/* ClubMatch Cloud v0.8 - quick actions, possession and fast ball-flow */
(function(global){
'use strict';
const ACTIONS=Object.freeze(['possession_control','possession_start','possession_stop','pass_received','pass_completed','ball_recovery','interception','block','ball_loss','bad_pass','chance_created','duel_won','duel_lost','shot','shot_on_target','foul_committed','foul_won','injury','save']);
const LOSS_CAUSES=Object.freeze(['bad_pass','duel_lost','poor_control','dribble','interception','other','unknown']);
function invariant(ok,message){if(!ok)throw new Error(message)}
function totalSecond(event){return Math.max(0,(Number(event?.match_minute)||0)*60+(Number(event?.match_second)||0))}
function createPlayerActionController(options={}){
 const client=options.client,runtime=options.runtime;invariant(client?.rpc&&runtime,'Cloud-client en live-runtime zijn verplicht');let snapshot=null,queue=Promise.resolve();
 const id=()=>global.crypto?.randomUUID?.()||`action-${Date.now()}-${Math.random().toString(16).slice(2)}`;
 function setSnapshot(next){snapshot=next?.match?.id?next:null;return snapshot}
 function player(playerId){return (snapshot?.players||[]).find(p=>p.player_id===playerId)||null}
 function possession(){const events=(snapshot?.events||[]).filter(e=>e.event_type==='player_action'&&['possession_start','possession_stop'].includes(e?.payload?.action)).slice().sort((a,b)=>totalSecond(a)-totalSecond(b)||String(a.id).localeCompare(String(b.id)));const last=events.at(-1);if(!last||last.payload?.action!=='possession_start')return null;const p=player(last.subject_player_id);return p?{playerId:p.player_id,name:p.display_name||p.full_name||p.player_id,shirtNumber:p.shirt_number??null,startedSecond:totalSecond(last)}:null}
 async function call(name,params){const result=await client.rpc(name,params);if(result?.error)throw result.error;await runtime.refresh(name);return result?.data}
 async function rawRecord(playerId,action,note='',context={}){invariant(snapshot?.match?.id&&runtime.activeMatchId,'Open eerst een live wedstrijd');invariant(ACTIONS.includes(action),'Onbekende speleractie');const p=player(playerId);invariant(p?.selected,'Speler hoort niet bij de wedstrijdselectie');if(!['injury','possession_stop'].includes(action))invariant(p.is_on_field,'Deze actie kan alleen voor een veldspeler');return call('record_player_action_v2',{p_match_id:runtime.activeMatchId,p_player_id:playerId,p_action:action,p_client_event_id:id(),p_related_player_id:context.relatedPlayerId||null,p_cause:context.cause||null,p_note:String(note||'').trim()||null})}
 function enqueue(fn){const next=queue.then(fn,fn);queue=next.catch(()=>{});return next}
 function record(playerId,action,note='',context={}){if(action==='bad_pass')return loseBall(playerId,'bad_pass',note);if(action==='ball_loss')return loseBall(playerId,context.cause||'unknown',note);return enqueue(()=>rawRecord(playerId,action,note,context))}
 function startPossession(playerId){return enqueue(async()=>{const active=possession();if(active?.playerId===playerId)return {ok:true,idempotent:true,reason:'already_active'};return rawRecord(playerId,'possession_start','Bezit-timer gestart')})}
 function stopPossession(){return enqueue(async()=>{const active=possession();invariant(active?.playerId,'Er loopt geen geregistreerd balbezit');return rawRecord(active.playerId,'possession_stop','Bezit-timer gestopt')})}
 function receiveBall(playerId){return enqueue(async()=>{const active=possession();const target=player(playerId);invariant(target?.selected&&target.is_on_field,'Ontvanger moet een veldspeler zijn');if(active?.playerId===playerId)return {ok:true,idempotent:true,reason:'already_has_ball'};if(!active?.playerId)return rawRecord(playerId,'possession_start','Balstroom gestart');const from=player(active.playerId);invariant(from?.is_on_field,'Huidige balbezitter staat niet meer op het veld');return call('record_ball_flow_v08',{p_match_id:runtime.activeMatchId,p_from_player_id:active.playerId,p_to_player_id:playerId,p_client_event_id:id()})})}
 function loseBall(playerId,cause='unknown',note=''){return enqueue(async()=>{invariant(LOSS_CAUSES.includes(cause),'Onbekende oorzaak balverlies');const p=player(playerId);invariant(p?.selected&&p.is_on_field,'Balverlies kan alleen voor een veldspeler');return call('record_ball_loss_v08',{p_match_id:runtime.activeMatchId,p_player_id:playerId,p_cause:cause,p_client_event_id:id(),p_note:String(note||'').trim()||null})})}
 return Object.freeze({setSnapshot,record,startPossession,stopPossession,receiveBall,loseBall,currentPossession:possession,get snapshot(){return snapshot},get actions(){return ACTIONS},get lossCauses(){return LOSS_CAUSES}})
}
global.ClubMatchV08PlayerActions={ACTIONS,LOSS_CAUSES,createPlayerActionController,totalSecond};
})(typeof window!=='undefined'?window:globalThis);
