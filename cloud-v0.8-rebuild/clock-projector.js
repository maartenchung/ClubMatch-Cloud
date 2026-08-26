/* ClubMatch Cloud v0.8 - monotonic presentation clock anchored to confirmed server state */
(function(global){
'use strict';

function second(value){return Math.max(0,Math.floor(Number(value)||0))}
function isRunning(snapshot){return snapshot?.match?.status==='live'&&snapshot?.state?.clock_status==='running'}

function createAnchor(snapshot,nowMs=Date.now()){
  if(!snapshot?.state)throw new Error('Confirmed snapshot state is required');
  return Object.freeze({
    stateVersion:Number(snapshot.state.state_version||0),
    confirmedSecond:second(snapshot.state.effective_elapsed_seconds),
    capturedAtMs:Number(nowMs)||0,
    running:isRunning(snapshot)
  });
}

function projectedSecond(anchor,nowMs=Date.now()){
  if(!anchor)return 0;
  if(!anchor.running)return second(anchor.confirmedSecond);
  const delta=Math.max(0,Math.floor(((Number(nowMs)||0)-anchor.capturedAtMs)/1000));
  return second(anchor.confirmedSecond)+delta;
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

global.ClubMatchV08ClockProjector={second,isRunning,createAnchor,projectedSecond,projectSnapshot};
})(typeof window!=='undefined'?window:globalThis);
