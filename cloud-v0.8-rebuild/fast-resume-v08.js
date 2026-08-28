/* ClubMatch Cloud v0.8 - non-blocking confirmed Cloud resume observer */
(function(global){
'use strict';
const doc=global.document;
const RESUMABLE=new Set(['live','halftime','paused','in_progress']);
const state={runtime:null,selection:null,startedAt:0,lastMs:null,done:false,watchdog:null,expectedMatchId:null};

function now(){return global.performance?.now?.()??Date.now()}
function appVisible(){const app=doc?.getElementById?.('appPanel');return !!app&&!app.classList.contains('hidden')}
function resumableStatus(value){return RESUMABLE.has(String(value||'').toLowerCase())}
function getSelection(){if(state.selection)return state.selection;state.selection=global.ClubMatchV08MatchSelection?.createMatchSelection?.()||null;return state.selection}
function ensureStatus(){if(!doc)return null;let el=doc.getElementById('v08FastResumeStatus');if(el?.isConnected)return el;const anchor=doc.getElementById('v08Integrity')||doc.getElementById('v08ScoreCard');if(!anchor)return null;el=doc.createElement('div');el.id='v08FastResumeStatus';el.setAttribute('role','status');el.style.cssText='margin-top:6px;padding:6px 9px;border-radius:999px;display:inline-block;font-size:10px;font-weight:900;border:1px solid #d8c4ef;background:#faf7fd;color:#5d4770';anchor.after(el);return el}
function renderStatus(message,tone='normal'){const el=ensureStatus();if(!el)return;el.textContent=message;if(tone==='ok'){el.style.background='#eaf7ee';el.style.color='#1f6638';el.style.borderColor='#9ed5ad'}else if(tone==='warn'){el.style.background='#fff4dd';el.style.color='#704800';el.style.borderColor='#e3bd68'}else{el.style.background='#faf7fd';el.style.color='#5d4770';el.style.borderColor='#d8c4ef'}}
function emit(detail){try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-fast-resume',{detail}))}catch{}}
function clearWatchdog(){if(state.watchdog!==null){global.clearTimeout?.(state.watchdog);state.watchdog=null}}
function beginObservation(){if(state.done||!appVisible())return false;const matchId=getSelection()?.recalled?.();if(!matchId)return false;if(state.expectedMatchId===matchId&&state.startedAt)return true;state.expectedMatchId=matchId;state.startedAt=now();renderStatus('↻ Actieve wedstrijd uit bevestigde Cloud-status herstellen…');clearWatchdog();state.watchdog=global.setTimeout?.(()=>{if(!state.done)renderStatus('Cloud-herstel duurt langer dan normaal · herstelroute blijft actief','warn')},8000)||null;return true}
function captureRuntime(event){state.runtime=event?.detail?.runtime||state.runtime;beginObservation()}
function confirmed(event){const detail=event?.detail||{},snapshot=detail.snapshot||{},match=snapshot.match||{},matchId=match.id||detail.runtime?.activeMatchId||null;if(!state.expectedMatchId)beginObservation();if(!state.expectedMatchId||matchId!==state.expectedMatchId)return;const status=match.status;if(!resumableStatus(status))return;state.lastMs=Math.max(0,Math.round(now()-(state.startedAt||now())));state.done=true;clearWatchdog();renderStatus(`⚡ Actieve wedstrijd bevestigd in ${(state.lastMs/1000).toFixed(1)}s`,'ok');emit({matchId,elapsedMs:state.lastMs,status:'confirmed'})}
function stopped(event){if(event?.detail?.matchId&&event.detail.matchId===state.expectedMatchId){clearWatchdog();state.done=false;state.startedAt=0;state.expectedMatchId=null}}
function boot(){ensureStatus();getSelection();global.addEventListener?.('clubmatch:v08-runtime-ready',captureRuntime);global.addEventListener?.('clubmatch:v08-confirmed',confirmed);global.addEventListener?.('clubmatch:v08-stopped',stopped);const app=doc?.getElementById?.('appPanel');if(app&&global.MutationObserver){const observer=new global.MutationObserver(beginObservation);observer.observe(app,{attributes:true,attributeFilter:['class']})}beginObservation()}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
global.ClubMatchV08FastResume=Object.freeze({beginObservation,resumableStatus,appVisible,renderStatus,get state(){return {...state}}});
})(typeof window!=='undefined'?window:globalThis);
