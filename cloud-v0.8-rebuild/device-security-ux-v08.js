/* ClubMatch Cloud v0.8 - device/tablet bootstrap diagnostics without MFA assumptions */
(function(global){
'use strict';
const doc=global.document;
const SESSION_KEY='clubmatch-v08-session';
const MATCH_KEY='clubmatch-v08-active-match';
const BUILD='20260828.2359';
const STARTED=Date.now();
let lastChallenge=false,lastStage='',lastError='',watchdog=null,observer=null;
function topStatus(message,tone='warn'){
  const el=doc?.getElementById?.('v08Status');if(!el)return;
  el.textContent=String(message||'');el.classList.remove('bad','ok');
  if(tone==='ok')el.classList.add('ok');
}
function read(key){try{return global.localStorage?.getItem?.(key)||null}catch{return null}}
function challengeVisible(){const panel=doc?.getElementById?.('securityMfaChallenge');return !!panel&&!panel.classList.contains('hidden')}
function hasConfirmedSnapshot(){const el=doc?.getElementById?.('v08Integrity'),text=String(el?.textContent||'');return !!text&&!/Nog geen bevestigde wedstrijdstatus/i.test(text)}
function matchesLoaded(){const box=doc?.getElementById?.('openMatches');if(!box)return false;return !!box.querySelector?.('.matchChoice')||/Geen open wedstrijden/i.test(String(box.textContent||''))}
function appVisible(){const app=doc?.getElementById?.('appPanel');return !!app&&!app.classList.contains('hidden')}
function sessionVisible(){return !!String(doc?.getElementById?.('sessionEmail')?.textContent||'').trim()}
function stage(){
  const stored=!!read(SESSION_KEY),remembered=!!read(MATCH_KEY);
  if(!stored)return {key:'signed-out',label:'Geen opgeslagen sessie',done:true,stored,remembered};
  if(challengeVisible())return {key:'security',label:'Beveiligingscontrole zichtbaar',done:false,stored,remembered};
  if(!appVisible())return {key:'session',label:'Sessie gevonden · app nog niet vrijgegeven',done:false,stored,remembered};
  if(!sessionVisible())return {key:'identity',label:'App zichtbaar · sessie-identiteit wordt geladen',done:false,stored,remembered};
  if(!matchesLoaded())return {key:'matches',label:'Sessie geldig · wedstrijden/context worden geladen',done:false,stored,remembered};
  if(remembered&&!hasConfirmedSnapshot())return {key:'snapshot',label:'Wedstrijden geladen · actieve wedstrijd wacht op confirmed Cloud-snapshot',done:false,stored,remembered};
  return {key:'ready',label:remembered?'Actieve wedstrijd confirmed uit Cloud':'Wedstrijdcontext gereed',done:true,stored,remembered};
}
function ensureStyles(){if(!doc||doc.getElementById('v08BootDiagStyles'))return;const s=doc.createElement('style');s.id='v08BootDiagStyles';s.textContent=`
#v08BootDiag{border:2px solid #d39118;background:#fff8e8}#v08BootDiag.bad{border-color:#983263;background:#fff1f1}#v08BootDiag .bootDiagGrid{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}#v08BootDiag .bootStage{font-weight:900;color:#4b2672}#v08BootDiag .bootMeta{font-size:10px;color:#6b5877;margin-top:4px;overflow-wrap:anywhere}#v08BootDiag .controls button{min-height:48px;touch-action:manipulation}@media(pointer:coarse){#v08BootDiag .controls button{min-height:62px;font-size:14px}}@media(max-width:620px){#v08BootDiag .bootDiagGrid{grid-template-columns:1fr}#v08BootDiag .controls button{width:100%}}
`;doc.head.appendChild(s)}
function ensureCard(){
  let card=doc?.getElementById?.('v08BootDiag');if(card)return card;const first=doc?.querySelector?.('.wrap > section.card');if(!first)return null;ensureStyles();card=doc.createElement('section');card.id='v08BootDiag';card.className='card hidden';card.innerHTML='<div class="bootDiagGrid"><div><h2 style="margin-bottom:4px">Opstartcontrole</h2><div class="bootStage" id="v08BootStage"></div><div class="bootMeta" id="v08BootMeta"></div></div><div class="controls"><button type="button" id="v08BootRetry">Opnieuw proberen</button><button type="button" id="v08BootReload" class="secondary">Cachevrij herladen</button></div></div>';first.after(card);
  card.querySelector('#v08BootRetry').onclick=()=>retry();card.querySelector('#v08BootReload').onclick=()=>cacheFreeReload();return card;
}
function cacheFreeReload(){const url=new URL(global.location.href);url.searchParams.set('cm_build',BUILD);url.searchParams.set('_cm',String(Date.now()));global.location.replace(url.href)}
function retry(){const s=stage(),button=doc?.getElementById?.('refreshMatchesBtn');if(s.key==='matches'||s.key==='snapshot'||appVisible()){if(button&&typeof button.click==='function'){button.click();return}}cacheFreeReload()}
function render(force=false){
  const s=stage(),elapsed=Date.now()-STARTED,card=ensureCard();if(!card)return s;const shouldShow=!s.done&&(elapsed>=3500||!!lastError||s.key==='security');
  if(shouldShow){card.classList.remove('hidden');card.classList.toggle('bad',!!lastError);const stageEl=doc.getElementById('v08BootStage'),meta=doc.getElementById('v08BootMeta');if(stageEl)stageEl.textContent=lastError?`JavaScriptfout tijdens opstart: ${lastError}`:s.label;if(meta)meta.textContent=`Stage: ${s.key} · build ${BUILD} · ${Math.round(elapsed/100)/10}s${s.remembered?' · actieve wedstrijd onthouden':''}`;if(force||lastStage!==s.key)topStatus(`Opstartcontrole · ${s.label}`)}else card.classList.add('hidden');
  lastStage=s.key;return s;
}
function inspect(){const panel=doc?.getElementById?.('securityMfaChallenge'),visible=challengeVisible();if(visible){topStatus('Beveiligingscontrole geopend op dit apparaat. ClubMatch gebruikt alleen de echte sessiestatus; er wordt niet aangenomen dat 2FA is ingesteld.');if(!lastChallenge){try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch{}}lastChallenge=true}else lastChallenge=false;return render()}
function captureError(value){lastError=String(value?.message||value?.reason?.message||value?.reason||value||'Onbekende fout').slice(0,240);render(true)}
function boot(){
  if(!doc?.body)return;inspect();watchdog=global.setInterval?.(()=>{const s=render();if(s.done&&Date.now()-STARTED>10000){global.clearInterval?.(watchdog);watchdog=null}},500)||null;
  if(global.MutationObserver){observer=new global.MutationObserver(()=>render());observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})}
  global.addEventListener?.('error',captureError);global.addEventListener?.('unhandledrejection',captureError);global.addEventListener?.('pageshow',inspect);doc.addEventListener?.('visibilitychange',()=>{if(!doc.hidden)inspect()});
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08DeviceSecurityUx=Object.freeze({inspect,challengeVisible,stage,render,retry,cacheFreeReload,get lastError(){return lastError}});
})(typeof window!=='undefined'?window:globalThis);
