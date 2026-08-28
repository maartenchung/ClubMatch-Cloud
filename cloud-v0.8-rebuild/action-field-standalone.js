/* ClubMatch Cloud v0.8 - browser startup + shared Cloud client guard; Action Field UI retired */
(function(global){
'use strict';

function installStartupWatchdog(){
  const doc=global.document,el=doc?.getElementById?.('v08Status');
  if(!el)return;
  if(/Initialiseren/i.test(el.textContent||''))el.textContent='Sessie herstellen en actuele Cloud-status laden…';
  const isReady=()=>/gereed|✓|actief/i.test(el.textContent||'');
  global.setTimeout?.(()=>{
    if(!isReady()&&!/mislukt|startfout/i.test(el.textContent||'')){
      el.textContent='Hervatten duurt langer dan normaal · actuele Cloud-status wordt nog gecontroleerd…';
      el.classList?.remove?.('bad');
    }
  },8000);
  const fail=message=>{
    if(isReady())return;
    el.textContent=`Startfout: ${message||'onbekende browserfout'}`;
    el.classList?.add?.('bad');
  };
  global.addEventListener?.('error',event=>fail(event?.error?.message||event?.message));
  global.addEventListener?.('unhandledrejection',event=>fail(event?.reason?.message||event?.reason));
}

function installSharedClientGuard(){
  const api=global.ClubMatchV08CloudClient;
  if(!api?.createClient||api.__sharedBrowserClient)return;
  const original=api.createClient.bind(api);
  let shared=null;
  function createClient(url,key,options={}){
    const custom=options&&Object.keys(options).length>0;
    if(custom)return original(url,key,options);
    if(!shared)shared=original(url,key,options);
    return shared;
  }
  global.ClubMatchV08CloudClient={...api,createClient,__sharedBrowserClient:true};
  if(global.supabase)global.supabase.createClient=createClient;
}

installStartupWatchdog();
installSharedClientGuard();
global.ClubMatchV08BrowserBootstrap=Object.freeze({installStartupWatchdog,installSharedClientGuard});
})(typeof window!=='undefined'?window:globalThis);
