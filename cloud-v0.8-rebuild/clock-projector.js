/* ClubMatch Cloud v0.8 - monotonic presentation clocks anchored to confirmed server state */
(function(global){
'use strict';

function second(value){return Math.max(0,Math.floor(Number(value)||0))}
function isRunning(snapshot){return snapshot?.match?.status==='live'&&snapshot?.state?.clock_status==='running'}
function isHalftime(snapshot){return snapshot?.match?.status==='halftime'&&snapshot?.state?.period==='halftime'}
function dateMs(value){const parsed=Date.parse(value||'');return Number.isFinite(parsed)?parsed:null}
function latestHalftimeEvent(snapshot){
  const events=Array.isArray(snapshot?.events)?snapshot.events:[];
  return [...events].reverse().find(event=>event?.event_type==='halftime_started'&&dateMs(event.occurred_at)!==null)||null;
}
function confirmedBreakSecond(snapshot){
  if(!isHalftime(snapshot))return 0;
  const event=latestHalftimeEvent(snapshot);if(!event)return 0;
  const start=dateMs(event.occurred_at),server=dateMs(snapshot?.server_now);
  if(start===null||server===null)return 0;
  return second((server-start)/1000);
}

function createAnchor(snapshot,nowMs=Date.now()){
  if(!snapshot?.state)throw new Error('Confirmed snapshot state is required');
  return Object.freeze({
    stateVersion:Number(snapshot.state.state_version||0),
    confirmedSecond:second(snapshot.state.effective_elapsed_seconds),
    confirmedBreakSecond:confirmedBreakSecond(snapshot),
    capturedAtMs:Number(nowMs)||0,
    running:isRunning(snapshot),
    breakActive:isHalftime(snapshot)
  });
}

function elapsedSince(anchor,nowMs){return Math.max(0,Math.floor(((Number(nowMs)||0)-anchor.capturedAtMs)/1000))}
function projectedSecond(anchor,nowMs=Date.now()){
  if(!anchor)return 0;
  if(!anchor.running)return second(anchor.confirmedSecond);
  return second(anchor.confirmedSecond)+elapsedSince(anchor,nowMs);
}
function projectedBreakSecond(anchor,nowMs=Date.now()){
  if(!anchor?.breakActive)return 0;
  return second(anchor.confirmedBreakSecond)+elapsedSince(anchor,nowMs);
}

function projectSnapshot(snapshot,anchor,nowMs=Date.now()){
  if(!snapshot?.state)throw new Error('Confirmed snapshot state is required');
  const effective=projectedSecond(anchor,nowMs);
  if(effective===second(snapshot.state.effective_elapsed_seconds))return snapshot;
  return {
    ...snapshot,
    state:{...snapshot.state,effective_elapsed_seconds:effective}
  };
}

global.ClubMatchV08ClockProjector={
  second,isRunning,isHalftime,latestHalftimeEvent,confirmedBreakSecond,
  createAnchor,projectedSecond,projectedBreakSecond,projectSnapshot
};
})(typeof window!=='undefined'?window:globalThis);
