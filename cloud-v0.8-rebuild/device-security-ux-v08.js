/* ClubMatch Cloud v0.8 - device/tablet security gate UX */
(function(global){
'use strict';
const doc=global.document;
let lastVisible=false;
function topStatus(message,tone='warn'){
  const el=doc?.getElementById?.('v08Status');if(!el)return;
  el.textContent=String(message||'');el.classList.remove('bad','ok');
  if(tone==='ok')el.classList.add('ok');
}
function challengeVisible(){const panel=doc?.getElementById?.('securityMfaChallenge');return !!panel&&!panel.classList.contains('hidden')}
function inspect(){
  if(!doc)return false;const panel=doc.getElementById('securityMfaChallenge'),visible=challengeVisible();
  if(visible){
    topStatus('2FA-verificatie vereist op dit apparaat · verifieer eerst, daarna wordt de actieve wedstrijd uit Cloud hervat.');
    if(!lastVisible){try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch{}global.setTimeout?.(()=>doc.getElementById('loginMfaCode')?.focus?.(),120)}
  }
  lastVisible=visible;return visible;
}
function boot(){
  if(!doc?.body)return;inspect();
  if(global.MutationObserver)new global.MutationObserver(inspect).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  global.addEventListener?.('pageshow',inspect);doc.addEventListener?.('visibilitychange',()=>{if(!doc.hidden)inspect()});
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08DeviceSecurityUx=Object.freeze({inspect,challengeVisible});
})(typeof window!=='undefined'?window:globalThis);
