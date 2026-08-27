/* ClubMatch Cloud v0.8 - training attendance and assessment controller */
(function(global){
'use strict';
function invariant(ok,message){if(!ok)throw new Error(message)}
function freeze(value){if(Array.isArray(value)){value.forEach(freeze);return Object.freeze(value)}if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function createTrainingController(options={}){
 const client=options.client;invariant(client?.rpc,'Cloud-client met RPC is verplicht');let teamSeasons=[],teamSeasonId='',dashboard={sessions:[],players:[],model:null};
 function state(){return freeze({teamSeasons:[...teamSeasons],teamSeasonId,dashboard:{...dashboard,sessions:[...(dashboard.sessions||[])],players:[...(dashboard.players||[])]}})}
 function emit(){const next=state();options.onChange?.(next);return next}
 async function rpc(name,params={}){const result=await client.rpc(name,params);if(result?.error)throw result.error;return result?.data}
 async function loadTeams(){const data=await rpc('get_my_team_seasons');teamSeasons=Array.isArray(data)?data:[];return emit()}
 async function load(id=teamSeasonId){invariant(id,'Kies een team/seizoen');teamSeasonId=id;dashboard=await rpc('get_training_dashboard_v08',{p_team_season_id:id})||{sessions:[],players:[]};return emit()}
 async function createSession(input={}){invariant(teamSeasonId,'Kies eerst een team/seizoen');invariant(input.trainingDate,'Trainingsdatum is verplicht');const created=await rpc('create_training_session_v08',{p_team_season_id:teamSeasonId,p_training_date:input.trainingDate,p_scheduled_time:input.scheduledTime||null,p_title:String(input.title||'Training').trim()||'Training',p_notes:String(input.notes||'').trim()||null});await load(teamSeasonId);return {created,state:state()}}
 async function saveReview(sessionId,playerId,input={}){invariant(sessionId&&playerId,'Training en speler zijn verplicht');const n=v=>v===''||v===null||v===undefined?null:Number(v);await rpc('save_training_review_v08',{p_training_session_id:sessionId,p_player_id:playerId,p_attendance_status:input.attendanceStatus||'unknown',p_effort:n(input.effort),p_quality:n(input.quality),p_attitude:n(input.attitude),p_coach_note:String(input.coachNote||'').trim()||null});return load(teamSeasonId)}
 async function saveAllReviews(sessionId,reviews=[]){invariant(sessionId,'Training-ID ontbreekt');invariant(Array.isArray(reviews)&&reviews.length>0,'Geen trainingsregels om op te slaan');const clean=reviews.map(r=>({player_id:r.playerId,attendance_status:r.attendanceStatus||'unknown',effort:r.effort===''?null:r.effort,quality:r.quality===''?null:r.quality,attitude:r.attitude===''?null:r.attitude,coach_note:String(r.coachNote||'').trim()||null}));const saved=await rpc('save_training_reviews_v08',{p_training_session_id:sessionId,p_reviews:clean});await load(teamSeasonId);return {saved,state:state()}}
 async function deleteSession(sessionId){invariant(sessionId,'Training-ID ontbreekt');await rpc('delete_training_session_v08',{p_training_session_id:sessionId});return load(teamSeasonId)}
 return Object.freeze({loadTeams,load,createSession,saveReview,saveAllReviews,deleteSession,get state(){return state()}})
}
global.ClubMatchV08Training={createTrainingController};
})(typeof window!=='undefined'?window:globalThis);
