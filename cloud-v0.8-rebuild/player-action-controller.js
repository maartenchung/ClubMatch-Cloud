/* ClubMatch Cloud v0.8 - quick player actions through append-only Cloud events */
(function(global){
'use strict';
const ACTIONS=Object.freeze(['possession_control','ball_recovery','interception','block','ball_loss','bad_pass','chance_created','duel_won','duel_lost','shot','shot_on_target','foul_committed','foul_won','injury','save']);
function invariant(ok,message){if(!ok)throw new Error(message)}
function createPlayerActionController(options={}){
  const client=options.client,runtime=options.runtime;invariant(client?.rpc&&runtime,'Cloud-client en live-runtime zijn verplicht');let snapshot=null,queue=Promise.resolve();
  const id=()=>global.crypto?.randomUUID?.()||`action-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  function setSnapshot(next){snapshot=next?.match?.id?next:null;return snapshot}
  function player(playerId){return (snapshot?.players||[]).find(p=>p.player_id===playerId)||null}
  function record(playerId,action,note=''){
    return queue=queue.then(async()=>{invariant(snapshot?.match?.id&&runtime.activeMatchId,'Open eerst een live wedstrijd');invariant(ACTIONS.includes(action),'Onbekende speleractie');const p=player(playerId);invariant(p?.selected,'Speler hoort niet bij de wedstrijdselectie');if(action!=='injury')invariant(p.is_on_field,'Deze actie kan alleen voor een veldspeler');const result=await client.rpc('record_player_action_v08',{p_match_id:runtime.activeMatchId,p_player_id:playerId,p_action:action,p_client_event_id:id(),p_note:String(note||'').trim()||null});if(result?.error)throw result.error;await runtime.refresh('speleractie');return result?.data}).catch(error=>{queue=Promise.resolve();throw error});
  }
  return Object.freeze({setSnapshot,record,get snapshot(){return snapshot},get actions(){return ACTIONS}})
}
global.ClubMatchV08PlayerActions={ACTIONS,createPlayerActionController};
})(typeof window!=='undefined'?window:globalThis);
