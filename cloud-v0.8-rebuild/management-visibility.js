/* ClubMatch Cloud v0.8 - keep Beheer out of view for read-only roles; server remains authority */
(function(global){
'use strict';
function canManage(state){return !!(state?.userAdmin?.can_manage_users||state?.userAdmin?.is_platform_admin||state?.context?.can_create_club||(state?.context?.clubs||[]).some(c=>c.can_manage))}
async function apply(){const app=global.ClubMatchV08ManagementApp,button=global.document?.getElementById?.('managementBtn');if(!app?.controller||!button)return false;try{await app.controller.loadAll();const allowed=canManage(app.controller.state);button.classList.toggle('hidden',!allowed);button.disabled=!allowed;button.dataset.v08Allowed=allowed?'1':'0';button.title=allowed?'Beheer clubs, teams en gebruikers':'';return true}catch(error){button.classList.add('hidden');button.disabled=true;return true}}
function install(){let tries=0;const timer=global.setInterval(async()=>{tries++;if(await apply()||tries>160)global.clearInterval(timer)},75)}
global.ClubMatchV08ManagementVisibility={canManage,apply};global.document?.addEventListener?.('DOMContentLoaded',install);
})(typeof window!=='undefined'?window:globalThis);
