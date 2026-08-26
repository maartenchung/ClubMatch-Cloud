import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null,Date};context.globalThis=context;context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./clock-projector.js',import.meta.url),'utf8'),context);
const C=context.ClubMatchV08ClockProjector;
const running={match:{status:'live'},state:{state_version:7,clock_status:'running',effective_elapsed_seconds:600}};
const anchor=C.createAnchor(running,100000);
assert.equal(C.projectedSecond(anchor,100000),600);
assert.equal(C.projectedSecond(anchor,101999),601);
assert.equal(C.projectedSecond(anchor,105000),605);
const projected=C.projectSnapshot(running,anchor,105000);
assert.equal(projected.state.effective_elapsed_seconds,605);
assert.equal(running.state.effective_elapsed_seconds,600,'confirmed snapshot must remain immutable');
const paused={match:{status:'live'},state:{state_version:8,period:'first_half',clock_status:'paused',effective_elapsed_seconds:605}};
const pausedAnchor=C.createAnchor(paused,200000);
assert.equal(C.projectedSecond(pausedAnchor,260000),605,'paused clock must not advance');

const halftime={
  server_now:'2026-08-26T12:03:15.000Z',
  match:{status:'halftime'},
  state:{state_version:9,period:'halftime',clock_status:'stopped',effective_elapsed_seconds:2400},
  events:[{id:'h1',event_type:'halftime_started',occurred_at:'2026-08-26T12:00:00.000Z'}]
};
const halfAnchor=C.createAnchor(halftime,300000);
assert.equal(C.projectedSecond(halfAnchor,305000),2400,'halftime must not change match time');
assert.equal(C.confirmedBreakSecond(halftime),195,'server-confirmed halftime duration');
assert.equal(C.projectedBreakSecond(halfAnchor,300000),195);
assert.equal(C.projectedBreakSecond(halfAnchor,305000),200,'break clock must continue locally from server anchor');

const secondHalf={...halftime,match:{status:'live'},state:{...halftime.state,state_version:10,period:'second_half',clock_status:'running'}};
const secondAnchor=C.createAnchor(secondHalf,400000);
assert.equal(secondAnchor.breakActive,false);
assert.equal(C.projectedBreakSecond(secondAnchor,405000),0,'break clock is inactive in second half');
console.log('PASS clock-projector: match clock + server-anchored halftime clock');
