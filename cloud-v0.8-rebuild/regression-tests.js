/* ClubMatch v0.8 regression suite - no production UI dependency */
(function(){
'use strict';
const ids=Array.from({length:15},(_,i)=>`p${i+1}`), starters=ids.slice(0,11), positions=['GK','RB','RCB','LCB','LB','CM1','CM2','AM','RW','ST','LW'];
const startingPositionsById=Object.fromEntries(starters.map((id,i)=>[id,positions[i]]));
const input=(t,events=[])=>({effectiveMatchSecond:t,selectedIds:ids,starterIds:starters,startingPositionsById,events});
const S=(t,events=[])=>ClubMatchV08.deriveLiveMatchState(input(t,events));
const sub=(at,outId,inId,position,id)=>({id,type:'SUBSTITUTION',matchSecond:at,outId,inId,position});
const pos=(at,playerId,position,id,otherPlayerId,otherPosition)=>({id,type:'POSITION_CHANGED',matchSecond:at,playerId,position,otherPlayerId,otherPosition});
const assert=(cond,msg)=>{if(!cond)throw new Error(msg)};
const tests=[];const test=(name,fn)=>tests.push([name,fn]);

test('start has 11 field and exact clocks',()=>{const s=S(600);assert(s.fieldIds.length===11,'field count');assert(s.players.p1.playSeconds===600,'starter play');assert(s.players.p12.benchSeconds===600,'reserve bench')});
test('first substitution inherits outgoing position',()=>{const s=S(700,[sub(600,'p11','p12',null,'s1')]);assert(s.players.p11.currentRole==='BENCH','out bench');assert(s.players.p12.currentRole==='FIELD','in field');assert(s.players.p12.currentPosition==='LW','position inherited');assert(s.players.p11.playSeconds===600&&s.players.p11.benchSeconds===100,'out clocks');assert(s.players.p12.benchSeconds===600&&s.players.p12.playSeconds===100,'in clocks')});
test('second substitution works without refresh',()=>{const ev=[sub(600,'p11','p12',null,'s1'),sub(720,'p10','p13',null,'s2')],s=S(800,ev);assert(s.players.p13.currentRole==='FIELD','second in');assert(s.players.p10.currentRole==='BENCH','second out');assert(s.fieldIds.length===11,'still 11')});
test('third substitution can return earlier player',()=>{const ev=[sub(600,'p11','p12',null,'s1'),sub(720,'p10','p13',null,'s2'),sub(840,'p12','p11',null,'s3')],s=S(900,ev);assert(s.players.p11.currentRole==='FIELD','returned player field');assert(s.players.p11.inCount===1&&s.players.p11.outCount===1,'counts');assert(s.players.p12.currentRole==='BENCH','replacement back bench')});
test('single position change persists',()=>{const s=S(700,[pos(650,'p9','ST','p1')]);assert(s.players.p9.currentPosition==='ST','position changed')});
test('atomic position swap changes both players',()=>{const s=S(700,[pos(650,'p9','ST','ps','p10','RW')]);assert(s.players.p9.currentPosition==='ST','p9 ST');assert(s.players.p10.currentPosition==='RW','p10 RW')});
test('duplicate cloud event id is idempotent',()=>{const e=sub(600,'p11','p12',null,'same'),s=S(700,[e,{...e}]);assert(s.players.p11.outCount===1,'one out');assert(s.players.p12.inCount===1,'one in');assert(s.rejectedEvents.length===0,'not rejected')});
test('invalid repeated substitution is rejected, not applied',()=>{const ev=[sub(600,'p11','p12',null,'s1'),sub(610,'p11','p13',null,'bad')],s=S(700,ev);assert(s.rejectedEvents.length===1,'rejected');assert(s.players.p13.currentRole==='BENCH','p13 stays bench')});
test('all players play+bench equals effective clock',()=>{const ev=[sub(600,'p11','p12',null,'s1'),sub(720,'p10','p13',null,'s2'),sub(840,'p12','p11',null,'s3')],s=S(1000,ev);Object.values(s.players).forEach(p=>assert(p.playSeconds+p.benchSeconds===1000,`${p.playerId} clock mismatch`))});
test('latest substitution gets JUST state, older become SUBBED_BEFORE',()=>{const s=S(800,[sub(600,'p11','p12',null,'s1'),sub(720,'p10','p13',null,'s2')]);assert(s.players.p10.changeState==='JUST_OUT','latest out');assert(s.players.p13.changeState==='JUST_IN','latest in');assert(s.players.p11.changeState==='SUBBED_BEFORE','older out');assert(s.players.p12.changeState==='SUBBED_BEFORE','older in')});

function run(){const result=[];let passed=0;for(const [name,fn] of tests){try{fn();passed++;result.push({name,ok:true})}catch(e){result.push({name,ok:false,error:e.message})}}return{passed,total:tests.length,ok:passed===tests.length,results:result}}
window.ClubMatchV08Regression={run};
})();
