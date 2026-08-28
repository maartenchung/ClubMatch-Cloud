import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;
vm.createContext(context);
for(const file of ['live-state.js','view-model.js'])vm.runInContext(fs.readFileSync(new URL(`./${file}`,import.meta.url),'utf8'),context);
const S=context.ClubMatchV08;
const V=context.ClubMatchV08ViewModel;

const ids=Array.from({length:15},(_,i)=>`p${i+1}`);
const starters=ids.slice(0,11);
const positions=['GK','RB','RCB','LCB','LB','CM1','CM2','AM','RW','ST','LW'];
const startPos=Object.fromEntries(starters.map((id,i)=>[id,positions[i]]));
const input=(second,events=[])=>({effectiveMatchSecond:second,selectedIds:ids,starterIds:starters,startingPositionsById:startPos,events});
const derive=(second,events=[])=>S.deriveLiveMatchState(input(second,events));
const sub=(matchSecond,outId,inId,id,position=null)=>({id,type:'SUBSTITUTION',matchSecond,outId,inId,position});
const pos=(matchSecond,playerId,position,id,otherPlayerId=null,otherPosition=null)=>({id,type:'POSITION_CHANGED',matchSecond,playerId,position,otherPlayerId,otherPosition});
const meta=Object.fromEntries(ids.map((id,i)=>[id,{name:`Speler ${i+1}`,number:i+1}]));

const tests=[];
const test=(gate,name,fn)=>tests.push({gate,name,fn});

function invariantState(state,label='state'){
  const v=S.validateLiveState(state);
  assert.equal(v.ok,true,`${label}: ${v.errors.join(' · ')}`);
  assert.equal(state.fieldIds.length,11,`${label}: exactly 11 field players`);
  Object.values(state.players).forEach(p=>assert.equal(p.playSeconds+p.benchSeconds,state.effectiveMatchSecond,`${label}: ${p.playerId} clock conservation`));
}

test(1,'start has exactly 11 field players',()=>{
  const s=derive(0);invariantState(s);
  assert.deepEqual([...s.fieldIds],starters);
});

test(2,'first substitution A out / B in',()=>{
  const s=derive(700,[sub(600,'p11','p12','s1')]);invariantState(s);
  assert.equal(s.players.p11.currentRole,'BENCH');assert.equal(s.players.p12.currentRole,'FIELD');
  assert.equal(s.players.p12.currentPosition,'LW');
});

test(3,'second substitution works without refresh',()=>{
  const ev=[sub(600,'p11','p12','s1'),sub(720,'p10','p13','s2')];
  const s=derive(800,ev);invariantState(s);
  assert.equal(s.players.p10.currentRole,'BENCH');assert.equal(s.players.p13.currentRole,'FIELD');
});

test(4,'third substitution returns an earlier player',()=>{
  const ev=[sub(600,'p11','p12','s1'),sub(720,'p10','p13','s2'),sub(840,'p12','p11','s3')];
  const s=derive(900,ev);invariantState(s);
  assert.equal(s.players.p11.currentRole,'FIELD');assert.equal(s.players.p11.inCount,1);assert.equal(s.players.p11.outCount,1);
});

test(5,'single unoccupied position change persists',()=>{
  const s=derive(700,[pos(650,'p9','RWF','p1')]);invariantState(s);
  assert.equal(s.players.p9.currentPosition,'RWF');
});

test(6,'atomic position swap changes both players',()=>{
  const s=derive(700,[pos(650,'p9','ST','ps','p10','RW')]);invariantState(s);
  assert.equal(s.players.p9.currentPosition,'ST');assert.equal(s.players.p10.currentPosition,'RW');
});

test(7,'incoming player inherits outgoing position',()=>{
  const s=derive(630,[sub(600,'p5','p12','s1')]);invariantState(s);
  assert.equal(s.players.p12.currentPosition,'LB');assert.equal(s.players.p5.currentPosition,'');
});

test('8-9','scoreboard projects own and opponent goals from confirmed score',()=>{
  const liveState=derive(700);
  const model=V.createLiveViewModel({liveState,playersById:meta,score:{for:2,against:1},match:{status:'live'},events:[{id:'g1',type:'GOAL',matchSecond:610},{id:'g2',type:'GOAL',matchSecond:660}]});
  assert.equal(model.scoreboard.display,'2–1');assert.equal(model.dashboard.scoreboard,model.scoreboard);
});

test(10,'pause keeps all effective player times frozen',()=>{
  const ev=[sub(600,'p11','p12','s1')];
  const atPause=derive(700,ev),stillPaused=derive(700,ev);
  assert.deepEqual(JSON.parse(JSON.stringify(stillPaused)),JSON.parse(JSON.stringify(atPause)));
  invariantState(stillPaused);
});

test(11,'resume continues from frozen effective second without jump',()=>{
  const ev=[sub(600,'p11','p12','s1')];
  const paused=derive(700,ev),resumed=derive(705,ev);invariantState(resumed);
  assert.equal(resumed.players.p12.playSeconds-paused.players.p12.playSeconds,5);
  assert.equal(resumed.players.p11.benchSeconds-paused.players.p11.benchSeconds,5);
});

test('12-14','refresh reproduces basis, current lineup and exact clocks',()=>{
  const ev=[sub(600,'p11','p12','s1'),sub(720,'p10','p13','s2'),pos(750,'p9','ST','ps','p13','RW')];
  const a=derive(800,ev),b=derive(800,structuredClone(ev));
  invariantState(a);invariantState(b);
  assert.deepEqual([...a.fieldIds],[...b.fieldIds]);
  assert.deepEqual([...a.benchIds],[...b.benchIds]);
  assert.deepEqual(Object.fromEntries(Object.values(a.players).map(p=>[p.playerId,[p.initialRole,p.startedPosition,p.currentRole,p.currentPosition,p.playSeconds,p.benchSeconds]])),Object.fromEntries(Object.values(b.players).map(p=>[p.playerId,[p.initialRole,p.startedPosition,p.currentRole,p.currentPosition,p.playSeconds,p.benchSeconds]])));
});

test(15,'desktop and mobile projection is deterministic',()=>{
  const ev=[sub(600,'p11','p12','s1'),sub(720,'p10','p13','s2')];
  const a=derive(800,ev),b=derive(800,[...ev].reverse());
  const ma=V.createLiveViewModel({liveState:a,playersById:meta,score:{for:1,against:1},match:{status:'live'},events:ev});
  const mb=V.createLiveViewModel({liveState:b,playersById:meta,score:{for:1,against:1},match:{status:'live'},events:[...ev].reverse()});
  assert.deepEqual(ma.field.map(p=>[p.id,p.position]),mb.field.map(p=>[p.id,p.position]));
  assert.equal(ma.scoreboard.display,mb.scoreboard.display);
  assert.deepEqual(ma.timeline.map(e=>e.id),mb.timeline.map(e=>e.id));
});

test('16-17','field count and clock conservation survive multiple substitutions',()=>{
  const ev=[sub(300,'p11','p12','s1'),sub(450,'p10','p13','s2'),sub(620,'p12','p14','s3'),sub(780,'p9','p15','s4'),sub(900,'p13','p10','s5')];
  for(const t of [0,300,449,450,620,780,900,1000])invariantState(derive(t,ev),`t=${t}`);
});

let passed=0;
for(const t of tests){
  try{t.fn();passed++;console.log(`PASS gate ${t.gate}: ${t.name}`)}
  catch(error){console.error(`FAIL gate ${t.gate}: ${t.name}: ${error.message}`);throw error}
}
console.log(`PASS v0.8 regression gates: ${passed}/${tests.length} scenarios; architecture gates 1-17 covered`);
