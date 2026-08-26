import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./dashboard-controller.js',import.meta.url),'utf8'),context);
let calls=[];
const client={async rpc(name,params={}){calls.push({name,params});if(name==='get_my_team_seasons')return {data:[{team_season_id:'ts1',team_name:'O16'},{team_season_id:'ts2',team_name:'O13'}],error:null};if(name==='get_cloud_dashboard')return {data:{team_season_id:params.p_team_season_id,players:[{player_id:'p1',name:'A',play:'80',bench:'10',goals:'2',assists:'1'}],matches:[{id:'m1',opponent:'DEM',score_for:'3',score_against:'1',duration:'80'}],kpis:{matches:'1',play_minutes:'880',bench_minutes:'110',goals:'3',assists:'2',absent:'1'}},error:null};return {data:null,error:new Error('unexpected')}}};
const D=context.ClubMatchV08Dashboard.createDashboardController({client});await D.loadTeams();assert.equal(D.state.teamSeasons.length,2);await D.load('ts1');assert.equal(D.state.dashboard.teamSeasonId,'ts1');assert.equal(D.state.dashboard.kpis.play_minutes,880);assert.equal(D.state.dashboard.players[0].goals,2);assert.equal(D.state.dashboard.matches[0].score_for,3);assert.equal(calls.at(-1).params.p_team_season_id,'ts1');await D.load(null);assert.equal(calls.at(-1).params.p_team_season_id,null);assert.equal(Object.isFrozen(D.state.dashboard),true);console.log('PASS dashboard-controller: team filter + normalized history/KPIs');
