/* ClubMatch Cloud v0.8 - touch-first analyst live field + proximity smart input */
(function(global){
'use strict';
const doc=global.document;
const SUPABASE_URL='https://fnbqyogbamufytcabfzm.supabase.co';
const SUPABASE_KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const MODE_KEY='clubmatch.v08.action.mode';
const GOAL_TYPES=Object.freeze([
 ['open_play','Open spel'],['header','Kopbal'],['volley','Volley'],['tap_in','Intikker'],['long_shot','Afstandsschot'],['one_on_one','1-op-1'],['counter','Counter'],['corner','Corner'],['direct_free_kick','Directe vrije trap'],['penalty','Penalty'],['own_goal','Eigen doelpunt'],['other','Overig']
]);
const OPP_FORMATION='4-3-3';
const state={runtime:null,client:null,actions:null,snapshot:null,panel:null,status:null,pitch:null,ownLayer:null,oppLayer:null,ball:null,context:null,goal:null,side:'for',ballPoint:{x:50,y:50},lastOwn:null,prevOwn:null,lastOpp:null,prevOpp:null,pending:0,queue:Promise.resolve(),renderQueued:false};
function id(){return global.crypto?.randomUUID?.()||`laf-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function analystOn(){try{return global.localStorage?.getItem(MODE_KEY)==='analyst'}catch{return !!doc?.getElementById?.('v08AnalystMode')?.classList.contains('on')}}
function fieldPlayers(){return (state.snapshot?.players||[]).filter(p=>p.selected&&p.is_on_field)}
function playerLabel(p){return p?`#${p.shirt_number??'—'} ${p.display_name||p.full_name||p.player_id}`:'—'}
function formation(){return state.snapshot?.match?.formation_code||'4-3-3'}
function geometry(){return global.ClubMatchV08PitchLayout?.geometry?.(formation())||{slots:[]}}
function ownPoint(player){const position=player?.current_position||player?.starting_position||'',slot=geometry().slots.find(s=>s.position===position);return slot?{x:slot.x,y:slot.y}:null}
function opponentPoints(){const geom=global.ClubMatchV08PitchLayout?.geometry?.(OPP_FORMATION)||{slots:[]};return geom.slots.map((s,index)=>({id:`T${index+1}`,label:`T${index+1}`,x:s.x,y:100-s.y,position:s.position}))}
function distance(a,b){return Math.hypot(Number(a?.x||0)-Number(b?.x||0),Number(a?.y||0)-Number(b?.y||0))}
function recent(touch,ms=20000){return !!touch&&Date.now()-Number(touch.at||0)<=ms}
function currentSide(){const team=state.actions?.currentTeamPossession?.(),active=state.actions?.currentPossession?.();if(team?.side)return team.side;if(active?.playerId)return 'for';return state.side}
function nearestOwn(point,limit=4){return fieldPlayers().map(p=>({player:p,point:ownPoint(p)})).filter(x=>x.point).sort((a,b)=>distance(a.point,point)-distance(b.point,point)).slice(0,limit)}
function likelyCross(from,to,side){if(!from?.point||!to?.point)return false;const wide=from.point.x<=27||from.point.x>=73;if(!wide)return false;return side==='against'?(to.point.y>=72&&to.point.y>from.point.y):(to.point.y<=28&&to.point.y<from.point.y)}
function setLocalStatus(text,tone='normal'){if(!state.status)return;state.status.textContent=String(text||'');state.status.className=`lafStatus ${tone}`}
function setBall(point){if(!point)return;state.ballPoint={x:Math.max(0,Math.min(100,Number(point.x)||0)),y:Math.max(0,Math.min(100,Number(point.y)||0))};if(state.ball){state.ball.style.left=`${state.ballPoint.x}%`;state.ball.style.top=`${state.ballPoint.y}%`}}
function enqueue(label,fn){
 state.pending++;setLocalStatus(`${label} · ${state.pending} actie${state.pending===1?'':'s'} in verwerking`,'busy');
 const work=state.queue.then(fn,fn);state.queue=work.catch(()=>{});
 return work.then(result=>{setLocalStatus(`${label} ✓`,'ok');return result}).catch(error=>{console.error(error);setLocalStatus(`${label} mislukt: ${error.message||error}`,'bad');throw error}).finally(()=>{state.pending=Math.max(0,state.pending-1);if(state.pending)setLocalStatus(`${state.pending} actie${state.pending===1?'':'s'} in wachtrij`,'busy')});
}
function client(){if(state.client)return state.client;const api=global.ClubMatchV08CloudClient;if(!api?.createClient)throw new Error('Cloud-client ontbreekt');state.client=api.createClient(SUPABASE_URL,SUPABASE_KEY);return state.client}
async function recordSpatial(action,input={}){
 if(!state.runtime?.activeMatchId)throw new Error('Open eerst een live wedstrijd');const c=client(),side=input.side==='against'?'against':'for',start=input.start||state.ballPoint,end=input.end||start;
 const result=await c.rpc('record_action_field_event_v08',{p_match_id:state.runtime.activeMatchId,p_side:side,p_action:action,p_player_id:side==='for'?(input.playerId||null):null,p_start_x:start?.x??null,p_start_y:start?.y??null,p_end_x:end?.x??null,p_end_y:end?.y??null,p_note:input.note||null,p_client_event_id:id()});
 if(result?.error)throw result.error;return result?.data;
}
async function refresh(reason){return state.runtime?.refresh?.(reason||'live-actieveld')}
function ensureController(runtime){
 state.runtime=runtime||state.runtime;if(!state.runtime)return null;
 if(!state.actions){state.actions=global.ClubMatchV08PlayerActions?.createPlayerActionController?.({client:client(),runtime:state.runtime})||null;if(state.snapshot)state.actions?.setSnapshot?.(state.snapshot)}
 return state.actions;
}
function ensureStyles(){if(doc?.getElementById?.('v08AnalystLiveInputStyles'))return;const s=doc.createElement('style');s.id='v08AnalystLiveInputStyles';s.textContent=`
#v08PossessionBar .quickAction{min-height:58px!important;padding:12px 8px!important;font-size:12px!important;line-height:1.15;touch-action:manipulation}#v08PossessionBar .quickAction.goal{min-height:64px!important;font-size:14px!important}#v08PossessionBar .flowPlayer{min-height:56px!important;padding:10px 6px!important;font-size:11px!important;touch-action:manipulation}#v08PossessionBar .flowPlayer.lafNear{border-width:3px!important;box-shadow:0 2px 8px rgba(25,118,210,.16)}#v08PossessionBar .lossBtn{min-height:50px!important;font-size:11px!important;touch-action:manipulation}#v08PossessionBar .quickButtons,#v08PossessionBar .quickAlpha{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}#v08PossessionBar .flowGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
.lafCard{border:2px solid #c9afe3}.lafHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.lafLayout{display:grid;grid-template-columns:minmax(0,1fr) 160px;gap:10px}.lafPitch{position:relative;height:560px;border:4px solid #fff;border-radius:16px;background:linear-gradient(90deg,#3f8b58,#4a9962);overflow:hidden;touch-action:manipulation;user-select:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)}.lafLine{position:absolute;pointer-events:none;border:2px solid rgba(255,255,255,.9)}.lafHalf{left:0;right:0;top:50%;border-width:2px 0 0}.lafCircle{width:108px;height:108px;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)}.lafBoxTop,.lafBoxBottom{width:58%;height:18%;left:21%}.lafBoxTop{top:-2px}.lafBoxBottom{bottom:-2px}.lafDir{position:absolute;top:5px;left:50%;transform:translateX(-50%);color:#fff;font-size:10px;font-weight:900;text-shadow:0 1px 2px #244b31}.lafOwn,.lafOpp{position:absolute;transform:translate(-50%,-50%);min-width:48px;width:48px;height:48px;border-radius:50%;z-index:3;font-weight:900;display:flex;align-items:center;justify-content:center;touch-action:manipulation}.lafOwn{background:#fff;color:#4b2672;border:3px solid #6f42c1}.lafOwn.active{outline:5px solid #f3c44f}.lafOpp{background:#4b252d;color:#fff;border:3px solid #f4c0c0}.lafOpp.active{outline:5px solid #ff8b8b}.lafBall{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;background:#fff;border:4px solid #111;z-index:6;pointer-events:none}.lafRail{display:grid;align-content:start;gap:8px}.lafRail button,.lafContext button,.lafGoalTypes button{min-height:58px;border:0;border-radius:12px;padding:9px 7px;font-weight:900;background:#6f42c1;color:#fff;touch-action:manipulation}.lafRail .danger{background:#983263}.lafRail .green{background:#237a43}.lafContext,.lafGoal{margin-top:9px;padding:10px;border:2px solid #d8c4ef;border-radius:12px;background:#fcfaff}.lafContextGrid,.lafGoalTypes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}.lafContext button.secondary,.lafGoal button.secondary{background:#eadff5;color:#4b2672}.lafStatus{margin-top:8px;padding:8px;border-radius:9px;background:#f7f4fa;font-size:11px}.lafStatus.ok{background:#eaf7ee;color:#1f6638}.lafStatus.bad{background:#fff1f1;color:#8b1f1f}.lafStatus.busy{background:#eef7ff;color:#125a9e}.lafLegend{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0;font-size:10px;color:#6b5877}.lafGoalOptions{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}.lafGoalOptions label{display:flex;gap:5px;align-items:center;font-size:11px}.lafGoalOptions input{width:auto}
@media(pointer:coarse){#v08PossessionBar .quickAction,#v08PossessionBar .flowPlayer,.lafRail button,.lafContext button,.lafGoalTypes button{min-height:64px!important;font-size:13px!important}.lafOwn,.lafOpp{width:54px;height:54px;min-width:54px}}
@media(max-width:820px){.lafLayout{grid-template-columns:minmax(0,1fr) 145px}.lafPitch{height:520px}.lafContextGrid,.lafGoalTypes{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.lafLayout{grid-template-columns:1fr}.lafRail{grid-template-columns:repeat(3,minmax(0,1fr))}.lafPitch{height:480px}#v08PossessionBar .quickButtons,#v08PossessionBar .quickAlpha,#v08PossessionBar .flowGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
`;doc.head.appendChild(s)}
function panelHtml(){return `<div class="lafHead"><div><h2 style="margin-bottom:3px">Live Actieveld <span class="badge">ANALIST</span></h2><div class="muted">Tik spelers in de balvolgorde. Eigen A → eigen B = pass/ontvangst/bezit. Tegenstander → eigen speler = balverovering. Veldtik = locatieactie.</div></div><span class="badge">touch-first</span></div><div class="lafLegend"><span>⚪ eigen speler</span><span>🔴 tegenstander</span><span>⚽ actuele ballocatie</span><span>⭐ dichtstbijzijnde afspeelopties staan bovenaan bij Snelle registratie</span></div><div class="lafLayout"><div id="lafPitch" class="lafPitch"><i class="lafLine lafHalf"></i><i class="lafLine lafCircle"></i><i class="lafLine lafBoxTop"></i><i class="lafLine lafBoxBottom"></i><div class="lafDir">↑ ONS AANVALSDOEL</div><div id="lafOwnLayer"></div><div id="lafOppLayer"></div><div id="lafBall" class="lafBall"></div></div><aside class="lafRail"><button data-laf-action="goal_for" class="green">⚽ Goal ons</button><button data-laf-action="goal_against" class="danger">⚽ Goal tegen</button><button data-laf-action="shot_on_target">🎯 Schot op doel</button><button data-laf-action="shot">Schot</button><button data-laf-action="cross">Voorzet</button><button data-laf-action="ball_recovery" class="green">Bal veroverd</button><button data-laf-action="ball_loss" class="danger">Balverlies</button><button data-laf-action="free_kick">Vrije trap</button><button data-laf-action="corner">Corner</button><button data-laf-action="throw_in">Ingooi</button><button data-laf-action="offside">Buitenspel</button></aside></div><div id="lafContext" class="lafContext hidden"></div><div id="lafGoal" class="lafGoal hidden"></div><div id="lafStatus" class="lafStatus">Actieveld wacht op analistmodus en een lopende wedstrijd.</div>`}
function ensurePanel(){
 if(state.panel?.isConnected)return state.panel;ensureStyles();const liveCard=doc?.getElementById?.('v08Pitch')?.closest?.('.card');if(!liveCard)return null;const panel=doc.createElement('section');panel.id='v08LiveActionField';panel.className='card lafCard hidden';panel.innerHTML=panelHtml();liveCard.after(panel);state.panel=panel;state.pitch=panel.querySelector('#lafPitch');state.ownLayer=panel.querySelector('#lafOwnLayer');state.oppLayer=panel.querySelector('#lafOppLayer');state.ball=panel.querySelector('#lafBall');state.context=panel.querySelector('#lafContext');state.goal=panel.querySelector('#lafGoal');state.status=panel.querySelector('#lafStatus');setBall(state.ballPoint);bindPanel();return panel;
}
function renderPlayers(){
 if(!state.ownLayer||!state.oppLayer)return;const active=state.actions?.currentPossession?.();state.ownLayer.replaceChildren();
 fieldPlayers().forEach(p=>{const point=ownPoint(p);if(!point)return;const b=doc.createElement('button');b.type='button';b.className=`lafOwn ${active?.playerId===p.player_id?'active':''}`;b.style.left=`${point.x}%`;b.style.top=`${point.y}%`;b.dataset.playerId=p.player_id;b.textContent=String(p.shirt_number??'—');b.title=`${playerLabel(p)} · ${p.current_position||p.starting_position||''}`;b.onclick=e=>{e.stopPropagation();enqueue(`Bal naar ${playerLabel(p)}`,()=>touchOwn(p,point)).catch(()=>{})};state.ownLayer.appendChild(b)});
 const opp=opponentPoints();state.oppLayer.replaceChildren();opp.forEach(o=>{const b=doc.createElement('button');b.type='button';b.className=`lafOpp ${state.lastOpp?.id===o.id&&currentSide()==='against'?'active':''}`;b.style.left=`${o.x}%`;b.style.top=`${o.y}%`;b.dataset.oppId=o.id;b.textContent=o.label;b.title=`Tegenstander ${o.label}`;b.onclick=e=>{e.stopPropagation();enqueue(`Tegenstander ${o.label}`,()=>touchOpponent(o)).catch(()=>{})};state.oppLayer.appendChild(b)})
}
function enhanceQuickPlayers(){
 const bar=doc?.getElementById?.('v08PossessionBar');if(!bar||!state.actions)return;const active=state.actions.currentPossession?.(),buttons=[...bar.querySelectorAll('[data-flow-player]')];buttons.forEach(b=>b.classList.remove('lafNear'));if(!active?.playerId||!buttons.length)return;const originPlayer=fieldPlayers().find(p=>p.player_id===active.playerId),origin=ownPoint(originPlayer);if(!origin)return;const ranked=buttons.map(btn=>{const p=fieldPlayers().find(x=>x.player_id===btn.dataset.flowPlayer),point=ownPoint(p);return {btn,point,d:point?distance(origin,point):999}}).sort((a,b)=>a.d-b.d);const parent=buttons[0].parentElement;ranked.forEach((item,index)=>{if(index<4)item.btn.classList.add('lafNear');item.btn.title=index<4?`Dichtbij · veldafstand ${Math.round(item.d)}`:`Veldafstand ${Math.round(item.d)}`;parent?.appendChild(item.btn)})
}
function render(){
 const panel=ensurePanel();if(!panel)return;const live=state.snapshot?.match?.status==='live',clock=state.snapshot?.state?.clock_status==='running',on=analystOn();panel.classList.toggle('hidden',!(live&&on));if(live&&on){renderPlayers();enhanceQuickPlayers();setBall(state.ballPoint);if(!clock)setLocalStatus('Wedstrijdklok staat stil · acties tijdelijk geblokkeerd.','busy')}return panel;
}
function scheduleRender(){if(state.renderQueued)return;state.renderQueued=true;(global.requestAnimationFrame||global.setTimeout)(()=>{state.renderQueued=false;render()},0)}
async function touchOwn(player,point){
 const actions=ensureController(state.runtime);if(!actions)throw new Error('Analist-controller ontbreekt');const wasAgainst=currentSide()==='against',previous=!wasAgainst&&recent(state.lastOwn)?state.lastOwn:null;
 if(wasAgainst)await actions.analystRecord(player.player_id,'ball_recovery','Live Actieveld · bal veroverd');else await actions.analystReceiveBall(player.player_id);
 state.side='for';state.prevOwn=previous;state.lastOwn={id:player.player_id,label:playerLabel(player),point,at:Date.now()};state.lastOpp=wasAgainst?state.lastOpp:null;setBall(point);
 if(previous&&previous.id!==player.player_id&&likelyCross(previous,state.lastOwn,'for')){await recordSpatial('cross',{side:'for',playerId:previous.id,start:previous.point,end:point,note:`Ruimtelijk herkende voorzet ${previous.label} → ${state.lastOwn.label}`});await refresh('actieveld-voorzet')}
 scheduleRender();return true;
}
async function touchOpponent(opponent){
 const actions=ensureController(state.runtime);if(!actions)throw new Error('Analist-controller ontbreekt');const active=actions.currentPossession?.(),wasAgainst=currentSide()==='against',previous=wasAgainst&&recent(state.lastOpp)?state.lastOpp:null;
 if(active?.playerId)await actions.analystLoseBall(active.playerId,'other',`Live Actieveld · ${opponent.label} neemt bal over`);else if(!wasAgainst)await actions.startTeamPossession('against');
 state.side='against';state.prevOpp=previous;const current={id:opponent.id,label:opponent.label,point:{x:opponent.x,y:opponent.y},at:Date.now()};
 if(previous&&previous.id!==current.id){const action=likelyCross(previous,current,'against')?'cross':'pass';await recordSpatial(action,{side:'against',start:previous.point,end:current.point,note:`${previous.label} → ${current.label}${action==='cross'?' · voorzet':''}`})}
 await recordSpatial('possession_control',{side:'against',start:current.point,end:current.point,note:`${current.label} · balcontact`});state.lastOpp=current;setBall(current.point);await refresh('tegenstander-balcontact');scheduleRender();return true;
}
function fieldPoint(ev){const r=state.pitch.getBoundingClientRect();return {x:Math.max(0,Math.min(100,(ev.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(ev.clientY-r.top)/r.height*100))}}
function isSideline(p){return p.x<=8||p.x>=92}
function isGoalLine(p){return p.y<=7||p.y>=93}
function isPenaltyZone(p,side){return side==='against'?p.y>=82:p.y<=18}
function contextButton(label,action,data=''){return `<button type="button" data-context-action="${action}" ${data}>${esc(label)}</button>`}
function showContext(point){
 state.contextPoint=point;setBall(point);const side=currentSide(),near=nearestOwn(point,3),parts=[];
 parts.push(contextButton(side==='for'?'Vrije trap ons':'Vrije trap tegen','free_kick'));
 parts.push(contextButton(side==='for'?'Buitenspel ons':'Buitenspel tegenstander','offside'));
 if(isPenaltyZone(point,side))parts.push(contextButton(side==='for'?'Penalty ons':'Penalty tegen','penalty'));
 if(isGoalLine(point)){parts.push(contextButton('Corner ons','corner_for'));parts.push(contextButton('Corner tegen','corner_against'))}
 if(isSideline(point)){near.forEach(n=>parts.push(contextButton(`Ingooi ${playerLabel(n.player)}`,'throw_for',`data-player-id="${n.player.player_id}"`)));parts.push(contextButton('Ingooi tegenstander','throw_against'))}
 if(side==='against')near.forEach(n=>parts.push(contextButton(`Overtreding ${playerLabel(n.player)}`,'foul_by',`data-player-id="${n.player.player_id}"`)));
 else {const active=state.actions?.currentPossession?.();if(active?.playerId)parts.push(contextButton('Overtreding mee · huidige speler','foul_won'))}
 state.context.innerHTML=`<b>Actie op ${Math.round(point.x)},${Math.round(point.y)}</b><div class="muted">ClubMatch gebruikt balbezit en veldzone om de meest waarschijnlijke opties vooraan te zetten.</div><div class="lafContextGrid">${parts.join('')}<button type="button" class="secondary" data-context-action="close">Sluiten</button></div>`;state.context.classList.remove('hidden');state.context.querySelectorAll('[data-context-action]').forEach(btn=>btn.onclick=()=>{const action=btn.dataset.contextAction;if(action==='close'){state.context.classList.add('hidden');return}enqueue(btn.textContent.trim(),()=>handleContext(action,btn.dataset.playerId||null,point)).catch(()=>{})});
}
async function handleContext(action,playerId,point){const actions=ensureController(state.runtime),side=currentSide();
 if(action==='free_kick'){if(side==='for'){const active=actions.currentPossession?.();if(active?.playerId)await actions.analystRecord(active.playerId,'foul_won','Actieveld · vrije trap mee')}await recordSpatial('free_kick',{side,start:point,end:point,note:side==='for'?'Vrije trap ons':'Vrije trap tegen'});await refresh('vrije-trap')}
 else if(action==='foul_by'){await actions.analystRecord(playerId,'foul_committed','Actieveld · overtreding');await recordSpatial('free_kick',{side:'against',start:point,end:point,note:`Vrije trap tegen · overtreding ${playerId}`});await refresh('overtreding-tegen')}
 else if(action==='foul_won'){await actions.analystRecord(actions.currentPossession().playerId,'foul_won','Actieveld · overtreding mee');await recordSpatial('free_kick',{side:'for',start:point,end:point,note:'Vrije trap ons'});await refresh('overtreding-mee')}
 else if(action==='offside'){await recordSpatial('offside',{side,start:point,end:point,note:side==='for'?'Buitenspel ons':'Buitenspel tegenstander'});if(side==='for'){await actions.stopPossession();await actions.startTeamPossession('against');state.side='against'}else{await actions.startTeamPossession('for');state.side='for'}await refresh('buitenspel')}
 else if(action==='penalty'){await recordSpatial('penalty',{side,start:point,end:point,note:side==='for'?'Penalty toegekend aan ons':'Penalty toegekend aan tegenstander'});await refresh('penalty')}
 else if(action==='corner_for'||action==='corner_against'){const s=action==='corner_for'?'for':'against';await recordSpatial('corner',{side:s,start:point,end:point,note:s==='for'?'Corner ons':'Corner tegen'});await refresh('corner')}
 else if(action==='throw_for'||action==='throw_against'){const s=action==='throw_for'?'for':'against';await recordSpatial('throw_in',{side:s,playerId:s==='for'?playerId:null,start:point,end:point,note:s==='for'?`Ingooi ${playerId||''}`:'Ingooi tegenstander'});state.side=s;await actions.startTeamPossession(s);await refresh('ingooi')}
 state.context.classList.add('hidden');scheduleRender();return true}
function goalModal(side){
 const active=state.actions?.currentPossession?.(),own=side==='for',current=own?state.lastOwn:state.lastOpp,previous=own?state.prevOwn:state.prevOpp;
 if(own&&!active?.playerId){setLocalStatus('Kies eerst de speler die scoort.','bad');return}
 if(!own&&!current){setLocalStatus('Tik eerst de tegenstander die scoort.','bad');return}
 const assist=recent(previous)&&previous?.id!==current?.id?previous:null,cross=assist&&likelyCross(assist,current,side);
 state.goal.dataset.side=side;state.goal.dataset.scorerId=own?active.playerId:'';state.goal.dataset.assistId=own&&assist?assist.id:'';state.goal.innerHTML=`<b>${own?`Goal ${esc(current?.label||active?.name||'eigen team')}`:`Goal tegen · ${esc(current.label)}`}</b><div class="muted">Kies alleen het goaltype. Assist/voorzet zijn al voorgesteld uit de laatste balvolgorde en blijven aanpasbaar.</div><div class="lafGoalOptions">${assist?`<label><input id="lafAssistToggle" type="checkbox" checked> Assist ${esc(assist.label)}</label><label><input id="lafCrossToggle" type="checkbox" ${cross?'checked':''}> Vorige actie = voorzet</label>`:'<span class="muted">Geen recente assistkandidaat.</span>'}</div><div class="lafGoalTypes">${GOAL_TYPES.map(([value,label])=>`<button type="button" data-goal-type="${value}">${esc(label)}</button>`).join('')}<button type="button" class="secondary" data-goal-cancel>Annuleren</button></div>`;state.goal.classList.remove('hidden');state.goal.querySelector('[data-goal-cancel]').onclick=()=>state.goal.classList.add('hidden');state.goal.querySelectorAll('[data-goal-type]').forEach(btn=>btn.onclick=()=>enqueue(`Goal · ${btn.textContent.trim()}`,()=>saveGoal(side,btn.dataset.goalType,current,assist)).catch(()=>{}));
}
async function saveGoal(side,goalType,current,assist){
 const useAssist=!!state.goal.querySelector('#lafAssistToggle')?.checked,useCross=!!state.goal.querySelector('#lafCrossToggle')?.checked;
 if(useCross&&assist&&current){await recordSpatial('cross',{side,playerId:side==='for'?assist.id:null,start:assist.point,end:current.point,note:`Voorzet vóór goal · ${assist.label} → ${current.label}`});await refresh('voorzet-voor-goal')}
 if(side==='for')await state.runtime.recordGoal({side:'for',scorerId:state.goal.dataset.scorerId,assistId:useAssist?(state.goal.dataset.assistId||null):null,goalType,note:'Live Actieveld · analistmodus'});
 else await state.runtime.recordGoal({side:'against',goalType,note:`Live Actieveld · scorer ${current?.label||'onbekend'}${useAssist&&assist?` · assist ${assist.label}`:''}`});
 await state.actions?.stopAllPossession?.();state.goal.classList.add('hidden');state.side='for';scheduleRender();return true;
}
async function railAction(action){const actions=ensureController(state.runtime),side=currentSide(),point=state.ballPoint,active=actions.currentPossession?.();
 if(action==='goal_for'){goalModal('for');return true}if(action==='goal_against'){goalModal('against');return true}
 if(action==='ball_recovery'){const candidate=nearestOwn(point,1)[0]?.player;if(!candidate)throw new Error('Geen veldspeler gevonden');await actions.analystRecord(candidate.player_id,'ball_recovery','Live Actieveld · dichtstbijzijnde speler');state.side='for';setLocalStatus(`Bal veroverd door ${playerLabel(candidate)} · dichtstbijzijnde bij de ballocatie.`,'ok');return true}
 if(action==='ball_loss'){if(!active?.playerId)throw new Error('Geen eigen balbezitter actief');await actions.analystLoseBall(active.playerId,'other','Live Actieveld · balverlies');state.side='against';return true}
 if(action==='offside')return handleContext('offside',null,point);
 if(action==='free_kick')return handleContext('free_kick',null,point);
 if(action==='throw_in'){if(side==='for'){const candidate=nearestOwn(point,1)[0]?.player;await recordSpatial('throw_in',{side:'for',playerId:candidate?.player_id||null,start:point,end:point,note:candidate?`Ingooi ${playerLabel(candidate)}`:'Ingooi ons'});await actions.startTeamPossession('for')}else{await recordSpatial('throw_in',{side:'against',start:point,end:point,note:'Ingooi tegenstander'});await actions.startTeamPossession('against')}await refresh('ingooi-snel');return true}
 if(action==='shot_on_target'){await recordSpatial('shot',{side,playerId:side==='for'?active?.playerId:null,start:point,end:point,note:'Automatisch uit schot op doel'});await recordSpatial('shot_on_target',{side,playerId:side==='for'?active?.playerId:null,start:point,end:point,note:'Live Actieveld'});await refresh('schot-op-doel');return true}
 await recordSpatial(action,{side,playerId:side==='for'?active?.playerId:null,start:point,end:point,note:'Live Actieveld'});await refresh(`actieveld-${action}`);return true}
function bindPanel(){
 state.panel.querySelectorAll('[data-laf-action]').forEach(btn=>btn.onclick=()=>enqueue(btn.textContent.trim(),()=>railAction(btn.dataset.lafAction)).catch(()=>{}));
 state.pitch.addEventListener('click',ev=>{if(ev.target.closest?.('.lafOwn,.lafOpp'))return;showContext(fieldPoint(ev))});
}
function onConfirmed(event){const detail=event?.detail||{};if(detail.runtime)ensureController(detail.runtime);state.snapshot=detail.snapshot||state.runtime?.snapshot||state.snapshot;state.actions?.setSnapshot?.(state.snapshot);if(state.snapshot?.match?.status!=='live'){state.lastOwn=state.prevOwn=state.lastOpp=state.prevOpp=null}scheduleRender()}
function onRuntime(event){ensureController(event?.detail?.runtime);scheduleRender()}
function boot(){
 ensureStyles();global.addEventListener?.('clubmatch:v08-runtime-ready',onRuntime);global.addEventListener?.('clubmatch:v08-confirmed',onConfirmed);global.addEventListener?.('clubmatch:v08-stopped',()=>{state.snapshot=null;scheduleRender()});
 doc?.addEventListener?.('click',ev=>{if(ev.target.closest?.('#v08AnalystMode'))global.setTimeout?.(scheduleRender,0)},true);
 if(global.MutationObserver&&doc?.body)new global.MutationObserver(()=>{enhanceQuickPlayers();if(!state.panel?.isConnected)ensurePanel()}).observe(doc.body,{childList:true,subtree:true});
 global.setInterval?.(()=>{enhanceQuickPlayers();const visible=state.panel&&!state.panel.classList.contains('hidden');if(visible!==!!(state.snapshot?.match?.status==='live'&&analystOn()))scheduleRender()},1000);scheduleRender();
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08AnalystLiveInput=Object.freeze({render,nearestOwn,likelyCross,showContext,get state(){return {...state}}});
})(typeof window!=='undefined'?window:globalThis);
