/* ClubMatch Cloud v0.8 - confirmed-state runtime bridge */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function playerMetadata(snapshot){return Object.fromEntries((snapshot?.players||[]).map(player=>[player.player_id,{name:player.display_name||player.full_name||player.player_id,full_name:player.full_name,short_name:player.display_name,shirt_number:player.shirt_number}]))}
function exactEventSecond(event){return Math.max(0,(Number(event?.match_minute)||0)*60+(Number(event?.match_second)||0))}
function timelineEvents(snapshot){return (snapshot?.events||[]).map((event,index)=>({...event,seq:index+1,matchSecond:exactEventSecond(event)}))}

function createRuntime(options){
  invariant(options?.supabase?.rpc,'A Supabase client is required');
  invariant(global.ClubMatchV08SnapshotAdapter?.deriveSnapshot,'snapshot-adapter.js is required');
  invariant(global.ClubMatchV08ViewModel?.createLiveViewModel,'view-model.js is required');
  invariant(global.ClubMatchV08MutationController?.createMutationController,'mutation-controller.js is required');
  invariant(global.ClubMatchV08ClockProjector?.createAnchor,'clock-projector.js is required');
  const supabase=options.supabase,render=typeof options.render==='function'?options.render:()=>{},onDeleted=typeof options.onDeleted==='function'?options.onDeleted:()=>{},onError=typeof options.onError==='function'?options.onError:console.error;
  const nowMs=typeof options.nowMs==='function'?options.nowMs:()=>Date.now(),pollMs=Math.max(1000,Number(options.pollMs)||5000),tickMs=Math.max(250,Number(options.tickMs)||1000);
  let activeMatchId=null,lastSnapshot=null,lastLiveState=null,lastViewModel=null,clockAnchor=null,pollTimer=null,tickTimer=null,realtimeChannel=null,refreshPromise=null,refreshQueued=false,stopped=true;
  async function rpc(name,params){return supabase.rpc(name,params)}

  function breakProjection(anchor,atMs){return {active:!!anchor?.breakActive,seconds:global.ClubMatchV08ClockProjector.projectedBreakSecond(anchor,atMs)}}
  function project(snapshot,liveState,breakState={active:false,seconds:0}){
    const model=global.ClubMatchV08ViewModel.createLiveViewModel({
      liveState,playersById:playerMetadata(snapshot),score:{for:snapshot?.match?.score_for,against:snapshot?.match?.score_against},
      match:snapshot?.match||{},state:snapshot?.state||{},break:breakState,events:timelineEvents(snapshot)
    });
    const validation=global.ClubMatchV08ViewModel.validateLiveViewModel(model);
    if(!validation.ok){const error=new Error(`Invalid v0.8 live projection: ${validation.errors.join(' · ')}`);error.code='CLUBMATCH_VIEW_INVALID';error.validation=validation;throw error}
    return model;
  }
  function acceptConfirmed(snapshot,liveState,meta={}){
    const captured=nowMs();clockAnchor=global.ClubMatchV08ClockProjector.createAnchor(snapshot,captured);
    const model=project(snapshot,liveState,breakProjection(clockAnchor,captured));
    lastSnapshot=snapshot;lastLiveState=liveState;lastViewModel=model;
    render(model,{snapshot,liveState,confirmed:true,...meta});return model;
  }
  function acceptProjected(projectedSnapshot,liveState,breakState,meta={}){
    const model=project(projectedSnapshot,liveState,breakState);lastLiveState=liveState;lastViewModel=model;
    render(model,{snapshot:lastSnapshot,projectedSnapshot,liveState,confirmed:false,...meta});return model;
  }

  const mutations=global.ClubMatchV08MutationController.createMutationController({rpc,deriveSnapshot:global.ClubMatchV08SnapshotAdapter.deriveSnapshot,renderConfirmed(snapshot,liveState,meta){acceptConfirmed(snapshot,liveState,{source:'mutation',...meta})}});
  async function loadSnapshot(){invariant(activeMatchId,'No active v0.8 match');const result=await supabase.rpc('get_match_snapshot',{p_match_id:activeMatchId});if(result?.error)throw result.error;invariant(result?.data?.match&&result?.data?.state,'Confirmed snapshot is incomplete');return {snapshot:result.data,liveState:global.ClubMatchV08SnapshotAdapter.deriveSnapshot(result.data)}}
  async function refresh(reason='refresh'){
    if(stopped||!activeMatchId)return lastViewModel;if(refreshPromise){refreshQueued=true;return refreshPromise}
    refreshPromise=(async()=>{do{refreshQueued=false;const {snapshot,liveState}=await loadSnapshot();acceptConfirmed(snapshot,liveState,{source:reason})}while(refreshQueued&&!stopped);return lastViewModel})();
    try{return await refreshPromise}catch(error){onError(error);throw error}finally{refreshPromise=null}
  }
  function projectNow(reason='tick'){
    if(stopped||!lastSnapshot||!clockAnchor||(!clockAnchor.running&&!clockAnchor.breakActive))return lastViewModel;
    try{
      const at=nowMs(),projectedSnapshot=global.ClubMatchV08ClockProjector.projectSnapshot(lastSnapshot,clockAnchor,at),breakState=breakProjection(clockAnchor,at);
      const projectedSecond=Number(projectedSnapshot.state.effective_elapsed_seconds||0),currentSecond=Number(lastLiveState?.effectiveMatchSecond||0),currentBreak=Number(lastViewModel?.scoreboard?.breakSeconds||0);
      if(projectedSecond===currentSecond&&breakState.seconds===currentBreak)return lastViewModel;
      const liveState=projectedSecond===currentSecond?lastLiveState:global.ClubMatchV08SnapshotAdapter.deriveSnapshot(projectedSnapshot);
      return acceptProjected(projectedSnapshot,liveState,breakState,{source:reason});
    }catch(error){onError(error);return lastViewModel}
  }
  function schedulePoll(){clearInterval(pollTimer);pollTimer=setInterval(()=>{refresh('poll').catch(()=>{})},pollMs)}
  function scheduleTick(){clearInterval(tickTimer);tickTimer=setInterval(()=>projectNow('tick'),tickMs)}
  function subscribeRealtime(){if(typeof supabase.channel!=='function')return;try{realtimeChannel=supabase.channel(`clubmatch-v08-${activeMatchId}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'match_state',filter:`match_id=eq.${activeMatchId}`},()=>{refresh('realtime').catch(()=>{})}).subscribe()}catch(error){onError(error)}}
  async function start(matchId){invariant(matchId,'matchId is required');stop();activeMatchId=matchId;stopped=false;const model=await refresh('start');schedulePoll();scheduleTick();subscribeRealtime();return model}
  function stop(){stopped=true;clearInterval(pollTimer);pollTimer=null;clearInterval(tickTimer);tickTimer=null;if(realtimeChannel){try{if(typeof supabase.removeChannel==='function')supabase.removeChannel(realtimeChannel);else realtimeChannel.unsubscribe?.()}catch(error){onError(error)}}realtimeChannel=null}
  function clearDeletedState(){stop();activeMatchId=null;lastSnapshot=null;lastLiveState=null;lastViewModel=null;clockAnchor=null;refreshQueued=false}
  function requireMatch(input={}){return {...input,matchId:input.matchId||activeMatchId}}
  async function deleteMatch(input={}){const result=await mutations.deleteMatch(requireMatch(input));clearDeletedState();onDeleted(result);return result}
  return Object.freeze({
    start,stop,refresh,projectNow,substitute:input=>mutations.substitute(requireMatch(input)),changePosition:input=>mutations.changePosition(requireMatch(input)),swapPositions:input=>mutations.swapPositions(requireMatch(input)),recordGoal:input=>mutations.recordGoal(requireMatch(input)),advanceClock:input=>mutations.advanceClock(requireMatch(input)),deleteMatch,
    get activeMatchId(){return activeMatchId},get snapshot(){return lastSnapshot},get liveState(){return lastLiveState},get viewModel(){return lastViewModel},get pendingMutations(){return mutations.pendingCount}
  });
}
global.ClubMatchV08Runtime={createRuntime,playerMetadata,exactEventSecond,timelineEvents};
})(typeof window!=='undefined'?window:globalThis);
