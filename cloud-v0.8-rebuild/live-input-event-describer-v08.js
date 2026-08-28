/* ClubMatch Cloud v0.8 - richer live-input event descriptions */
(function(global){
'use strict';
const base=global.ClubMatchV08EventDescriber;if(!base?.describeEvent)return;
const EXTRA_ACTION=Object.freeze({offside:'Buitenspel',penalty:'Penalty'});
const EXTRA_GOAL=Object.freeze({header:'Kopbal',volley:'Volley',tap_in:'Intikker',long_shot:'Afstandsschot',one_on_one:'1-op-1',direct_free_kick:'Directe vrije trap'});
function fmtCoord(v){return Number.isFinite(Number(v))?Math.round(Number(v)):null}
function describeSpatial(event,players){
  const p=event?.payload||{},side=p.side==='against'?'against':'for',label=EXTRA_ACTION[p.action],subject=event?.subject_player_id?base.playerName(players,event.subject_player_id):'',who=side==='against'?'Tegenstander':(subject||'Eigen team'),x=fmtCoord(p.start_x),y=fmtCoord(p.start_y),where=x!==null&&y!==null?` · locatie ${x},${y}`:'',note=p.note?` · ${p.note}`:'';
  return Object.freeze({label:side==='against'?`Tegenstander · ${label}`:label,description:`${who} · ${label}${where}${note}`,playerChanges:Object.freeze(event?.subject_player_id?{[event.subject_player_id]:label}:{}),tone:p.action==='penalty'?(side==='for'?'green':'red'):'amber'});
}
function describeAnalystUndo(event){const p=event?.payload||{},reason=p.reason?` · ${p.reason}`:'';return Object.freeze({label:'Analistactie teruggedraaid',description:`Correctie · oorspronkelijke ${p.original_event_type||'analistactie'} ongeldig gemaakt${reason}`,playerChanges:Object.freeze({}),tone:'red'});}
const original=base.describeEvent.bind(base);
function describeEvent(event,players){
  const p=event?.payload||{};
  if(event?.event_type==='analyst_action_voided')return describeAnalystUndo(event);
  if(event?.event_type==='player_action'&&p.source==='action_field'&&EXTRA_ACTION[p.action])return describeSpatial(event,players);
  const result=original(event,players),goalType=event?.goal?.goal_type||p.goal_type;
  if(EXTRA_GOAL[goalType]&&result?.description){
    const raw=String(goalType),label=EXTRA_GOAL[goalType],description=String(result.description).replace(` · ${raw}`,` · ${label}`);
    return Object.freeze({...result,description});
  }
  return result;
}
global.ClubMatchV08EventDescriber=Object.freeze({...base,EXTRA_ACTION_LABELS:EXTRA_ACTION,EXTRA_GOAL_TYPE_LABELS:EXTRA_GOAL,describeEvent});
})(typeof window!=='undefined'?window:globalThis);
