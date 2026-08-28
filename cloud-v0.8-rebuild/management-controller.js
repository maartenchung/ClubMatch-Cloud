/* ClubMatch Cloud v0.8 - central club/team/player/user management */
(function(global){
'use strict';
const SUPABASE_URL='https://fnbqyogbamufytcabfzm.supabase.co';
const SUPABASE_KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
function invariant(ok,message){if(!ok)throw new Error(message)}
function clean(value){return String(value??'').trim()}
function positions(value){const raw=Array.isArray(value)?value:String(value||'').split(/[,;]+/);return [...new Set(raw.map(v=>clean(v).toUpperCase()).filter(Boolean))]}
function createManagementController(options={}){
  const client=options.client,fetchImpl=options.fetch||global.fetch?.bind(global);invariant(client?.rpc,'Cloud-client met RPC is verplicht');let teamSeasons=[],context={clubs:[],can_create_club:false},admin=null,userAdmin={is_platform_admin:false,can_manage_users:false,clubs:[],memberships:[]},teamSeasonId='';
  function snapshot(){
    const frozenClubs=Object.freeze((context.clubs||[]).map(c=>Object.freeze({...c}))),frozenContext=Object.freeze({...context,clubs:frozenClubs});let frozenAdmin=null;
    if(admin){const frozenPlayers=Object.freeze((admin.players||[]).map(p=>Object.freeze({...p,preferred_positions:Object.freeze([...(p.preferred_positions||[])])})));frozenAdmin=Object.freeze({...admin,players:frozenPlayers})}
    const frozenUser=Object.freeze({...userAdmin,clubs:Object.freeze((userAdmin.clubs||[]).map(c=>Object.freeze({...c}))),memberships:Object.freeze((userAdmin.memberships||[]).map(m=>Object.freeze({...m})))});
    return Object.freeze({teamSeasons:Object.freeze([...teamSeasons]),context:frozenContext,teamSeasonId,admin:frozenAdmin,userAdmin:frozenUser});
  }
  function emit(){const next=snapshot();options.onChange?.(next);return next}
  async function rpc(name,params={}){const result=await client.rpc(name,params);if(result?.error)throw result.error;return result?.data}
  async function loadTeamSeasons(){const data=await rpc('get_my_team_seasons');teamSeasons=Array.isArray(data)?data:[];return emit()}
  async function loadContext(){context=await rpc('get_management_context_v08')||{clubs:[],can_create_club:false};return emit()}
  async function loadUserAdmin(){userAdmin=await rpc('get_user_admin_v08')||{is_platform_admin:false,can_manage_users:false,clubs:[],memberships:[]};return emit()}
  async function loadAll(){await loadTeamSeasons();await loadContext();await loadUserAdmin();return emit()}
  async function load(id){invariant(id,'Kies een team/seizoen');teamSeasonId=id;admin=await rpc('get_team_admin_v08',{p_team_season_id:id});invariant(admin?.team_season_id,'Beheergegevens zijn onvolledig');return emit()}
  function requireManage(){invariant(admin?.can_manage,'Alleen platform- of clubbeheer kan deze masterdata wijzigen')}
  async function createTeamSeason(input={}){const wantsNewClub=!!input.newClub,clubId=wantsNewClub?null:(input.clubId||null);if(wantsNewClub){invariant(context.can_create_club,'Alleen platformbeheer kan een nieuwe club maken');invariant(clean(input.clubName),'Clubnaam is verplicht')}else invariant(clubId,'Kies eerst een club of kies + Nieuwe club');invariant(clean(input.teamName),'Teamnaam is verplicht');invariant(clean(input.seasonName),'Seizoennaam is verplicht');const result=await rpc('create_team_season_v08',{p_club_id:clubId,p_club_name:wantsNewClub?clean(input.clubName):null,p_team_name:clean(input.teamName),p_season_name:clean(input.seasonName),p_display_name:clean(input.displayName)||null});invariant(result?.team_season_id,'Nieuw team/seizoen is onvolledig');teamSeasonId=result.team_season_id;admin=result;await loadTeamSeasons();await loadContext();await loadUserAdmin();return emit()}
  async function updateNames({teamName,seasonName,displayName}={}){requireManage();invariant(teamSeasonId,'Kies een team/seizoen');invariant(clean(teamName),'Teamnaam is verplicht');invariant(clean(seasonName),'Seizoennaam is verplicht');admin=await rpc('update_team_season_v08',{p_team_season_id:teamSeasonId,p_team_name:clean(teamName),p_season_name:clean(seasonName),p_display_name:clean(displayName)||null});await loadTeamSeasons();return emit()}
  async function savePlayer(input={}){requireManage();invariant(teamSeasonId,'Kies een team/seizoen');const number=input.shirtNumber===''||input.shirtNumber===null||input.shirtNumber===undefined?null:Number(input.shirtNumber);if(number!==null)invariant(Number.isInteger(number)&&number>=0&&number<=99,'Rugnummer moet tussen 0 en 99 liggen');const preferred=positions(input.preferredPositions);admin=await rpc('upsert_team_player_v08',{p_team_season_id:teamSeasonId,p_player_id:input.playerId||null,p_full_name:clean(input.fullName)||null,p_display_name:clean(input.displayName)||null,p_shirt_number:number,p_preferred_positions:preferred,p_shirt_size:clean(input.shirtSize)||null,p_team_active:input.teamActive!==false});return emit()}
  async function addPlayer(input={}){invariant(clean(input.fullName),'Spelersnaam is verplicht');return savePlayer({...input,playerId:null})}
  async function setMembership(input={}){invariant(userAdmin.can_manage_users,'Geen gebruikersbeheerrechten');invariant(input.userId&&input.clubId,'Gebruiker en club zijn verplicht');await rpc('set_club_membership_v08',{p_user_id:input.userId,p_club_id:input.clubId,p_role:input.role||'viewer',p_status:input.status||'active'});return loadUserAdmin()}
  async function inviteUser(input={}){invariant(userAdmin.can_manage_users,'Geen gebruikersbeheerrechten');const email=clean(input.email).toLowerCase(),clubId=input.clubId,role=input.role||'viewer';invariant(email&&email.includes('@'),'Geldig e-mailadres is verplicht');invariant(clubId,'Kies een club');invariant(fetchImpl,'Browser fetch ontbreekt');const token=client.session?.access_token;invariant(token,'Log opnieuw in om een gebruiker uit te nodigen');const response=await fetchImpl(`${SUPABASE_URL}/functions/v1/clubmatch-user-invite`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({email,club_id:clubId,role})});const body=await response.json().catch(()=>({}));if(!response.ok||body?.error)throw new Error(body?.error||`Uitnodigen mislukt (${response.status})`);await loadUserAdmin();return body}
  return Object.freeze({loadTeamSeasons,loadContext,loadUserAdmin,loadAll,load,createTeamSeason,updateNames,savePlayer,addPlayer,setMembership,inviteUser,get state(){return snapshot()},normalizePositions:positions})
}
global.ClubMatchV08Management={createManagementController,normalizePositions:positions};
})(typeof window!=='undefined'?window:globalThis);
