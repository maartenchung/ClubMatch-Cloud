/* ClubMatch Cloud v0.8 - persistent last notice + automatic deadline signal */
(function(global){
'use strict';
const doc=global.document,STORE='clubmatch.v08.last.notice';let box=null,text=null,actions=null,lastSignal='';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(e){const total=Math.max(0,(Number(e?.match_minute)||0)*60+(Number(e?.match_second)||0));return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`}
function ensure(){if(box?.isConnected)return box;const score=doc?.getElementById('v08ScoreCard');if(!score)return null;box=doc.createElement('div');box.id='v08LastNotice';box.style.cssText='margin-top:9px;padding:10px 12px;border-radius:11px;border:2px solid #d8c4ef;background:#faf7fd;color:#4b2672;font-size:12px;font-weight:800';box.innerHTML='<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;opacity:.7">Laatste melding</div><div id="v08LastNoticeText" style="margin-top:3px"></div><div id="v08LastNoticeActions" class="controls hidden" style="margin-top:8px"></div>';score.appendChild(box);text=box.querySelector('#v08LastNoticeText');actions=box.querySelector('#v08LastNoticeActions');try{const saved=global.sessionStorage?.getItem(STORE);if(saved)text.textContent=saved}catch{}return box}
function persist(message){try{global.sessionStorage?.setItem(STORE,String(message||''))}catch{}}
function show(message,tone='normal',{deadline=false}={}){if(!ensure()||!message)return;const value=String(message);text.textContent=value;persist(value);box.style.borderColor=tone==='danger'?'#b23a48':tone==='ok'?'#9ed5ad':tone==='amber'?'#e3bd68':'#d8c4ef';box.style.background=tone==='danger'?'#fff1f1':tone==='ok'?'#eaf7ee':tone==='amber'?'#fff8e8':'#faf7fd';box.style.color=tone==='danger'?'#8b1f1f':tone==='ok'?'#1f6638':tone==='amber'?'#704800':'#4b2672';actions.classList.toggle('hidden',!deadline);if(deadline){actions.innerHTML='<button type="button" data-notice-injury>+ Blessuretijd</button><button type="button" class="secondary" data-notice-finish>Wedstrijd beëindigen</button><button type="button" class="secondary" data-notice-events>Wedstrijdverloop</button>';actions.querySelector('[data-notice-injury]').onclick=()=>{const el=doc.getElementById('injuryMinutes');el?.scrollIntoView?.({behavior:'smooth',block:'center'});el?.focus?.()};actions.querySelector('[data-notice-finish]').onclick=()=>doc.querySelector('[data-clock="finish"]')?.scrollIntoView?.({behavior:'smooth',block:'center'});actions.querySelector('[data-notice-events]').onclick=()=>doc.getElementById('v08Timeline')?.scrollIntoView?.({behavior:'smooth',block:'center'})}}
function signalDeadline(event){const key=event?.id||event?.client_event_id||`${event?.match_minute}:${event?.match_second}`;if(key===lastSignal)return;lastSignal=key;try{global.navigator?.vibrate?.([250,120,250])}catch{}try{const C=global.AudioContext||global.webkitAudioContext;if(C){const ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=880;g.gain.value=.05;o.start();o.stop(ctx.currentTime+.18);o.onended=()=>ctx.close?.()}}catch{}}
function sortEvents(events){return [...(events||[])].sort((a,b)=>String(a?.occurred_at||a?.created_at||'').localeCompare(String(b?.occurred_at||b?.created_at||''))||((Number(a?.match_minute)||0)*60+(Number(a?.match_second)||0))-((Number(b?.match_minute)||0)*60+(Number(b?.match_second)||0)))}
function onConfirmed(detail){ensure();const snapshot=detail?.snapshot||{},events=sortEvents(snapshot.events),latest=events.at(-1);const stopIndex=events.map(e=>e.event_type).lastIndexOf('automatic_deadline_stop');if(stopIndex>=0){const stop=events[stopIndex],resolved=events.slice(stopIndex+1).some(e=>['injury_time_set','extra_time_started','penalties_started','match_finished','match_closed'].includes(e.event_type));if(!resolved&&snapshot?.match?.status!=='finished'){show(`⏱ Wedstrijdklok automatisch gestopt op ${fmt(stop)}. Kies nu blessuretijd, verlenging/strafschoppen of beëindig de wedstrijd.`,'danger',{deadline:true});signalDeadline(stop);return}}
 if(latest&&!['player_action','team_possession'].includes(latest.event_type)){const described=global.ClubMatchV08EventDescriber?.describeEvent?.(latest,Object.fromEntries((snapshot.players||[]).map(p=>[p.player_id,{name:p.display_name||p.full_name,shirt_number:p.shirt_number}])))||{};if(described.description)show(`${described.label||'Gebeurtenis'} · ${described.description}`,latest.event_type==='match_finished'?'ok':latest.event_type==='match_paused'?'amber':'normal')}
}
function watchStatus(){const status=doc?.getElementById('v08Status');if(!status)return;let last='';new MutationObserver(()=>{const value=(status.textContent||'').trim();if(!value||value===last)return;last=value;if(/gereed|laden|hervatten duurt|cloud-synchronisatie|live-status verversen|wedstrijden verversen/i.test(value))return;if(/✓|mislukt|gestopt|opgeslagen|toegevoegd|gewijzigd/i.test(value))show(value,/mislukt/i.test(value)?'danger':'ok')}).observe(status,{childList:true,subtree:true,characterData:true})}
function boot(){ensure();watchStatus();global.addEventListener?.('clubmatch:v08-confirmed',e=>onConfirmed(e.detail));global.addEventListener?.('clubmatch:v08-notice',e=>show(e?.detail?.message||'',e?.detail?.tone||'normal'))}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08LiveNotice={show};
})(typeof window!=='undefined'?window:globalThis);

/* ClubMatch Cloud v0.8 - Live Actieveld 4-3-3 default layout enhancer.
   Visual only: role/formation data and action coordinates stay unchanged. */
(function(global){
'use strict';
const doc=global.document;if(!doc)return;
let snapshot=null,runtime=null,queued=false;
const OWN_433=Object.freeze({
 LW:{x:22,y:29},ST:{x:50,y:25},RW:{x:78,y:29},
 LCM:{x:22,y:50},DM:{x:50,y:50},RCM:{x:78,y:50},
 LB:{x:15,y:81},LCB:{x:36,y:84},RCB:{x:64,y:84},RB:{x:85,y:81},
 GK:{x:50,y:93}
});
const OPP_433=Object.freeze({
 LW:{x:87,y:65},ST:{x:50,y:70},RW:{x:13,y:60},
 LCM:{x:86,y:41},DM:{x:50,y:39},RCM:{x:13,y:42},
 LB:{x:87,y:25},LCB:{x:69,y:22},RCB:{x:34,y:20},RB:{x:10,y:23},
 GK:{x:50,y:9}
});
function matchId(){return runtime?.activeMatchId||snapshot?.match?.id||null}
function hasSaved(side,id){const m=matchId();if(!m||!id)return false;try{return [`clubmatch.v08.laf.layout.${m}.${side}.${id}`,`clubmatch.v12.laf.layout.${m}.${side}.${id}`,`clubmatch.v11.laf.layout.${m}.${side}.${id}`,`clubmatch.v10.laf.layout.${m}.${side}.${id}`].some(k=>!!global.localStorage?.getItem(k))}catch{return false}}
function positionOfPlayer(id){const p=(snapshot?.players||[]).find(x=>x.player_id===id);return String(p?.current_position||p?.starting_position||'').toUpperCase()}
function setPoint(el,p){if(!el||!p)return;el.style.left=`${p.x}%`;el.style.top=`${p.y}%`}
function apply(){queued=false;const panel=doc.getElementById('v08LiveActionField');if(!panel||panel.classList.contains('layout'))return false;const snap=snapshot||runtime?.snapshot;if(!snap)return false;snapshot=snap;let changed=false;
 if(String(snap?.match?.formation_code||'4-3-3')==='4-3-3')panel.querySelectorAll('.lafOwn[data-player-id]').forEach(el=>{if(hasSaved('for',el.dataset.playerId))return;const p=OWN_433[positionOfPlayer(el.dataset.playerId)];if(p){setPoint(el,p);changed=true}});
 if(String(snap?.match?.opponent_formation_code||'4-3-3')==='4-3-3')panel.querySelectorAll('.lafOpp[data-opp-id]').forEach(el=>{if(hasSaved('against',el.dataset.oppId))return;const pos=String(el.querySelector('.lafPos')?.textContent||'').trim().toUpperCase(),p=OPP_433[pos];if(p){setPoint(el,p);changed=true}});
 if(changed){panel.dataset.defaultFormationLayout='4-3-3-screenshot';panel.querySelector('#lafPitch')?.setAttribute('data-default-formation','4-3-3')}
 return changed}
function schedule(){if(queued)return;queued=true;(global.requestAnimationFrame||global.setTimeout)(()=>{apply();global.setTimeout?.(apply,30)},0)}
function capture(e){runtime=e?.detail?.runtime||runtime;snapshot=e?.detail?.snapshot||runtime?.snapshot||snapshot;schedule()}
function bootLayout(){global.addEventListener?.('clubmatch:v08-runtime-ready',capture);global.addEventListener?.('clubmatch:v08-confirmed',capture);global.addEventListener?.('pageshow',schedule);doc.addEventListener('click',e=>{if(e.target.closest?.('#v08LiveActionField [data-layout],#v08LiveActionField [data-reset-layout]'))global.setTimeout?.(schedule,60)},true);new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes].some(n=>n?.nodeType===1&&(n.id==='v08LiveActionField'||n.querySelector?.('#v08LiveActionField')))))schedule()}).observe(doc.documentElement,{childList:true,subtree:true});schedule()}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',bootLayout,{once:true});else bootLayout();
global.ClubMatchV08ActionFieldDefault433=Object.freeze({apply,schedule,own:OWN_433,opponent:OPP_433});
})(typeof window!=='undefined'?window:globalThis);
