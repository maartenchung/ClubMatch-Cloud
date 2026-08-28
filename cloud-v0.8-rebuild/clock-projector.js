/* ClubMatch Cloud v0.8 - monotonic presentation clocks anchored to confirmed server state */
(function(global){
'use strict';
function second(value){return Math.max(0,Math.floor(Number(value)||0))}
function isRunning(snapshot){return snapshot?.match?.status==='live'&&snapshot?.state?.clock_status==='running'}
function isHalftime(snapshot){return snapshot?.match?.status==='halftime'&&snapshot?.state?.period==='halftime'}
function isPaused(snapshot){return snapshot?.match?.status==='live'&&snapshot?.state?.clock_status==='paused'&&['first_half','second_half','extra_time'].includes(snapshot?.state?.period)}
function dateMs(value){const parsed=Date.parse(value||'');return Number.isFinite(parsed)?parsed:null}
function latestEvent(snapshot,type){const events=Array.isArray(snapshot?.events)?snapshot.events:[];return [...events].reverse().find(event=>event?.event_type===type&&dateMs(event.occurred_at)!==null)||null}
function latestHalftimeEvent(snapshot){return latestEvent(snapshot,'halftime_started')}
function latestPauseEvent(snapshot){return latestEvent(snapshot,'match_paused')}
function elapsedFromEvent(snapshot,event){if(!event)return 0;const start=dateMs(event.occurred_at),server=dateMs(snapshot?.server_now);if(start===null||server===null)return 0;return second((server-start)/1000)}
function confirmedBreakSecond(snapshot){return isHalftime(snapshot)?elapsedFromEvent(snapshot,latestHalftimeEvent(snapshot)):0}
function confirmedPauseSecond(snapshot){return isPaused(snapshot)?elapsedFromEvent(snapshot,latestPauseEvent(snapshot)):0}
function createAnchor(snapshot,nowMs=Date.now()){
  if(!snapshot?.state)throw new Error('Confirmed snapshot state is required');
  return Object.freeze({stateVersion:Number(snapshot.state.state_version||0),confirmedSecond:second(snapshot.state.effective_elapsed_seconds),confirmedBreakSecond:confirmedBreakSecond(snapshot),confirmedPauseSecond:confirmedPauseSecond(snapshot),capturedAtMs:Number(nowMs)||0,running:isRunning(snapshot),breakActive:isHalftime(snapshot),pauseActive:isPaused(snapshot)});
}
function elapsedSince(anchor,nowMs){return Math.max(0,Math.floor(((Number(nowMs)||0)-anchor.capturedAtMs)/1000))}
function projectedSecond(anchor,nowMs=Date.now()){if(!anchor)return 0;if(!anchor.running)return second(anchor.confirmedSecond);return second(anchor.confirmedSecond)+elapsedSince(anchor,nowMs)}
function projectedBreakSecond(anchor,nowMs=Date.now()){if(!anchor?.breakActive)return 0;return second(anchor.confirmedBreakSecond)+elapsedSince(anchor,nowMs)}
function projectedPauseSecond(anchor,nowMs=Date.now()){if(!anchor?.pauseActive)return 0;return second(anchor.confirmedPauseSecond)+elapsedSince(anchor,nowMs)}
function projectSnapshot(snapshot,anchor,nowMs=Date.now()){
  if(!snapshot?.state)throw new Error('Confirmed snapshot state is required');const effective=projectedSecond(anchor,nowMs);if(effective===second(snapshot.state.effective_elapsed_seconds))return snapshot;return {...snapshot,state:{...snapshot.state,effective_elapsed_seconds:effective}};
}
global.ClubMatchV08ClockProjector={second,isRunning,isHalftime,isPaused,latestHalftimeEvent,latestPauseEvent,confirmedBreakSecond,confirmedPauseSecond,createAnchor,projectedSecond,projectedBreakSecond,projectedPauseSecond,projectSnapshot};
})(typeof window!=='undefined'?window:globalThis);
