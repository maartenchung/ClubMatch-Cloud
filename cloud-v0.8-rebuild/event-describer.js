/* ClubMatch Cloud v0.8 - pure Dutch event descriptions for timeline and live monitoring */
(function(global){
'use strict';
function clean(v){return String(v??'').trim()}
function playerMeta(playersById,id){return playersById instanceof Map?playersById.get(id):playersById?.[id]||null}
function playerName(playersById,id){const p=playerMeta(playersById,id);if(!id)return '—';if(!p)return id;const name=p.name||p.display_name||p.full_name||p.short_name||id;const shirt=p.shirtNumber??p.shirt_number??p.number;return shirt===null||shirt===undefined?String(name):`#${shirt} ${name}`}
function pos(position){const value=clean(position);return value?(global.ClubMatchV08PitchLayout?.slotLabel?.(value)||value):'—'}
const PLAYER_ACTION_LABELS=Object.freeze({
  ball_recovery:'Bal veroverd',interception:'Bal onderschept',block:'Blok',ball_loss:'Balverlies',bad_pass:'Verkeerde pass',chance_created:'Kans gecreëerd',duel_won:'Duel gewonnen',duel_lost:'Duel verloren',shot:'Schot',shot_on_target:'Schot op doel',foul_committed:'Overtreding gemaakt',foul_won:'Overtreding mee',injury:'Blessure',save:'Redding'
});
const TYPE_LABELS=Object.freeze({
  match_started:'Wedstrijd gestart',match_paused:'Wedstrijd gepauzeerd',match_resumed:'Wedstrijd hervat',halftime_started:'Rust gestart',second_half_started:'Tweede helft gestart',injury_time_set:'Extra tijd ingesteld',automatic_deadline_stop:'Automatische eindstop',extra_time_started:'Verlenging gestart',penalties_started:'Strafschoppen gestart',penalty_scored:'Strafschop raak',penalty_missed:'Strafschop gemist',match_finished:'Wedstrijd beëindigd',match_closed:'Wedstrijd gesloten',substitution:'Wissel',substitution_corrected:'Wissel gecorrigeerd',substitution_voided:'Wissel ongeldig',position_changed:'Positie gewijzigd',position_corrected:'Positie gecorrigeerd',position_voided:'Positie ongeldig',goal_for:'Doelpunt ClubMatch',goal_against:'Doelpunt tegenstander',goal_corrected:'Doelpunt gecorrigeerd',goal_voided:'Doelpunt ongeldig',formation_changed:'Formatie gewijzigd',player_action:'Speleractie',note:'Notitie',correction:'Correctie'
});
function typeLabel(event){
  if(event?.event_type==='position_changed'&&event?.payload?.formation_changed)return 'Formatie gewijzigd';
  if(event?.event_type==='position_changed'&&event?.payload?.swap===true)return 'Positieruil';
  if(event?.event_type==='player_action')return PLAYER_ACTION_LABELS[event?.payload?.action]||'Speleractie';
  return TYPE_LABELS[event?.event_type]||clean(event?.event_type).replace(/_/g,' ')||'Gebeurtenis';
}
function substitutionChanges(event,players){
  const d=event?.substitution||{},out=event?.subject_player_id||d.player_out_id,inId=event?.related_player_id||d.player_in_id,oldPos=event?.payload?.old_position||d.old_position||'',newPos=event?.payload?.new_position||d.new_position||oldPos;
  const changes={};if(out)changes[out]=`${pos(oldPos)} → BANK`;if(inId)changes[inId]=`BANK → ${pos(newPos)}`;
  return {summary:`${playerName(players,out)} uit (${pos(oldPos)} → BANK) · ${playerName(players,inId)} in (BANK → ${pos(newPos)})`,changes};
}
function positionChanges(event,players){
  const payload=event?.payload||{},a=event?.subject_player_id,b=event?.related_player_id,d=event?.position_change||{};
  if(payload.formation_changed){
    const assignments=Array.isArray(payload.assignments)?payload.assignments:[];const changes={};assignments.forEach(item=>{const id=item.player_id||item.playerId;if(id)changes[id]=`→ ${pos(item.position)}`});
    return {summary:`Formatie ${payload.old_formation||'—'} → ${payload.new_formation||payload.formation_code||'—'}`,changes};
  }
  if(payload.swap===true||b){const aOld=payload.player_a_old_position||payload.old_position||d.old_position||'',aNew=payload.player_a_new_position||payload.new_position||d.new_position||'',bOld=payload.player_b_old_position||aNew,bNew=payload.player_b_new_position||aOld;return {summary:`${playerName(players,a)} ${pos(aOld)} → ${pos(aNew)} · ${playerName(players,b)} ${pos(bOld)} → ${pos(bNew)}`,changes:{[a]:`${pos(aOld)} → ${pos(aNew)}`,[b]:`${pos(bOld)} → ${pos(bNew)}`}}}
  const pid=a||d.player_id,oldPos=payload.old_position||d.old_position||'',newPos=payload.new_position||d.new_position||'';return {summary:`${playerName(players,pid)} ${pos(oldPos)} → ${pos(newPos)}`,changes:pid?{[pid]:`${pos(oldPos)} → ${pos(newPos)}`}:{}};
}
function goalDescription(event,players){
  const g=event?.goal||{},side=g.side||(event?.event_type==='goal_for'?'for':event?.event_type==='goal_against'?'against':null),scorer=g.scorer_player_id||event?.subject_player_id,assist=g.assist_player_id||event?.related_player_id,type=g.goal_type||event?.payload?.goal_type,note=g.note||event?.payload?.note;
  if(side==='against')return `Doelpunt tegenstander${type?` · ${type}`:''}${note?` · ${note}`:''}`;
  return `${playerName(players,scorer)}${assist?` · assist ${playerName(players,assist)}`:''}${type?` · ${type}`:''}${note?` · ${note}`:''}`;
}
function correctionDescription(event,players){
  const reason=clean(event?.payload?.reason);if(event?.event_type==='goal_voided')return `Doelpunt ongeldig${reason?` · Reden: ${reason}`:''}`;
  if(event?.event_type==='substitution_voided')return `Wissel ongeldig${reason?` · Reden: ${reason}`:''}`;
  if(event?.event_type==='position_voided')return `Positiewijziging ongeldig${reason?` · Reden: ${reason}`:''}`;
  if(event?.event_type==='goal_corrected')return `Doelpunt gecorrigeerd${reason?` · ${reason}`:''}`;
  if(event?.event_type==='substitution_corrected')return `Wissel gecorrigeerd${reason?` · ${reason}`:''}`;
  if(event?.event_type==='position_corrected')return `Positie gecorrigeerd${reason?` · ${reason}`:''}`;
  return '';
}
function describeEvent(event,playersById){
  const type=event?.event_type||event?.type||'',payload=event?.payload||{};let description='',playerChanges={};
  if(type==='substitution'){const d=substitutionChanges(event,playersById);description=d.summary;playerChanges=d.changes}
  else if(type==='position_changed'||type==='formation_changed'){const d=positionChanges(event,playersById);description=d.summary;playerChanges=d.changes}
  else if(type==='goal_for'||type==='goal_against')description=goalDescription(event,playersById);
  else if(/_(voided|corrected)$/.test(type))description=correctionDescription(event,playersById);
  else if(type==='match_started')description=`Start${payload.formation?` · formatie ${payload.formation}`:''}`;
  else if(type==='match_paused')description='Wedstrijdklok gepauzeerd';
  else if(type==='match_resumed')description='Wedstrijdklok hervat';
  else if(type==='halftime_started')description='Rust gestart';
  else if(type==='second_half_started')description='Tweede helft gestart';
  else if(type==='injury_time_set')description=`Extra tijd ${payload.minutes??'—'} min`;
  else if(type==='automatic_deadline_stop')description='Klok automatisch gestopt op de ingestelde eindgrens';
  else if(type==='extra_time_started')description=`Verlenging gestart${payload.minutes?` · ${payload.minutes} min`:''}`;
  else if(type==='penalties_started')description='Strafschoppenreeks gestart';
  else if(type==='penalty_scored'||type==='penalty_missed')description=`${payload.side==='against'?'Tegenstander':'ClubMatch'} · ${type==='penalty_scored'?'raak':'mis'}`;
  else if(type==='match_finished')description='Wedstrijd definitief beëindigd';
  else if(type==='player_action'){const action=PLAYER_ACTION_LABELS[payload.action]||payload.action||'Speleractie';description=`${playerName(playersById,event?.subject_player_id)} · ${action}${payload.note?` · ${payload.note}`:''}`;if(event?.subject_player_id)playerChanges[event.subject_player_id]=action}
  else description=clean(payload.note)||typeLabel(event);
  return Object.freeze({label:typeLabel(event),description,playerChanges:Object.freeze({...playerChanges})});
}
function latestPlayerChanges(events,playersById){const latest={};(events||[]).forEach(event=>{const d=describeEvent(event,playersById);const matchSecond=Math.max(0,Number(event?.matchSecond??event?.match_second??0)||0);Object.entries(d.playerChanges).forEach(([id,text])=>{if(!latest[id]||matchSecond>=latest[id].matchSecond)latest[id]={text,matchSecond,label:d.label}})});return latest}
global.ClubMatchV08EventDescriber={TYPE_LABELS,PLAYER_ACTION_LABELS,typeLabel,describeEvent,latestPlayerChanges,playerName};
})(typeof window!=='undefined'?window:globalThis);
