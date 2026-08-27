/* ClubMatch Cloud v0.8 - logic-free UI render frame */
(function(global){
'use strict';

function invariant(condition,message){if(!condition)throw new Error(message)}
function freezeList(list){return Object.freeze(list.map(item=>Object.freeze(item)))}

function playerFrame(player){
  invariant(player?.id,'Player view is required');
  invariant(Array.isArray(player.metrics)&&player.metrics.length===4,'Stable four-slot player metrics are required');
  return Object.freeze({
    id:player.id,name:player.name,shortName:player.shortName,shirtNumber:player.shirtNumber,role:player.role,position:player.position,startedPosition:player.startedPosition,
    changeState:player.changeState,cssClass:player.statusStyle?.cssClass||'swapNever080',tone:player.statusStyle?.tone||'neutral',
    inCount:player.inCount,outCount:player.outCount,substitutionCount:player.substitutionCount,
    metrics:freezeList(player.metrics.map(metric=>({key:metric.key,label:metric.label,display:metric.display,active:metric.active})))
  });
}

function scoreboardFrame(scoreboard){return Object.freeze({
  display:scoreboard.display,clock:scoreboard.clock,status:scoreboard.status,period:scoreboard.period,clockStatus:scoreboard.clockStatus,formationCode:scoreboard.formationCode,
  breakActive:scoreboard.breakActive,breakSeconds:scoreboard.breakSeconds,breakClock:scoreboard.breakClock
})}

function createUiFrame(model){
  invariant(model?.scoreboard&&model?.pitch&&model?.tiles&&model?.substitutionMonitor&&model?.dashboard,'Complete v0.8 ViewModel is required');
  const playerById={};model.players.forEach(player=>{playerById[player.id]=playerFrame(player)});Object.freeze(playerById);
  const field=freezeList(model.field.map(player=>playerById[player.id]));
  const bench=freezeList(model.bench.map(player=>playerById[player.id]));
  const pitch=freezeList(model.pitch.field.map(player=>({
    id:player.id,shirtNumber:player.shirtNumber,name:player.shortName,position:player.position,
    play:model.byId[player.id].metrics[0].display,current:model.byId[player.id].metrics[2].display,
    substitutions:player.substitutionCount,cssClass:player.statusStyle.cssClass
  })));
  const monitor=freezeList(model.substitutionMonitor.players.map(player=>({
    id:player.id,name:player.name,role:player.role,position:player.position,
    currentStint:player.role==='FIELD'?player.metrics[2].display:player.metrics[3].display,
    total:player.role==='FIELD'?player.metrics[0].display:player.metrics[1].display,
    substitutions:player.substitutionCount,changeState:player.changeState,cssClass:player.statusStyle.cssClass
  })));
  const timeline=freezeList(model.timeline.map(event=>({id:event.id,type:event.type||event.event_type||'',clock:event.clock,minuteLabel:event.minuteLabel})));
  const scoreboard=scoreboardFrame(model.scoreboard),formationCode=model.formationCode||scoreboard.formationCode||'4-3-3';
  return Object.freeze({
    clock:model.clock,breakActive:model.breakActive,breakClock:model.breakClock,formationCode,scoreboard,field,bench,playerById,pitch,monitor,timeline,
    dashboard:Object.freeze({field,bench,scoreboard,timeline})
  });
}

function validateUiFrame(frame){
  const errors=[];
  if(frame.field.length!==11)errors.push(`field count ${frame.field.length}, expected 11`);
  if(frame.pitch.length!==frame.field.length)errors.push('pitch and field tile count differ');
  if(!frame.formationCode)errors.push('formation code missing');
  if(frame.dashboard.field!==frame.field||frame.dashboard.bench!==frame.bench)errors.push('dashboard does not share the same frame arrays');
  if(frame.dashboard.scoreboard!==frame.scoreboard)errors.push('dashboard scoreboard does not share frame');
  if(frame.scoreboard.formationCode!==frame.formationCode)errors.push('formation does not share scoreboard source');
  if(frame.breakActive!==frame.scoreboard.breakActive||frame.breakClock!==frame.scoreboard.breakClock)errors.push('break clock does not share scoreboard source');
  const allowed=new Set(['swapNever080','swapPast080','swapIn080','swapOut080']);
  [...frame.field,...frame.bench].forEach(player=>{
    if(player.metrics.length!==4)errors.push(`${player.id}: metric slot count changed`);
    if(!allowed.has(player.cssClass))errors.push(`${player.id}: invalid substitution class`);
    if(player.tone==='green')errors.push(`${player.id}: green substitution tone is forbidden`);
  });
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}

global.ClubMatchV08UiFrame={createUiFrame,validateUiFrame};
})(typeof window!=='undefined'?window:globalThis);
