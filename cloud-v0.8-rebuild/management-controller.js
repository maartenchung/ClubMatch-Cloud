/* ClubMatch Cloud v0.8 - v09 central club/team/player/user management */
(function(global){
'use strict';
const SUPABASE_URL='https://fnbqyogbamufytcabfzm.supabase.co';
const SUPABASE_KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const invariant=(ok,msg)=>{if(!ok)throw new Error(msg)};
const clean=v=>String(v??'').trim();
const positions=v=>[...new Set((Array.isArray(v)?v:String(v||'').split(/[,;]+/)).map(x=>clean(x).toUpperCase()).filter(Boolean))];
function createManagementController(options={}){
 const client=options.client,fetchImpl=options.fetch||global.fetch?.bind(global);invariant(client?.rpc,'Cloud-client met RPC is verplicht');
 let teamSeasons=[],context={clubs:[],can_create_club:false},admin=null,userAdmin={is_platform_admin:false,can_manage_users:false,clubs:[],memberships:[]},teamSeasonId='';const pending={teamSeasons:null,context:null,userAdmin:null};
 function snapshot(){
  const frozenContext=Object.freeze({...context,clubs:Object.freeze((context.clubs||[]).map(x=>Object.freeze({...x})))});
  const frozenAdmin=admin?Object.freeze({...admin,players:Object.freeze((admin.players||[]).map(p=>Object.freeze({...p,preferred_positions:Object.freeze([...(p.preferred_positions||[])])})))}):null;
  const frozenUser=Object.freeze({...userAdmin,clubs:Object.freeze((userAdmin.clubs||[]).map(x=>Object.freeze({...x}))),memberships:Object.freeze((userAdmin.memberships||[]).map(x=>Object.freeze({...x})))});
  return Object.freeze({teamSeasons:Object.freeze([...teamSeasons]),context:frozenContext,teamSeasonId,admin:frozenAdmin,userAdmin:frozenUser});
 }
 function emit(){const s=snapshot();options.onChange?.(s);return s}
 async function rpc(name,params={}){const r=await client.rpc(name,params);if(r?.error)throw r.error;return r?.data}
 function single(key,fn){if(pending[key])return pending[key];pending[key]=Promise.resolve().then(fn).finally(()=>pending[key]=null);return pending[key]}
 const loadTeamSeasons=()=>single('teamSeasons',async()=>{const x=await rpc('get_my_team_seasons');teamSeasons=Array.isArray(x)?x:[];return emit()});
 const loadContext=()=>single('context',async()=>{context=await rpc('get_management_context_v08')||{clubs:[],can_create_club:false};return emit()});
 const loadUserAdmin=()=>single('userAdmin',async()=>{userAdmin=await rpc('get_user_admin_v08')||{is_platform_admin:false,can_manage_users:false,clubs:[],memberships:[]};return emit()});
 async function loadAll(){await Promise.all([loadTeamSeasons(),loadContext(),loadUserAdmin()]);return emit()}
 async function load(id){invariant(id,'Kies een team/seizoen');teamSeasonId=id;admin=await rpc('get_team_admin_v08',{p_team_season_id:id});invariant(admin?.team_season_id,'Beheergegevens onvolledig');return emit()}
 function requireManage(){invariant(admin?.can_manage,'Alleen platform- of clubbeheer kan deze masterdata wijzigen')}
 async function createTeamSeason(input={}){const wantsNew=!!input.newClub,clubId=wantsNew?null:(input.clubId||null);if(wantsNew){invariant(context.can_create_club,'Alleen platformbeheer kan een nieuwe club maken');invariant(clean(input.clubName),'Clubnaam is verplicht')}else invariant(clubId,'Kies een club');invariant(clean(input.teamName),'Teamnaam is verplicht');invariant(clean(input.seasonName),'Seizoennaam is verplicht');const result=await rpc('create_team_season_v08',{p_club_id:clubId,p_club_name:wantsNew?clean(input.clubName):null,p_team_name:clean(input.teamName),p_season_name:clean(input.seasonName),p_display_name:clean(input.displayName)||null});teamSeasonId=result.team_season_id;admin=result;await Promise.all([loadTeamSeasons(),loadContext(),loadUserAdmin()]);return emit()}
 async function updateNames(input={}){requireManage();admin=await rpc('update_team_season_v08',{p_team_season_id:teamSeasonId,p_team_name:clean(input.teamName),p_season_name:clean(input.seasonName),p_display_name:clean(input.displayName)||null});await loadTeamSeasons();return emit()}
 async function savePlayer(input={}){requireManage();const n=input.shirtNumber===''||input.shirtNumber==null?null:Number(input.shirtNumber);if(n!==null)invariant(Number.isInteger(n)&&n>=0&&n<=99,'Rugnummer moet tussen 0 en 99 liggen');admin=await rpc('upsert_team_player_v08',{p_team_season_id:teamSeasonId,p_player_id:input.playerId||null,p_full_name:clean(input.fullName)||null,p_display_name:clean(input.displayName)||null,p_shirt_number:n,p_preferred_positions:positions(input.preferredPositions),p_shirt_size:clean(input.shirtSize)||null,p_team_active:input.teamActive!==false});return emit()}
 async function addPlayer(input={}){invariant(clean(input.fullName),'Spelersnaam is verplicht');return savePlayer({...input,playerId:null})}
 async function setMembership(input={}){invariant(userAdmin.can_manage_users,'Geen gebruikersbeheerrechten');await rpc('set_club_membership_v08',{p_user_id:input.userId,p_club_id:input.clubId,p_role:input.role||'viewer',p_status:input.status||'active'});return loadUserAdmin()}
 async function removeMembership(input={}){invariant(userAdmin.can_manage_users,'Geen gebruikersbeheerrechten');invariant(input.userId&&input.clubId,'Gebruiker en club zijn verplicht');await rpc('remove_club_membership_v09',{p_user_id:input.userId,p_club_id:input.clubId});return loadUserAdmin()}
 async function inviteUser(input={}){invariant(userAdmin.can_manage_users,'Geen gebruikersbeheerrechten');const email=clean(input.email).toLowerCase(),clubId=input.clubId,role=input.role||'viewer';invariant(email.includes('@'),'Geldig e-mailadres is verplicht');invariant(clubId,'Kies een club');const token=client.session?.access_token||((await client.auth.getSession())?.data?.session?.access_token);invariant(token,'Log opnieuw in om gebruiker uit te nodigen');const r=await fetchImpl(`${SUPABASE_URL}/functions/v1/clubmatch-user-invite`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({email,club_id:clubId,role})});const body=await r.json().catch(()=>({}));if(!r.ok||body?.error)throw new Error(body?.error||`Uitnodigen mislukt (${r.status})`);await loadUserAdmin();return body}
 async function deleteUser(input={}){invariant(userAdmin.is_platform_admin,'Alleen platformbeheer kan een account definitief verwijderen');invariant(input.userId,'Gebruiker ontbreekt');const token=client.session?.access_token||((await client.auth.getSession())?.data?.session?.access_token);invariant(token,'Log opnieuw in om gebruiker te verwijderen');const r=await fetchImpl(`${SUPABASE_URL}/functions/v1/clubmatch-user-delete`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({user_id:input.userId})});const body=await r.json().catch(()=>({}));if(!r.ok||body?.error)throw new Error(body?.error||`Account verwijderen mislukt (${r.status})`);await loadUserAdmin();return body}
 return Object.freeze({loadTeamSeasons,loadContext,loadUserAdmin,loadAll,load,createTeamSeason,updateNames,savePlayer,addPlayer,setMembership,removeMembership,inviteUser,deleteUser,get state(){return snapshot()},get pending(){return Object.freeze({...pending})},normalizePositions:positions})
}
global.ClubMatchV08Management={createManagementController,normalizePositions:positions};
global.ClubMatchV09Management=global.ClubMatchV08Management;
})(typeof window!=='undefined'?window:globalThis);
