import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;
vm.createContext(context);
for(const file of ['live-state.js','view-model.js'])vm.runInContext(fs.readFileSync(new URL(`./${file}`,import.meta.url),'utf8'),context);
const {deriveLiveMatchState}=context.ClubMatchV08;
const V=context.ClubMatchV08ViewModel;

const ids=Array.from({length:13},(_,i)=>`p${i+1}`);
const positions=['GK','RB','RCB','LCB','LB','CM1','CM2','AM','RW','ST','LW'];
const liveState=deriveLiveMatchState({
  effectiveMatchSecond:800,
  selectedIds:ids,
  starterIds:ids.slice(0,11),
  startingPositionsById:Object.fromEntries(ids.slice(0,11).map((id,i)=>[id,positions[i]])),
  events:[
    {id:'s1',type:'SUBSTITUTION',matchSecond:600,outId:'p11',inId:'p12'},
    {id:'s2',type:'SUBSTITUTION',matchSecond:720,outId:'p10',inId:'p13'},
    {id:'pc1',type:'POSITION_CHANGED',matchSecond:750,playerId:'p9',position:'ST',otherPlayerId:'p13',otherPosition:'RW'}
  ]
});
const playersById=Object.fromEntries(ids.map((id,i)=>[id,{name:`Speler ${i+1}`,number:i+1}]));
const timeline=[
  {id:'later',type:'POSITION_CHANGED',matchSecond:750},
  {id:'first',type:'SUBSTITUTION',matchSecond:600}
];
const model=V.createLiveViewModel({liveState,playersById,score:{for:2,against:1},match:{status:'running'},events:timeline});

assert.equal(model.pitch.field,model.tiles.field,'pitch and tiles must share the exact field projection');
assert.equal(model.pitch.field,model.dashboard.field,'dashboard must share the exact field projection');
assert.equal(model.pitch.bench,model.substitutionMonitor.bench,'monitor must share the exact bench projection');
assert.equal(model.pitch.byPosition.ST.id,'p9','position change must be identical in every view');
assert.equal(model.byId.p13.position,'RW','atomic position swap must project both positions');
assert.equal(model.byId.p13.changeState,'JUST_IN');
assert.equal(model.byId.p13.statusStyle.tone,'blue');
assert.equal(model.byId.p10.changeState,'JUST_OUT');
assert.equal(model.byId.p10.statusStyle.tone,'amber');
assert.equal(model.byId.p11.changeState,'SUBBED_BEFORE');
assert.equal(model.byId.p11.statusStyle.tone,'purple');
assert.equal(model.byId.p1.changeState,'NEVER_SUBBED');
assert.equal(model.byId.p1.statusStyle.tone,'neutral');
assert.equal(model.players.some(player=>player.statusStyle.tone==='green'),false,'green cannot encode substitution status');
model.players.forEach(player=>assert.equal(player.metrics.map(metric=>metric.key).join(','),'play,bench,currentField,currentBench'));
assert.equal(model.clock,'13:20');
assert.equal(model.scoreboard.display,'2–1');
assert.equal(model.dashboard.scoreboard,model.scoreboard,'dashboard and scoreboard must share one clock and score');
assert.equal(model.timeline.map(event=>event.id).join(','),'first,later','timeline must be deterministically ordered');
assert.equal(model.timeline[0].clock,'10:00');
assert.equal(V.validateLiveViewModel(model).ok,true);

console.log('PASS view-model: 7/7');
