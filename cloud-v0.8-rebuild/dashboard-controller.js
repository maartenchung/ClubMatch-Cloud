/* ClubMatch Cloud v0.8 - dashboard/history/action/rating controller */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function num(value){const n=Number(value);return Number.isFinite(n)?n:0}
function freeze(value){if(Array.isArray(value)){value.forEach(freeze);return Object.freeze(value)}if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function normalize(data={}){
  const players=(Array.isArray(data.players)?data.players:[]).map(p=>({...p,number:p.number??null,present:num(p.present),absent:num(p.absent),selected:num(p.selected),starts:num(p.starts),play:num(p.play),bench:num(p.bench),avg:num(p.avg),playPct:num(p.playPct),goals:num(p.goals),assists:num(p.assists),rating:num(p.rating)||6,actionTotal:num(p.actionTotal),actions:p.actions||{},possessionSeconds:num(p.possessionSeconds),possessionShare:num(p.possessionShare)}));
  const matches=(Array.isArray(data.matches)?data.matches:[]).map(m=>({...m,score_for:num(m.score_for),score_against:num(m.score_against),duration:m.duration==null?null:num(m.duration),player_minutes:num(m.player_minutes),action_count:num(m.action_count),possession_seconds:num(m.possession_seconds),possession_pct:num(m.possession_pct)}));
  const raw=data.kpis||{},kpis={matches:num(raw.matches),play_minutes:num(raw.play_minutes),bench_minutes:num(raw.bench_minutes),goals:num(raw.goals),assists:num(raw.assists),absent:num(raw.absent),actions:num(raw.actions),possession_seconds:num(raw.possession_seconds)};
  return freeze({teamSeasonId:data.team_season_id||null,players,matches,kpis,ratingModel:data.rating_model||null});
}
function createDashboardController(options={}){const client=options.client;invariant(client?.rpc,'Cloud client with rpc is required');let teamSeasons=[],dashboard=normalize();function snapshot(){return freeze({teamSeasons:[...teamSeasons],dashboard})}function emit(){const state=snapshot();options.onChange?.(state);return state}async function rpc(name,params={}){const result=await client.rpc(name,params);if(result?.error)throw result.error;return result?.data}async function loadTeams(){const data=await rpc('get_my_team_seasons');teamSeasons=Array.isArray(data)?data:[];return emit()}async function load(teamSeasonId=null){dashboard=normalize(await rpc('get_cloud_dashboard',{p_team_season_id:teamSeasonId||null}));return emit()}return Object.freeze({loadTeams,load,get state(){return snapshot()}})}
global.ClubMatchV08Dashboard={createDashboardController,normalize};
})(typeof window!=='undefined'?window:globalThis);
