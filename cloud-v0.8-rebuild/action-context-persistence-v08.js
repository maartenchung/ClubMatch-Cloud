/* ClubMatch Cloud v0.8 - non-blocking event-context persistence and retry queue */
(function(global){
'use strict';
const STORAGE_KEY='clubmatch.v08.pending-event-context.v1',MAX_QUEUE=80;
function createPersistence(options={}){
 const client=options.client;if(!client?.rpc)throw new Error('Cloud-client is verplicht voor actiecontext');const storage=options.storage||global.localStorage;let flushing=false;
 function load(){try{const rows=JSON.parse(storage?.getItem(STORAGE_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}}
 function save(rows){try{storage?.setItem(STORAGE_KEY,JSON.stringify(rows.slice(-MAX_QUEUE)))}catch{}}
 function key(item){return `${item.matchId}|${item.clientEventId}`}
 function queue(item){const rows=load(),k=key(item),index=rows.findIndex(x=>key(x)===k),next={...item,attempts:(index>=0?Number(rows[index].attempts)||0:0),queuedAt:Date.now()};if(index>=0)rows[index]={...rows[index],...next,context:{...(rows[index].context||{}),...(item.context||{})}};else rows.push(next);save(rows);return next}
 async function send(item){const result=await client.rpc('enrich_match_event_context_v08',{p_match_id:item.matchId,p_client_event_id:item.clientEventId,p_context:item.context||{}});if(result?.error)throw result.error;try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-context-synced',{detail:{...item,result:result?.data}}))}catch{}return result?.data}
 async function persist(item,{queueOnError=true}={}){if(!item?.matchId||!item?.clientEventId)return null;try{return await send(item)}catch(error){if(queueOnError)queue({...item,attempts:(Number(item.attempts)||0)+1});try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-context-pending',{detail:{...item,error:error?.message||String(error)}}))}catch{}if(!queueOnError)throw error;return null}}
 function after(primaryPromise,itemProvider){Promise.resolve(primaryPromise).then(()=>{const item=typeof itemProvider==='function'?itemProvider():itemProvider;if(item)persist(item).catch(()=>{})}).catch(error=>{try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-action-sync-failed',{detail:{error:error?.message||String(error)}}))}catch{}});return primaryPromise}
 async function flush(){if(flushing)return;flushing=true;try{const rows=load(),keep=[];for(const item of rows){try{await send(item)}catch{keep.push({...item,attempts:(Number(item.attempts)||0)+1})}}save(keep)}finally{flushing=false}}
 function pendingCount(){return load().length}
 global.addEventListener?.('online',()=>flush().catch(()=>{}));global.addEventListener?.('clubmatch:v08-confirmed',()=>{if(pendingCount())flush().catch(()=>{})});
 return Object.freeze({persist,after,flush,queue,get pendingCount(){return pendingCount()}})
}
global.ClubMatchV08ActionContextPersistence=Object.freeze({createPersistence,STORAGE_KEY,MAX_QUEUE});
})(typeof window!=='undefined'?window:globalThis);
