/* ClubMatch Cloud v0.8 - Realtime connection status indicator */
(function(global){
'use strict';
const doc=global.document;
let pill=null,last='fallback';
function ensure(){if(!doc)return null;if(pill?.isConnected)return pill;const anchor=doc.getElementById('v08Integrity')||doc.getElementById('v08ScoreCard');if(!anchor)return null;pill=doc.createElement('div');pill.id='v08RealtimeStatus';pill.setAttribute('role','status');pill.style.cssText='margin-top:6px;padding:6px 9px;border-radius:999px;display:inline-block;font-size:10px;font-weight:900;border:1px solid #e0c9ef;background:#faf7fd;color:#5d4770';anchor.after(pill);render(last);return pill}
function render(status,raw=''){last=status||'fallback';const el=ensure();if(!el)return;const offline=global.navigator?.onLine===false;if(offline){el.textContent='● Live sync · offline';el.style.background='#fff1f1';el.style.color='#8b1f1f';el.style.borderColor='#e2a2a2';return}if(last==='connected'){el.textContent='● Live sync · Realtime';el.style.background='#eaf7ee';el.style.color='#1f6638';el.style.borderColor='#9ed5ad'}else if(last==='connecting'){el.textContent='● Live sync · verbinden…';el.style.background='#eef7ff';el.style.color='#125a9e';el.style.borderColor='#b8d8f5'}else{el.textContent=`● Live sync · polling fallback${raw&&raw!=='UNAVAILABLE'?` · ${raw}`:''}`;el.style.background='#fff4dd';el.style.color='#704800';el.style.borderColor='#e3bd68'}}
function boot(){ensure();global.addEventListener?.('clubmatch:v08-realtime',event=>render(event?.detail?.status||'fallback',event?.detail?.rawStatus||''));global.addEventListener?.('clubmatch:v08-stopped',()=>render('fallback',''));global.addEventListener?.('online',()=>render(last));global.addEventListener?.('offline',()=>render(last))}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
global.ClubMatchV08RealtimeStatusUi={render,ensure,get status(){return last}};
})(typeof window!=='undefined'?window:globalThis);
