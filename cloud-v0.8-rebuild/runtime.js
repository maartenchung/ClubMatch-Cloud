/* ClubMatch Cloud v0.8 - confirmed-state runtime bridge with Realtime push + polling fallback */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function playerMetadata(snapshot){return Object.fromEntries((snapshot?.players||[]).map(player=>[player.player_id,{name:player.display_name||player.full_name||player.player_id,full_name:player.full_name,short_name:player.display_name,shirt_number:player.shirt_number}]))}
function exactEventSecond(event){return Math.max(0,(Number(event?.match_minute)||0)*60+(Number(event?.match_second)||0))}
function timelineEvents(snapshot){return (snapshot?.events||[]).map((event,index)=>({...event,seq:index+1,matchSecond:exactEventSecond(event)}))}
function emitRuntimeEvent(name,detail){try{if(typeof global.dispatchEvent==='function'&&typeof global.CustomEvent==='function')global.dispatchEvent(new global.CustomEvent(name,{detail}))}catch{}}
function createRuntime(options){
  invariant(options?.supabase?.rpc,'Supabase-client is verplicht');invariant(global.ClubMatchV08SnapshotAdapter?.deriveSnapshot,'snapshot-adapter.js is verplicht');invariant(global.ClubMatchV08ViewModel?.createLiveViewModel,'view-model.js is verplicht');invariant(global.ClubMatchV08MutationController?.createMutationController,'mutation-controller.js is verplicht');invariant(global.ClubMatchV08ClockProjector?.createAnchor,'clock-projector.js is verplicht');
  const supabase=options.supabase,render=typeof options.render==='function'?options.render:()=>{},onDeleted=typeof options.onDeleted==='function'?options.onDeleted:()=>{},onError=typeof options.onError==='function'?options.onError:console.error,nowMs=typeof options.nowMs==='function'?options.nowMs:()=>Date.now(),pollMs=Math.max(1000,Number(options.pollMs)||5000),tickMs=Math.max(250,Number(options.tickMs)||1000),realtimeDebounceMs=Math.max(20,Number(options.realtimeDebounceMs)||80);
  let activeMatchId=null,lastSnapshot=null,lastLiveState=null,lastViewModel=null,clockAnchor=null,pollTimer=null,tickTimer=null,realtimeChannel=null,realtimeRefreshTimer=null,realtimeConnected=false,refreshPromise=null,refreshQueued=false,stopped=true,api=null;
  async function rpc(name,params){return supabase.rpc(name,params)}
  function clockProjection(anchor,atMs){return {breakState:{active:!!anchor?.breakActive,seconds:global.ClubMatchV08ClockProjector.projectedBreakSecond(anchor,atMs)},pauseState:{active:!!anchor?.pauseActive,seconds:global.ClubMatchV08ClockProjector.projectedPauseSecond(anchor,atMs)}}}
  function project(snapshot,liveState,breakState={active:false,seconds:0},pauseState={active:false,seconds:0}){
    const model=global.ClubMatchV08ViewModel.createLiveViewModel({liveState,playersById:playerMetadata(snapshot),score:{for:snapshot?.match?.score_for,against:snapshot?.match?.score_against},match:snapshot?.match||{},state:snapshot?.state||{},break:breakState,pause:pauseState,events:timelineEvents(snapshot)});const validation=global.ClubMatchV08ViewModel.validateLiveViewModel(model);if(!validation.ok){const error=new Error(`Ongeldige v0.8-liveprojectie: ${validation.errors.join(' · ')}`);error.code='CLUBMATCH_VIEW_INVALID';error.validation=validation;throw error}return model;
  }
  function acceptConfirmed(snapshot,liveState,meta={}){const captured=nowMs();clockAnchor=global.ClubMatchV08ClockProjector.createAnchor(snapshot,captured);const clocks=clockProjection(clockAnchor,captured),model=project(snapshot,liveState,clocks.breakState,clocks.pauseState);lastSnapshot=snapshot;lastLiveState=liveState;lastViewModel=model;render(model,{snapshot,liveState,confirmed:true,...meta});emitRuntimeEvent('clubmatch:v08-confirmed',{runtime:api,snapshot,liveState,model,meta});return model}
  function acceptProjected(projectedSnapshot,liveState,clocks,meta={}){const model=project(projectedSnapshot,liveState,clocks.breakState,clocks.pauseState);lastLiveState=liveState;lastViewModel=model;render(model,{snapshot:lastSnapshot,projectedSnapshot,liveState,confirmed:false,...meta});return model}
  const mutations=global.ClubMatchV08MutationController.createMutationController({rpc,deriveSnapshot:global.ClubMatchV08SnapshotAdapter.deriveSnapshot,renderConfirmed(snapshot,liveState,meta){acceptConfirmed(snapshot,liveState,{source:'mutation',...meta})}});
  async function loadSnapshot(){invariant(activeMatchId,'Geen actieve v0.8-wedstrijd');const result=await supabase.rpc('get_match_snapshot',{p_match_id:activeMatchId});if(result?.error)throw result.error;invariant(result?.data?.match&&result?.data?.state,'Bevestigde snapshot is onvolledig');return {snapshot:result.data,liveState:global.ClubMatchV08SnapshotAdapter.deriveSnapshot(result.data)}}
  async function refresh(reason='refresh'){if(stopped||!activeMatchId)return lastViewModel;if(refreshPromise){refreshQueued=true;return refreshPromise}refreshPromise=(async()=>{do{refreshQueued=false;const {snapshot,liveState}=await loadSnapshot();acceptConfirmed(snapshot,liveState,{source:reason})}while(refreshQueued&&!stopped);return lastViewModel})();try{return await refreshPromise}catch(error){onError(error);throw error}finally{refreshPromise=null}}
  function projectNow(reason='tick'){
    if(stopped||!lastSnapshot||!clockAnchor||(!clockAnchor.running&&!clockAnchor.breakActive&&!clockAnchor.pauseActive))return lastViewModel;
    try{const at=nowMs(),projectedSnapshot=global.ClubMatchV08ClockProjector.projectSnapshot(lastSnapshot,clockAnchor,at),clocks=clockProjection(clockAnchor,at),projectedSecond=Number(projectedSnapshot.state.effective_elapsed_seconds||0),currentSecond=Number(lastLiveState?.effectiveMatchSecond||0),currentBreak=Number(lastViewModel?.scoreboard?.breakSeconds||0),currentPause=Number(lastViewModel?.scoreboard?.pauseSeconds||0);if(projectedSecond===currentSecond&&clocks.breakState.seconds===currentBreak&&clocks.pauseState.seconds===currentPause)return lastViewModel;const liveState=projectedSecond===currentSecond?lastLiveState:global.ClubMatchV08SnapshotAdapter.deriveSnapshot(projectedSnapshot);return acceptProjected(projectedSnapshot,liveState,clocks,{source:reason})}catch(error){onError(error);return lastViewModel}
  }
  function schedulePoll(){clearInterval(pollTimer);pollTimer=setInterval(()=>{refresh('poll-fallback').catch(()=>{})},pollMs)}
  function scheduleTick(){clearInterval(tickTimer);tickTimer=setInterval(()=>projectNow('tick'),tickMs)}
  function emitRealtime(status,rawStatus='',error=null){realtimeConnected=status==='connected';emitRuntimeEvent('clubmatch:v08-realtime',{runtime:api,matchId:activeMatchId,status,rawStatus,error:error?.message||null,pollFallbackMs:pollMs})}
  function queueRealtimeRefresh(source){if(stopped||!activeMatchId)return;if(realtimeRefreshTimer!==null)global.clearTimeout?.(realtimeRefreshTimer);realtimeRefreshTimer=global.setTimeout?.(()=>{realtimeRefreshTimer=null;refresh(source).catch(()=>{})},realtimeDebounceMs)||null}
  function subscribeRealtime(){
    if(typeof supabase.channel!=='function'){emitRealtime('fallback','UNAVAILABLE');return}
    try{
      realtimeChannel=supabase.channel(`clubmatch-v08-${activeMatchId}`)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'match_state',filter:`match_id=eq.${activeMatchId}`},()=>queueRealtimeRefresh('realtime-state'))
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'match_events',filter:`match_id=eq.${activeMatchId}`},()=>queueRealtimeRefresh('realtime-event'))
        .subscribe((status,error)=>{
          if(status==='SUBSCRIBED')emitRealtime('connected',status);
          else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))emitRealtime('fallback',status,error);
          else emitRealtime('connecting',status,error);
        });
    }catch(error){onError(error);emitRealtime('fallback','EXCEPTION',error)}
  }
  async function start(matchId){invariant(matchId,'Wedstrijd-ID is verplicht');stop();activeMatchId=matchId;stopped=false;emitRealtime('connecting','START');const model=await refresh('start');schedulePoll();scheduleTick();subscribeRealtime();return model}
  function stop(){const stoppedMatchId=activeMatchId;stopped=true;clearInterval(pollTimer);pollTimer=null;clearInterval(tickTimer);tickTimer=null;if(realtimeRefreshTimer!==null)global.clearTimeout?.(realtimeRefreshTimer);realtimeRefreshTimer=null;if(realtimeChannel){try{if(typeof supabase.removeChannel==='function')supabase.removeChannel(realtimeChannel);else realtimeChannel.unsubscribe?.()}catch(error){onError(error)}}realtimeChannel=null;realtimeConnected=false;emitRuntimeEvent('clubmatch:v08-stopped',{runtime:api,matchId:stoppedMatchId})}
  function clearDeletedState(){stop();activeMatchId=null;lastSnapshot=null;lastLiveState=null;lastViewModel=null;clockAnchor=null;refreshQueued=false}
  function requireMatch(input={}){return {...input,matchId:input.matchId||activeMatchId}}
  async function deleteMatch(input={}){const result=await mutations.deleteMatch(requireMatch(input));clearDeletedState();onDeleted(result);return result}
  api=Object.freeze({start,stop,refresh,projectNow,substitute:input=>mutations.substitute(requireMatch(input)),changePosition:input=>mutations.changePosition(requireMatch(input)),swapPositions:input=>mutations.swapPositions(requireMatch(input)),changeFormation:input=>mutations.changeFormation(requireMatch(input)),recordGoal:input=>mutations.recordGoal(requireMatch(input)),correctSubstitution:input=>mutations.correctSubstitution(requireMatch(input)),voidSubstitution:input=>mutations.voidSubstitution(requireMatch(input)),correctPositionChange:input=>mutations.correctPositionChange(requireMatch(input)),voidPositionChange:input=>mutations.voidPositionChange(requireMatch(input)),correctGoal:input=>mutations.correctGoal(requireMatch(input)),voidGoal:input=>mutations.voidGoal(requireMatch(input)),advanceClock:input=>mutations.advanceClock(requireMatch(input)),deleteMatch,get activeMatchId(){return activeMatchId},get snapshot(){return lastSnapshot},get liveState(){return lastLiveState},get viewModel(){return lastViewModel},get pendingMutations(){return mutations.pendingCount},get realtimeConnected(){return realtimeConnected}});
  emitRuntimeEvent('clubmatch:v08-runtime-ready',{runtime:api});return api;
}
global.ClubMatchV08Runtime={createRuntime,playerMetadata,exactEventSecond,timelineEvents,emitRuntimeEvent};
})(typeof window!=='undefined'?window:globalThis);
