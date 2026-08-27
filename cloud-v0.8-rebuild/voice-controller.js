/* ClubMatch Cloud v0.8 - confirmation gate between speech/text and confirmed runtime */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function createVoiceController(options={}){
  const runtime=options.runtime,playerActions=options.playerActions||null,parse=options.parseCommand||global.ClubMatchV08VoiceCommand?.parseCommand;invariant(runtime,'Live-runtime is verplicht');invariant(typeof parse==='function','Spraakopdracht-parser is verplicht');
  let snapshot=null,pending=null,lastText='',lastError='';
  function state(){return freeze({hasMatch:!!snapshot?.match?.id,lastText,pending:pending?{...pending,payload:{...pending.payload}}:null,lastError})}
  function emit(){const s=state();options.onChange?.(s);return s}
  function setSnapshot(next){snapshot=next?.match?.id?next:null;if(!snapshot){pending=null;lastText='';lastError=''}return emit()}
  function prepare(text){lastText=String(text??'').trim();lastError='';pending=null;if(!snapshot?.match?.id){lastError='Open eerst een actieve wedstrijd';emit();return {ok:false,error:lastError}}const parsed=parse(lastText,snapshot);if(!parsed.ok){lastError=parsed.error||'Opdracht niet herkend';emit();return parsed}pending=parsed;emit();return parsed}
  function cancel(){pending=null;lastError='';return emit()}
  async function confirm(){
    invariant(snapshot?.match?.id,'Open eerst een actieve wedstrijd');invariant(pending?.ok,'Er staat geen geldige opdracht klaar om te bevestigen');const command=pending;let result;
    try{switch(command.action){case 'SUBSTITUTION':result=await runtime.substitute(command.payload);break;case 'SWAP':result=await runtime.swapPositions(command.payload);break;case 'POSITION':result=await runtime.changePosition(command.payload);break;case 'GOAL_FOR':case 'GOAL_AGAINST':result=await runtime.recordGoal(command.payload);break;case 'CLOCK':result=await runtime.advanceClock(command.payload);break;case 'PLAYER_ACTION':invariant(playerActions?.record,'Speleractie-controller is niet beschikbaar');result=await playerActions.record(command.payload.playerId,command.payload.playerAction,command.payload.note||'');break;default:throw new Error(`Niet-ondersteunde bevestigde opdracht: ${command.action}`)}pending=null;lastError='';emit();return result}catch(error){lastError=error?.message||String(error);emit();throw error}
  }
  function clear(){snapshot=null;pending=null;lastText='';lastError='';return emit()}
  return Object.freeze({setSnapshot,prepare,confirm,cancel,clear,get state(){return state()}})
}
global.ClubMatchV08VoiceController={createVoiceController};
})(typeof window!=='undefined'?window:globalThis);
