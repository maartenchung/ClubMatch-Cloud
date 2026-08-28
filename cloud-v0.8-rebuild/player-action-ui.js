/* ClubMatch Cloud v0.8 - fast coach actions + quick registration parity + explicit analyst flow */
(function(global){
'use strict';

const MODE_KEY='clubmatch.v08.action.mode';
const QUICK_ORDER_KEY='clubmatch.v08.quick.order';
const FIELD_QUICK=Object.freeze([
  'pass','progression','switch_play','cross','shot','shot_on_target','chance_created',
  'ball_loss','ball_recovery','interception','duel_won','duel_lost',
  'foul_committed','foul_won','free_kick','corner','throw_in','save'
]);
const FIELD_LABEL_FALLBACK=Object.freeze({
  pass:'Pass',progression:'Vooruit spelen',switch_play:'Spel verleggen',cross:'Voorzet',
  shot:'Schot',shot_on_target:'Schot op doel',chance_created:'Kans gecreëerd',
  ball_loss:'Balverlies',ball_recovery:'Bal veroverd',interception:'Onderschepping',
  duel_won:'Duel gewonnen',duel_lost:'Duel verloren',
  foul_committed:'Overtreding gemaakt',foul_won:'Overtreding mee',
  free_kick:'Vrije trap',corner:'Corner',throw_in:'Ingooi',save:'Redding'
});
const QUICK_GROUP=Object.freeze({
  goal:'Aanval',cross:'Aanval',shot:'Aanval',shot_on_target:'Aanval',chance_created:'Aanval',
  pass:'Pass',progression:'Pass',switch_play:'Pass',
  ball_loss:'Bal',ball_recovery:'Bal',interception:'Bal',
  duel_won:'Duel',duel_lost:'Duel',
  foul_committed:'Spelhervatting',foul_won:'Spelhervatting',free_kick:'Spelhervatting',corner:'Spelhervatting',throw_in:'Spelhervatting',
  save:'Keeper'
});
const GROUP_ORDER=Object.freeze(['Aanval','Pass','Bal','Duel','Spelhervatting','Keeper','Overig']);
const ANALYST_QUICK=new Set(['shot','shot_on_target','ball_recovery','interception','ball_loss','foul_won','foul_committed']);

const ACTIONS=Object.freeze([
  {id:'possession_control',label:'Balcontrole',group:'Bal'},
  {id:'ball_recovery',label:'Bal veroverd',group:'Bal'},
  {id:'interception',label:'Onderschepping',group:'Bal'},
  {id:'block',label:'Blok',group:'Bal'},
  {id:'ball_loss',label:'Balverlies',group:'Bal'},
  {id:'bad_pass',label:'Verkeerde pass',group:'Pass'},
  {id:'chance_created',label:'Kans gecreëerd',group:'Pass'},
  {id:'duel_won',label:'Duel gewonnen',group:'Duel'},
  {id:'duel_lost',label:'Duel verloren',group:'Duel'},
  {id:'shot',label:'Schot',group:'Aanval'},
  {id:'shot_on_target',label:'Schot op doel',group:'Aanval'},
  {id:'foul_committed',label:'Overtreding / vrije trap tegen',group:'Spelhervatting'},
  {id:'foul_won',label:'Overtreding mee / vrije trap mee',group:'Spelhervatting'},
  {id:'save',label:'Redding',group:'Overig'},
  {id:'injury',label:'Blessure',group:'Overig'}
]);
const LOSS_LABELS=Object.freeze([
  ['bad_pass','Foute pass'],['duel_lost','Duel'],['poor_control','Controle'],
  ['dribble','Dribbel'],['interception','Onderschept'],['other','Overig']
]);
const GOAL_TYPES=Object.freeze([
  ['open_play','Open spel'],['counter','Counter'],['set_piece','Standaardsituatie'],
  ['corner','Corner'],['free_kick','Vrije trap'],['penalty','Penalty'],
  ['own_goal','Eigen doelpunt'],['other','Overig']
]);

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function getStored(key,fallback){try{return global.localStorage?.getItem(key)||fallback}catch{return fallback}}
function setStored(key,value){try{global.localStorage?.setItem(key,value)}catch{}}
function getMode(){return getStored(MODE_KEY,'coach')}
function setMode(v){setStored(MODE_KEY,v)}
function getQuickOrder(){const value=getStored(QUICK_ORDER_KEY,'category');return value==='alpha'?'alpha':'category'}
function setQuickOrder(v){setStored(QUICK_ORDER_KEY,v)}

function createPlayerActionUi(options={}){
  const doc=options.document||global.document;
  const controller=options.controller;
  const runtime=options.runtime;
  const run=options.run||((_,fn)=>fn());
  if(!doc||!controller)throw new Error('Document en speleractie-controller zijn verplicht');

  let sheet=null,currentPlayerId=null,posBar=null,timer=null,lastStructureKey='';
  let mode=getMode(),quickOrder=getQuickOrder(),quickSide='for',quickPlayerId='';

  function ensureStyles(){
    if(doc.getElementById('v08PlayerActionStyles'))return;
    const s=doc.createElement('style');
    s.id='v08PlayerActionStyles';
    s.textContent=`
.paOverlay{position:fixed;inset:0;background:rgba(30,18,43,.35);z-index:9997;display:flex;align-items:flex-end;justify-content:center}
.paSheet{width:min(720px,100%);max-height:82vh;overflow:auto;background:#fff;border-radius:18px 18px 0 0;padding:14px;box-shadow:0 -8px 28px rgba(40,20,60,.22)}
.paHead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.paClose{border:0;background:#f1e9f8;color:#4b2672;border-radius:999px;padding:7px 10px;font-weight:900}
.paGroup{margin-top:10px}.paGroup>b{display:block;color:#4b2672;font-size:11px;margin-bottom:5px}.paButtons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.paAction{border:1px solid #7e5ca4;background:#faf7fd;color:#4b2672;border-radius:10px;padding:9px 7px;font-weight:800;cursor:pointer}.paPossession{border:2px solid #1976d2;background:#eef7ff;color:#125a9e}
.paHint{margin-top:7px;padding:7px 9px;border-radius:9px;background:#f7f4fa;color:#6b5877;font-size:10px}
.posBar{margin-top:9px;padding:10px 11px;border:1px solid #b8d8f5;border-radius:11px;background:#f4faff}
.posHead{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}.posClock{font-variant-numeric:tabular-nums;font-weight:900;color:#125a9e}
.teamFlow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:8px 0}.teamFlow button{padding:10px 8px!important}.teamFor.active{background:#237a43!important;color:#fff!important}.teamAgainst.active{background:#983263!important;color:#fff!important}.stopAll.active{background:#5c2b75!important;color:#fff!important}
.flowGrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin-top:7px}.flowPlayer{background:#fff!important;color:#4b2672!important;border:1px solid #8d6dac!important;padding:6px 4px!important;font-size:10px!important}.flowPlayer.active{background:#1976d2!important;color:#fff!important;border-color:#1976d2!important}
.lossGrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin-top:7px}.lossBtn{background:#fff!important;color:#983263!important;border:1px solid #b95078!important;padding:6px 4px!important;font-size:9px!important}
.modeBtn,.quickModeBtn{background:#fff!important;color:#125a9e!important;border:1px solid #1976d2!important}.modeBtn.on,.quickModeBtn.on{background:#1976d2!important;color:#fff!important}
.quickReg{margin-top:10px;padding-top:10px;border-top:1px solid #cfe1f1}.quickRegHead{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}.quickOrder{display:flex;gap:5px}.quickOrder button{padding:5px 8px!important;font-size:10px!important}
.quickScope{display:grid;grid-template-columns:auto auto minmax(180px,1fr);gap:6px;margin:7px 0}.quickScope button{padding:7px 9px!important}.quickScope .active{background:#4b2672!important;color:#fff!important}
.quickGroups{display:grid;gap:7px}.quickGroup{border:1px solid #d8c4ef;border-radius:10px;padding:7px;background:#fff}.quickGroup>b{display:block;font-size:10px;color:#4b2672;margin-bottom:5px}
.quickButtons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.quickAction{border:1px solid #8d6dac!important;background:#faf7fd!important;color:#4b2672!important;padding:7px 5px!important;font-size:10px!important;font-weight:800!important}
.quickAction.goal{background:#eaf7ee!important;color:#1f6638!important;border-color:#79bd8d!important}
.quickAlpha{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.paGoal{border:2px solid #9ed5ad;background:#eef9f1;border-radius:11px;padding:9px}.paGoalGrid{display:grid;grid-template-columns:1fr 1fr auto;gap:6px;align-items:end}.paGoalBtn{background:#237a43!important;color:#fff!important;border:0!important;padding:10px!important}
@media(max-width:650px){.flowGrid,.lossGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.paButtons{grid-template-columns:repeat(2,minmax(0,1fr))}.paSheet{max-height:88vh}.paGoalGrid{grid-template-columns:1fr}.teamFlow{grid-template-columns:1fr 1fr}.teamFlow button:last-child{grid-column:1/-1}.quickScope{grid-template-columns:1fr 1fr}.quickScope select{grid-column:1/-1}.quickButtons,.quickAlpha{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:430px){.quickButtons,.quickAlpha{grid-template-columns:repeat(2,minmax(0,1fr))}
}`;
    doc.head.appendChild(s);
  }

  function player(){return (controller.snapshot?.players||[]).find(p=>p.player_id===currentPlayerId)||null}
  function playerName(p){return p?`#${p.shirt_number??'—'} ${p.display_name||p.full_name||p.player_id}`:'Speler'}
  function fieldPlayers(){return (controller.snapshot?.players||[]).filter(p=>p.selected&&p.is_on_field)}
  function currentClockSecond(){const raw=doc.getElementById('v08Clock')?.textContent||'0:00',parts=raw.split(':').map(Number);return Math.max(0,(parts[0]||0)*60+(parts[1]||0))}
  function fmt(seconds){const s=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
  function updatePossessionClocks(active=controller.currentPossession?.(),team=controller.currentTeamPossession?.(),now=currentClockSecond()){
    if(!posBar?.isConnected)return;
    const playerElapsed=active?Math.max(0,now-Number(active.startedSecond||0)):0,teamElapsed=team?Math.max(0,now-Number(team.startedSecond||0)):0;
    const own=posBar.querySelector('#v08TeamForClock'),against=posBar.querySelector('#v08TeamAgainstClock'),playerClock=posBar.querySelector('#v08PlayerPossessionClock');
    if(own)own.textContent=team?.side==='for'?` · ${fmt(teamElapsed)}`:'';
    if(against)against.textContent=team?.side==='against'?` · ${fmt(teamElapsed)}`:'';
    if(playerClock)playerClock.textContent=active?fmt(playerElapsed):'';
  }
  function ensurePossessionBar(){if(posBar?.isConnected)return posBar;ensureStyles();const pitch=doc.getElementById('v08Pitch'),card=pitch?.closest('.card');if(!card)return null;posBar=doc.createElement('div');posBar.id='v08PossessionBar';posBar.className='posBar';card.appendChild(posBar);lastStructureKey='';renderPossessionBar(true);if(!timer)timer=setInterval(updatePossessionClocks,1000);return posBar}

  function actionFieldLabels(){return global.ClubMatchV08ActionField?.ACTION_LABELS||FIELD_LABEL_FALLBACK}
  function quickCatalog(){const labels=actionFieldLabels();return [{id:'goal',label:'Goal',group:'Aanval',special:true},...FIELD_QUICK.map(id=>({id,label:labels[id]||FIELD_LABEL_FALLBACK[id]||id,group:QUICK_GROUP[id]||'Overig'}))]}
  function quickActionsHtml(){
    const actions=quickCatalog();
    if(quickOrder==='alpha'){
      const sorted=actions.slice().sort((a,b)=>a.label.localeCompare(b.label,'nl'));
      return `<div class="quickAlpha">${sorted.map(a=>`<button type="button" class="quickAction ${a.special?'goal':''}" data-quick-action="${a.id}" data-v08-action>${a.special?'⚽ ':''}${esc(a.label)}</button>`).join('')}</div>`;
    }
    return `<div class="quickGroups">${GROUP_ORDER.map(group=>{const items=actions.filter(a=>a.group===group);if(!items.length)return '';return `<div class="quickGroup"><b>${esc(group)}</b><div class="quickButtons">${items.map(a=>`<button type="button" class="quickAction ${a.special?'goal':''}" data-quick-action="${a.id}" data-v08-action>${a.special?'⚽ ':''}${esc(a.label)}</button>`).join('')}</div></div>`}).join('')}</div>`;
  }
  function quickPlayerOptions(){const active=controller.currentPossession?.(),players=fieldPlayers();if(quickSide==='for'&&!quickPlayerId&&active?.playerId&&players.some(p=>p.player_id===active.playerId))quickPlayerId=active.playerId;if(quickPlayerId&&!players.some(p=>p.player_id===quickPlayerId))quickPlayerId='';return `<option value="">— teamactie / geen speler —</option>${players.map(p=>`<option value="${esc(p.player_id)}"${quickPlayerId===p.player_id?' selected':''}>#${esc(p.shirt_number??'—')} ${esc(p.display_name||p.full_name||'')}</option>`).join('')}`}
  function analystHtml(active){if(mode!=='analyst')return '';const players=fieldPlayers();return `<div class="paHint"><b>Analistmodus:</b> tik de volgende speler die de bal krijgt. A → B registreert automatisch geslaagde pass A + ontvangen pass B + spelerbezit B + ons teambezit.</div><div class="flowGrid">${players.map(p=>`<button type="button" class="flowPlayer ${active?.playerId===p.player_id?'active':''}" data-flow-player="${esc(p.player_id)}" data-v08-action>#${esc(p.shirt_number??'—')} ${esc(p.display_name||p.full_name||'')}</button>`).join('')}</div>${active?`<div class="lossGrid">${LOSS_LABELS.map(([id,label])=>`<button type="button" class="lossBtn" data-loss-cause="${id}" data-v08-action>${esc(label)}</button>`).join('')}</div>`:''}`}

  async function switchMode(){if(mode==='analyst'){const active=controller.currentPossession?.();if(active)await controller.stopPossession();mode='coach'}else mode='analyst';setMode(mode);renderPossessionBar(true)}

  async function recordQuick(action){
    if(action==='goal')return openQuickGoal();
    const playerId=quickSide==='for'?(quickPlayerId||null):null;
    if(mode==='analyst'&&quickSide==='for'&&playerId&&ANALYST_QUICK.has(action)&&typeof controller.analystRecord==='function'){
      if(action==='ball_loss'&&typeof controller.analystLoseBall==='function')await controller.analystLoseBall(playerId,'unknown','Snelle registratie');
      else await controller.analystRecord(playerId,action,'Snelle registratie');
    }else{
      if(typeof controller.recordQuickAction!=='function')throw new Error('Snelle actie-controller is nog niet beschikbaar');
      await controller.recordQuickAction({side:quickSide,action,playerId,note:'Snelle registratie'});
    }
    renderPossessionBar(true);
  }

  function openQuickGoal(){
    if(quickSide==='against'){
      const btn=doc.getElementById('goalAgainstBtn');
      if(!btn)throw new Error('Doelpuntregistratie tegenstander ontbreekt');
      btn.scrollIntoView?.({behavior:'smooth',block:'center'});btn.focus?.();return;
    }
    if(quickPlayerId){open(quickPlayerId);return}
    const scorer=doc.getElementById('goalScorer');
    if(!scorer)throw new Error('Kies eerst een speler voor het doelpunt');
    scorer.scrollIntoView?.({behavior:'smooth',block:'center'});scorer.focus?.();
  }

  function bindQuickControls(){
    posBar.querySelectorAll('[data-quick-order]').forEach(btn=>btn.onclick=()=>{quickOrder=btn.dataset.quickOrder==='alpha'?'alpha':'category';setQuickOrder(quickOrder);renderPossessionBar(true)});
    posBar.querySelectorAll('[data-quick-side]').forEach(btn=>btn.onclick=()=>{quickSide=btn.dataset.quickSide==='against'?'against':'for';if(quickSide==='against')quickPlayerId='';renderPossessionBar(true)});
    const select=posBar.querySelector('#v08QuickPlayer');if(select)select.onchange=()=>{quickPlayerId=select.value||''};
    posBar.querySelectorAll('[data-quick-action]').forEach(btn=>btn.onclick=()=>run(`Snelle actie · ${btn.textContent.trim()}`,()=>recordQuick(btn.dataset.quickAction)));
  }

  function renderPossessionBar(force=false){
    if(!posBar?.isConnected)return;
    const active=controller.currentPossession?.(),team=controller.currentTeamPossession?.(),now=currentClockSecond(),quickOptions=quickPlayerOptions(),players=fieldPlayers();
    const anything=!!active||!!team,canQuick=controller.snapshot?.match?.status==='live'&&controller.snapshot?.state?.clock_status==='running';
    const playerSig=players.map(p=>`${p.player_id}:${p.shirt_number??''}:${p.display_name||p.full_name||''}`).join('|');
    const structureKey=[mode,quickOrder,quickSide,quickPlayerId,active?.playerId||'',team?.side||'',canQuick?'1':'0',playerSig].join('~');
    if(!force&&structureKey===lastStructureKey){updatePossessionClocks(active,team,now);return}
    lastStructureKey=structureKey;
    posBar.innerHTML=`<div class="posHead"><div><b>⚡ Snelle registratie</b><div class="muted">Dezelfde actietypen als Actieveld, maar zonder locatie. Kies categorieën of A–Z; jouw voorkeur wordt onthouden.</div></div><button type="button" id="v08AnalystMode" class="modeBtn ${mode==='analyst'?'on':''}" data-v08-action>${mode==='analyst'?'Analistmodus aan':'Analistmodus'}</button></div><div class="teamFlow"><button type="button" class="teamFor ${team?.side==='for'?'active':''}" data-team-possession="for" data-v08-action>🟢 Ons bezit<span id="v08TeamForClock"></span></button><button type="button" class="teamAgainst ${team?.side==='against'?'active':''}" data-team-possession="against" data-v08-action>🔴 Tegenstander<span id="v08TeamAgainstClock"></span></button><button type="button" class="secondary stopAll ${anything?'active':''}" id="v08StopAllPossession" data-v08-action ${anything?'':'disabled'}>■ Alles bezit stoppen</button></div><div class="posHead"><div><b>Spelerbezit</b><div class="muted">${active?esc(`#${active.shirtNumber??'—'} ${active.name}`):'Geen actieve spelerbezitter'}</div></div>${active?'<span class="posClock" id="v08PlayerPossessionClock"></span>':''}</div>${analystHtml(active)}<div class="quickReg"><div class="quickRegHead"><div><b>Acties</b><div class="muted">Goal opent de doelpuntdetails; overige acties worden direct bevestigd in Cloud.</div></div><div class="quickOrder"><button type="button" class="quickModeBtn ${quickOrder==='category'?'on':''}" data-quick-order="category">Categorieën</button><button type="button" class="quickModeBtn ${quickOrder==='alpha'?'on':''}" data-quick-order="alpha">A–Z</button></div></div><div class="quickScope"><button type="button" class="${quickSide==='for'?'active':'secondary'}" data-quick-side="for">Ons team</button><button type="button" class="${quickSide==='against'?'active':'secondary'}" data-quick-side="against">Tegenstander</button><select id="v08QuickPlayer" ${quickSide==='against'?'disabled':''}>${quickOptions}</select></div><div ${canQuick?'':'style="opacity:.55;pointer-events:none"'}>${quickActionsHtml()}</div></div>`;
    posBar.querySelector('#v08AnalystMode').onclick=()=>run(mode==='analyst'?'Analistmodus afsluiten':'Analistmodus starten',switchMode);
    posBar.querySelectorAll('[data-team-possession]').forEach(btn=>btn.onclick=()=>run('Team-balbezit',async()=>{await controller.startTeamPossession(btn.dataset.teamPossession);renderPossessionBar(true)}));
    const stop=posBar.querySelector('#v08StopAllPossession');if(stop)stop.onclick=()=>run('Alle balbezit stoppen',async()=>{await controller.stopAllPossession();renderPossessionBar(true)});
    posBar.querySelectorAll('[data-flow-player]').forEach(btn=>btn.onclick=()=>run('Analist balstroom',async()=>{if(typeof controller.analystReceiveBall==='function')await controller.analystReceiveBall(btn.dataset.flowPlayer);else await controller.receiveBall(btn.dataset.flowPlayer);renderPossessionBar(true)}));
    posBar.querySelectorAll('[data-loss-cause]').forEach(btn=>btn.onclick=()=>run('Analist balverlies',async()=>{const a=controller.currentPossession?.();if(!a)throw new Error('Geen actieve balbezitter');if(typeof controller.analystLoseBall==='function')await controller.analystLoseBall(a.playerId,btn.dataset.lossCause);else await controller.loseBall(a.playerId,btn.dataset.lossCause);renderPossessionBar(true)}));
    bindQuickControls();updatePossessionClocks(active,team,now);
  }

  function close(){currentPlayerId=null;if(sheet){sheet.remove();sheet=null}}
  function assistOptions(scorerId){return '<option value="">— geen / onbekend —</option>'+fieldPlayers().filter(p=>p.player_id!==scorerId).map(p=>`<option value="${esc(p.player_id)}">#${esc(p.shirt_number??'—')} ${esc(p.display_name||p.full_name||'')}</option>`).join('')}
  function goalTypeOptions(){return GOAL_TYPES.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}
  async function recordSheetAction(action,note){if(mode==='analyst'&&typeof controller.analystRecord==='function'){if(action==='ball_loss'&&typeof controller.analystLoseBall==='function')return controller.analystLoseBall(currentPlayerId,'unknown',note);if(action==='bad_pass'&&typeof controller.analystLoseBall==='function')return controller.analystLoseBall(currentPlayerId,'bad_pass',note);return controller.analystRecord(currentPlayerId,action,note,{cause:action==='bad_pass'?'bad_pass':null})}if(action==='ball_loss'||action==='bad_pass')return controller.loseBall(currentPlayerId,action==='bad_pass'?'bad_pass':'unknown',note);return controller.record(currentPlayerId,action,note)}

  function open(playerId){
    currentPlayerId=playerId;const p=player();if(!p)return;close();currentPlayerId=playerId;ensureStyles();sheet=doc.createElement('div');sheet.className='paOverlay';const groups=[...new Set(ACTIONS.map(a=>a.group))],active=controller.currentPossession?.();
    sheet.innerHTML=`<div class="paSheet" role="dialog" aria-modal="true"><div class="paHead"><div><h2 style="margin:0">⚡ Snelle speleractie</h2><div class="muted">${esc(playerName(p))} · ${p.is_on_field?'VELD':'BANK'} · ${mode==='analyst'?'analist':'coach'}</div></div><button type="button" class="paClose">Sluiten</button></div>${p.is_on_field&&runtime?.recordGoal?`<div class="paGroup paGoal"><b>⚽ Doelpunt gemaakt</b><div class="paGoalGrid"><label>Type<select id="paGoalType">${goalTypeOptions()}</select></label><label>Assist<select id="paGoalAssist">${assistOptions(p.player_id)}</select></label><button type="button" id="paGoalBtn" class="paGoalBtn" data-v08-action>Doelpunt opslaan</button></div></div>`:''}${p.is_on_field?`<div class="paGroup"><b>Spelerbezit</b><div class="paButtons"><button type="button" class="paAction paPossession" data-possession-start>${active?.playerId===p.player_id?'✓ Bezit loopt':'▶ Bezit starten'}</button>${active?'<button type="button" class="paAction" data-possession-stop>Spelerbezit stoppen</button>':''}</div></div>`:''}${groups.map(group=>`<div class="paGroup"><b>${esc(group)}</b><div class="paButtons">${ACTIONS.filter(a=>a.group===group).map(a=>`<button type="button" class="paAction" data-pa-action="${a.id}"${!p.is_on_field&&a.id!=='injury'?' disabled':''}>${esc(a.label)}</button>`).join('')}</div></div>`).join('')}<label style="display:block;margin-top:10px">Notitie (optioneel)<input id="paNote" placeholder="Bijv. context of blessure"></label><div class="paHint">${mode==='analyst'?'<b>Analistmodus:</b> ClubMatch voegt alleen logisch zekere afleidingen automatisch toe.':'<b>Coachmodus:</b> registreert alleen de gekozen actie.'}</div></div>`;
    doc.body.appendChild(sheet);sheet.querySelector('.paClose').onclick=close;sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
    sheet.querySelector('#paGoalBtn')?.addEventListener('click',()=>run('Doelpunt opslaan',async()=>{await runtime.recordGoal({side:'for',scorerId:currentPlayerId,assistId:sheet?.querySelector('#paGoalAssist')?.value||null,goalType:sheet?.querySelector('#paGoalType')?.value||null,note:sheet?.querySelector('#paNote')?.value||null});close();renderPossessionBar(true)}));
    sheet.querySelector('[data-possession-start]')?.addEventListener('click',()=>run('Spelerbezit starten',async()=>{await controller.startPossession(currentPlayerId);close();renderPossessionBar(true)}));
    sheet.querySelector('[data-possession-stop]')?.addEventListener('click',()=>run('Spelerbezit stoppen',async()=>{await controller.stopPossession();close();renderPossessionBar(true)}));
    sheet.querySelectorAll('[data-pa-action]').forEach(btn=>btn.addEventListener('click',()=>run('Speleractie opslaan',async()=>{const note=sheet?.querySelector('#paNote')?.value||'';await recordSheetAction(btn.dataset.paAction,note);close();renderPossessionBar(true)})));
    return sheet;
  }

  function install(){ensureStyles();doc.addEventListener('click',event=>{const button=event.target.closest?.('[data-player-action-open]');if(!button)return;event.preventDefault();event.stopPropagation();const id=button.dataset.playerId||button.closest?.('[data-player-id]')?.dataset.playerId;if(id)open(id)});setTimeout(ensurePossessionBar,0);return true}
  function refresh(){ensurePossessionBar();renderPossessionBar(true)}
  return Object.freeze({install,open,close,refresh,get visible(){return !!sheet},get mode(){return mode},get quickOrder(){return quickOrder}})
}

global.ClubMatchV08PlayerActionUi={ACTIONS,FIELD_QUICK,LOSS_LABELS,GOAL_TYPES,createPlayerActionUi};
})(typeof window!=='undefined'?window:globalThis);
