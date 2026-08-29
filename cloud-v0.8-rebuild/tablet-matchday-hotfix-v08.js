/* ClubMatch Cloud v0.8 - tablet matchday hotfix 20260829.0405 */
(function(global){
'use strict';
const doc=global.document;
const BUILD='20260829.0405';
const MODE_KEY='clubmatch.v08.action.mode';
let previousMode=undefined,queued=false,observer=null;
const api=()=>global.ClubMatchV08AnalystLiveInput||null;
const state=()=>api()?.state||{};
function clamp(v,min,max){return Math.max(min,Math.min(max,Number(v)||0))}
function live(){return state().snapshot?.match?.status==='live'}
function ensureStyles(){
 if(!doc||doc.getElementById('v08TabletHotfixStyles'))return;
 const s=doc.createElement('style');s.id='v08TabletHotfixStyles';s.textContent=`
#v08LiveActionField[data-tablet-hotfix="1"],#v08LiveActionField[data-tablet-hotfix="1"].hidden{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important}
#v08LiveMatchWorkspace.v08TabletMatchday{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;align-items:start!important}
#v08LiveMatchWorkspace.v08TabletMatchday>#v08LiveLineupColumn,#v08LiveMatchWorkspace.v08TabletMatchday>#v08LiveAnalystColumn{display:contents!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08BasisLineup{grid-column:1!important;grid-row:1!important;margin:0!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixPitchCard{grid-column:2!important;grid-row:1!important;margin:0!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08LiveActionFieldHost{grid-column:1/-1!important;grid-row:2!important;min-width:0!important;width:100%!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixMonitorCard{grid-column:1!important;grid-row:3!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixEventsCard{grid-column:2!important;grid-row:3!important;min-width:0!important}
.v08HotfixPitchCard #v08Pitch{overflow:hidden!important;padding:5px!important;min-width:0!important}
.v08HotfixPitchCard .v08PitchSlot{width:96px!important;min-height:72px!important}
.v08HotfixPitchCard .v08PitchPlayer{min-height:68px!important;padding:4px!important}
.v08HotfixPitchCard .v08PitchName{font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.v08HotfixPitchCard .v08PitchPos{font-size:9px!important}.v08HotfixPitchCard .v08PitchTime{font-size:8px!important}.v08HotfixPitchCard .v08SlotLabel{font-size:7px!important;max-width:96px!important;overflow:hidden!important;text-overflow:ellipsis!important}
#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:88px!important;min-height:44px!important;padding:4px 5px!important}
#v08LiveActionField .lafName{font-size:9px!important}#v08LiveActionField .lafPos{font-size:7px!important}
@media(pointer:coarse){#v08LiveActionField .lafActionDock button{min-height:52px!important}#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:86px!important}}
@media(max-width:700px){#v08LiveMatchWorkspace.v08TabletMatchday{grid-template-columns:1fr!important}#v08LiveMatchWorkspace.v08TabletMatchday #v08BasisLineup,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixPitchCard,#v08LiveMatchWorkspace.v08TabletMatchday #v08LiveActionFieldHost,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixMonitorCard,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixEventsCard{grid-column:1!important;grid-row:auto!important}.v08HotfixPitchCard .v08PitchSlot{width:92px!important}}
`;
 doc.head.appendChild(s)
}
function stampBuild(){
 const badges=[...doc.querySelectorAll('.badge')];const badge=badges.find(el=>/v0\.8.*build/i.test(el.textContent||''));if(badge)badge.textContent=`v0.8 ONTWIKKELING · build ${BUILD}`;
 if(global.__ClubMatchShellBoot)global.__ClubMatchShellBoot.build=BUILD;
 doc.documentElement.dataset.clubmatchBuild=BUILD
}
function markWorkspace(){
 global.ClubMatchV08LiveWorkspace?.ensureWorkspace?.();
 const workspace=doc.getElementById('v08LiveMatchWorkspace');if(!workspace)return false;workspace.classList.add('v08TabletMatchday');
 doc.getElementById('v08Pitch')?.closest('.card')?.classList.add('v08HotfixPitchCard');
 doc.getElementById('v08Monitor')?.closest('.card')?.classList.add('v08HotfixMonitorCard');
 doc.getElementById('v08Timeline')?.closest('.card')?.classList.add('v08HotfixEventsCard');return true
}
function forceAnalystMode(){
 if(live()){
   try{if(previousMode===undefined)previousMode=global.localStorage?.getItem(MODE_KEY)??null;global.localStorage?.setItem(MODE_KEY,'analyst')}catch{}
   return true
 }
 if(previousMode!==undefined){try{if(previousMode===null)global.localStorage?.removeItem(MODE_KEY);else global.localStorage?.setItem(MODE_KEY,previousMode)}catch{}previousMode=undefined}
 return false
}
function forceActionField(){
 if(!forceAnalystMode())return false;const a=api();if(!a?.render)return false;
 a.render();const panel=doc.getElementById('v08LiveActionField');if(!panel)return false;panel.dataset.tabletHotfix='1';panel.classList.remove('hidden');return true
}
function clampPitchSlots(){
 const pitch=doc.getElementById('v08Pitch');if(!pitch||pitch.clientWidth<120)return;const width=pitch.clientWidth;
 pitch.querySelectorAll('.v08PitchSlot').forEach(slot=>{const raw=parseFloat(slot.style.left);if(!Number.isFinite(raw))return;const half=(Math.max(70,slot.offsetWidth||96)/2+5)/width*100;slot.style.left=`${Number(clamp(raw,half,100-half).toFixed(2))}%`})
}
function enforce(){ensureStyles();stampBuild();markWorkspace();forceActionField();clampPitchSlots()}
function schedule(){if(queued)return;queued=true;(global.requestAnimationFrame||global.setTimeout)(()=>{queued=false;enforce()},0)}
function cascade(){schedule();global.setTimeout?.(schedule,60);global.setTimeout?.(schedule,180);global.setTimeout?.(schedule,500)}
function boot(){
 ensureStyles();stampBuild();cascade();
 global.addEventListener?.('clubmatch:v08-runtime-ready',cascade);
 global.addEventListener?.('clubmatch:v08-confirmed',cascade);
 global.addEventListener?.('pageshow',cascade);
 global.addEventListener?.('resize',()=>global.setTimeout?.(cascade,80));
 doc?.addEventListener?.('visibilitychange',()=>{if(!doc.hidden)cascade()});
 if(global.MutationObserver&&doc?.body){observer=new global.MutationObserver(()=>{const panel=doc.getElementById('v08LiveActionField');if(live()&&(!panel||panel.classList.contains('hidden')))schedule();else if(panel)clampPitchSlots()});observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08TabletHotfix=Object.freeze({BUILD,enforce,forceActionField,clampPitchSlots});
})(typeof window!=='undefined'?window:globalThis);
