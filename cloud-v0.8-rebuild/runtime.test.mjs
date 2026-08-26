import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null,window:null,setInterval,clearInterval,setTimeout,clearTimeout,structuredClone};
context.globalThis=context;context.window=context;
vm.createContext(context);
for(const file of ['live-state.js','snapshot-adapter.js','view-model.js','mutation-controller.js','runtime.js']){
  vm.runInContext(fs.readFileSync(new URL(`./${file}`,import.meta.url),'utf8'),context);
}

const ids=Array.from({length:12},(_,i)=>`p${i+1}`);
const positions=['GK','RB','RCB','LCB','LB','CM1','CM2','AM','RW','ST','LW'];
let version=1;
let elapsed=600;
let events=[];
let role=Object.fromEntries(ids.map((id,i)=>[id,i<11?'FIELD':'BENCH']));
let currentPosition=Object.fromEntries(ids.slice(0,11).map((id,i)=>[id,positions[i]]));

function snapshot(){
  return {
    match:{id:'m1',status:'live',score_for:1,score_against:0},
    state:{state_version:version,effective_elapsed_seconds:elapsed},
    players:ids.map((id,i)=>({
      player_id:id,full_name:`Speler ${i+1}`,display_name:`P${i+1}`,shirt_number:i+1,
      selected:true,is_starter:i<11,starting_position:i<11?positions[i]:null,
      current_position:role[id]==='FIELD'?currentPosition[id]:null,is_on_field:role[id]==='FIELD'
    })),
    events
  };
}

const supabase={
  async rpc(name,params){
    if(name==='get_match_snapshot')return {data:snapshot()};
    if(name==='record_substitution'){
      const old=currentPosition[params.p_player_out_id];
      role[params.p_player_out_id]='BENCH';role[params.p_player_in_id]='FIELD';
      currentPosition[params.p_player_in_id]=params.p_new_position;delete currentPosition[params.p_player_out_id];
      events.push({id:'s1',event_type:'substitution',match_minute:10,match_second:0,subject_player_id:params.p_player_out_id,related_player_id:params.p_player_in_id,payload:{new_position:old},substitution:{player_out_id:params.p_player_out_id,player_in_id:params.p_player_in_id,new_position:old}});
      version++;return {data:{ok:true,state_version:version}};
    }
    if(name==='swap_player_positions'){
      const a=params.p_player_a_id,b=params.p_player_b_id,pa=currentPosition[a],pb=currentPosition[b];
      currentPosition[a]=pb;currentPosition[b]=pa;
      events.push({id:'ps1',event_type:'position_changed',match_minute:10,match_second:5,subject_player_id:a,related_player_id:b,payload:{swap:true,player_a_new_position:pb,player_b_new_position:pa},position_change:{player_id:a,new_position:pb}});
      version++;return {data:{ok:true,state_version:version}};
    }
    throw new Error(`unexpected rpc ${name}`);
  }
};

const renders=[];
const runtime=context.ClubMatchV08Runtime.createRuntime({supabase,pollMs:60000,render:model=>renders.push(model)});
const first=await runtime.start('m1');
assert.equal(first.field.length,11);
assert.equal(first.clock,'10:00');
assert.equal(renders.length,1);

await runtime.substitute({outId:'p11',inId:'p12'});
assert.equal(runtime.viewModel.byId.p11.role,'BENCH');
assert.equal(runtime.viewModel.byId.p12.role,'FIELD');
assert.equal(runtime.viewModel.byId.p12.position,'LW');
assert.equal(renders.length,2,'render only after confirmed mutation snapshot');

await runtime.swapPositions({playerId:'p9',otherPlayerId:'p10'});
assert.equal(runtime.viewModel.byId.p9.position,'ST');
assert.equal(runtime.viewModel.byId.p10.position,'RW');
assert.equal(runtime.viewModel.field.length,11);
assert.equal(runtime.viewModel.players.every(p=>p.playSeconds+p.benchSeconds===600),true);

runtime.stop();
console.log('PASS runtime: 3/3');
