/* ClubMatch Cloud v0.8 - matchday critical tablet/layout controls and keeper workflow */
(function(global){
'use strict';
const doc=global.document;
const MODE_KEY='clubmatch.v08.action.mode';
let queued=false,layoutObserver=null,lastPanel=null,overlapBusy=false;
const api=()=>global.ClubMatchV08AnalystLiveInput||null;
const liveState=()=>api()?.state||{};
function clamp(v,min,max){return Math.max(min,Math.min(max,Number(v)||0))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function isLive(snapshot=liveState().snapshot){return snapshot?.match?.status==='live'}
function clockRunning(){const st=liveState();return st.snapshot?.state?.clock_status==='running'}
function setStatus(text,tone='busy'){const el=doc?.querySelector?.('#v08LiveActionField .lafStatus');if(!el)return;el.textContent=text;el.className=`lafStatus ${tone}`}
function ensureStyles(){
 if(!doc||doc.getElementById('v08MatchdayCriticalStyles'))return;
 const s=doc.createElement('style');s.id='v08MatchdayCriticalStyles';s.textContent=`
#v08LiveMatchWorkspace.v08MatchdayLayout{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;align-items:start!important}
#v08LiveMatchWorkspace.v08MatchdayLayout>#v08LiveLineupColumn,#v08LiveMatchWorkspace.v08MatchdayLayout>#v08LiveAnalystColumn{display:contents!important}
#v08LiveMatchWorkspace.v08MatchdayLayout #v08BasisLineup{grid-column:1;order:10;margin:0!important;min-width:0}
#v08LiveMatchWorkspace.v08MatchdayLayout .v08LivePitchCard{grid-column:2;order:20;margin:0!important;min-width:0}
#v08LiveMatchWorkspace.v08MatchdayLayout #v08LiveActionFieldHost{grid-column:1/-1;order:30;min-width:0}
#v08LiveMatchWorkspace.v08MatchdayLayout .v08LiveMonitorCard{grid-column:1;order:40;min-width:0}
#v08LiveMatchWorkspace.v08MatchdayLayout .v08LiveEventsCard{grid-column:2;order:50;min-width:0}
#v08LiveActionFieldHost>#v08LiveActionField{width:100%!important;margin:0 0 12px!important}
#v08BasisLineup .basisPitch,.v08LivePitchCard .pitch{min-height:540px!important}
#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:90px!important;min-height:44px!important;padding:4px 5px!important;border-radius:10px!important}
#v08LiveActionField .lafName{font-size:9px!important;line-height:1.12!important}
#v08LiveActionField .lafPos{font-size:7px!important;line-height:1.1!important}
#v08LiveActionField .lafNo{font-size:9px!important}
@media(pointer:coarse){#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:88px!important;min-height:46px!important}.lafActionDock button{min-height:52px!important}}
#v08LiveActionField .lafActionDock{gap:8px!important;padding:10px!important;border:1px solid #ded0eb;border-radius:15px;background:linear-gradient(180deg,#fcfaff,#f5effa);box-shadow:0 4px 16px rgba(75,38,114,.08)}
#v08LiveActionField .lafActionDock button{border:1px solid #cbb8df!important;border-radius:13px!important;background:#fff!important;color:#4b2672!important;font-weight:900!important;box-shadow:0 2px 7px rgba(75,38,114,.08)!important;transition:transform .1s,box-shadow .1s,border-color .1s!important;touch-action:manipulation}
#v08LiveActionField .lafActionDock button:active{transform:translateY(1px) scale(.99)!important;box-shadow:none!important}
#v08LiveActionField .lafActionDock button[data-laf-action="ball_recovery"],#v08LiveActionField .lafActionDock button[data-matchday-action="keeper_save"]{background:#eef9f1!important;border-color:#8bc79b!important;color:#1f6638!important}
#v08LiveActionField .lafActionDock button[data-laf-action="ball_loss"]{background:#fff2f5!important;border-color:#d79bb3!important;color:#8b2852!important}
#v08LiveActionField .lafActionDock button[data-laf-action="shot_on_target"],#v08LiveActionField .lafActionDock button[data-laf-action="shot"]{background:#eef7ff!important;border-color:#93bce0!important;color:#245a91!important}
#v08LiveActionField .lafActionDock button[data-laf-action="corner"],#v08LiveActionField .lafActionDock button[data-laf-action="free_kick"],#v08LiveActionField .lafActionDock button[data-laf-action="throw_in"]{background:#fff8e9!important;border-color:#e6c57f!important;color:#7b5a16!important}
.lafMatchdayHint{margin:7px 0 9px;padding:8px 10px;border-radius:10px;background:#eef7ff;border:1px solid #b8d8f5;color:#245a91;font-size:10px;line-height:1.35}
.lafCoordExplain{margin-top:3px;font-size:9px;color:#7b6a87}.lafCoordExplain b{color:#4b2672}
.liveInjury.v08InjuryStepper{display:grid!important;grid-template-columns:auto 44px minmax(58px,72px) 44px auto;gap:6px!important;align-items:center!important;max-width:none!important}
.liveInjury.v08InjuryStepper .v08InjuryLabel{font-size:10px;font-weight:900;color:#4b2672;white-space:nowrap}
.liveInjury.v08InjuryStepper input{width:100%!important;min-width:58px;text-align:center;font-weight:900;font-size:16px}
.liveInjury.v08InjuryStepper .v08InjuryStep{width:44px;min-height:42px;border:1px solid #8d6dac!important;background:#fff!important;color:#4b2672!important;border-radius:10px!important;font-size:20px!important;font-weight:900!important;padding:4px!important}
.liveInjury.v08InjuryStepper [data-clock="injury_time"]{white-space:nowrap}
@media(max-width:900px){#v08LiveMatchWorkspace.v08MatchdayLayout{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}#v08BasisLineup .basisPitch,.v08LivePitchCard .pitch{min-height:500px!important}.liveInjury.v08InjuryStepper{grid-template-columns:auto 48px minmax(62px,78px) 48px;}.liveInjury.v08InjuryStepper [data-clock="injury_time"]{grid-column:1/-1}.liveInjury.v08InjuryStepper .v08InjuryStep{min-height:48px}}
@media(max-width:620px){#v08LiveMatchWorkspace.v08MatchdayLayout{grid-template-columns:1fr!important}#v08LiveMatchWorkspace.v08MatchdayLayout #v08BasisLineup,#v08LiveMatchWorkspace.v08MatchdayLayout .v08LivePitchCard,#v08LiveMatchWorkspace.v08MatchdayLayout .v08LiveMonitorCard,#v08LiveMatchWorkspace.v08MatchdayLayout .v08LiveEventsCard{grid-column:1!important}#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:76px!important;min-height:42px!important}.liveInjury.v08InjuryStepper{grid-template-columns:1fr 48px 72px 48px}.liveInjury.v08InjuryStepper .v08InjuryLabel{grid-column:1}.liveInjury.v08InjuryStepper [data-clock="injury_time"]{grid-column:1/-1}}
`;
 doc.head.appendChild(s)
}
function markCards(){
 const workspace=doc?.getElementById?.('v08LiveMatchWorkspace');if(!workspace)return false;
 workspace.classList.add('v08MatchdayLayout');
 doc.getElementById('v08Pitch')?.closest('.card')?.classList.add('v08LivePitchCard');
 doc.getElementById('v08Monitor')?.closest('.card')?.classList.add('v08LiveMonitorCard');
 doc.getElementById('v08Timeline')?.closest('.card')?.classList.add('v08LiveEventsCard');
 return true
}
function forceLiveActionField(snapshot=liveState().snapshot){
 if(!isLive(snapshot)||!api()?.render)return false;
 let previous=null,had=false;try{had=global.localStorage?.getItem(MODE_KEY)!==null;previous=global.localStorage?.getItem(MODE_KEY);global.localStorage?.setItem(MODE_KEY,'analyst')}catch{}
 try{api().render()}finally{try{if(had)global.localStorage?.setItem(MODE_KEY,previous);else global.localStorage?.removeItem(MODE_KEY)}catch{}}
 const panel=doc?.getElementById?.('v08LiveActionField');if(panel){panel.classList.remove('hidden');panel.dataset.matchdayVisible='1'}
 return !!panel
}
function ensureHint(){
 const panel=doc?.getElementById?.('v08LiveActionField');if(!panel)return;
 if(!panel.querySelector('.lafMatchdayHint')){const hint=doc.createElement('div');hint.className='lafMatchdayHint';hint.innerHTML='<b>Matchday-modus:</b> het Live Actieveld blijft op desktop én tablet zichtbaar tijdens een live wedstrijd. Bij een schot op doel van de tegenstander kies je daarna <b>🧤 Keeper save</b> als de keeper redt; ClubMatch registreert dan zowel de redding als de balverovering.';panel.querySelector('.lafLegend')?.before(hint)}
}
function ensureInjuryStepper(){
 const input=doc?.getElementById?.('injuryMinutes'),injury=doc?.querySelector?.('[data-clock="injury_time"]');if(!input||!injury)return false;
 const wrap=input.closest('.liveInjury');if(!wrap||wrap.classList.contains('v08InjuryStepper'))return !!wrap;
 wrap.classList.add('v08InjuryStepper');
 const label=doc.createElement('span');label.className='v08InjuryLabel';label.textContent='Blessuretijd';
 const minus=doc.createElement('button'),plus=doc.createElement('button');minus.type=plus.type='button';minus.className=plus.className='v08InjuryStep';minus.dataset.injuryStep='-1';plus.dataset.injuryStep='1';minus.setAttribute('aria-label','Blessuretijd 1 minuut verminderen');plus.setAttribute('aria-label','Blessuretijd 1 minuut verhogen');minus.textContent='−';plus.textContent='+';
 function step(delta){const min=Number(input.min||0),max=Number(input.max||60),next=clamp((Number(input.value)||0)+delta,min,max);input.value=String(next);input.dispatchEvent(new global.Event('input',{bubbles:true}));input.dispatchEvent(new global.Event('change',{bubbles:true}))}
 minus.onclick=()=>step(-1);plus.onclick=()=>step(1);
 wrap.insertBefore(label,input);wrap.insertBefore(minus,input);input.after(plus);return true
}
function addCoordExplanation(){
 const context=doc?.querySelector?.('#v08LiveActionField #lafContext');if(!context||context.classList.contains('hidden'))return;
 const st=liveState(),p=st.ballPoint||{x:50,y:50};let el=context.querySelector('.lafCoordExplain');if(!el){el=doc.createElement('div');el.className='lafCoordExplain';const debug=context.querySelector('.lafZoneDebug');(debug||context.querySelector(':scope > b'))?.after(el)}
 if(el)el.innerHTML=`<b>X ${Math.round(p.x)}%</b> = links → rechts · <b>Y ${Math.round(p.y)}%</b> = aanvalsdoel → eigen doel. Percentages maken dezelfde veldlocatie schaalbaar op desktop, tablet en mobiel.`
}
function keeper(){return (liveState().snapshot?.players||[]).find(p=>p.selected&&p.is_on_field&&(p.current_position||p.starting_position)==='GK')||null}
async function recordKeeperSave(){
 const st=liveState(),gk=keeper();if(!isLive(st.snapshot))throw new Error('Geen live wedstrijd');if(!clockRunning())throw new Error('Start of hervat eerst de wedstrijdklok');if(!gk)throw new Error('Geen keeper (GK) op het veld gevonden');if(!st.actions?.analystRecord)throw new Error('Analistactie-controller ontbreekt');
 setStatus(`Keeper save · ${gk.display_name||gk.full_name||'GK'} opslaan…`);
 await st.actions.analystRecord(gk.player_id,'save','Live Actieveld · keeper save');
 await st.actions.analystRecord(gk.player_id,'ball_recovery','Live Actieveld · keeper save, bal in bezit');
 setStatus(`🧤 Keeper save ${gk.display_name||gk.full_name||'GK'} ✓ redding + balverovering + ons balbezit`,'ok');
 return true
}
function ensureKeeperButton(){
 const dock=doc?.querySelector?.('#v08LiveActionField #lafActionDock');if(!dock||dock.querySelector('[data-matchday-action="keeper_save"]'))return;
 const btn=doc.createElement('button');btn.type='button';btn.dataset.matchdayAction='keeper_save';btn.dataset.v08Action='';btn.textContent='🧤 Keeper save';btn.title='Registreert keeperredding + balverovering en zet balbezit op ons team';
 btn.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();if(btn.disabled)return;btn.disabled=true;try{await recordKeeperSave()}catch(error){console.error(error);setStatus(`Keeper save niet opgeslagen: ${error.message||error}`,'bad')}finally{btn.disabled=false;schedule()}};
 const recovery=dock.querySelector('[data-laf-action="ball_recovery"]');if(recovery)recovery.after(btn);else dock.appendChild(btn)
}
function pctPoint(el){return {el,x:parseFloat(el.style.left)||50,y:parseFloat(el.style.top)||50,w:el.offsetWidth||80,h:el.offsetHeight||42}}
function overlaps(a,b,pitch){const pw=Math.max(1,pitch.clientWidth),ph=Math.max(1,pitch.clientHeight),ax=a.w/pw*50+1.2,bx=b.w/pw*50+1.2,ay=a.h/ph*50+1.0,by=b.h/ph*50+1.0;return Math.abs(a.x-b.x)<ax+bx&&Math.abs(a.y-b.y)<ay+by}
function separateOpponents(){
 if(overlapBusy)return;const panel=doc?.getElementById?.('v08LiveActionField'),pitch=panel?.querySelector('#lafPitch');if(!pitch||panel.classList.contains('hidden')||pitch.clientWidth<100)return;const own=[...pitch.querySelectorAll('.lafOwn')].map(pctPoint),nodes=[...pitch.querySelectorAll('.lafOpp')];if(!nodes.length)return;overlapBusy=true;
 try{const placed=[];const offsets=[[0,0],[6,0],[-6,0],[0,6],[0,-6],[8,5],[-8,5],[8,-5],[-8,-5],[12,0],[-12,0],[0,10],[0,-10],[14,7],[-14,7],[14,-7],[-14,-7],[18,0],[-18,0]];
  nodes.forEach(node=>{const base=pctPoint(node),all=()=>own.concat(placed);let chosen=null,best=null,bestScore=-Infinity;for(const [dx,dy] of offsets){const c={...base,x:clamp(base.x+dx,6,94),y:clamp(base.y+dy,5,95)};const hits=all().filter(o=>overlaps(c,o,pitch)).length;const nearest=all().length?Math.min(...all().map(o=>Math.hypot(c.x-o.x,c.y-o.y))):100;const score=nearest-hits*100;if(hits===0){chosen=c;break}if(score>bestScore){bestScore=score;best=c}}chosen=chosen||best||base;node.style.left=`${Number(chosen.x.toFixed(2))}%`;node.style.top=`${Number(chosen.y.toFixed(2))}%`;placed.push({...chosen,el:node})})
 }finally{overlapBusy=false}
}
function panelEnhance(){
 ensureStyles();markCards();ensureInjuryStepper();forceLiveActionField();ensureHint();ensureKeeperButton();addCoordExplanation();separateOpponents();
 const panel=doc?.getElementById?.('v08LiveActionField');if(panel&&panel!==lastPanel){lastPanel=panel;layoutObserver?.disconnect?.();if(global.MutationObserver){layoutObserver=new global.MutationObserver(()=>schedule());layoutObserver.observe(panel,{childList:true,subtree:true})}}
}
function schedule(){if(queued)return;queued=true;(global.requestAnimationFrame||global.setTimeout)(()=>{queued=false;panelEnhance()},0)}
function scheduleCascade(){schedule();global.setTimeout?.(schedule,80);global.setTimeout?.(schedule,220)}
function boot(){
 ensureStyles();scheduleCascade();
 global.addEventListener?.('clubmatch:v08-runtime-ready',scheduleCascade);
 global.addEventListener?.('clubmatch:v08-confirmed',scheduleCascade);
 global.addEventListener?.('pageshow',scheduleCascade);
 global.addEventListener?.('resize',()=>global.setTimeout?.(schedule,80));
 doc?.addEventListener?.('click',event=>{if(event.target.closest?.('#v08LiveActionField #lafPitch,#v08AnalystMode,[data-clock="injury_time"]'))global.setTimeout?.(scheduleCascade,0)},true);
 doc?.addEventListener?.('change',event=>{if(event.target.closest?.('#lafOpponentFormation select'))global.setTimeout?.(scheduleCascade,100)},true)
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08MatchdayCritical=Object.freeze({schedule,forceLiveActionField,ensureInjuryStepper,recordKeeperSave,separateOpponents});
})(typeof window!=='undefined'?window:globalThis);
