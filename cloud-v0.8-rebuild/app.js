/* ClubMatch Cloud v0.8 - branch-only browser application wiring */
(function(global){
'use strict';
const SUPABASE_URL='https://fnbqyogbamufytcabfzm.supabase.co';
const SUPABASE_KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const byId=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
let client=null,runtime=null,renderer=null,lifecycleSync=null,matchSelection=null,preparation=null,preparationUi=null,dashboard=null,dashboardUi=null,lastFrame=null,busy=false;

function status(message,ok=false){const el=byId('v08Status');if(!el)return;el.textContent=message;el.classList.toggle('ok',ok);el.classList.toggle('bad',!ok&&!!message)}
function setBusy(value){busy=!!value;document.querySelectorAll('[data-v08-action]').forEach(btn=>{btn.disabled=busy||btn.dataset.v08Allowed==='0'})}
function setAllowed(selector,allowed){const el=document.querySelector(selector);if(!el)return;el.dataset.v08Allowed=allowed?'1':'0';el.disabled=busy||!allowed}
async function run(label,fn){if(busy)return;setBusy(true);status(`${label}…`);try{const result=await fn();status(`${label} ✓`,true);return result}catch(error){console.error(error);status(`${label} mislukt: ${error.message||error}`);return undefined}finally{setBusy(false)}}

function optionHtml(player){return `<option value="${esc(player.id)}">#${esc(player.shirtNumber??'—')} ${esc(player.name)}${player.position?' · '+esc(player.position):''}</option>`}
function fillSelect(id,players,allowEmpty=false){const el=byId(id);if(!el)return;const old=el.value;el.innerHTML=(allowEmpty?'<option value="">—</option>':'')+players.map(optionHtml).join('');if([...el.options].some(o=>o.value===old))el.value=old}
function textMatch(match){byId('activeMatchTitle').textContent=match.id?`${match.team_name||'Team'} — ${match.opponent_name||'Tegenstander'}`:'Geen wedstrijd geselecteerd';byId('activeMatchMeta').textContent=match.id?`${match.club_name||''}${match.season_name?' · '+match.season_name:''}${match.status?' · '+match.status:''}${match.formation_code?' · '+match.formation_code:''}`:''}
function applyActionPolicy(frame={field:[],bench:[]}){
  const snapshot=runtime?.snapshot||{},policy=global.ClubMatchV08ActionPolicy.createActionPolicy({match:snapshot.match,state:snapshot.state,frame});
  setAllowed('#subBtn',policy.substitute);setAllowed('#posBtn',policy.changePosition);setAllowed('#swapBtn',policy.swapPositions);setAllowed('#goalForBtn',policy.goalFor);setAllowed('#goalAgainstBtn',policy.goalAgainst);
  setAllowed('[data-clock="pause"]',policy.pause);setAllowed('[data-clock="resume"]',policy.resume);setAllowed('[data-clock="halftime"]',policy.halftime);setAllowed('[data-clock="second_half"]',policy.secondHalf);setAllowed('[data-clock="injury_time"]',policy.injuryTime);setAllowed('[data-clock="finish"]',policy.finish);
  setAllowed('#deleteMatchBtn',policy.deleteMatch);byId('deleteMatchBtn').classList.toggle('hidden',!policy.deleteMatch);return policy;
}
function resetLiveUi(){lastFrame=null;renderer?.clear?.();textMatch({});if(global.ClubMatchV08ActionPolicy?.createActionPolicy)applyActionPolicy({field:[],bench:[]})}
function updateActionControls(frame){lastFrame=frame;fillSelect('subOut',frame.field);fillSelect('subIn',frame.bench);fillSelect('posPlayer',frame.field);fillSelect('swapA',frame.field);fillSelect('swapB',frame.field);fillSelect('goalScorer',frame.field,true);fillSelect('goalAssist',frame.field,true);textMatch(runtime?.snapshot?.match||{});applyActionPolicy(frame)}
function renderModel(model){const frame=global.ClubMatchV08UiFrame.createUiFrame(model);renderer.render(frame);updateActionControls(frame)}
function markActiveMatch(matchId){document.querySelectorAll('.matchChoice').forEach(x=>x.classList.toggle('active',x.dataset.matchId===matchId))}

async function openLiveMatch(match,{remember=true}={}){preparationUi?.hide();dashboardUi?.hide();await runtime.start(match.match_id);if(remember)matchSelection?.remember(match.match_id);markActiveMatch(match.match_id);return runtime.viewModel}
async function openPreparation(match,{remember=true}={}){dashboardUi?.hide();runtime.stop();resetLiveUi();if(remember)matchSelection?.remember(match.match_id);await preparationUi.openExisting(match);markActiveMatch(match.match_id);return preparation.state}
async function openMatchSummary(match,options={}){if(['draft','scheduled'].includes(match.status))return openPreparation(match,options);return openLiveMatch(match,options)}

async function refreshOpenMatches({restore=false}={}){
  const box=byId('openMatches');box.innerHTML='<div class="muted">Cloud-wedstrijden laden…</div>';
  const {data,error}=await client.rpc('get_my_open_matches');if(error)throw error;const matches=Array.isArray(data)?data:[];
  if(!matches.length){box.innerHTML='<div class="muted">Geen open wedstrijden.</div>';if(runtime?.activeMatchId){runtime.stop();resetLiveUi()}return matches}
  box.innerHTML='';matches.forEach(match=>{const card=document.createElement('button');card.type='button';card.className='matchChoice';card.dataset.matchId=match.match_id;card.innerHTML=`<b>${esc(match.team_name)} — ${esc(match.opponent_name)}</b><span>${esc(match.club_name||'')} · ${esc(match.match_date||'')} · ${esc(match.scheduled_time||'')} · ${esc(match.status)} · state v${esc(match.state_version??'—')}</span>`;card.onclick=()=>run(match.status==='draft'||match.status==='scheduled'?'Voorbereiding openen':'Wedstrijd openen',()=>openMatchSummary(match));box.appendChild(card)});
  if(runtime?.activeMatchId&&matches.some(match=>match.match_id===runtime.activeMatchId))markActiveMatch(runtime.activeMatchId);
  else if(preparation?.state?.meta?.matchId&&preparationUi?.visible&&matches.some(match=>match.match_id===preparation.state.meta.matchId))markActiveMatch(preparation.state.meta.matchId);
  else if(restore){const chosen=matchSelection?.choose(matches),match=matches.find(item=>item.match_id===chosen);if(match)await openMatchSummary(match,{remember:false})}
  return matches;
}

function ensureHeaderButtons(){
  const refresh=byId('refreshMatchesBtn'),parent=refresh?.parentElement;if(!parent)return;
  if(!byId('newPreparationBtn')){const button=document.createElement('button');button.id='newPreparationBtn';button.className='secondary';button.dataset.v08Action='';button.textContent='+ Nieuwe wedstrijd';button.onclick=()=>run('Nieuwe voorbereiding',async()=>{dashboardUi?.hide();runtime.stop();resetLiveUi();matchSelection?.clear();preparation.clear();await preparation.loadTeamSeasons();preparationUi.renderCurrent();return preparation.state});parent.insertBefore(button,refresh)}
  if(!byId('dashboardBtn')){const button=document.createElement('button');button.id='dashboardBtn';button.className='secondary';button.dataset.v08Action='';button.textContent='Dashboard';button.onclick=()=>run('Dashboard laden',async()=>{preparationUi?.hide();await dashboard.loadTeams();await dashboard.load(null);dashboardUi.show();return dashboard.state});parent.insertBefore(button,refresh)}
}

function showSession(session){const signed=!!session?.user;byId('authPanel').classList.toggle('hidden',signed);byId('appPanel').classList.toggle('hidden',!signed);byId('sessionEmail').textContent=signed?session.user.email||session.user.id:'';if(!signed){runtime?.stop?.();preparationUi?.hide?.();dashboardUi?.hide?.();resetLiveUi()}}
async function loadSignedInContext({restore=true}={}){await preparation.loadTeamSeasons();return refreshOpenMatches({restore})}
async function bootstrapSession(){const {data,error}=await client.auth.getSession();if(error)throw error;showSession(data.session);if(data.session)await loadSignedInContext({restore:true})}

function bindActions(){
  ensureHeaderButtons();
  byId('loginBtn').onclick=()=>run('Inloggen',async()=>{const email=byId('email').value.trim(),password=byId('password').value;const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;showSession(data.session);await loadSignedInContext({restore:true})});
  byId('logoutBtn').onclick=()=>run('Uitloggen',async()=>{runtime.stop();preparationUi.hide();dashboardUi.hide();const {error}=await client.auth.signOut();if(error)throw error;showSession(null);byId('openMatches').innerHTML=''});
  byId('refreshMatchesBtn').onclick=()=>run('Wedstrijden verversen',()=>refreshOpenMatches({restore:!runtime.activeMatchId&&!preparationUi.visible}));byId('refreshLiveBtn').onclick=()=>run('Live status verversen',()=>runtime.refresh('manual'));
  byId('subBtn').onclick=()=>run('Wissel vastleggen',()=>runtime.substitute({outId:byId('subOut').value,inId:byId('subIn').value}));
  byId('posBtn').onclick=()=>run('Positie wijzigen',()=>runtime.changePosition({playerId:byId('posPlayer').value,position:byId('posNew').value.trim()}));
  byId('swapBtn').onclick=()=>run('Posities ruilen',()=>runtime.swapPositions({playerId:byId('swapA').value,otherPlayerId:byId('swapB').value}));
  byId('goalForBtn').onclick=()=>run('Doelpunt eigen team',()=>runtime.recordGoal({side:'for',scorerId:byId('goalScorer').value,assistId:byId('goalAssist').value||null}));
  byId('goalAgainstBtn').onclick=()=>run('Doelpunt tegenstander',()=>runtime.recordGoal({side:'against'}));
  document.querySelectorAll('[data-clock]').forEach(btn=>btn.onclick=()=>run(`Klok ${btn.dataset.clock}`,async()=>{const input={clockAction:btn.dataset.clock};if(input.clockAction==='injury_time')input.minutes=Number(byId('injuryMinutes').value);const result=await runtime.advanceClock(input);await refreshOpenMatches();return result}));
  byId('deleteMatchBtn').onclick=()=>run('Wedstrijd verwijderen',async()=>{if(!runtime.activeMatchId)throw new Error('Geen wedstrijd geselecteerd');if(!confirm('Deze wedstrijd en alle gekoppelde events/spelerdata definitief verwijderen?'))throw new Error('Verwijderen geannuleerd');const confirmation=prompt('Typ DELETE om definitief te verwijderen:','');if(confirmation!=='DELETE')throw new Error('Bevestiging is niet DELETE');const result=await runtime.deleteMatch({confirmation});matchSelection?.clear();await refreshOpenMatches({restore:true});return result});
}

function ensureModule(path,isReady,label){if(isReady())return Promise.resolve();return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.onload=()=>isReady()?resolve():reject(new Error(`${label} geladen zonder API`));script.onerror=()=>reject(new Error(`${label} kon niet worden geladen`));document.head.appendChild(script)})}
async function init(){
  try{
    if(!global.ClubMatchV08CloudClient?.createClient)throw new Error('ClubMatch Cloud-client kon niet worden geladen');
    await ensureModule('action-policy.js',()=>!!global.ClubMatchV08ActionPolicy?.createActionPolicy,'action-policy.js');
    await ensureModule('lifecycle-sync.js',()=>!!global.ClubMatchV08LifecycleSync?.createLifecycleSync,'lifecycle-sync.js');
    await ensureModule('match-selection.js',()=>!!global.ClubMatchV08MatchSelection?.createMatchSelection,'match-selection.js');
    await ensureModule('preparation-controller.js',()=>!!global.ClubMatchV08Preparation?.createPreparationController,'preparation-controller.js');
    await ensureModule('preparation-ui.js',()=>!!global.ClubMatchV08PreparationUi?.createPreparationUi,'preparation-ui.js');
    await ensureModule('dashboard-controller.js',()=>!!global.ClubMatchV08Dashboard?.createDashboardController,'dashboard-controller.js');
    await ensureModule('dashboard-ui.js',()=>!!global.ClubMatchV08DashboardUi?.createDashboardUi,'dashboard-ui.js');
    client=global.ClubMatchV08CloudClient.createClient(SUPABASE_URL,SUPABASE_KEY);
    renderer=global.ClubMatchV08DomRenderer.createRenderer(document);
    runtime=global.ClubMatchV08Runtime.createRuntime({supabase:client,render:renderModel,onDeleted:resetLiveUi,onError:error=>status(`Cloud sync: ${error.message||error}`)});
    matchSelection=global.ClubMatchV08MatchSelection.createMatchSelection();
    preparation=global.ClubMatchV08Preparation.createPreparationController({client,onChange:state=>{if(preparationUi?.visible)preparationUi.render(state)}});
    preparationUi=global.ClubMatchV08PreparationUi.createPreparationUi({document,controller:preparation,run,onSaved:async snapshot=>{matchSelection.remember(snapshot.match.id);await refreshOpenMatches({restore:false});markActiveMatch(snapshot.match.id)},onStarted:async matchId=>{matchSelection.remember(matchId);preparationUi.hide();await refreshOpenMatches({restore:false});const response=await client.rpc('get_my_open_matches');if(response.error)throw response.error;const match=(response.data||[]).find(item=>item.match_id===matchId);if(!match)throw new Error('Gestarte wedstrijd niet teruggevonden');await openLiveMatch(match,{remember:false})}});
    dashboard=global.ClubMatchV08Dashboard.createDashboardController({client,onChange:state=>{if(dashboardUi?.visible)dashboardUi.render(state)}});
    dashboardUi=global.ClubMatchV08DashboardUi.createDashboardUi({document,controller:dashboard,run});
    lifecycleSync=global.ClubMatchV08LifecycleSync.createLifecycleSync({runtime,window:global,document});lifecycleSync.install();
    bindActions();applyActionPolicy({field:[],bench:[]});client.auth.onAuthStateChange((_event,session)=>showSession(session));
    await bootstrapSession();status('ClubMatch Cloud v0.8 rebuild gereed.',true);
  }catch(error){console.error(error);status(`Start mislukt: ${error.message||error}`)}
}
document.addEventListener('DOMContentLoaded',init);
})(window);
