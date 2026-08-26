import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null,Date,Math,crypto:{randomUUID:()=> 'evt-1'}};context.globalThis=context;context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./formation-layout.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./preparation-controller.js',import.meta.url),'utf8'),context);
const pref=['GK','RB','CB','CB','LB','DM','CM','CM','RW','ST','LW','ST','CM'];
const roster=Array.from({length:13},(_,i)=>({player_id:`p${i+1}`,legacy_key:`k${i+1}`,full_name:`Speler ${i+1}`,display_name:`P${i+1}`,shirt_number:i+1,preferred_positions:[pref[i]]}));
let savedParams=null,startParams=null;
const client={async rpc(name,params={}){
  if(name==='get_my_team_seasons')return {data:[{team_season_id:'ts1',team_name:'O16'}],error:null};
  if(name==='get_team_cloud_setup')return {data:{team_season_id:'ts1',club_name:'Club',team_name:'O16',players:roster},error:null};
  if(name==='get_match_snapshot')return {data:{match:{id:'m1',team_season_id:'ts1',opponent_name:'DEM',official_duration_minutes:80,formation_code:'4-3-3',status:'draft'},players:roster.map((p,i)=>({...p,attendance_status:'present',selected:i<12,is_starter:i<11,starting_position:i<11?['GK','RB','RCB','LCB','LB','DM','RCM','LCM','RW','ST','LW'][i]:null}))},error:null};
  if(name==='save_match_preparation'){savedParams=params;return {data:{match:{id:params.p_match_id||'m-new'},players:[]},error:null}}
  if(name==='start_match'){startParams=params;return {data:{ok:true,status:'live'},error:null}}
  return {data:null,error:new Error(`unexpected ${name}`)};
}};
const P=context.ClubMatchV08Preparation.createPreparationController({client,makeId:()=> 'evt-start'});
await P.loadTeamSeasons();assert.equal(P.state.teamSeasons.length,1);
await P.loadTeam('ts1');assert.equal(P.state.players.length,13);assert.equal(P.state.validation.starterCount,0);assert.equal(P.state.dirty,true);
P.setMeta({opponentName:'DEM',matchDate:'2026-08-29',scheduledTime:'11:15',officialDurationMinutes:80,formationCode:'4-3-3'});
P.selectAllPresent();assert.equal(P.state.players.filter(p=>p.selected).length,13);
P.makeSelectedStarters();assert.equal(P.state.players.filter(p=>p.starter).length,11);
P.applyFormation('4-3-3');assert.equal(P.state.players.filter(p=>p.starter&&p.position).length,11);assert.equal(new Set(P.state.players.filter(p=>p.starter).map(p=>p.position)).size,11);assert.equal(P.state.meta.formationCode,'4-3-3');
assert.equal(P.validate().ok,true,P.validate().errors.join(' · '));
await assert.rejects(()=>P.start(),/Sla de voorbereiding eerst op/,'new unsaved preparation cannot start');
const saved=await P.save();assert.equal(saved.match.id,'m-new');assert.equal(savedParams.p_players.length,13);assert.equal(savedParams.p_players.filter(p=>p.starter).length,11);assert.equal(P.state.meta.matchId,'m-new');assert.equal(P.state.dirty,false);
await P.start();assert.equal(startParams.p_match_id,'m-new');assert.equal(startParams.p_client_event_id,'evt-start');
P.patchPlayer('p1',{attendance:false});assert.equal(P.state.players[0].starter,false);assert.equal(P.validate().ok,false);assert.equal(P.state.dirty,true);
P.clearSelection();assert.equal(P.state.players.filter(p=>p.selected).length,0);assert.equal(P.state.players.filter(p=>p.starter).length,0);
await P.openExisting({match_id:'m1',match_date:'2026-08-30',scheduled_time:'10:30:00'});assert.equal(P.state.meta.matchId,'m1');assert.equal(P.state.players.filter(p=>p.starter).length,11);assert.equal(P.state.players.filter(p=>p.selected).length,12);assert.equal(P.state.meta.scheduledTime,'10:30');assert.equal(P.validate().ok,true);assert.equal(P.state.dirty,false);
P.setMeta({formationCode:'4-2-3-1'});await assert.rejects(()=>P.start(),/laatste wijzigingen eerst op/,'dirty saved preparation cannot start');
console.log('PASS preparation-controller: roster + quick selection + formation + save-before-start + restore');
