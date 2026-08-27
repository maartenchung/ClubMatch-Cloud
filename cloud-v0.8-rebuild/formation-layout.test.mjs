import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./formation-layout.js',import.meta.url),'utf8'),context);
const F=context.ClubMatchV08Formation;
assert.deepEqual([...F.getFormation('4-3-3').slots],['GK','RB','RCB','LCB','LB','DM','RCM','LCM','RW','ST','LW']);
assert.equal(F.getFormation('unknown').code,'4-3-3');
const players=[
 ['gk',['GK']],['rb',['RB']],['rcb',['CB']],['lcb',['CB']],['lb',['LB']],['dm',['DM']],['rcm',['CM']],['lcm',['CM']],['rw',['RW']],['st',['ST']],['lw',['LW']]
].map(([playerId,preferredPositions])=>({playerId,preferredPositions,starter:true,position:''}));
const assigned=F.assignFormation(players,'4-3-3');
assert.equal(assigned.assignments.length,11);
assert.equal(new Set(assigned.assignments.map(x=>x.playerId)).size,11);
assert.equal(new Set(assigned.assignments.map(x=>x.position)).size,11);
assert.equal(assigned.assignments.find(x=>x.position==='GK').playerId,'gk');
assert.equal(assigned.assignments.find(x=>x.position==='RB').playerId,'rb');
assert.equal(assigned.assignments.find(x=>x.position==='ST').playerId,'st');
assert.equal(F.pitchRows('4-3-3').flat().length,11);
assert.throws(()=>F.assignFormation(players.slice(0,10),'4-3-3'),/exact 11 basisspelers/);
const preserved=players.map((p,i)=>({...p,position:i===0?'GK':''}));
assert.equal(F.assignFormation(preserved,'4-3-3').assignments.find(x=>x.position==='GK').playerId,'gk');
console.log('PASS formation-layout: presets + preference matching + exactly-11 gate');
