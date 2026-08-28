/* ClubMatch Cloud v0.8 - compact event feed filters */
(function(global){
'use strict';
function createEventFeedUi(doc=global.document){
 if(!doc)return null;let mode='match',controls=null,observer=null;
 const analytical=/schot|op doel|bal|pass|duel|onderschep|verover|kans|redding|overtreding|vrije trap|corner|ingooi/i;
 function classify(row){const text=(row.textContent||'').toLowerCase();return analytical.test(text)?'analysis':'match'}
 function apply(){const timeline=doc.getElementById('v08Timeline');if(!timeline)return;[...timeline.querySelectorAll('.v08TimelineRow')].forEach(row=>{row.dataset.feedType=classify(row);row.classList.toggle('hidden',mode!=='all'&&row.dataset.feedType!==mode)});controls?.querySelectorAll('[data-feed]').forEach(b=>b.classList.toggle('active',b.dataset.feed===mode))}
 function mount(){const timeline=doc.getElementById('v08Timeline'),card=timeline?.closest('.card');if(!card)return;if(!controls){controls=doc.createElement('div');controls.className='controls';controls.style.marginBottom='8px';controls.innerHTML='<button type="button" class="secondary" data-feed="match">Belangrijk</button><button type="button" class="secondary" data-feed="analysis">Snelle analyse</button><button type="button" class="secondary" data-feed="all">Alles</button>';const heading=card.querySelector('h2');heading?.after(controls);controls.querySelectorAll('[data-feed]').forEach(b=>b.onclick=()=>{mode=b.dataset.feed;apply()})}if(!observer){observer=new MutationObserver(apply);observer.observe(timeline,{childList:true,subtree:true})}apply()}
 setTimeout(mount,0);return Object.freeze({mount,apply,get mode(){return mode}})
}
global.ClubMatchV08EventFeed={createEventFeedUi};
})(typeof window!=='undefined'?window:globalThis);
