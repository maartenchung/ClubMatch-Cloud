import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;context.ClubMatchV08PitchLayout={slotLabel:p=>p};vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./event-describer.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./view-model.js',import.meta.url),'utf8'),context);
const players={p1:{name:'Speler 1',shirt_number:1}};
const events=[
 {id:'g1',event_type:'goal_for',match_minute:10,match_second:5,subject_player_id:'p1',payload:{score_for:1,score_against:0}},
 {id:'g2',event_type:'goal_for',match_minute:20,match_second:0,subject_player_id:'p1',payload:{}},
 {id:'v2',event_type:'goal_voided',target_event_id:'g2',match_minute:21,match_second:0,payload:{reason:'Buitenspel',score_for:1,score_against:0}},
 {id:'ps1',event_type:'penalty_attempt',match_minute:80,match_second:0,payload:{side:'for',scored:true,penalty_score_for:1,penalty_score_against:0}},
 {id:'ps2',event_type:'penalty_attempt',match_minute:80,match_second:5,payload:{side:'against',scored:false}}
];
const timeline=context.ClubMatchV08ViewModel.createTimeline(events,players);
assert.match(timeline.find(e=>e.id==='g1').description,/stand 1–0/);
assert.match(timeline.find(e=>e.id==='g2').description,/stand 2–0/,'oude goal zonder payload krijgt chronologische fallbackstand');
assert.match(timeline.find(e=>e.id==='v2').description,/stand 1–0/);assert.match(timeline.find(e=>e.id==='v2').description,/Buitenspel/);
assert.match(timeline.find(e=>e.id==='ps1').description,/strafschoppen 1–0/);
assert.match(timeline.find(e=>e.id==='ps2').description,/mis/);assert.match(timeline.find(e=>e.id==='ps2').description,/strafschoppen 1–0/);
assert.equal(timeline.find(e=>e.id==='g1').clock,'10:05');
console.log('PASS event-score: goal score + void score + penalty shootout score');
