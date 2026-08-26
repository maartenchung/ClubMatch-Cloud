import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('./correction-ui.js',import.meta.url),'utf8'),context);
const C=context.ClubMatchV08Corrections;
const snapshot={players:[{player_id:'a',shirt_number:7,display_name:'Alex',selected:true},{player_id:'b',shirt_number:9,display_name:'Bo',selected:true},{player_id:'c',shirt_number:10,display_name:'Chris',selected:true}],events:[
{id:'s1',event_type:'substitution',match_minute:10,match_second:5,subject_player_id:'a',related_player_id:'b',payload:{new_position:'RW'},substitution:{player_out_id:'a',player_in_id:'b',new_position:'RW'}},
{id:'sc1',event_type:'substitution_corrected',target_event_id:'s1',match_minute:11,match_second:12,subject_player_id:'a',related_player_id:'c',payload:{new_position:'ST'},substitution:{player_out_id:'a',player_in_id:'c',new_position:'ST'}},
{id:'p1',event_type:'position_changed',match_minute:12,match_second:0,subject_player_id:'c',payload:{new_position:'LW'},position_change:{player_id:'c',new_position:'LW'}},
{id:'swap1',event_type:'position_changed',match_minute:13,match_second:0,subject_player_id:'a',related_player_id:'c',payload:{swap:true,player_a_new_position:'ST',player_b_new_position:'RW'}},
{id:'g1',event_type:'goal_for',match_minute:15,match_second:30,subject_player_id:'c',goal:{side:'for',scorer_player_id:'c',assist_player_id:'a',goal_type:'open_play'}},
{id:'gv1',event_type:'goal_voided',target_event_id:'g1',match_minute:15,match_second:30}
]};
const rows=C.deriveCorrectionRows(snapshot);
assert.equal(rows.length,4);
const sub=rows.find(r=>r.id==='s1');assert.equal(sub.isCorrected,true);assert.equal(sub.isVoided,false);assert.equal(sub.matchSecond,672);assert.equal(sub.canCorrect,true);assert.match(C.rowDescription(sub,new Map(snapshot.players.map(p=>[p.player_id,p]))),/Chris/);
const pos=rows.find(r=>r.id==='p1');assert.equal(pos.canCorrect,true);assert.equal(pos.isSwap,false);
const swap=rows.find(r=>r.id==='swap1');assert.equal(swap.isSwap,true);assert.equal(swap.canCorrect,false);assert.equal(swap.canVoid,true);
const goal=rows.find(r=>r.id==='g1');assert.equal(goal.isVoided,true);assert.equal(goal.canCorrect,false);assert.equal(goal.canVoid,false);
assert.equal(C.eventSecond({match_minute:2,match_second:7}),127);assert.equal(C.fmtSecond(127),'2:07');
console.log('PASS correction-ui: effective corrections + void state + atomic swap policy');
