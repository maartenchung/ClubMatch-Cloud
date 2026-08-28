/* ClubMatch Cloud v0.8 - safe refresh warmup; Action Field UI retired */
(function(global){
'use strict';
const doc=global.document;
const URL='https://fnbqyogbamufytcabfzm.supabase.co',KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
let warmStartup=()=>Promise.resolve();

function installSafeWarmStartup(){
  const api=global.ClubMatchV08CloudClient;
  if(!api?.createClient)return;
  const client=api.createClient(URL,KEY);
  warmStartup=async()=>{
    try{
      const session=(await client.auth.getSession()).data?.session;
      if(!session)return;
      await Promise.allSettled([
        client.rpc('get_my_team_seasons'),
        client.rpc('get_my_open_matches')
      ]);
    }catch(error){
      console.debug('ClubMatch veilige startup-warmup overgeslagen',error);
    }
  };
}

function retireActionField(){
  doc?.getElementById?.('v08ActionField')?.remove?.();
}

function boot(){
  installSafeWarmStartup();
  warmStartup();
  retireActionField();
  if(doc?.body)new MutationObserver(retireActionField).observe(doc.body,{childList:true,subtree:true});
}

installSafeWarmStartup();
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof window!=='undefined'?window:globalThis);
