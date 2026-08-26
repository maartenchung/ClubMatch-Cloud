/* ClubMatch Cloud v0.8 - koppelt correctie-UI losjes aan confirmed runtime-events */
(function(global){
'use strict';
let ui=null,runtime=null,busy=false;
function status(message,ok=false){const el=global.document?.getElementById('v08Status');if(!el)return;el.textContent=message;el.classList.toggle('ok',ok);el.classList.toggle('bad',!ok&&!!message)}
async function run(label,fn){if(busy)return;busy=true;const panel=global.document?.getElementById('v08Corrections');panel?.querySelectorAll('button').forEach(b=>b.disabled=true);status(`${label}…`);try{const result=await fn();status(`${label} ✓`,true);return result}catch(error){console.error(error);status(`${label} mislukt: ${error.message||error}`);return undefined}finally{busy=false;panel?.querySelectorAll('button').forEach(b=>b.disabled=false)}}
function attach(nextRuntime){runtime=nextRuntime;if(!runtime||!global.ClubMatchV08Corrections?.createCorrectionUi)return;ui=global.ClubMatchV08Corrections.createCorrectionUi({document:global.document,runtime,run});if(runtime.snapshot)ui.render(runtime.snapshot)}
global.addEventListener?.('clubmatch:v08-runtime-ready',event=>attach(event.detail?.runtime));
global.addEventListener?.('clubmatch:v08-confirmed',event=>{if(!ui&&event.detail?.runtime)attach(event.detail.runtime);ui?.render(event.detail?.snapshot)});
global.addEventListener?.('clubmatch:v08-stopped',()=>ui?.clear());
global.ClubMatchV08CorrectionBootstrap={attach,get runtime(){return runtime},get ui(){return ui}};
})(typeof window!=='undefined'?window:globalThis);
