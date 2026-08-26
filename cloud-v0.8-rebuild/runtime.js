/* ClubMatch Cloud v0.8 - confirmed-state runtime bridge */
(function(global){
'use strict';

function invariant(condition,message){if(!condition)throw new Error(message)}

function playerMetadata(snapshot){
  return Object.fromEntries((snapshot?.players||[]).map(player=>[
    player.player_id,
    {
      name:player.display_name||player.full_name||player.player_id,
      full_name:player.full_name,
      short_name:player.display_name,
      shirt_number:player.shirt_number
    }
  ]));
}

function exactEventSecond(event){
  return Math.max(0,(Number(event?.match_minute)||0)*60+(Number(event?.match_second)||0));
}

function timelineEvents(snapshot){
  return (snapshot?.events||[]).map((event,index)=>({
    ...event,
    seq:index+1,
    matchSecond:exactEventSecond(event)
  }));
}

function createRuntime(options){
  invariant(options?.supabase?.rpc,'A Supabase client is required');
  invariant(global.ClubMatchV08SnapshotAdapter?.deriveSnapshot,'snapshot-adapter.js is required');
  invariant(global.ClubMatchV08ViewModel?.createLiveViewModel,'view-model.js is required');
  invariant(global.ClubMatchV08MutationController?.createMutationController,'mutation-controller.js is required');

  const supabase=options.supabase;
  const render=typeof options.render==='function'?options.render:()=>{};
  const onError=typeof options.onError==='function'?options.onError:console.error;
  const pollMs=Math.max(1000,Number(options.pollMs)||5000);
  let activeMatchId=null;
  let lastSnapshot=null;
  let lastLiveState=null;
  let lastViewModel=null;
  let pollTimer=null;
  let realtimeChannel=null;
  let refreshPromise=null;
  let refreshQueued=false;
  let stopped=true;

  async function rpc(name,params){return supabase.rpc(name,params)}

  function project(snapshot,liveState){
    const model=global.ClubMatchV08ViewModel.createLiveViewModel({
      liveState,
      playersById:playerMetadata(snapshot),
      score:{for:snapshot?.match?.score_for,against:snapshot?.match?.score_against},
      match:snapshot?.match||{},
      events:timelineEvents(snapshot)
    });
    const validation=global.ClubMatchV08ViewModel.validateLiveViewModel(model);
    if(!validation.ok){
      const error=new Error(`Invalid v0.8 live projection: ${validation.errors.join(' · ')}`);
      error.code='CLUBMATCH_VIEW_INVALID';
      error.validation=validation;
      throw error;
    }
    return model;
  }

  function acceptConfirmed(snapshot,liveState,meta={}){
    const model=project(snapshot,liveState);
    lastSnapshot=snapshot;
    lastLiveState=liveState;
    lastViewModel=model;
    render(model,{snapshot,liveState,...meta});
    return model;
  }

  const mutations=global.ClubMatchV08MutationController.createMutationController({
    rpc,
    deriveSnapshot:global.ClubMatchV08SnapshotAdapter.deriveSnapshot,
    renderConfirmed(snapshot,liveState,meta){acceptConfirmed(snapshot,liveState,{source:'mutation',...meta})}
  });

  async function loadSnapshot(){
    invariant(activeMatchId,'No active v0.8 match');
    const result=await supabase.rpc('get_match_snapshot',{p_match_id:activeMatchId});
    if(result?.error)throw result.error;
    invariant(result?.data?.match&&result?.data?.state,'Confirmed snapshot is incomplete');
    const liveState=global.ClubMatchV08SnapshotAdapter.deriveSnapshot(result.data);
    return {snapshot:result.data,liveState};
  }

  async function refresh(reason='refresh'){
    if(stopped||!activeMatchId)return lastViewModel;
    if(refreshPromise){refreshQueued=true;return refreshPromise}
    refreshPromise=(async()=>{
      do{
        refreshQueued=false;
        const {snapshot,liveState}=await loadSnapshot();
        acceptConfirmed(snapshot,liveState,{source:reason});
      }while(refreshQueued&&!stopped);
      return lastViewModel;
    })();
    try{return await refreshPromise}catch(error){onError(error);throw error}finally{refreshPromise=null}
  }

  function schedulePoll(){
    clearInterval(pollTimer);
    pollTimer=setInterval(()=>{refresh('poll').catch(()=>{})},pollMs);
  }

  function subscribeRealtime(){
    if(typeof supabase.channel!=='function')return;
    try{
      realtimeChannel=supabase.channel(`clubmatch-v08-${activeMatchId}`)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'match_state',filter:`match_id=eq.${activeMatchId}`},()=>{
          refresh('realtime').catch(()=>{});
        })
        .subscribe();
    }catch(error){onError(error)}
  }

  async function start(matchId){
    invariant(matchId,'matchId is required');
    stop();
    activeMatchId=matchId;
    stopped=false;
    const model=await refresh('start');
    schedulePoll();
    subscribeRealtime();
    return model;
  }

  function stop(){
    stopped=true;
    clearInterval(pollTimer);pollTimer=null;
    if(realtimeChannel){
      try{if(typeof supabase.removeChannel==='function')supabase.removeChannel(realtimeChannel);else realtimeChannel.unsubscribe?.()}catch(error){onError(error)}
    }
    realtimeChannel=null;
  }

  function requireMatch(input={}){return {...input,matchId:input.matchId||activeMatchId}}

  return Object.freeze({
    start,stop,refresh,
    substitute:input=>mutations.substitute(requireMatch(input)),
    changePosition:input=>mutations.changePosition(requireMatch(input)),
    swapPositions:input=>mutations.swapPositions(requireMatch(input)),
    recordGoal:input=>mutations.recordGoal(requireMatch(input)),
    advanceClock:input=>mutations.advanceClock(requireMatch(input)),
    get activeMatchId(){return activeMatchId},
    get snapshot(){return lastSnapshot},
    get liveState(){return lastLiveState},
    get viewModel(){return lastViewModel},
    get pendingMutations(){return mutations.pendingCount}
  });
}

global.ClubMatchV08Runtime={createRuntime,playerMetadata,exactEventSecond,timelineEvents};
})(typeof window!=='undefined'?window:globalThis);
