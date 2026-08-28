/* ClubMatch Cloud v0.8 - compact event feed with live/all default + match/analysis filters */
(function(global){
'use strict';
function createEventFeedUi(doc=global.document){
 if(!doc)return null;let mode='all',controls=null,observer=null,visibleLimit=16,more=null;
 const analytical=/schot|op doel|bal|pass|duel|onderschep|verover|kans|redding|overtreding|vrije trap|corner|ingooi|buitenspel|penalty|voorzet/i;
 function classify(row){const type=row.dataset.eventType||'';if(type==='player_action'||type==='team_possession')return 'analysis';return analytical.test((row.textContent||'').toLowerCase())?'analysis':'match'}
 function rowsFor(all,type){return type==='all'?all:all.filter(row=>row.dataset.feedType===type)}
 function apply(){const timeline=doc.getElementById('v08Timeline');if(!timeline)return;const all=[...timeline.querySelectorAll('.v08TimelineRow')];all.forEach(row=>{row.dataset.feedType=classify(row)});const eligible=rowsFor(all,mode),show=new Set(eligible.slice(-visibleLimit));all.forEach(row=>row.classList.toggle('hidden',!show.has(row)));controls?.querySelectorAll('[data-feed]').forEach(b=>{const key=b.dataset.feed,count=rowsFor(all,key).length;b.classList.toggle('active',key===mode);const label=key==='match'?'Wedstrijd':key==='analysis'?'Analyse':'Alles';b.textContent=`${label} (${count})`});if(more){const older=Math.max(0,eligible.length-visibleLimit);more.classList.toggle('hidden',older===0);more.textContent=older?`Toon oudere gebeurtenissen (${older})`:''}}
 function select(next){mode=['match','analysis','all'].includes(next)?next:'all';visibleLimit=16;apply();return mode}
 function mount(){const timeline=doc.getElementById('v08Timeline'),card=timeline?.closest('.card');if(!card)return false;if(!controls){controls=doc.createElement('div');controls.className='controls';controls.style.marginBottom='8px';controls.innerHTML='<button type="button" class="secondary" data-feed="all">Alles</button><button type="button" class="secondary" data-feed="analysis">Analyse</button><button type="button" class="secondary" data-feed="match">Wedstrijd</button>';const heading=card.querySelector('h2');heading?.after(controls);const hint=doc.createElement('div');hint.className='muted';hint.style.marginBottom='7px';hint.textContent='Alles staat standaard aan, zodat snelle analistacties direct zichtbaar zijn. Filters verbergen alleen de weergave; niets wordt uit de historie verwijderd.';controls.after(hint);more=doc.createElement('button');more.type='button';more.className='secondary hidden';more.style.cssText='margin-top:8px;width:100%';more.onclick=()=>{visibleLimit+=24;apply()};timeline.after(more);controls.querySelectorAll('[data-feed]').forEach(b=>b.onclick=()=>select(b.dataset.feed))}if(!observer){observer=new MutationObserver(apply);observer.observe(timeline,{childList:true,subtree:true})}apply();return true}
 setTimeout(mount,0);return Object.freeze({mount,apply,select,get mode(){return mode}})
}
global.ClubMatchV08EventFeed={createEventFeedUi};
function boot(){let tries=0;const timer=global.setInterval(()=>{tries++;const ui=createEventFeedUi(global.document);if(ui?.mount?.()||tries>100)global.clearInterval(timer)},50)}
if(global.document?.readyState==='loading')global.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(typeof window!=='undefined'?window:globalThis);
