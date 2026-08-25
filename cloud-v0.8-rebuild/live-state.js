/* ClubMatch Cloud v0.8 - deterministic LiveMatchState engine */
(function(global){
'use strict';
const clamp=n=>Math.max(0,Math.floor(Number(n)||0));
const sec=e=>clamp(e.matchSecond ?? e.second ?? (Number(e.minute)||0)*60);
const order=(a,b)=>sec(a)-sec(b)||Number(a.seq||0)-Number(b.seq||0);
const key=e=>e.clientEventId||e.client_event_id||e.id||[e.type,sec(e),e.outId,e.inId,e.playerId,e.position,e.otherPlayerId,e.otherPosition].join('|');

function deriveLiveMatchState(input){
 const now=clamp(input.effectiveMatchSecond), selected=[...(input.selectedIds||[])], starters=new Set(input.starterIds||[]), startPos={...(input.startingPositionsById||{})};
 const players={};
 selected.forEach(id=>players[id]={playerId:id,initialRole:starters.has(id)?'FIELD':'BENCH',currentRole:starters.has(id)?'FIELD':'BENCH',startedPosition:startPos[id]||'',currentPosition:starters.has(id)?(startPos[id]||''):'',playSeconds:0,benchSeconds:0,currentStintSeconds:0,currentStintStartedAtSecond:0,inCount:0,outCount:0,substitutionCount:0,lastSubstitutionSecond:null,lastSubstitutionDirection:null,changeState:'NEVER_SUBBED',_last:0});
 const seen=new Set(), rejected=[];
 const events=[...(input.events||[])].sort(order).filter(e=>{const k=key(e);if(seen.has(k))return false;seen.add(k);return true});
 function accrue(p,to){const d=Math.max(0,Math.min(now,to)-p._last);if(p.currentRole==='FIELD')p.playSeconds+=d;else p.benchSeconds+=d;p._last=Math.min(now,to)}
 events.forEach(e=>{
   const at=Math.min(now,sec(e)); if(sec(e)>now)return;
   if(e.type==='WISSEL'||e.type==='SUBSTITUTION'){
     const out=players[e.outId], inn=players[e.inId]; if(!out||!inn||out===inn){rejected.push({event:e,reason:'invalid players'});return}
     accrue(out,at);accrue(inn,at);
     if(out.currentRole!=='FIELD'||inn.currentRole!=='BENCH'){rejected.push({event:e,reason:'role conflict'});return}
     const inheritedPosition=e.position||e.inPosition||out.currentPosition||'';
     out.currentRole='BENCH';out.currentPosition='';out.outCount++;out.substitutionCount++;out.lastSubstitutionSecond=at;out.lastSubstitutionDirection='OUT';out._last=at;
     inn.currentRole='FIELD';inn.currentPosition=inheritedPosition;inn.inCount++;inn.substitutionCount++;inn.lastSubstitutionSecond=at;inn.lastSubstitutionDirection='IN';inn._last=at;
   } else if(e.type==='POSITIE'||e.type==='POSITION_CHANGED'){
     const p=players[e.playerId];
     if(!p||p.currentRole!=='FIELD'||!e.position){rejected.push({event:e,reason:'invalid position change'});return}
     if(e.otherPlayerId){
       const q=players[e.otherPlayerId];if(!q||q.currentRole!=='FIELD'||q===p){rejected.push({event:e,reason:'invalid position swap'});return}
       const pOld=p.currentPosition,qOld=q.currentPosition;
       p.currentPosition=e.position||qOld;
       q.currentPosition=e.otherPosition||pOld;
     }else p.currentPosition=e.position;
   }
 });
 Object.values(players).forEach(p=>{accrue(p,now);p.currentStintSeconds=Math.max(0,now-p._last);p.currentStintStartedAtSecond=p._last;if(p.substitutionCount)p.changeState=p.lastSubstitutionDirection==='IN'?'JUST_IN':'JUST_OUT';delete p._last});
 let latest=-1;Object.values(players).forEach(p=>{if(p.lastSubstitutionSecond!==null)latest=Math.max(latest,p.lastSubstitutionSecond)});
 Object.values(players).forEach(p=>{if(p.substitutionCount&&p.lastSubstitutionSecond!==latest)p.changeState='SUBBED_BEFORE'});
 return {effectiveMatchSecond:now,players,fieldIds:selected.filter(id=>players[id]?.currentRole==='FIELD'),benchIds:selected.filter(id=>players[id]?.currentRole==='BENCH'),rejectedEvents:rejected};
}
function validateLiveState(s){
 const errors=[];Object.values(s.players).forEach(p=>{if(p.playSeconds+p.benchSeconds!==s.effectiveMatchSecond)errors.push(`${p.playerId}: play+bench mismatch`)});
 if(s.fieldIds.length!==11)errors.push(`field count ${s.fieldIds.length}, expected 11`);
 const positions=s.fieldIds.map(id=>s.players[id].currentPosition).filter(Boolean),dup=positions.filter((x,i)=>positions.indexOf(x)!==i);if(dup.length)errors.push(`duplicate positions: ${[...new Set(dup)].join(', ')}`);
 if(s.rejectedEvents?.length)errors.push(`${s.rejectedEvents.length} rejected event(s)`);
 return {ok:errors.length===0,errors};
}
function canSubstitute(s,outId,inId){return !!s.players[outId]&&!!s.players[inId]&&outId!==inId&&s.players[outId].currentRole==='FIELD'&&s.players[inId].currentRole==='BENCH'}
function canChangePosition(s,playerId){return !!s.players[playerId]&&s.players[playerId].currentRole==='FIELD'}
global.ClubMatchV08={deriveLiveMatchState,validateLiveState,canSubstitute,canChangePosition};
})(window);
