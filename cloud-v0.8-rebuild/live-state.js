/* ClubMatch Cloud v0.8 - deterministic LiveMatchState engine */
(function(global){
'use strict';
const clamp=n=>Math.max(0,Math.floor(Number(n)||0));
const sec=e=>clamp(e.matchSecond ?? (Number(e.minute)||0)*60);
const order=(a,b)=>sec(a)-sec(b)||Number(a.seq||0)-Number(b.seq||0);

function deriveLiveMatchState(input){
 const now=clamp(input.effectiveMatchSecond), selected=[...(input.selectedIds||[])], starters=new Set(input.starterIds||[]), startPos={...(input.startingPositionsById||{})};
 const players={};
 selected.forEach(id=>players[id]={playerId:id,initialRole:starters.has(id)?'FIELD':'BENCH',currentRole:starters.has(id)?'FIELD':'BENCH',startedPosition:startPos[id]||'',currentPosition:starters.has(id)?(startPos[id]||''):'',playSeconds:0,benchSeconds:0,currentStintSeconds:0,currentStintStartedAtSecond:0,inCount:0,outCount:0,substitutionCount:0,lastSubstitutionSecond:null,lastSubstitutionDirection:null,changeState:'NEVER_SUBBED',_last:0});
 const events=[...(input.events||[])].sort(order);
 function accrue(p,to){const d=Math.max(0,Math.min(now,to)-p._last);if(p.currentRole==='FIELD')p.playSeconds+=d;else p.benchSeconds+=d;p._last=Math.min(now,to)}
 events.forEach(e=>{
   const at=Math.min(now,sec(e)); if(sec(e)>now)return;
   if(e.type==='WISSEL'||e.type==='SUBSTITUTION'){
     const out=players[e.outId], inn=players[e.inId]; if(!out||!inn)return;
     accrue(out,at);accrue(inn,at);
     if(out.currentRole!=='FIELD'||inn.currentRole!=='BENCH')return;
     out.currentRole='BENCH';out.currentPosition='';out.outCount++;out.substitutionCount++;out.lastSubstitutionSecond=at;out.lastSubstitutionDirection='OUT';out._last=at;
     inn.currentRole='FIELD';inn.currentPosition=e.position||e.inPosition||out.currentPosition||startPos[e.inId]||'';inn.inCount++;inn.substitutionCount++;inn.lastSubstitutionSecond=at;inn.lastSubstitutionDirection='IN';inn._last=at;
   } else if(e.type==='POSITIE'||e.type==='POSITION_CHANGED'){
     const p=players[e.playerId];if(p&&p.currentRole==='FIELD'&&e.position)p.currentPosition=e.position;
     if(e.otherPlayerId&&players[e.otherPlayerId]&&e.otherPosition){players[e.otherPlayerId].currentPosition=e.otherPosition}
   }
 });
 Object.values(players).forEach(p=>{accrue(p,now);p.currentStintSeconds=Math.max(0,now-p._last);p.currentStintStartedAtSecond=p._last;if(p.substitutionCount){p.changeState=p.lastSubstitutionDirection==='IN'?'JUST_IN':'JUST_OUT'};delete p._last});
 // Only the most recent substitution keeps JUST_IN/JUST_OUT; older changed players become SUBBED_BEFORE.
 let latest=-1;Object.values(players).forEach(p=>{if(p.lastSubstitutionSecond!==null)latest=Math.max(latest,p.lastSubstitutionSecond)});
 Object.values(players).forEach(p=>{if(p.substitutionCount&&p.lastSubstitutionSecond!==latest)p.changeState='SUBBED_BEFORE'});
 return {effectiveMatchSecond:now,players,fieldIds:selected.filter(id=>players[id]?.currentRole==='FIELD'),benchIds:selected.filter(id=>players[id]?.currentRole==='BENCH')};
}
function validateLiveState(s){
 const errors=[];Object.values(s.players).forEach(p=>{if(p.playSeconds+p.benchSeconds!==s.effectiveMatchSecond)errors.push(`${p.playerId}: play+bench mismatch`)});
 if(s.fieldIds.length!==11)errors.push(`field count ${s.fieldIds.length}, expected 11`);
 const positions=s.fieldIds.map(id=>s.players[id].currentPosition).filter(Boolean), dup=positions.filter((x,i)=>positions.indexOf(x)!==i);if(dup.length)errors.push(`duplicate positions: ${[...new Set(dup)].join(', ')}`);
 return {ok:errors.length===0,errors};
}
global.ClubMatchV08={deriveLiveMatchState,validateLiveState};
})(window);
