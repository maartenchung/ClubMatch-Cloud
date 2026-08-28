/* ClubMatch Cloud v0.8 - shared Cloud client guard; Action Field UI retired */
(function(global){
'use strict';
const doc=global.document;

function installSharedCloudClient(){
  const api=global.ClubMatchV08CloudClient;
  if(!api?.createClient||api.__sharedBrowserClient)return;
  const original=api.createClient.bind(api),registry=new Map();
  function createClient(url,key,options={}){
    const custom=!!(options?.fetch||options?.storage||options?.shared===false);
    if(custom)return original(url,key,options);
    const storageKey=options?.storageKey||'clubmatch-v08-session';
    const cacheKey=`${url}|${key}|${storageKey}`;
    if(registry.has(cacheKey))return registry.get(cacheKey);
    const client=original(url,key,options);registry.set(cacheKey,client);return client;
  }
  global.ClubMatchV08CloudClient={...api,__sharedBrowserClient:true,createClient};
  if(global.supabase&&typeof global.supabase==='object')global.supabase.createClient=createClient;
  global.__clubmatchV08CloudClientRegistry=registry;
}

function retireActionField(){doc?.getElementById?.('v08ActionField')?.remove?.()}
function boot(){retireActionField()}

/* Install synchronously, before DOMContentLoaded boots stabilization, Fast Resume and app.js. */
installSharedCloudClient();
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof window!=='undefined'?window:globalThis);
