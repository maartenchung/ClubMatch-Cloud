/* ClubMatch Cloud v0.8 - richer goal-type choices without changing goal RPC */
(function(global){
'use strict';
const doc=global.document;
const EXTRA=Object.freeze([['header','Kopbal'],['volley','Volley'],['tap_in','Intikker'],['long_shot','Afstandsschot'],['one_on_one','1-op-1'],['direct_free_kick','Directe vrije trap']]);
function augment(select){if(!select||select.dataset.v08GoalTypesExtended==='1')return false;const values=new Set([...select.options].map(o=>o.value));EXTRA.forEach(([value,label])=>{if(values.has(value))return;const option=doc.createElement('option');option.value=value;option.textContent=label;select.appendChild(option)});select.dataset.v08GoalTypesExtended='1';return true}
function apply(){augment(doc?.getElementById?.('goalType'));augment(doc?.getElementById?.('paGoalType'))}
function boot(){apply();if(global.MutationObserver&&doc?.body)new global.MutationObserver(apply).observe(doc.body,{childList:true,subtree:true})}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08GoalTypesUx=Object.freeze({EXTRA,apply});
})(typeof window!=='undefined'?window:globalThis);
