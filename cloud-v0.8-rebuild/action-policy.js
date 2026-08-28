/* ClubMatch Cloud v0.8 - pure action availability policy */
(function(global){
'use strict';

function createActionPolicy(input={}){
  const match=input.match||{};
  const state=input.state||{};
  const frame=input.frame||{};
  const field=Array.isArray(frame.field)?frame.field:[];
  const bench=Array.isArray(frame.bench)?frame.bench:[];
  const status=match.status||'';
  const period=state.period||'';
  const clock=state.clock_status||'';
  const hasMatch=!!match.id;
  const isLive=status==='live';
  const hasValidField=field.length===11;

  return Object.freeze({
    hasMatch,
    status,
    period,
    clock,
    substitute:hasMatch&&isLive&&hasValidField&&bench.length>0,
    changePosition:hasMatch&&isLive&&hasValidField,
    swapPositions:hasMatch&&isLive&&hasValidField&&field.length>1,
    goalFor:hasMatch&&isLive&&hasValidField,
    goalAgainst:hasMatch&&isLive,
    pause:hasMatch&&isLive&&['first_half','second_half','extra_time'].includes(period)&&clock==='running',
    resume:hasMatch&&isLive&&['first_half','second_half','extra_time'].includes(period)&&clock==='paused',
    halftime:hasMatch&&isLive&&period==='first_half'&&['running','paused'].includes(clock),
    secondHalf:hasMatch&&status==='halftime'&&period==='halftime'&&clock==='stopped',
    injuryTime:hasMatch&&isLive&&period==='second_half',
    finish:hasMatch&&['live','halftime'].includes(status)&&['first_half','halftime','second_half','extra_time'].includes(period),
    deleteMatch:hasMatch&&['finished','closed'].includes(status)
  });
}

global.ClubMatchV08ActionPolicy={createActionPolicy};
})(typeof window!=='undefined'?window:globalThis);
