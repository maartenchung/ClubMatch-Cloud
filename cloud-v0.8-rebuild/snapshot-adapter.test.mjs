import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;
vm.createContext(context);
for(const file of ['live-state.js','snapshot-adapter.js'])vm.runInContext(fs.readFileSync(new URL(`./${file}`,import.meta.url),'utf8'),context);
const A=context.ClubMatchV08SnapshotAdapter;

const ids=Array.from({length:13},(_,i)=>`p${i+1}`);
const positions=['GK','RB','RCB','LCB','LB','CM1','CM2','AM','RW','ST','LW'];
const players=ids.map((id,i)=>({player_id:id,selected:true,is_starter:i<11,starting_position:i<11?positions[i]:null}));
const base={match:{id:'m1'},state:{effective_elapsed_seconds:754},players,events:[]};

assert.equal(A.totalSecond({match_minute:12,match_second:34}),754,'minute and second must form one exact clock');

const substitution={id:'s1',event_type:'substitution',match_minute:10,match_second:5,subject_player_id:'p11',related_player_id:'p12',client_event_id:'c1',payload:{new_position:'LW'},substitution:{player_out_id:'p11',player_in_id:'p12',new_position:'LW'}};
let state=A.deriveSnapshot({...base,events:[substitution]});
assert.equal(state.players.p11.playSeconds,605);
assert.equal(state.players.p12.benchSeconds,605);
assert.equal(state.players.p12.currentPosition,'LW');

const voidEvent={id:'v1',event_type:'substitution_voided',target_event_id:'s1',match_minute:11,match_second:0};
state=A.deriveSnapshot({...base,events:[substitution,voidEvent]});
assert.equal(state.players.p11.currentRole,'FIELD','voided substitution must not project');

const position={id:'pchange',event_type:'position_changed',match_minute:4,match_second:9,subject_player_id:'p9',payload:{new_position:'ST'},position_change:{player_id:'p9',new_position:'ST'}};
const correction={id:'pcorrect',event_type:'position_corrected',target_event_id:'pchange',match_minute:4,match_second:11,subject_player_id:'p9',payload:{new_position:'CF'},position_change:{player_id:'p9',new_position:'CF'}};
state=A.deriveSnapshot({...base,events:[position,correction]});
assert.equal(state.players.p9.currentPosition,'CF','latest correction must replace base event');

const swap={id:'swap1',event_type:'position_changed',match_minute:6,match_second:7,subject_player_id:'p9',related_player_id:'p10',payload:{swap:true,player_a_new_position:'ST',player_b_new_position:'RW'}};
state=A.deriveSnapshot({...base,events:[swap]});
assert.equal(state.players.p9.currentPosition,'ST');
assert.equal(state.players.p10.currentPosition,'RW');

console.log('PASS snapshot-adapter: 5/5');
