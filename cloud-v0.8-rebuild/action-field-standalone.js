/* ClubMatch Cloud v0.8 - standalone action-field bridge using ONE shared browser Cloud client */
(function(global){
'use strict';
const SUPABASE_URL='https://fnbqyogbamufytcabfzm.supabase.co';
const SUPABASE_KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
function installSharedClientGuard(){
 const api=global.ClubMatchV08CloudClient;if(!api?.createClient||api.__sharedBrowserClient)return;
 const original=api.createClient.bind(api);let shared=null;
 function createClient(url,key,options={}){const hasCustom=options&&Object.keys(options).length>0;if(hasCustom)return original(url,key,options);if(!shared)shared=original(url,key,options);return shared}
 global.ClubMatchV08CloudClient={...api,createClient,__sharedBrowserClient:true};
 if(global.supabase)global.supabase.createClient=createClient;
}
installSharedClientGuard();
function install(){
 if(!global.ClubMatchV08CloudClient?.createClient||!global.ClubMatchV08ActionField?.createActionFieldController||!global.ClubMatchV08ActionFieldUi?.createActionFieldUi)return false;
 if(global.ClubMatchV08ActionFieldApp)return true;
 const client=global.ClubMatchV08CloudClient.createClient(SUPABASE_URL,SUPABASE_KEY);let matchId='',controller=null,ui=null,refreshing=false,lastVersion='';
 async function fetchConfirmed(reason='poll'){
  if(!matchId||refreshing)return null;refreshing=true;
  try{const response=await client.rpc('get_match_snapshot',{p_match_id:matchId});if(response?.error)throw response.error;const snapshot=response?.data||null;const version=String(snapshot?.state?.state_version??'');if(version!==lastVersion||reason!=='poll'){lastVersion=version;controller.setSnapshot(snapshot)}if(!['poll','select'].includes(reason))global.document.getElementById('refreshLiveBtn')?.click();return snapshot}finally{refreshing=false}
 }
 const runtime=Object.freeze({refresh:fetchConfirmed,get activeMatchId(){return matchId}});
 controller=global.ClubMatchV08ActionField.createActionFieldController({client,runtime,onChange:state=>ui?.render?.(state)});
 ui=global.ClubMatchV08ActionFieldUi.createActionFieldUi({document:global.document,controller,run:async(label,fn)=>{try{return await fn()}catch(error){console.error(label,error);global.alert?.(`${label} mislukt: ${error.message||error}`);throw error}}});
 async function syncSelection(){const active=global.document.querySelector('.matchChoice.active'),next=active?.dataset?.matchId||'';if(next!==matchId){matchId=next;lastVersion='';if(!matchId){controller.setSnapshot(null);return}await fetchConfirmed('select');return}if(matchId&&global.document.visibilityState!=='hidden')await fetchConfirmed('poll')}
 const observer=new MutationObserver(()=>{syncSelection().catch(console.error)}),open=global.document.getElementById('openMatches');if(open)observer.observe(open,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
 global.document.addEventListener('visibilitychange',()=>{if(global.document.visibilityState==='visible')syncSelection().catch(console.error)});global.addEventListener?.('pageshow',()=>syncSelection().catch(console.error));global.addEventListener?.('online',()=>syncSelection().catch(console.error));
 const timer=global.setInterval(()=>syncSelection().catch(console.error),3000);syncSelection().catch(console.error);global.ClubMatchV08ActionFieldApp=Object.freeze({client,controller,ui,runtime,stop(){global.clearInterval(timer);observer.disconnect()}});return true
}
function boot(){let tries=0;const timer=global.setInterval(()=>{tries++;if(install()||tries>200)global.clearInterval(timer)},50)}
if(global.document?.readyState==='loading')global.document.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof window!=='undefined'?window:globalThis);
