/* ClubMatch Cloud v0.8 - one immutable projection for every live view */
(function(global){
'use strict';

const STATUS_STYLES=Object.freeze({
  NEVER_SUBBED:Object.freeze({tone:'neutral',cssClass:'swapNever080'}),
  SUBBED_BEFORE:Object.freeze({tone:'purple',cssClass:'swapPast080'}),
  JUST_IN:Object.freeze({tone:'blue',cssClass:'swapIn080'}),
  JUST_OUT:Object.freeze({tone:'amber',cssClass:'swapOut080'})
});

const METRIC_DEFINITIONS=Object.freeze([
  Object.freeze({key:'play',label:'Speeltijd totaal'}),
  Object.freeze({key:'bench',label:'Banktijd totaal'}),
  Object.freeze({key:'currentField',label:'Huidige veldbeurt'}),
  Object.freeze({key:'currentBench',label:'Huidige bankbeurt'})
]);

function invariant(condition,message){
  if(!condition)throw new Error(message);
}

function second(value){
  return Math.max(0,Math.floor(Number(value)||0));
}

function formatClock(value){
  const total=second(value);
  return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
}

function formatMinute(value){
  return `${Math.floor(second(value)/60)+1}'`;
}

function playerMetadata(playersById,id){
  const source=playersById instanceof Map?playersById.get(id):playersById?.[id];
  return source||{};
}

function createPlayerView(player,meta){
  const role=player.currentRole;
  const currentField=role==='FIELD'?second(player.currentStintSeconds):0;
  const currentBench=role==='BENCH'?second(player.currentStintSeconds):0;
  const metrics=Object.freeze([
    Object.freeze({...METRIC_DEFINITIONS[0],seconds:second(player.playSeconds),display:formatClock(player.playSeconds),active:role==='FIELD'}),
    Object.freeze({...METRIC_DEFINITIONS[1],seconds:second(player.benchSeconds),display:formatClock(player.benchSeconds),active:role==='BENCH'}),
    Object.freeze({...METRIC_DEFINITIONS[2],seconds:currentField,display:role==='FIELD'?formatClock(currentField):'—',active:role==='FIELD'}),
    Object.freeze({...METRIC_DEFINITIONS[3],seconds:currentBench,display:role==='BENCH'?formatClock(currentBench):'—',active:role==='BENCH'})
  ]);
  const changeState=STATUS_STYLES[player.changeState]?player.changeState:'NEVER_SUBBED';

  return Object.freeze({
    id:player.playerId,
    name:meta.name||meta.full_name||player.playerId,
    shortName:meta.shortName||meta.short_name||meta.name||meta.full_name||player.playerId,
    shirtNumber:meta.shirtNumber??meta.shirt_number??meta.number??null,
    initialRole:player.initialRole,
    role,
    position:role==='FIELD'?(player.currentPosition||''):'',
    startedPosition:player.startedPosition||'',
    playSeconds:second(player.playSeconds),
    benchSeconds:second(player.benchSeconds),
    currentStintSeconds:second(player.currentStintSeconds),
    inCount:second(player.inCount),
    outCount:second(player.outCount),
    substitutionCount:second(player.substitutionCount),
    lastSubstitutionSecond:player.lastSubstitutionSecond==null?null:second(player.lastSubstitutionSecond),
    lastSubstitutionDirection:player.lastSubstitutionDirection||null,
    changeState,
    statusStyle:STATUS_STYLES[changeState],
    metrics
  });
}

function createTimeline(events){
  return Object.freeze([...(events||[])]
    .map((event,index)=>Object.freeze({
      ...event,
      id:event.id||event.clientEventId||event.client_event_id||`event-${index+1}`,
      matchSecond:second(event.matchSecond??event.match_second??(Number(event.matchMinute??event.match_minute)||0)*60),
      clock:formatClock(event.matchSecond??event.match_second??(Number(event.matchMinute??event.match_minute)||0)*60),
      minuteLabel:formatMinute(event.matchSecond??event.match_second??(Number(event.matchMinute??event.match_minute)||0)*60)
    }))
    .sort((a,b)=>a.matchSecond-b.matchSecond||Number(a.seq||0)-Number(b.seq||0)));
}

function createLiveViewModel(input){
  const liveState=input?.liveState;
  invariant(liveState?.players&&Array.isArray(liveState.fieldIds)&&Array.isArray(liveState.benchIds),'A complete LiveMatchState is required');

  const byId={};
  Object.values(liveState.players).forEach(player=>{
    byId[player.playerId]=createPlayerView(player,playerMetadata(input.playersById,player.playerId));
  });
  Object.freeze(byId);

  const field=Object.freeze(liveState.fieldIds.map(id=>byId[id]).filter(Boolean));
  const bench=Object.freeze(liveState.benchIds.map(id=>byId[id]).filter(Boolean));
  const players=Object.freeze([...field,...bench]);
  const byPosition=Object.freeze(Object.fromEntries(field.filter(player=>player.position).map(player=>[player.position,player])));
  const timeline=createTimeline(input.events);
  const scoreFor=second(input.score?.for??input.match?.scoreFor??input.match?.score_for);
  const scoreAgainst=second(input.score?.against??input.match?.scoreAgainst??input.match?.score_against);
  const scoreboard=Object.freeze({
    scoreFor,
    scoreAgainst,
    display:`${scoreFor}–${scoreAgainst}`,
    effectiveMatchSecond:second(liveState.effectiveMatchSecond),
    clock:formatClock(liveState.effectiveMatchSecond),
    status:input.match?.status||'live'
  });

  const sharedPlayers=Object.freeze({players,field,bench,byId});
  return Object.freeze({
    effectiveMatchSecond:scoreboard.effectiveMatchSecond,
    clock:scoreboard.clock,
    scoreboard,
    timeline,
    players,
    field,
    bench,
    byId,
    pitch:Object.freeze({...sharedPlayers,byPosition}),
    tiles:sharedPlayers,
    substitutionMonitor:Object.freeze({...sharedPlayers,timeline}),
    dashboard:Object.freeze({...sharedPlayers,scoreboard,timeline})
  });
}

function validateLiveViewModel(model){
  const errors=[];
  if(model.field.length!==11)errors.push(`field count ${model.field.length}, expected 11`);
  const ids=model.players.map(player=>player.id);
  if(new Set(ids).size!==ids.length)errors.push('duplicate player IDs');
  if(model.pitch.field!==model.tiles.field||model.pitch.field!==model.dashboard.field)errors.push('field projections do not share one source');
  if(model.pitch.bench!==model.tiles.bench||model.pitch.bench!==model.dashboard.bench)errors.push('bench projections do not share one source');
  model.players.forEach(player=>{
    if(player.metrics.length!==METRIC_DEFINITIONS.length)errors.push(`${player.id}: unstable metric slots`);
    if(!STATUS_STYLES[player.changeState])errors.push(`${player.id}: unknown substitution state`);
    if(player.statusStyle.tone==='green')errors.push(`${player.id}: green substitution status is not allowed`);
  });
  return {ok:errors.length===0,errors};
}

global.ClubMatchV08ViewModel={
  STATUS_STYLES,
  METRIC_DEFINITIONS,
  formatClock,
  formatMinute,
  createLiveViewModel,
  validateLiveViewModel
};
})(typeof window!=='undefined'?window:globalThis);
