/* ClubMatch Cloud v0.8 - lazy, single-flight management visibility */
(function(global){
'use strict';
let inFlight=null,retryTimer=null,installed=false;
function canManage(state){return !!(state?.userAdmin?.can_manage_users||state?.userAdmin?.is_platform_admin||state?.context?.can_create_club||(state?.context?.clubs||[]).some(c=>c.can_manage))}
async function apply(){
  if(inFlight)return inFlight;
  const app=global.ClubMatchV08ManagementApp,button=global.document?.getElementById?.('managementBtn');
  if(!app?.controller||!button)return false;
  inFlight=(async()=>{
    try{
      // Visibility only needs permissions. Never load team seasons or full Beheer data at app startup.
      await Promise.all([app.controller.loadContext(),app.controller.loadUserAdmin()]);
      const allowed=canManage(app.controller.state);
      button.classList.toggle('hidden',!allowed);button.disabled=!allowed;button.dataset.v08Allowed=allowed?'1':'0';button.title=allowed?'Beheer clubs, teams en gebruikers':'';
      return true;
    }catch(error){
      console.error('ClubMatch beheerrechten controleren mislukt',error);
      button.classList.add('hidden');button.disabled=true;button.dataset.v08Allowed='0';return true;
    }finally{inFlight=null}
  })();
  return inFlight;
}
function install(){
  if(installed)return;installed=true;
  let tries=0;
  const attempt=async()=>{
    retryTimer=null;tries++;
    const done=await apply();
    if(!done&&tries<40)retryTimer=global.setTimeout?.(attempt,100)||null;
  };
  retryTimer=global.setTimeout?.(attempt,0)||null;
}
global.ClubMatchV08ManagementVisibility={canManage,apply,get inFlight(){return inFlight},get retryTimer(){return retryTimer}};
if(global.document?.readyState==='loading')global.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(typeof window!=='undefined'?window:globalThis);
