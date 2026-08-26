/* ClubMatch Cloud v0.8 - branch-only browser application wiring */
(function(global){
'use strict';
const SUPABASE_URL='https://fnbqyogbamufytcabfzm.supabase.co';
const SUPABASE_KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const byId=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let client=null,runtime=null,renderer=null,lastFrame=null,busy=false;

function status(message,ok=false){const el=byId('v08Status');if(!el)return;el.textContent=message;el.classList.toggle('ok',ok);el.classList.toggle('bad',!ok&&!!message)}
function setBusy(value){busy=!!value;document.querySelectorAll('[data-v08-action]').forEach(btn=>btn.disabled=busy)}
async function run(label,fn){if(busy)return;setBusy(true);status(`${label}…`);try{const result=await fn();status(`${label} ✓`,true);return result}catch(error){console.error(error);status(`${label} mislukt: ${error.message||error}`);throw error}finally{setBusy(false)}}

function optionHtml(player){return `<option value="${esc(player.id)}">#${esc(player.shirtNumber??'—')} ${esc(player.name)}${player.position?' · '+esc(player.position):''}</option>`}
function fillSelect(id,players,allowEmpty=false){const el=byId(id);if(!el)return;const old=el.value;el.innerHTML=(allowEmpty?'<option value="">—</option>':'')+players.map(optionHtml).join('');if([...el.options].some(o=>o.value===old))el.value=old}
function updateActionControls(frame){
  lastFrame=frame;fillSelect('subOut',frame.field);fillSelect('subIn',frame.bench);fillSelect('posPlayer',frame.field);fillSelect('swapA',frame.field);fillSelect('swapB',frame.field);fillSelect('goalScorer',frame.field,true);fillSelect('goalAssist',frame.field,true);
  const match=runtime?.snapshot?.match||{};textMatch(match);
  byId('deleteMatchBtn').classList.toggle('hidden',match.status!=='finished');
}
function textMatch(match){byId('activeMatchTitle').textContent=match.id?`${match.team_name||'Team'} — ${match.opponent_name||'Tegenstander'}`:'Geen wedstrijd geselecteerd';byId('activeMatchMeta').textContent=match.id?`${match.match_date||''} · ${match.status||''} · ${match.formation_code||''}`:''}

function renderModel(model){const frame=global.ClubMatchV08UiFrame.createUiFrame(model);renderer.render(frame);updateActionControls(frame)}

async function refreshOpenMatches(){
  const box=byId('openMatches');box.innerHTML='<div class="muted">Cloud-wedstrijden laden…</div>';
  const {data,error}=await client.rpc('get_my_open_matches');if(error)throw error;
  const matches=Array.isArray(data)?data:[];
  if(!matches.length){box.innerHTML='<div class="muted">Geen open wedstrijden.</div>';return}
  box.innerHTML='';
  matches.forEach(match=>{const card=document.createElement('button');card.type='button';card.className='matchChoice';card.dataset.matchId=match.match_id;card.innerHTML=`<b>${esc(match.team_name)} — ${esc(match.opponent_name)}</b><span>${esc(match.match_date||'')} · ${esc(match.scheduled_time||'')} · ${esc(match.status)} · v${esc(match.state_version??'—')}</span>`;card.onclick=()=>run('Wedstrijd openen',async()=>{await runtime.start(match.match_id);document.querySelectorAll('.matchChoice').forEach(x=>x.classList.toggle('active',x.dataset.matchId===match.match_id))});box.appendChild(card)});
}

function showSession(session){const signed=!!session?.user;byId('authPanel').classList.toggle('hidden',signed);byId('appPanel').classList.toggle('hidden',!signed);byId('sessionEmail').textContent=signed?session.user.email||session.user.id:''}
async function bootstrapSession(){const {data,error}=await client.auth.getSession();if(error)throw error;showSession(data.session);if(data.session)await refreshOpenMatches()}

function bindActions(){
  byId('loginBtn').onclick=()=>run('Inloggen',async()=>{const email=byId('email').value.trim(),password=byId('password').value;const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;showSession(data.session);await refreshOpenMatches()});
  byId('logoutBtn').onclick=()=>run('Uitloggen',async()=>{runtime.stop();const {error}=await client.auth.signOut();if(error)throw error;showSession(null);byId('openMatches').innerHTML='';textMatch({})});
  byId('refreshMatchesBtn').onclick=()=>run('Wedstrijden verversen',refreshOpenMatches);
  byId('refreshLiveBtn').onclick=()=>run('Live status verversen',()=>runtime.refresh('manual'));

  byId('subBtn').onclick=()=>run('Wissel vastleggen',()=>runtime.substitute({outId:byId('subOut').value,inId:byId('subIn').value}));
  byId('posBtn').onclick=()=>run('Positie wijzigen',()=>runtime.changePosition({playerId:byId('posPlayer').value,position:byId('posNew').value.trim()}));
  byId('swapBtn').onclick=()=>run('Posities ruilen',()=>runtime.swapPositions({playerId:byId('swapA').value,otherPlayerId:byId('swapB').value}));
  byId('goalForBtn').onclick=()=>run('Doelpunt eigen team',()=>runtime.recordGoal({side:'for',scorerId:byId('goalScorer').value,assistId:byId('goalAssist').value||null}));
  byId('goalAgainstBtn').onclick=()=>run('Doelpunt tegenstander',()=>runtime.recordGoal({side:'against'}));

  document.querySelectorAll('[data-clock]').forEach(btn=>btn.onclick=()=>run(`Klok ${btn.dataset.clock}`,async()=>{const input={clockAction:btn.dataset.clock};if(input.clockAction==='injury_time')input.minutes=Number(byId('injuryMinutes').value);const result=await runtime.advanceClock(input);await refreshOpenMatches();return result}));

  byId('deleteMatchBtn').onclick=()=>run('Wedstrijd verwijderen',async()=>{
    if(!runtime.activeMatchId)throw new Error('Geen wedstrijd geselecteerd');
    if(!confirm('Deze wedstrijd en alle gekoppelde events/spelerdata definitief verwijderen?'))throw new Error('Verwijderen geannuleerd');
    const confirmation=prompt('Typ DELETE om definitief te verwijderen:','');
    if(confirmation!=='DELETE')throw new Error('Bevestiging is niet DELETE');
    const result=await runtime.deleteMatch({confirmation});await refreshOpenMatches();textMatch({});return result;
  });
}

async function init(){
  try{
    if(!global.supabase?.createClient)throw new Error('Supabase JS kon niet worden geladen');
    client=global.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    renderer=global.ClubMatchV08DomRenderer.createRenderer(document);
    runtime=global.ClubMatchV08Runtime.createRuntime({supabase:client,render:renderModel,onDeleted:()=>{lastFrame=null},onError:error=>status(`Cloud sync: ${error.message||error}`)});
    bindActions();
    client.auth.onAuthStateChange((_event,session)=>showSession(session));
    await bootstrapSession();status('ClubMatch Cloud v0.8 rebuild gereed.',true);
  }catch(error){console.error(error);status(`Start mislukt: ${error.message||error}`)}
}

document.addEventListener('DOMContentLoaded',init);
})(window);
