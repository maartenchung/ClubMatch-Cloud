import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('./pitch-layout.js',import.meta.url),'utf8'),context);
const P=context.ClubMatchV08PitchLayout;
for(const code of ['4-3-3','4-2-3-1','4-4-2','3-5-2','3-4-3','5-3-2']){
  const g=P.geometry(code);assert.equal(g.slots.length,11,`${code} must have 11 slots`);assert.equal(new Set(g.slots.map(s=>s.position)).size,11);g.slots.forEach(s=>{assert.ok(s.x>=0&&s.x<=100);assert.ok(s.y>=0&&s.y<=100);assert.ok(s.label)});
}
assert.deepEqual([...P.formationRows('4-3-3')[0]],['LW','ST','RW']);
assert.deepEqual([...P.formationRows('4-2-3-1')[1]],['LW','AM','RW']);
assert.equal(P.positionLabel('RW'),'Rechtsbuiten');assert.equal(P.slotLabel('GK'),'GK · Doelman');
const g433=P.geometry('4-3-3');assert.ok(P.slot('4-3-3','GK').y>P.slot('4-3-3','ST').y,'keeper must render behind striker');
console.log('PASS pitch-layout: 6 formations · 11 unique slots · Dutch labels · stable geometry');
