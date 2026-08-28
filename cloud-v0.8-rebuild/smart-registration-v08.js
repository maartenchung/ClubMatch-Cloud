/* ClubMatch Cloud v0.8 - one smart player-bound quick registration flow */
(function(global){
'use strict';

const doc=global.document;
const URL='https://fnbqyogbamufytcabfzm.supabase.co';
const KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const ASSIST_WINDOW_SECONDS=20;
const LOSS_ACTIONS=Object.freeze([
  {cause:'bad_pass',label:'Foute pass',group:'Pass'},
  {cause:'interception',label:'Pass onderschept',group:'Pass'},
  {cause:'duel_lost',label:'Balverlies · duel',group:'Bal'},
  {cause:'poor_control',label:'Bal kwijt · controle',group:'Bal'},
  {cause:'dribble',label:'Bal kwijt · dribbel',group:'Bal'},
  {cause:'other',label:'Overig balverlies',group:'Bal'}
]);
const state={controller:null,runtime:null,client:null,observer:null,queued:false};

function id(){return global.crypto?.randomUUID?.()||`smart-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function totalSecond(event){return Math.max(0,(Number(event?.match_minute)||0)*60+(Number(event?.match_second)||0))}
function activePlayer(){return state.controller?.currentPossession?.()||null}
function isAnalyst(bar){return !!bar?.querySelector?.('#v08AnalystMode')?.classList?.contains('on')}
function isAgainst(bar){return !!bar?.querySelector?.('[data-quick-side="against"]')?.classList?.contains('active')}
function fieldPlayers(){return (state.controller?.snapshot?.players||[]).filter(p=>p.selected&&p.is_on_field)}
function playerLabel(playerId){const p=fieldPlayers().find(x=>x.player_id===playerId);return p?`#${p.shirt_number??'—'} ${p.display_name||p.full_name||p.player_id}`:playerId}

function assistCandidate(snapshot,scorerId,windowSeconds=ASSIST_WINDOW_SECONDS){
  const now=Math.max(0,Number(snapshot?.state?.effective_elapsed_seconds)||0),events=(snapshot?.events||[]).slice().reverse();
  for(const event of events){
    if(event?.event_type!=='player_action'||event?.subject_player_id!==scorerId||event?.payload?.action!=='pass_received'||!event?.related_player_id)continue;
    const age=Math.max(0,now-totalSecond(event));
    if(age<=windowSeconds)return {playerId:event.related_player_id,age,event};
    return null;
  }
  return null;
}

function notice(message,tone='normal'){
  try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-notice',{detail:{message:String(message||''),tone}}))}catch{}
}
function localStatus(bar,message,type=''){
  if(!bar)return;
  let el=bar.querySelector(':scope > .smartRegStatus');
  if(!el){el=doc.createElement('div');el.className='smartRegStatus';bar.appendChild(el)}
  const nextClass=`smartRegStatus ${type}`.trim();
  if(el.className!==nextClass)el.className=nextClass;
  if(el.textContent!==message)el.textContent=message;
}
async function run(bar,label,fn){
  if(bar?.dataset.smartBusy==='1')return;
  if(bar)bar.dataset.smartBusy='1';
  localStatus(bar,`${label}…`);
  try{
    const result=await fn();
    localStatus(bar,`${label} ✓`,'ok');
    return result;
  }catch(error){
    console.error(error);
    localStatus(bar,`${label} mislukt: ${error.message||error}`,'bad');
    notice(`${label} mislukt: ${error.message||error}`,'danger');
    return undefined;
  }finally{
    if(bar)delete bar.dataset.smartBusy;
  }
}

function patchControllerFactory(){
  const api=global.ClubMatchV08PlayerActions;
  if(!api?.createPlayerActionController||api.__smartRegistration)return;
  const original=api.createPlayerActionController.bind(api);
  global.ClubMatchV08PlayerActions={...api,__smartRegistration:true,createPlayerActionController(options={}){
    const controller=original(options);
    state.controller=controller;state.runtime=options.runtime||state.runtime;
    queueTransform();
    return controller;
  }};
}
function sharedClient(){
  if(state.client)return state.client;
  const api=global.ClubMatchV08CloudClient;
  if(!api?.createClient)return null;
  state.client=api.createClient(URL,KEY);
  return state.client;
}

async function selectPlayer(playerId,bar){
  const current=activePlayer();
  if(current?.playerId===playerId)return;
  if(isAnalyst(bar)&&typeof state.controller?.analystReceiveBall==='function'){
    await state.controller.analystReceiveBall(playerId);
  }else{
    if(current?.playerId)await state.controller.stopPossession();
    await state.controller.startPossession(playerId);
    if(typeof state.controller.startTeamPossession==='function')await state.controller.startTeamPossession('for');
  }
}

async function recordLoss(cause,bar){
  if(isAgainst(bar))throw new Error('Balverliesoorzaak hoort bij een gekozen eigen speler');
  const current=activePlayer();
  if(!current?.playerId)throw new Error('Kies bij Spelerbezit eerst de speler');
  if(isAnalyst(bar)&&typeof state.controller?.analystLoseBall==='function')await state.controller.analystLoseBall(current.playerId,cause,'Snelle registratie');
  else await state.controller.loseBall(current.playerId,cause,'Snelle registratie');
}

async function recordSmartGoal(bar){
  const current=activePlayer();
  if(!current?.playerId)throw new Error('Kies bij Spelerbezit eerst de doelpuntenmaker');
  const runtime=state.runtime;
  if(!runtime?.activeMatchId)throw new Error('Geen actieve wedstrijd geselecteerd');
  const candidate=assistCandidate(state.controller?.snapshot,current.playerId);
  const client=sharedClient();
  if(!client)throw new Error('Cloud-client niet beschikbaar');
  const context=candidate?'assist':'none';
  const result=await client.rpc('record_analyst_goal_v08',{p_match_id:runtime.activeMatchId,p_scorer_player_id:current.playerId,p_context:context,p_client_event_id:id()});
  if(result?.error)throw result.error;
  await runtime.refresh('smart-analyst-goal');
  const assistText=candidate?` · assist ${playerLabel(candidate.playerId)} automatisch gekoppeld`:'';
  notice(`Goal ${playerLabel(current.playerId)}${assistText}. Schot + schot op doel zijn automatisch toegevoegd.`,'ok');
}

function ensureStyles(){
  if(!doc||doc.getElementById('v08SmartRegistrationStyles'))return;
  const s=doc.createElement('style');s.id='v08SmartRegistrationStyles';s.textContent=`
#v08ActionField,.lossGrid,.v08AnalystQuick,#v08QuickPlayer{display:none!important}
.smartPlayerChooser{margin-top:7px}.smartPlayerHint{margin-top:6px;padding:7px 9px;border-radius:9px;background:#f7f4fa;color:#6b5877;font-size:10px}
.smartRegStatus{margin-top:8px;padding:7px 9px;border-radius:9px;border:1px solid #d8c4ef;background:#faf7fd;font-size:10px}.smartRegStatus.ok{background:#eaf7ee;color:#1f6638;border-color:#9ed5ad}.smartRegStatus.bad{background:#fff1f1;color:#8b1f1f;border-color:#e2a2a2}
.smartLoss{border-color:#b95078!important}.smartActor{font-weight:900;color:#4b2672}.quickScope.smartUnified{grid-template-columns:1fr 1fr!important}
`;
  doc.head.appendChild(s);
}

function ensureCoachChooser(bar){
  if(!bar||bar.querySelector('.flowGrid'))return;
  const heads=bar.querySelectorAll('.posHead'),anchor=heads[1];
  if(!anchor||bar.querySelector('.smartPlayerChooser'))return;
  const wrap=doc.createElement('div');wrap.className='smartPlayerChooser';
  wrap.innerHTML=`<div class="smartPlayerHint"><b>Speler kiezen:</b> tik de speler met de bal. In coachmodus wisselt alleen de actieve speler; in analistmodus registreert A → B automatisch pass geslaagd, pass ontvangen en nieuw bezit.</div><div class="flowGrid">${fieldPlayers().map(p=>`<button type="button" class="flowPlayer ${activePlayer()?.playerId===p.player_id?'active':''}" data-smart-player="${p.player_id}" data-v08-action>#${p.shirt_number??'—'} ${p.display_name||p.full_name||''}</button>`).join('')}</div>`;
  anchor.after(wrap);
  wrap.querySelectorAll('[data-smart-player]').forEach(btn=>btn.onclick=()=>run(bar,'Spelerbezit',()=>selectPlayer(btn.dataset.smartPlayer,bar)));
}

function syncActor(bar){
  const select=bar.querySelector('#v08QuickPlayer'),scope=bar.querySelector('.quickScope');
  if(scope)scope.classList.add('smartUnified');
  if(!select||isAgainst(bar))return;
  const current=activePlayer();
  if(current?.playerId&&select.value!==current.playerId){
    select.value=current.playerId;
    try{select.dispatchEvent(new global.Event('change',{bubbles:true}))}catch{select.onchange?.()}
  }
}

function groupContainer(bar,name){
  return [...bar.querySelectorAll('.quickGroup')].find(group=>group.querySelector(':scope > b')?.textContent?.trim()===name)?.querySelector('.quickButtons')||null;
}
function addLossButtons(bar){
  const alpha=bar.querySelector('.quickAlpha');
  for(const item of LOSS_ACTIONS){
    if(bar.querySelector(`[data-smart-loss="${item.cause}"]`))continue;
    const btn=doc.createElement('button');btn.type='button';btn.className='quickAction smartLoss';btn.dataset.smartLoss=item.cause;btn.dataset.v08Action='';btn.textContent=item.label;
    btn.onclick=()=>run(bar,item.label,()=>recordLoss(item.cause,bar));
    const target=alpha||groupContainer(bar,item.group)||groupContainer(bar,'Overig');
    target?.appendChild(btn);
  }
  if(alpha){
    [...alpha.querySelectorAll('.quickAction')].sort((a,b)=>a.textContent.trim().localeCompare(b.textContent.trim(),'nl')).forEach(btn=>alpha.appendChild(btn));
  }
}

function bindSmartGoal(bar){
  const btn=bar.querySelector('[data-quick-action="goal"]');
  if(!btn||btn.dataset.smartGoal==='1')return;
  const original=btn.onclick;
  btn.dataset.smartGoal='1';
  btn.onclick=event=>{
    if(isAgainst(bar)||!isAnalyst(bar))return original?.call(btn,event);
    return run(bar,'Goal registreren',()=>recordSmartGoal(bar));
  };
}

function updateActionContext(bar){
  const header=bar.querySelector('.quickRegHead > div');
  const current=activePlayer(),against=isAgainst(bar);
  if(header){
    const title=header.querySelector('b'),hint=header.querySelector('.muted');
    const nextTitle=against?'Acties tegenstander':current?`Acties voor ${playerLabel(current.playerId)}`:'Acties · kies eerst een speler';
    const nextHint=against?'Tegenstanderacties worden als teamactie geregistreerd.':current?(isAnalyst(bar)?'Nieuwe speler kiezen verplaatst het bezit; Goal koppelt een recente aangever automatisch als assist.':'Alle acties hieronder horen bij de actieve speler.'):'Tik hierboven bij Spelerbezit eerst een veldspeler.';
    if(title&&title.textContent!==nextTitle)title.textContent=nextTitle;
    if(hint&&hint.textContent!==nextHint)hint.textContent=nextHint;
  }
  const ownDisabled=!against&&!current;
  bar.querySelectorAll('[data-quick-action],[data-smart-loss]').forEach(btn=>{btn.disabled=ownDisabled});
}

function retireDuplicates(bar){
  doc?.getElementById?.('v08ActionField')?.remove?.();
  bar?.querySelector('.lossGrid')?.classList.add('hidden');
  bar?.querySelector('.v08AnalystQuick')?.classList.add('hidden');
}

function transform(){
  state.queued=false;
  const bar=doc?.getElementById?.('v08PossessionBar');
  if(!bar||!state.controller)return;
  retireDuplicates(bar);
  ensureCoachChooser(bar);
  syncActor(bar);
  addLossButtons(bar);
  bindSmartGoal(bar);
  updateActionContext(bar);
}
function queueTransform(){
  if(state.queued)return;state.queued=true;
  Promise.resolve().then(transform);
}

function boot(){
  ensureStyles();patchControllerFactory();sharedClient();queueTransform();
  if(doc?.body){state.observer=new MutationObserver(queueTransform);state.observer.observe(doc.body,{childList:true,subtree:true})}
  global.addEventListener?.('clubmatch:v08-confirmed',queueTransform);
  global.addEventListener?.('clubmatch:v08-stopped',queueTransform);
}

patchControllerFactory();
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
global.ClubMatchV08SmartRegistration=Object.freeze({LOSS_ACTIONS,ASSIST_WINDOW_SECONDS,totalSecond,assistCandidate,queueTransform});
})(typeof window!=='undefined'?window:globalThis);
