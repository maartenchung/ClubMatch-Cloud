/* ClubMatch Cloud v0.8 - safe gesture/action proposal controller */
(function(global){
'use strict';
const ACTION_LABELS=Object.freeze({
 possession_control:'Balcontrole',pass:'Pass',progression:'Vooruit spelen',switch_play:'Spel verleggen',cross:'Voorzet',shot:'Schot',shot_on_target:'Schot op doel',chance_created:'Kans gecreëerd',ball_loss:'Balverlies',ball_recovery:'Bal veroverd',interception:'Onderschepping',duel_won:'Duel gewonnen',duel_lost:'Duel verloren',foul_committed:'Overtreding gemaakt',foul_won:'Overtreding mee',free_kick:'Vrije trap',corner:'Corner',throw_in:'Ingooi',save:'Redding'
});
function invariant(ok,message){if(!ok)throw new Error(message)}
function clamp(v){const n=Number(v);return Math.max(0,Math.min(100,Number.isFinite(n)?n:0))}
function point(value){return Object.freeze({x:clamp(value?.x),y:clamp(value?.y)})}
function distance(a,b){return Math.hypot(b.x-a.x,b.y-a.y)}
function zone(y,side){const v=clamp(y);if(side==='against'){if(v>67)return 'aanvalsderde';if(v>33)return 'midden';return 'verdedigingsderde'}if(v<33)return 'aanvalsderde';if(v<67)return 'midden';return 'verdedigingsderde'}
function classifyGesture(start,end,side){const a=point(start),b=point(end),dx=b.x-a.x,dy=b.y-a.y,d=distance(a,b),towardGoal=side==='against'?dy>0:dy<0,nearGoal=side==='against'?b.y>=84:b.y<=16;let action='pass';if(d<7)action='possession_control';else if(nearGoal&&towardGoal&&Math.abs(dy)>=12)action='shot';else if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(dy)*1.2)action='switch_play';else if(towardGoal&&Math.abs(dy)>=22)action='progression';else if(Math.abs(dx)>=18&&nearGoal)action='cross';return Object.freeze({action,start:a,end:b,distance:Math.round(d*10)/10,fromZone:zone(a.y,side),toZone:zone(b.y,side)})}
function clean(v){return String(v??'').trim()}
function makeId(){return global.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function createActionFieldController(options={}){
 const client=options.client,runtime=options.runtime;invariant(client?.rpc,'Cloud client with rpc is required');invariant(runtime?.refresh,'Live runtime is required');let snapshot=null,proposal=null,side='for',playerId='';
 function fieldPlayers(){return (snapshot?.players||[]).filter(p=>p.is_on_field).map(p=>Object.freeze({id:p.player_id,name:p.display_name||p.full_name||p.player_id,number:p.shirt_number??null,position:p.current_position||p.starting_position||''}))}
 function usable(){return snapshot?.match?.status==='live'&&snapshot?.state?.clock_status==='running'&&['first_half','second_half','extra_time'].includes(snapshot?.state?.period)}
 function state(){return Object.freeze({snapshot,proposal,side,playerId,fieldPlayers:Object.freeze(fieldPlayers()),canUse:usable()})}
 function emit(){const next=state();options.onChange?.(next);return next}
 function setSnapshot(next){snapshot=next||null;if(!snapshot?.match?.id){proposal=null;playerId=''}if(playerId&&!fieldPlayers().some(p=>p.id===playerId))playerId='';return emit()}
 function setSide(next){invariant(['for','against'].includes(next),'Onbekende speelzijde');side=next;if(side==='against')playerId='';return emit()}
 function setPlayer(next){if(!next){playerId='';return emit()}invariant(side==='for','Een eigen speler kan alleen bij ons team worden gekozen');invariant(fieldPlayers().some(p=>p.id===next),'Speler staat niet op het veld');playerId=next;return emit()}
 function playerLabel(id){const p=fieldPlayers().find(x=>x.id===id);return p?`#${p.number??'—'} ${p.name}`:'Eigen team'}
 function buildProposal(action,input={}){invariant(usable(),'Actieveld is alleen beschikbaar bij een lopende wedstrijdklok');invariant(ACTION_LABELS[action],`Onbekende actie: ${action}`);const chosenSide=input.side||side,chosenPlayer=chosenSide==='for'?(input.playerId??playerId):'';if(chosenPlayer)invariant(fieldPlayers().some(p=>p.id===chosenPlayer),'Speler staat niet op het veld');const start=input.start?point(input.start):null,end=input.end?point(input.end):null;proposal=Object.freeze({id:makeId(),side:chosenSide,playerId:chosenPlayer||null,action,label:ACTION_LABELS[action],start,end,fromZone:start?zone(start.y,chosenSide):null,toZone:end?zone(end.y,chosenSide):null,note:clean(input.note),summary:`${chosenSide==='against'?'Tegenstander':(chosenPlayer?playerLabel(chosenPlayer):'Eigen team')} · ${ACTION_LABELS[action]}${start&&end?` · ${zone(start.y,chosenSide)} → ${zone(end.y,chosenSide)}`:''}`});return emit()}
 function proposeGesture(input={}){const chosenSide=input.side||side,gesture=classifyGesture(input.start,input.end,chosenSide);return buildProposal(gesture.action,{...input,side:chosenSide,start:gesture.start,end:gesture.end})}
 function proposeAction(action,input={}){return buildProposal(action,input)}
 function cancel(){proposal=null;return emit()}
 async function confirm(){invariant(proposal,'Er is geen actievoorstel om te bevestigen');invariant(snapshot?.match?.id,'Geen live wedstrijd geselecteerd');const p=proposal;const result=await client.rpc('record_action_field_event_v08',{p_match_id:snapshot.match.id,p_side:p.side,p_action:p.action,p_player_id:p.playerId,p_start_x:p.start?.x??null,p_start_y:p.start?.y??null,p_end_x:p.end?.x??null,p_end_y:p.end?.y??null,p_note:p.note||null,p_client_event_id:p.id});if(result?.error)throw result.error;proposal=null;await runtime.refresh('actieveld');emit();return result?.data}
 async function setPossession(nextSide){invariant(['for','against'].includes(nextSide),'Balbezitzijde ontbreekt');invariant(snapshot?.match?.id,'Geen live wedstrijd geselecteerd');invariant(usable(),'Balbezit kan alleen tijdens een lopende wedstrijdklok worden gestart');side=nextSide;if(side==='against')playerId='';const result=await client.rpc('record_team_possession_v08',{p_match_id:snapshot.match.id,p_action:'start',p_side:nextSide,p_client_event_id:makeId()});if(result?.error)throw result.error;await runtime.refresh('team-balbezit');emit();return result?.data}
 async function stopPossession(){invariant(snapshot?.match?.id,'Geen live wedstrijd geselecteerd');const result=await client.rpc('record_team_possession_v08',{p_match_id:snapshot.match.id,p_action:'stop',p_side:null,p_client_event_id:makeId()});if(result?.error)throw result.error;await runtime.refresh('team-balbezit-stop');emit();return result?.data}
 return Object.freeze({setSnapshot,setSide,setPlayer,proposeGesture,proposeAction,cancel,confirm,setPossession,stopPossession,classifyGesture,get state(){return state()}})
}
global.ClubMatchV08ActionField={ACTION_LABELS,classifyGesture,createActionFieldController};
})(typeof window!=='undefined'?window:globalThis);
