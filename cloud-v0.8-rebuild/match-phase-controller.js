/* ClubMatch Cloud v0.8 - wedstrijdphase controller buiten de live-state rekenkern */
(function(global){
'use strict';
function invariant(ok,message){if(!ok)throw new Error(message)}
function createMatchPhaseController(options={}){
  const client=options.client,runtime=options.runtime;invariant(client?.rpc&&runtime,'Cloud-client en live-runtime zijn verplicht');let queue=Promise.resolve();
  const id=()=>global.crypto?.randomUUID?.()||`phase-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  async function rpc(name,params){const result=await client.rpc(name,params);if(result?.error)throw result.error;return result?.data}
  function enqueue(fn){const next=queue.then(fn,fn);queue=next.catch(()=>{});return next}
  async function refresh(){if(runtime.activeMatchId)return runtime.refresh('wedstrijdphase');return null}
  function requireMatch(){invariant(runtime.activeMatchId,'Open eerst een wedstrijd');return runtime.activeMatchId}
  function enforceDeadline(matchId=runtime.activeMatchId){if(!matchId)return Promise.resolve(null);return enqueue(async()=>{const data=await rpc('enforce_match_deadline_v08',{p_match_id:matchId});if(data?.changed&&runtime.activeMatchId===matchId)await refresh();return data})}
  function finish(){return enqueue(async()=>{const matchId=requireMatch(),data=await rpc('finish_match_v08',{p_match_id:matchId,p_client_event_id:id()});await refresh();return data})}
  function startExtraTime(minutes=30){return enqueue(async()=>{const matchId=requireMatch(),n=Number(minutes);invariant(Number.isInteger(n)&&n>=1&&n<=60,'Duur verlenging moet tussen 1 en 60 minuten zijn');const data=await rpc('start_extra_time_v08',{p_match_id:matchId,p_minutes:n,p_client_event_id:id()});await refresh();return data})}
  function startPenalties(){return enqueue(async()=>{const matchId=requireMatch(),data=await rpc('start_penalties_v08',{p_match_id:matchId,p_client_event_id:id()});await refresh();return data})}
  function recordPenalty(side,scored){return enqueue(async()=>{const matchId=requireMatch();invariant(side==='for'||side==='against','Kies eigen team of tegenstander');const data=await rpc('record_penalty_v08',{p_match_id:matchId,p_side:side,p_scored:!!scored,p_client_event_id:id()});await refresh();return data})}
  return Object.freeze({enforceDeadline,finish,startExtraTime,startPenalties,recordPenalty})
}
global.ClubMatchV08MatchPhase={createMatchPhaseController};
})(typeof window!=='undefined'?window:globalThis);
