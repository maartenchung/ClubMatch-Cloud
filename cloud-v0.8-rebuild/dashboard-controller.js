/* ClubMatch Cloud v0.8 - dashboard/history/action/rating/player360/team-possession controller */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function num(value){const n=Number(value);return Number.isFinite(n)?n:0}
function freeze(value){if(Array.isArray(value)){value.forEach(freeze);return Object.freeze(value)}if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function normalize(data={}){
  const players=(Array.isArray(data.players)?data.players:[]).map(p=>({...p,number:p.number??null,present:num(p.present),absent:num(p.absent),selected:num(p.selected),starts:num(p.starts),play:num(p.play),bench:num(p.bench),avg:num(p.avg),playPct:num(p.playPct),goals:num(p.goals),assists:num(p.assists),rating:Math.max(1,Math.min(100,Math.round(num(p.rating)||50))),ratingReliability:p.ratingReliability||'laag',actionTotal:num(p.actionTotal),actions:p.actions||{},relationships:p.relationships||{},possessionSeconds:num(p.possessionSeconds),possessionShare:num(p.possessionShare)}));
  const matches=(Array.isArray(data.matches)?data.matches:[]).map(m=>({...m,score_for:num(m.score_for),score_against:num(m.score_against),duration:m.duration==null?null:num(m.duration),player_minutes:num(m.player_minutes),action_count:num(m.action_count),possession_seconds:num(m.possession_seconds),possession_pct:num(m.possession_pct),include_in_dashboard:m.include_in_dashboard!==false,can_delete:!!m.can_delete}));
  const raw=data.kpis||{},kpis={matches:num(raw.matches),available_matches:num(raw.available_matches??raw.matches),play_minutes:num(raw.play_minutes),bench_minutes:num(raw.bench_minutes),goals:num(raw.goals),assists:num(raw.assists),absent:num(raw.absent),actions:num(raw.actions),possession_seconds:num(raw.possession_seconds)};
  return freeze({teamSeasonId:data.team_season_id||null,players,matches,kpis,ratingModel:data.rating_model||null,analysisModel:data.analysis_model||null});
}
function emptyPossession(){return freeze({first_half:null,second_half:null,extra_time:null,total:{for_seconds:0,against_seconds:0,for_pct:null,against_pct:null},matches:[]})}
function normalizePossession(data={}){const phase=value=>value?{for_seconds:num(value.for_seconds),against_seconds:num(value.against_seconds),for_pct:value.for_pct==null?null:num(value.for_pct),against_pct:value.against_pct==null?null:num(value.against_pct)}:null;return freeze({first_half:phase(data.first_half),second_half:phase(data.second_half),extra_time:phase(data.extra_time),total:phase(data.total)||{for_seconds:0,against_seconds:0,for_pct:null,against_pct:null},matches:Array.isArray(data.matches)?data.matches.map(m=>({...m,for_seconds:num(m.for_seconds),against_seconds:num(m.against_seconds),for_pct:m.for_pct==null?null:num(m.for_pct),against_pct:m.against_pct==null?null:num(m.against_pct)})):[]})}
function createDashboardController(options={}){
  const client=options.client;invariant(client?.rpc,'Cloud client with rpc is required');let teamSeasons=[],dashboard=normalize(),playerOverview=null,teamPossession=emptyPossession();
  function snapshot(){return freeze({teamSeasons:[...teamSeasons],dashboard,playerOverview,teamPossession})}
  function emit(){const state=snapshot();options.onChange?.(state);return state}
  async function rpc(name,params={}){const result=await client.rpc(name,params);if(result?.error)throw result.error;return result?.data}
  async function loadTeams(){const data=await rpc('get_my_team_seasons');teamSeasons=Array.isArray(data)?data:[];return emit()}
  async function load(teamSeasonId=null){const id=teamSeasonId||null;const [dash,pos]=await Promise.all([rpc('get_cloud_dashboard_v2',{p_team_season_id:id}),rpc('get_team_possession_dashboard_v08',{p_team_season_id:id})]);dashboard=normalize(dash);teamPossession=normalizePossession(pos||{});playerOverview=null;return emit()}
  async function loadPlayer(playerId,teamSeasonId=dashboard.teamSeasonId){invariant(playerId,'Speler-ID ontbreekt');invariant(teamSeasonId,'Kies eerst één team/seizoen voor een volledig spelerprofiel');playerOverview=await rpc('get_player_overview_v08',{p_player_id:playerId,p_team_season_id:teamSeasonId});return emit()}
  function closePlayer(){playerOverview=null;return emit()}
  async function setMatchIncluded(matchId,include){invariant(matchId,'Wedstrijd-ID ontbreekt');await rpc('set_match_dashboard_inclusion_v08',{p_match_id:matchId,p_include:!!include});return load(dashboard.teamSeasonId)}
  async function deleteMatch(matchId,confirmation='DELETE'){invariant(matchId,'Wedstrijd-ID ontbreekt');invariant(confirmation==='DELETE','Typ DELETE om definitief te verwijderen');await rpc('delete_match_v08',{p_match_id:matchId,p_confirmation:confirmation});return load(dashboard.teamSeasonId)}
  return Object.freeze({loadTeams,load,loadPlayer,closePlayer,setMatchIncluded,deleteMatch,get state(){return snapshot()}})
}
global.ClubMatchV08Dashboard={createDashboardController,normalize,normalizePossession};
})(typeof window!=='undefined'?window:globalThis);
