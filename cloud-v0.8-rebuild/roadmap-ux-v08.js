/* ClubMatch Cloud v0.8 - shared Cloud client guard + additive v0.8 enhancement loader */
(function(global){
'use strict';
const doc=global.document;
function installSharedCloudClient(){const api=global.ClubMatchV08CloudClient;if(!api?.createClient||api.__sharedBrowserClient)return;const original=api.createClient.bind(api),registry=new Map();function createClient(url,key,options={}){const custom=!!(options?.fetch||options?.storage||options?.shared===false);if(custom)return original(url,key,options);const storageKey=options?.storageKey||'clubmatch-v08-session',cacheKey=`${url}|${key}|${storageKey}`;if(registry.has(cacheKey))return registry.get(cacheKey);const client=original(url,key,options);registry.set(cacheKey,client);return client}global.ClubMatchV08CloudClient={...api,__sharedBrowserClient:true,createClient};if(global.supabase&&typeof global.supabase==='object')global.supabase.createClient=createClient;global.__clubmatchV08CloudClientRegistry=registry}
function retireActionField(){doc?.getElementById?.('v08ActionField')?.remove?.()}
function loadEnhancement(src,id){if(!doc||doc.getElementById(id))return;const script=doc.createElement('script');script.id=id;script.src=src;script.async=false;script.onerror=()=>{const status=doc.getElementById('v08Status');if(status){status.textContent=`Module kon niet laden: ${src}`;status.classList.add('bad')}};doc.head.appendChild(script)}
function boot(){retireActionField();loadEnhancement('matchday-critical-v08.js?v=20260829.0340','v08MatchdayCriticalLoader');loadEnhancement('dashboard-experience-v08.js?v=20260829.0340','v08DashboardExperienceLoader')}
installSharedCloudClient();
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof window!=='undefined'?window:globalThis);
