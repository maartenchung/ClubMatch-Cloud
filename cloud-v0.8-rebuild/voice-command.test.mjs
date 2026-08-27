import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./voice-command.js',import.meta.url),'utf8'),context);
const V=context.ClubMatchV08VoiceCommand;
const snapshot={players:[
  {player_id:'p13',display_name:'Wai Sam',full_name:'Wai Sam Chung',shirt_number:13,selected:true},
  {player_id:'p9',display_name:'Shane',full_name:'Shane Test',shirt_number:9,selected:true},
  {player_id:'p10',display_name:'Siem',full_name:'Siem Test',shirt_number:10,selected:true},
  {player_id:'p7',display_name:'Sam',full_name:'Sam Anders',shirt_number:7,selected:true},
  {player_id:'x1',display_name:'Niet geselecteerd',shirt_number:99,selected:false}
]};

assert.equal(V.clean('  WÁI   Sam! '),'wai sam');
assert.equal(V.resolvePlayer('13',snapshot).player.player_id,'p13');
assert.equal(V.resolvePlayer('rugnummer 9',snapshot).player.player_id,'p9');
assert.equal(V.resolvePlayer('Wai Sam',snapshot).player.player_id,'p13');
assert.equal(V.resolvePlayer('99',snapshot).player,null,'niet-geselecteerde speler mag niet worden opgelost');
assert.match(V.resolvePlayer('Sam',snapshot).error,/niet eenduidig/,'gelijke naamfragmenten moeten bevestiging afdwingen');
assert.equal(V.positionCode('rechtsbuiten'),'RW');
assert.equal(V.positionCode('centrale verdediger'),'CB');
assert.equal(V.positionCode('spits'),'ST');

let c=V.parseCommand('wissel 13 voor 9',snapshot);assert.equal(c.ok,true);assert.equal(c.action,'SUBSTITUTION');assert.equal(c.payload.outId,'p13');assert.equal(c.payload.inId,'p9');
c=V.parseCommand('wissel nummer 13 eruit en rugnummer 9 erin',snapshot);assert.equal(c.ok,true);assert.equal(c.payload.outId,'p13');assert.equal(c.payload.inId,'p9');
c=V.parseCommand('ruil Shane met Siem',snapshot);assert.equal(c.action,'SWAP');assert.equal(c.payload.playerId,'p9');assert.equal(c.payload.otherPlayerId,'p10');
c=V.parseCommand('positie 13 naar rechtsbuiten',snapshot);assert.equal(c.action,'POSITION');assert.equal(c.payload.playerId,'p13');assert.equal(c.payload.position,'RW');
c=V.parseCommand('doelpunt Wai Sam assist Shane',snapshot);assert.equal(c.action,'GOAL_FOR');assert.equal(c.payload.scorerId,'p13');assert.equal(c.payload.assistId,'p9');
c=V.parseCommand('doelpunt tegenstander',snapshot);assert.equal(c.action,'GOAL_AGAINST');assert.equal(c.payload.side,'against');
c=V.parseCommand('pauze',snapshot);assert.equal(c.action,'CLOCK');assert.equal(c.payload.clockAction,'pause');
c=V.parseCommand('hervatten',snapshot);assert.equal(c.payload.clockAction,'resume');
c=V.parseCommand('rust',snapshot);assert.equal(c.payload.clockAction,'halftime');
c=V.parseCommand('tweede helft',snapshot);assert.equal(c.payload.clockAction,'second_half');
assert.equal(V.parseCommand('verwijder wedstrijd',snapshot).ok,false,'destructieve spraakopdracht mag niet bestaan');
assert.equal(V.parseCommand('stop wedstrijd',snapshot).ok,false,'wedstrijd definitief stoppen mag niet via deze spraakparser');
console.log('PASS voice-command: namen + rugnummers + wissel + positie + ruil + doelpunt + veilige klok');
