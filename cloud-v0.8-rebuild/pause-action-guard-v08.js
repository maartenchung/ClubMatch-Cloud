/* ClubMatch Cloud v0.8 - keep Live Actieveld visible during pause/rust, block logging */
(function(global){
'use strict';
const doc=global.document;
const BUILD='20260829.0520';
let snapshot=null,bound=false;
function currentSnapshot(){return snapshot||global.ClubMatchV08AnalystLiveInput?.state?.snapshot||null}
function status(){return String(currentSnapshot()?.match?.status||'')}
function clockRunning(){const s=currentSnapshot();return status()==='live'&&String(s?.state?.clock_status||'')==='running'}
function matchOpen(){return ['live','halftime'].includes(status())}
function pausedLabel(){return status()==='halftime'?'Rust':'Pauze'}
function stampBuild(){const badge=[...doc.querySelectorAll('.badge')].find(el=>/v0\.8.*build/i.test(el.textContent||''));if(badge)badge.textContent=`v0.8 ONTWIKKELING · build ${BUILD}`;if(global.__ClubMatchShellBoot)global.__ClubMatchShellBoot.build=BUILD;doc.documentElement.dataset.clubmatchBuild=BUILD}
function ensureStyle(){if(doc.getElementById('v08PauseActionGuardStyles'))return;const s=doc.createElement('style');s.id='v08PauseActionGuardStyles';s.textContent=`
#v08LiveActionField[data-pause-visible="1"],#v08LiveActionField[data-pause-visible="1"].hidden{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important}
#v08LiveActionField[data-registration-locked="1"] .lafActionDock button,#v08LiveActionField[data-registration-locked="1"] .lafContext button,#v08LiveActionField[data-registration-locked="1"] .lafGoal button,#v08LiveActionField[data-registration-locked="1"] .lafGoalTypes button{opacity:.48!important;filter:saturate(.65);cursor:not-allowed!important}
#v08PauseActionNotice{margin:0 0 9px;padding:9px 11px;border-radius:10px;border:1px solid #e2c77e;background:#fff8e8;color:#765716;font-size:11px;font-weight:800}
`;
doc.head.appendChild(s)}
function notice(panel,locked){let note=doc.getElementById('v08PauseActionNotice');if(!note){note=doc.createElement('div');note.id='v08PauseActionNotice';panel.prepend(note)}if(locked){note.textContent=`${pausedLabel()} · Live Actieveld blijft zichtbaar. Acties die je hier aanklikt worden niet geregistreerd zolang de wedstrijdklok stilstaat.`;note.classList.remove('hidden')}else note.classList.add('hidden')}
function sync(){snapshot=currentSnapshot();stampBuild();ensureStyle();if(!matchOpen())return;const panel=doc.getElementById('v08LiveActionField');if(!panel)return;const locked=!clockRunning();panel.dataset.pauseVisible='1';panel.dataset.registrationLocked=locked?'1':'0';panel.dataset.actionActive=clockRunning()?'1':'0';panel.classList.remove('hidden');notice(panel,locked);const old=doc.getElementById('v08ActionPausedNotice');if(old)old.classList.add('hidden')}
function blockedTarget(target){if(!target?.closest)return false;const panel=target.closest('#v08LiveActionField');if(!panel)return false;return !!target.closest('button,.lafOwn,.lafOpp,.lafPitch,.lafContext,.lafGoal,.lafActionDock')}
function guard(event){if(clockRunning()||!matchOpen()||!blockedTarget(event.target))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const panel=doc.getElementById('v08LiveActionField');const statusEl=panel?.querySelector('.lafStatus');if(statusEl){statusEl.textContent=`${pausedLabel()} · niet opgeslagen. Hervat eerst de wedstrijdklok om acties te registreren.`;statusEl.className='lafStatus bad'}}
function bind(){if(bound)return;bound=true;doc.addEventListener('click',guard,true);doc.addEventListener('dblclick',guard,true);doc.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&!clockRunning()&&blockedTarget(event.target))guard(event)},true)}
function onConfirmed(event){snapshot=event?.detail?.snapshot||event?.detail?.runtime?.snapshot||global.ClubMatchV08AnalystLiveInput?.state?.snapshot||snapshot;sync()}
function boot(){ensureStyle();stampBuild();bind();snapshot=global.ClubMatchV08AnalystLiveInput?.state?.snapshot||snapshot;global.addEventListener?.('clubmatch:v08-confirmed',onConfirmed);global.addEventListener?.('clubmatch:v08-runtime-ready',event=>{snapshot=event?.detail?.runtime?.snapshot||global.ClubMatchV08AnalystLiveInput?.state?.snapshot||snapshot;sync()});global.addEventListener?.('pageshow',sync);global.setTimeout(sync,120);global.setTimeout(sync,600)}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08PauseActionGuard=Object.freeze({BUILD,sync,get locked(){return matchOpen()&&!clockRunning()}});
})(typeof window!=='undefined'?window:globalThis);
