/* ClubMatch Cloud v0.8 - device/tablet auth-state visibility without MFA assumptions */
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
    topStatus('Beveiligingscontrole geopend op dit apparaat. ClubMatch controleert de actuele sessiestatus; er wordt niet aangenomen dat 2FA is ingesteld.');
    if(!lastVisible){try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch{}}
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
