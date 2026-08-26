import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./mutation-controller.js',import.meta.url),'utf8'),context);
const {createMutationController}=context.ClubMatchV08MutationController;

const players={
  a:{playerId:'a',currentRole:'FIELD',currentPosition:'LW'},
  b:{playerId:'b',currentRole:'BENCH',currentPosition:''},
  c:{playerId:'c',currentRole:'FIELD',currentPosition:'ST'}
};
const liveState=()=>({players:structuredClone(players),fieldIds:['a','c']});
const snapshot=version=>({match:{id:'m1',status:'live'},state:{state_version:version,effective_elapsed_seconds:600},players:[],events:[]});

async function testConfirmedRenderOnly(){
  let version=1,mutated=false,renders=0;
  const rpc=async(name,params)=>{
    if(name==='get_match_snapshot')return {data:snapshot(version)};
    assert.equal(renders,0,'must not render before Cloud confirms');
    assert.equal(name,'record_substitution');
    assert.equal(params.p_new_position,'LW');
    mutated=true;version++;
    return {data:{ok:true,state_version:version}};
  };
  const controller=createMutationController({rpc,deriveSnapshot:liveState,idFactory:()=> 'event-1',renderConfirmed:()=>{renders++}});
  const result=await controller.substitute({matchId:'m1',outId:'a',inId:'b'});
  assert.equal(mutated,true);
  assert.equal(renders,1);
  assert.equal(result.clientEventId,'event-1');
  assert.equal(result.after.snapshot.state.state_version,2);
}

async function testInvalidMutationDoesNotWrite(){
  let writes=0;
  const rpc=async name=>{if(name==='get_match_snapshot')return {data:snapshot(1)};writes++;return {data:{ok:true}}};
  const controller=createMutationController({rpc,deriveSnapshot:liveState,idFactory:()=> 'event-2'});
  await assert.rejects(()=>controller.substitute({matchId:'m1',outId:'b',inId:'a'}),/Outgoing player/);
  assert.equal(writes,0);
}

async function testQueueSerializesWrites(){
  let version=1,active=0,maxActive=0;
  const rpc=async name=>{
    if(name==='get_match_snapshot')return {data:snapshot(version)};
    active++;maxActive=Math.max(maxActive,active);
    await new Promise(resolve=>setTimeout(resolve,5));
    version++;active--;
    return {data:{ok:true,state_version:version}};
  };
  let n=0;
  const controller=createMutationController({rpc,deriveSnapshot:liveState,idFactory:()=>`q-${++n}`});
  await Promise.all([
    controller.recordGoal({matchId:'m1',side:'for',scorerId:'a'}),
    controller.recordGoal({matchId:'m1',side:'against'})
  ]);
  assert.equal(maxActive,1,'writes must be serialized');
}

async function testAtomicSwapUsesOneRpc(){
  let version=1,writes=[];
  const rpc=async(name,params)=>{
    if(name==='get_match_snapshot')return {data:snapshot(version)};
    writes.push({name,params});version++;return {data:{ok:true,state_version:version}};
  };
  const controller=createMutationController({rpc,deriveSnapshot:liveState,idFactory:()=> 'swap-1'});
  await controller.swapPositions({matchId:'m1',playerId:'a',otherPlayerId:'c'});
  assert.equal(writes.length,1);
  assert.equal(writes[0].name,'swap_player_positions');
  assert.equal(writes[0].params.p_client_event_id,'swap-1');
}

await testConfirmedRenderOnly();
await testInvalidMutationDoesNotWrite();
await testQueueSerializesWrites();
await testAtomicSwapUsesOneRpc();
console.log('PASS mutation-controller: 4/4');
