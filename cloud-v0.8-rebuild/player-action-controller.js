/* ClubMatch Cloud v0.8 - quick player actions and optional possession timer */
(function(global){
'use strict';
const ACTIONS=Object.freeze(['possession_control','possession_start','possession_stop','ball_recovery','interception','block','ball_loss','bad_pass','chance_created','duel_won','duel_lost','shot','shot_on_target','foul_committed','foul_won','injury','save']);
function invariant(ok,message){if(!ok)throw new Error(message)}
function totalSecond(event){return Math.max(0,(Number(event?.match_minute)||0)*60+(Number(event?.match_second)||0))}
function createPlayerActionController(options={}){
  const client=options.client,runtime=options.runtime;invariant(client?.rpc&&runtime,'Cloud-client en live-runtime zijn verplicht');let snapshot=null,queue=Promise.resolve();
  const id=()=>global.crypto?.randomUUID?.()||`action-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function setSnapshot(next){snapshot=next?.match?.id?next:null;return snapshot}
  function player(playerId){return (snapshot?.players||[]).find(p=>p.player_id===playerId)||null}
  function possession(){const events=(snapshot?.events||[]).filter(e=>e.event_type==='player_action'&&['possession_start','possession_stop'].includes(e?.payload?.action)).slice().sort((a,b)=>totalSecond(a)-totalSecond(b)||String(a.id).localeCompare(String(b.id)));const last=events.at(-1);if(!last||last.payload?.action!=='possession_start')return null;const p=player(last.subject_player_id);return p?{playerId:p.player_id,name:p.display_name||p.full_name||p.player_id,shirtNumber:p.shirt_number??null,startedSecond:totalSecond(last)}:null}
  async function rawRecord(playerId,action,note=''){invariant(snapshot?.match?.id&&runtime.activeMatchId,'Open eerst een live wedstrijd');invariant(ACTIONS.includes(action),'Onbekende speleractie');const p=player(playerId);invariant(p?.selected,'Speler hoort niet bij de wedstrijdselectie');if(!['injury','possession_stop'].includes(action))invariant(p.is_on_field,'Deze actie kan alleen voor een veldspeler');const result=await client.rpc('record_player_action_v08',{p_match_id:runtime.activeMatchId,p_player_id:playerId,p_action:action,p_client_event_id:id(),p_note:String(note||'').trim()||null});if(result?.error)throw result.error;await runtime.refresh('speleractie');return result?.data}
  function enqueue(fn){const next=queue.then(fn,fn);queue=next.catch(()=>{});return next}
  function record(playerId,action,note=''){return enqueue(()=>rawRecord(playerId,action,note))}
  function startPossession(playerId){return enqueue(async()=>{const active=possession();if(active?.playerId===playerId)return {ok:true,idempotent:true,reason:'already_active'};return rawRecord(playerId,'possession_start','Bezit-timer gestart')})}
  function stopPossession(){return enqueue(async()=>{const active=possession();invariant(active?.playerId,'Er loopt geen geregistreerd balbezit');return rawRecord(active.playerId,'possession_stop','Bezit-timer gestopt')})}
  return Object.freeze({setSnapshot,record,startPossession,stopPossession,currentPossession:possession,get snapshot(){return snapshot},get actions(){return ACTIONS}})
}
global.ClubMatchV08PlayerActions={ACTIONS,createPlayerActionController,totalSecond};
})(typeof window!=='undefined'?window:globalThis);
