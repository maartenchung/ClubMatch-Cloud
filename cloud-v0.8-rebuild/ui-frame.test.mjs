import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;
vm.createContext(context);
for(const file of ['live-state.js','view-model.js','ui-frame.js'])vm.runInContext(fs.readFileSync(new URL(`./${file}`,import.meta.url),'utf8'),context);

const ids=Array.from({length:13},(_,i)=>`p${i+1}`);
const positions=['GK','RB','RCB','LCB','LB','CM1','CM2','AM','RW','ST','LW'];
const events=[
  {id:'s1',type:'SUBSTITUTION',matchSecond:600,outId:'p11',inId:'p12'},
  {id:'s2',type:'SUBSTITUTION',matchSecond:720,outId:'p10',inId:'p13'}
];
const liveState=context.ClubMatchV08.deriveLiveMatchState({
  effectiveMatchSecond:800,
  selectedIds:ids,
  starterIds:ids.slice(0,11),
  startingPositionsById:Object.fromEntries(ids.slice(0,11).map((id,i)=>[id,positions[i]])),
  events
});
const playersById=Object.fromEntries(ids.map((id,i)=>[id,{name:`Speler ${i+1}`,shirt_number:i+1}]));
const model=context.ClubMatchV08ViewModel.createLiveViewModel({liveState,playersById,score:{for:2,against:1},match:{status:'live'},events});
const frame=context.ClubMatchV08UiFrame.createUiFrame(model);
const validation=context.ClubMatchV08UiFrame.validateUiFrame(frame);

assert.equal(validation.ok,true,validation.errors.join(' · '));
assert.equal(frame.scoreboard.display,'2–1');
assert.equal(frame.scoreboard.clock,'13:20');
assert.equal(frame.field.length,11);
assert.equal(frame.bench.length,2);
assert.equal(frame.pitch.length,11);
assert.equal(frame.dashboard.field,frame.field,'dashboard must share field frame');
assert.equal(frame.dashboard.bench,frame.bench,'dashboard must share bench frame');
assert.equal(frame.playerById.p13.changeState,'JUST_IN');
assert.equal(frame.playerById.p10.changeState,'JUST_OUT');
assert.equal(frame.playerById.p11.changeState,'SUBBED_BEFORE');
assert.equal(frame.playerById.p12.changeState,'SUBBED_BEFORE');
assert.equal(frame.playerById.p13.metrics[0].display,model.byId.p13.metrics[0].display,'UI must copy confirmed display, not recalculate it');
assert.equal(frame.pitch.find(p=>p.id==='p13').current,model.byId.p13.metrics[2].display);
assert.equal(frame.monitor.find(p=>p.id==='p10').currentStint,model.byId.p10.metrics[3].display);
assert.equal([...frame.field,...frame.bench].some(p=>p.tone==='green'),false);
assert.equal(Object.isFrozen(frame),true);
assert.equal(Object.isFrozen(frame.field),true);
console.log('PASS ui-frame: single-source field, bench, pitch, monitor and dashboard');
