/* ClubMatch Cloud v0.8 - modulaire wedstrijdvoorbereiding */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function clean(value){return String(value??'').trim()}
function freeze(value){if(Array.isArray(value)){value.forEach(freeze);return Object.freeze(value)}if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
function defaultMeta(){return {matchId:null,teamSeasonId:'',opponentName:'',matchDate:'',scheduledTime:'',officialDurationMinutes:80,formationCode:'4-3-3'}}
function rosterPlayer(player){return {playerId:player.player_id,legacyKey:player.legacy_key,name:player.display_name||player.full_name||player.player_id,fullName:player.full_name||'',shirtNumber:player.shirt_number??null,preferredPositions:Array.isArray(player.preferred_positions)?player.preferred_positions:[],attendance:true,selected:false,starter:false,position:''}}
function formationSlots(code='4-3-3'){return global.ClubMatchV08Formation?.getFormation?.(code)?.slots||['GK','RB','RCB','LCB','LB','DM','RCM','LCM','RW','ST','LW']}
function validation(players=[],meta={}){
  const selected=players.filter(p=>p.selected),starters=players.filter(p=>p.starter),presentStarters=starters.filter(p=>p.attendance),positions=starters.map(p=>clean(p.position)).filter(Boolean);
  const errors=[];
  if(!clean(meta.teamSeasonId))errors.push('Kies een team/seizoen');
  if(!clean(meta.opponentName))errors.push('Vul een tegenstander in');
  if(!clean(meta.matchDate))errors.push('Vul een wedstrijddatum in');
  if(Number(meta.officialDurationMinutes)<1||Number(meta.officialDurationMinutes)>180)errors.push('Wedstrijdduur moet tussen 1 en 180 minuten liggen');
  if(selected.length<11)errors.push(`Selecteer minimaal 11 spelers; nu ${selected.length}`);
  if(starters.length!==11)errors.push(`Kies exact 11 basisspelers; nu ${starters.length}`);
  if(presentStarters.length!==11)errors.push('Iedere basisspeler moet aanwezig zijn');
  if(positions.length!==11)errors.push('Iedere basisspeler moet een positie hebben');
  if(new Set(positions).size!==positions.length)errors.push('Iedere basispositie moet uniek zijn');
  const allowed=new Set(formationSlots(meta.formationCode||'4-3-3'));
  starters.forEach(p=>{if(p.position&&!allowed.has(clean(p.position)))errors.push(`${p.name}: positie ${p.position} hoort niet bij ${meta.formationCode}`)});
  return freeze({ok:errors.length===0,errors,selectedCount:selected.length,starterCount:starters.length,benchCount:selected.length-starters.length,attendanceCount:players.filter(p=>p.attendance).length});
}
function createPreparationController(options={}){
  const client=options.client;invariant(client?.rpc,'Cloud-client met RPC is verplicht');
  const makeId=options.makeId||(()=>global.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`);
  let teamSeasons=[],setup=null,meta=defaultMeta(),players=[],dirty=false;
  function snapshot(){return freeze({teamSeasons:[...teamSeasons],setup:setup?{...setup}:null,meta:{...meta},players:players.map(p=>({...p,preferredPositions:[...p.preferredPositions]})),validation:validation(players,meta),dirty})}
  function emit(){const state=snapshot();options.onChange?.(state);return state}
  async function rpc(name,params={}){const result=await client.rpc(name,params);if(result?.error)throw result.error;return result?.data}
  async function loadTeamSeasons(){const data=await rpc('get_my_team_seasons');teamSeasons=Array.isArray(data)?data:[];return emit()}
  async function loadTeam(teamSeasonId){
    invariant(teamSeasonId,'Kies een team/seizoen');const data=await rpc('get_team_cloud_setup',{p_team_season_id:teamSeasonId});
    invariant(data?.team_season_id,'Teamgegevens zijn onvolledig');setup=data;meta={...defaultMeta(),teamSeasonId:data.team_season_id};players=(data.players||[]).map(rosterPlayer);dirty=true;return emit();
  }
  async function openExisting(matchSummary){
    invariant(matchSummary?.match_id,'Wedstrijd-ID ontbreekt');const snap=await rpc('get_match_snapshot',{p_match_id:matchSummary.match_id});
    invariant(['draft','scheduled'].includes(snap?.match?.status),'Alleen concept/geplande wedstrijden kunnen worden voorbereid');
    const team=await rpc('get_team_cloud_setup',{p_team_season_id:snap.match.team_season_id});setup=team;
    const existing=new Map((snap.players||[]).map(p=>[p.player_id,p]));
    players=(team.players||[]).map(rosterPlayer).map(player=>{const saved=existing.get(player.playerId);return saved?{...player,attendance:saved.attendance_status==='present',selected:!!saved.selected,starter:!!saved.is_starter,position:clean(saved.starting_position)}:player});
    meta={matchId:snap.match.id,teamSeasonId:snap.match.team_season_id,opponentName:snap.match.opponent_name||'',matchDate:matchSummary.match_date||'',scheduledTime:clean(matchSummary.scheduled_time).slice(0,5),officialDurationMinutes:Number(snap.match.official_duration_minutes)||80,formationCode:snap.match.formation_code||'4-3-3'};dirty=false;
    return emit();
  }
  function setMeta(patch={}){meta={...meta,...patch};dirty=true;return emit()}
  function setFormation(code){
    const formation=global.ClubMatchV08Formation?.getFormation?.(code)||{code:'4-3-3',slots:formationSlots('4-3-3')};const allowed=new Set(formation.slots);
    meta={...meta,formationCode:formation.code};players=players.map(p=>p.starter&&!allowed.has(clean(p.position))?{...p,position:''}:p);dirty=true;return emit();
  }
  function patchPlayer(playerId,patch={}){
    const index=players.findIndex(p=>p.playerId===playerId);invariant(index>=0,'Speler niet gevonden in wedstrijdvoorbereiding');let next={...players[index],...patch};
    if(patch.attendance===false)next={...next,selected:false,starter:false,position:''};
    if(patch.selected===false)next={...next,starter:false,position:''};
    if(patch.starter===true)next={...next,attendance:true,selected:true};
    if(next.starter===false&&patch.position===undefined)next.position='';
    if(patch.position!==undefined&&clean(patch.position))invariant(formationSlots(meta.formationCode).includes(clean(patch.position)),'Deze positie hoort niet bij de gekozen formatie');
    players=[...players.slice(0,index),next,...players.slice(index+1)];dirty=true;return emit();
  }
  function placeStarter(playerId,position){
    const pos=clean(position);invariant(formationSlots(meta.formationCode).includes(pos),`Positie ${pos||'—'} hoort niet bij formatie ${meta.formationCode}`);
    const sourceIndex=players.findIndex(p=>p.playerId===playerId);invariant(sourceIndex>=0,'Speler niet gevonden');const source=players[sourceIndex];invariant(source.attendance,'Alleen aanwezige spelers kunnen in de basis');
    const target=players.find(p=>p.starter&&p.position===pos&&p.playerId!==playerId)||null;
    if(source.starter){const oldPos=source.position;players=players.map(p=>p.playerId===playerId?{...p,selected:true,starter:true,position:pos}:target&&p.playerId===target.playerId?{...p,position:oldPos}:p)}
    else{const starterCount=players.filter(p=>p.starter).length;if(starterCount>=11&&!target)throw new Error('De basis heeft al 11 spelers. Sleep naar een bezette positie om iemand te vervangen.');players=players.map(p=>p.playerId===playerId?{...p,attendance:true,selected:true,starter:true,position:pos}:target&&p.playerId===target.playerId?{...p,selected:true,starter:false,position:''}:p)}
    dirty=true;return emit();
  }
  function moveToBench(playerId){const index=players.findIndex(p=>p.playerId===playerId);invariant(index>=0,'Speler niet gevonden');players=players.map(p=>p.playerId===playerId?{...p,attendance:true,selected:true,starter:false,position:''}:p);dirty=true;return emit()}
  function selectAllPresent(){players=players.map(p=>p.attendance?{...p,selected:true}:p);dirty=true;return emit()}
  function clearSelection(){players=players.map(p=>({...p,selected:false,starter:false,position:''}));dirty=true;return emit()}
  function makeSelectedStarters(){const selected=players.filter(p=>p.attendance&&p.selected);invariant(selected.length>=11,`Selecteer eerst minimaal 11 aanwezige spelers; nu ${selected.length}`);const starterIds=new Set(selected.slice(0,11).map(p=>p.playerId));players=players.map(p=>starterIds.has(p.playerId)?{...p,starter:true,selected:true,attendance:true}:{...p,starter:false,position:''});dirty=true;return emit()}
  function applyFormation(code=meta.formationCode){invariant(global.ClubMatchV08Formation?.assignFormation,'Formatiemodule is niet geladen');const result=global.ClubMatchV08Formation.assignFormation(players,code);const byId=new Map(result.assignments.map(a=>[a.playerId,a.position]));players=players.map(p=>p.starter?{...p,position:byId.get(p.playerId)||''}:p);meta={...meta,formationCode:result.code};dirty=true;return emit()}
  function payloadPlayers(){return players.map(p=>({legacy_key:p.legacyKey,attendance:!!p.attendance,selected:!!p.selected,starter:!!p.starter,position:p.starter?clean(p.position):null}))}
  function validateAll(){return validation(players,meta)}
  async function save(){const check=validateAll();const metaErrors=check.errors.filter(e=>/^Kies een team|^Vul een tegenstander|^Vul een wedstrijddatum|^Wedstrijdduur/.test(e));if(metaErrors.length)throw new Error(metaErrors.join(' · '));const data=await rpc('save_match_preparation',{p_match_id:meta.matchId||null,p_team_season_id:meta.teamSeasonId,p_opponent_name:clean(meta.opponentName),p_match_date:meta.matchDate,p_scheduled_time:clean(meta.scheduledTime)||null,p_official_duration_minutes:Number(meta.officialDurationMinutes),p_formation_code:clean(meta.formationCode)||null,p_players:payloadPlayers()});invariant(data?.match?.id,'Opgeslagen wedstrijdvoorbereiding is onvolledig');meta={...meta,matchId:data.match.id};dirty=false;options.onSaved?.(data);emit();return data}
  async function start(){const check=validateAll();if(!check.ok)throw new Error(check.errors.join(' · '));invariant(meta.matchId,'Sla de voorbereiding eerst op');if(dirty)throw new Error('Sla de laatste wijzigingen eerst op');const result=await rpc('start_match',{p_match_id:meta.matchId,p_client_event_id:makeId()});options.onStarted?.({matchId:meta.matchId,result});return result}
  function clear(){setup=null;meta=defaultMeta();players=[];dirty=false;return emit()}
  return Object.freeze({loadTeamSeasons,loadTeam,openExisting,setMeta,setFormation,patchPlayer,placeStarter,moveToBench,selectAllPresent,clearSelection,makeSelectedStarters,applyFormation,save,start,clear,validate:validateAll,get state(){return snapshot()}});
}
global.ClubMatchV08Preparation={createPreparationController,validation};
})(typeof window!=='undefined'?window:globalThis);
