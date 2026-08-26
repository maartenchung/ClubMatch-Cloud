/* ClubMatch Cloud v0.8 - lifecycle-triggered confirmed-state resync */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}

function createLifecycleSync(options={}){
  const runtime=options.runtime;invariant(runtime?.refresh,'runtime.refresh is required');
  const win=options.window||global,doc=options.document||global.document;
  const now=typeof options.now==='function'?options.now:()=>Date.now();
  const minGapMs=Math.max(100,Number(options.minGapMs)||750);
  let installed=false,lastRequestAt=-Infinity,inFlight=null,queuedReason=null;

  async function request(reason='lifecycle'){
    if(!runtime.activeMatchId)return runtime.viewModel;
    const at=now();
    if(inFlight){queuedReason=reason;return inFlight}
    if(at-lastRequestAt<minGapMs)return runtime.viewModel;
    lastRequestAt=at;
    inFlight=(async()=>{
      try{return await runtime.refresh(reason)}
      finally{
        inFlight=null;
        if(queuedReason){const next=queuedReason;queuedReason=null;Promise.resolve().then(()=>request(next)).catch(()=>{})}
      }
    })();
    return inFlight;
  }
  const onFocus=()=>request('focus').catch(()=>{});
  const onOnline=()=>request('online').catch(()=>{});
  const onPageShow=()=>request('pageshow').catch(()=>{});
  const onVisibility=()=>{if(!doc||doc.visibilityState==='visible')request('visible').catch(()=>{})};

  function install(){
    if(installed)return;installed=true;
    win?.addEventListener?.('focus',onFocus);win?.addEventListener?.('online',onOnline);win?.addEventListener?.('pageshow',onPageShow);doc?.addEventListener?.('visibilitychange',onVisibility);
  }
  function uninstall(){
    if(!installed)return;installed=false;
    win?.removeEventListener?.('focus',onFocus);win?.removeEventListener?.('online',onOnline);win?.removeEventListener?.('pageshow',onPageShow);doc?.removeEventListener?.('visibilitychange',onVisibility);
  }
  return Object.freeze({install,uninstall,request,get installed(){return installed}});
}
global.ClubMatchV08LifecycleSync={createLifecycleSync};
})(typeof window!=='undefined'?window:globalThis);
