import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;vm.createContext(context);
for(const file of ['voice-command.js','voice-controller.js'])vm.runInContext(fs.readFileSync(new URL(`./${file}`,import.meta.url),'utf8'),context);
const calls=[];
const runtime={
  async substitute(payload){calls.push(['substitute',payload]);return {ok:true}},
  async swapPositions(payload){calls.push(['swap',payload]);return {ok:true}},
  async changePosition(payload){calls.push(['position',payload]);return {ok:true}},
  async recordGoal(payload){calls.push(['goal',payload]);return {ok:true}},
  async advanceClock(payload){calls.push(['clock',payload]);return {ok:true}}
};
const snapshot={match:{id:'m1'},players:[
  {player_id:'p13',display_name:'Wai Sam',shirt_number:13,selected:true},
  {player_id:'p9',display_name:'Shane',shirt_number:9,selected:true},
  {player_id:'p10',display_name:'Siem',shirt_number:10,selected:true}
]};
const C=context.ClubMatchV08VoiceController.createVoiceController({runtime});
let parsed=C.prepare('wissel 13 voor 9');assert.equal(parsed.ok,false);assert.match(C.state.lastError,/Open eerst/);assert.equal(calls.length,0);
C.setSnapshot(snapshot);
parsed=C.prepare('wissel 13 voor 9');assert.equal(parsed.ok,true);assert.equal(C.state.pending.action,'SUBSTITUTION');assert.equal(calls.length,0,'voorstel mag nooit meteen schrijven');
C.cancel();assert.equal(C.state.pending,null);assert.equal(calls.length,0);
C.prepare('wissel 13 voor 9');await C.confirm();assert.equal(calls.length,1);assert.equal(calls[0][0],'substitute');assert.equal(calls[0][1].outId,'p13');assert.equal(C.state.pending,null);
C.prepare('doelpunt Wai Sam assist Shane');await C.confirm();assert.equal(calls[1][0],'goal');assert.equal(calls[1][1].scorerId,'p13');
C.prepare('positie 13 naar rechtsbuiten');await C.confirm();assert.equal(calls[2][0],'position');assert.equal(calls[2][1].position,'RW');
C.prepare('ruil 13 met 10');await C.confirm();assert.equal(calls[3][0],'swap');
C.prepare('pauze');await C.confirm();assert.equal(calls[4][0],'clock');assert.equal(calls[4][1].clockAction,'pause');
parsed=C.prepare('verwijder wedstrijd');assert.equal(parsed.ok,false);assert.equal(calls.length,5,'afgewezen opdracht mag niets schrijven');
C.clear();assert.equal(C.state.hasMatch,false);assert.equal(C.state.pending,null);
console.log('PASS voice-controller: parse -> voorstel -> expliciete bevestiging -> confirmed runtime');
