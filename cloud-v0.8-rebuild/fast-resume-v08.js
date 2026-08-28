/* ClubMatch Cloud v0.8 - safe refresh acceleration: coalesce read-only startup calls */
(function(global){
'use strict';
const URL='https://fnbqyogbamufytcabfzm.supabase.co',KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const api=global.ClubMatchV08CloudClient;if(!api?.createClient)return;const client=api.createClient(URL,KEY);if(client.__v08FastResume)return;
const originalRpc=client.rpc.bind(client),prefetch=new Map();
function key(name,params){return `${name}:${JSON.stringify(params||{})}`}
function start(name,params={}){const k=key(name,params);if(!prefetch.has(k)){const p=Promise.resolve().then(()=>originalRpc(name,params)).finally(()=>setTimeout(()=>prefetch.delete(k),1500));prefetch.set(k,p)}return prefetch.get(k)}
client.rpc=function(name,params){const k=key(name,params);if(prefetch.has(k))return prefetch.get(k);return originalRpc(name,params)};
Object.defineProperty(client,'__v08FastResume',{value:true});
async function warm(){try{const session=(await client.auth.getSession()).data?.session;if(!session)return;start('get_my_team_seasons');start('get_my_open_matches');}catch(error){console.debug('ClubMatch fast-resume prefetch overgeslagen',error)}}
if(global.document?.readyState==='loading')global.document.addEventListener('DOMContentLoaded',warm,{once:true});else warm();
})(typeof window!=='undefined'?window:globalThis);
