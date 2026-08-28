import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null};context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./action-policy.js',import.meta.url),'utf8'),context);
const {createActionPolicy}=context.ClubMatchV08ActionPolicy;
const frame={field:Array.from({length:11},(_,i)=>({id:`p${i+1}`})),bench:[{id:'p12'}]};

let p=createActionPolicy({match:{id:'m1',status:'live'},state:{period:'first_half',clock_status:'running'},frame});
assert.equal(p.substitute,true);assert.equal(p.pause,true);assert.equal(p.resume,false);assert.equal(p.halftime,true);assert.equal(p.deleteMatch,false);

p=createActionPolicy({match:{id:'m1',status:'live'},state:{period:'first_half',clock_status:'paused'},frame});
assert.equal(p.pause,false);assert.equal(p.resume,true);assert.equal(p.halftime,true);

p=createActionPolicy({match:{id:'m1',status:'halftime'},state:{period:'halftime',clock_status:'stopped'},frame});
assert.equal(p.substitute,false);assert.equal(p.secondHalf,true);assert.equal(p.finish,true);

p=createActionPolicy({match:{id:'m1',status:'live'},state:{period:'second_half',clock_status:'running'},frame});
assert.equal(p.injuryTime,true);assert.equal(p.finish,true);

p=createActionPolicy({match:{id:'m1',status:'finished'},state:{period:'finished',clock_status:'stopped'},frame});
assert.equal(p.deleteMatch,true);assert.equal(p.goalFor,false);assert.equal(p.finish,false);

p=createActionPolicy({match:{id:'m1',status:'live'},state:{period:'first_half',clock_status:'running'},frame:{field:frame.field.slice(0,10),bench:frame.bench}});
assert.equal(p.substitute,false);assert.equal(p.goalFor,false);assert.equal(p.changePosition,false);

console.log('PASS action-policy: 6/6');
