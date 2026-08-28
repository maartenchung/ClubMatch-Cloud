/* ClubMatch Cloud v0.8 - compact event feed with match/analysis/audit views */
(function(global){
'use strict';
function createEventFeedUi(doc=global.document){
 if(!doc)return null;let mode='match',controls=null,observer=null,visibleLimit=12,more=null;
 const analytical=/schot|op doel|bal|pass|duel|onderschep|verover|kans|redding|overtreding|vrije trap|corner|ingooi/i;
 function classify(row){const type=row.dataset.eventType||'';if(type==='player_action'||type==='team_possession')return 'analysis';return analytical.test((row.textContent||'').toLowerCase())?'analysis':'match'}
 function rowsFor(all,type){return type==='all'?all:all.filter(row=>row.dataset.feedType===type)}
 function apply(){const timeline=doc.getElementById('v08Timeline');if(!timeline)return;const all=[...timeline.querySelectorAll('.v08TimelineRow')];all.forEach(row=>{row.dataset.feedType=classify(row)});const eligible=rowsFor(all,mode),show=new Set(eligible.slice(-visibleLimit));all.forEach(row=>row.classList.toggle('hidden',!show.has(row)));controls?.querySelectorAll('[data-feed]').forEach(b=>{const key=b.dataset.feed,count=rowsFor(all,key).length;b.classList.toggle('active',key===mode);const label=key==='match'?'Wedstrijd':key==='analysis'?'Analyse':'Alles';b.textContent=`${label} (${count})`});if(more){const older=Math.max(0,eligible.length-visibleLimit);more.classList.toggle('hidden',older===0);more.textContent=older?`Toon oudere gebeurtenissen (${older})`:''}}
 function mount(){const timeline=doc.getElementById('v08Timeline'),card=timeline?.closest('.card');if(!card)return;if(!controls){controls=doc.createElement('div');controls.className='controls';controls.style.marginBottom='8px';controls.innerHTML='<button type="button" class="secondary" data-feed="match">Wedstrijd</button><button type="button" class="secondary" data-feed="analysis">Analyse</button><button type="button" class="secondary" data-feed="all">Alles</button>';const heading=card.querySelector('h2');heading?.after(controls);more=doc.createElement('button');more.type='button';more.className='secondary hidden';more.style.cssText='margin-top:8px;width:100%';more.onclick=()=>{visibleLimit+=20;apply()};timeline.after(more);controls.querySelectorAll('[data-feed]').forEach(b=>b.onclick=()=>{mode=b.dataset.feed;visibleLimit=12;apply()})}if(!observer){observer=new MutationObserver(apply);observer.observe(timeline,{childList:true,subtree:true})}apply()}
 setTimeout(mount,0);return Object.freeze({mount,apply,get mode(){return mode}})
}
global.ClubMatchV08EventFeed={createEventFeedUi};
})(typeof window!=='undefined'?window:globalThis);
