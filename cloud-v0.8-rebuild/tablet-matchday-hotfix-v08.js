/* ClubMatch Cloud v0.8 - stable tablet matchday layout 20260829.0420 */
(function(global){
'use strict';
const doc=global.document;
const BUILD='20260829.0420';
const MODE_KEY='clubmatch.v08.action.mode';
const FORMATIONS=['4-3-3','4-2-3-1','4-4-2','3-5-2','3-4-3','5-3-2'];
let runtime=null,lastSnapshot=null,queued=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const isLive=()=>['live','halftime'].includes(String(lastSnapshot?.match?.status||''));
function ensureStyles(){
 if(!doc||doc.getElementById('v08TabletHotfixStyles'))return;
 const s=doc.createElement('style');s.id='v08TabletHotfixStyles';s.textContent=`
#v08LiveActionField[data-tablet-hotfix="1"],#v08LiveActionField[data-tablet-hotfix="1"].hidden{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important}
#v08LiveMatchWorkspace.v08TabletMatchday{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;align-items:start!important}
#v08LiveMatchWorkspace.v08TabletMatchday>#v08LiveLineupColumn,#v08LiveMatchWorkspace.v08TabletMatchday>#v08LiveAnalystColumn{display:contents!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08BasisLineup{grid-column:1!important;grid-row:1!important;margin:0!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixPitchCard{grid-column:2!important;grid-row:1!important;margin:0!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08LiveActionFieldHost{grid-column:1/-1!important;grid-row:2!important;min-width:0!important;width:100%!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixMonitorCard{grid-column:1!important;grid-row:3!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixEventsCard{grid-column:2!important;grid-row:3!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08QuickRegistrationCard{grid-column:1/-1!important;grid-row:4!important;margin:0 0 12px!important;min-width:0!important}
.v08HotfixPitchCard #v08Pitch{overflow:hidden!important;padding:5px!important;min-width:0!important}.v08HotfixPitchCard .v08PitchSlot{width:104px!important;min-height:74px!important}.v08HotfixPitchCard .v08PitchPlayer{min-height:70px!important;padding:5px!important}.v08HotfixPitchCard .v08PitchName{font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.v08HotfixPitchCard .v08PitchPos{font-size:9px!important}.v08HotfixPitchCard .v08PitchTime{font-size:8px!important}.v08HotfixPitchCard .v08SlotLabel{font-size:7px!important;max-width:104px!important;overflow:hidden!important;text-overflow:ellipsis!important}
#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:126px!important;min-height:54px!important;padding:6px 8px!important;border-radius:11px!important;transition:none!important}#v08LiveActionField .lafName{font-size:11px!important;line-height:1.12!important}#v08LiveActionField .lafPos{font-size:8px!important;line-height:1.1!important}#v08LiveActionField .lafNo{font-size:11px!important}#v08LiveActionField .lafDir{font-size:10px!important;font-weight:900!important}
.v08LiveFormationControl{margin:8px 0 10px;padding:10px;border:1px solid #d8c4ef;border-radius:12px;background:#faf7fd}.v08LiveFormationControlHead{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}.v08LiveFormationControlHead b{color:#4b2672}.v08LiveFormationControlRow{display:grid;grid-template-columns:minmax(150px,220px) auto minmax(180px,1fr);gap:7px;align-items:center;margin-top:7px}.v08LiveFormationControl button{border:0;background:#6f42c1;color:#fff;font-weight:900;border-radius:10px;padding:10px 13px;min-height:42px}.v08LiveFormationStatus{font-size:10px;color:#6b5877}.v08LiveFormationStatus.ok{color:#1f6638}.v08LiveFormationStatus.bad{color:#8b1f1f}
#v08QuickRegistrationCard h2{margin-bottom:3px}#v08QuickRegistrationCard .v08QuickRegistrationHint{font-size:11px;color:#6b5877;margin-bottom:7px}#v08QuickRegistrationCard #v08PossessionBar{margin-top:0!important}
@media(pointer:coarse){#v08LiveActionField .lafActionDock button{min-height:52px!important}#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:128px!important;min-height:56px!important}.v08LiveFormationControl button{min-height:48px}}
@media(max-width:700px){#v08LiveMatchWorkspace.v08TabletMatchday{grid-template-columns:1fr!important}#v08LiveMatchWorkspace.v08TabletMatchday #v08BasisLineup,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixPitchCard,#v08LiveMatchWorkspace.v08TabletMatchday #v08LiveActionFieldHost,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixMonitorCard,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixEventsCard,#v08LiveMatchWorkspace.v08TabletMatchday #v08QuickRegistrationCard{grid-column:1!important;grid-row:auto!important}.v08HotfixPitchCard .v08PitchSlot{width:96px!important}#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:100px!important;min-height:48px!important}.v08LiveFormationControlRow{grid-template-columns:1fr}.v08LiveFormationControl button{width:100%}}
`;
 doc.head.appendChild(s)
}
function stampBuild(){const badge=[...doc.querySelectorAll('.badge')].find(el=>/v0\.8.*build/i.test(el.textContent||''));if(badge)badge.textContent=`v0.8 ONTWIKKELING · build ${BUILD}`;if(global.__ClubMatchShellBoot)global.__ClubMatchShellBoot.build=BUILD;doc.documentElement.dataset.clubmatchBuild=BUILD}
function markWorkspace(){
 global.ClubMatchV08LiveWorkspace?.ensureWorkspace?.();
 const workspace=doc.getElementById('v08LiveMatchWorkspace');if(!workspace)return null;
 const basis=doc.getElementById('v08BasisLineup');if(basis&&basis.parentElement!==workspace)workspace.prepend(basis);
 workspace.classList.add('v08TabletMatchday');doc.getElementById('v08Pitch')?.closest('.card')?.classList.add('v08HotfixPitchCard');doc.getElementById('v08Monitor')?.closest('.card')?.classList.add('v08HotfixMonitorCard');doc.getElementById('v08Timeline')?.closest('.card')?.classList.add('v08HotfixEventsCard');return workspace
}
function forceActionField(){
 if(!isLive())return false;
 try{global.localStorage?.setItem(MODE_KEY,'analyst')}catch{}
 const api=global.ClubMatchV08AnalystLiveInput;let panel=doc.getElementById('v08LiveActionField');
 if(!panel&&api?.render){try{api.render()}catch(error){console.error('Live Actieveld render',error)}}
 panel=doc.getElementById('v08LiveActionField');if(!panel)return false;panel.dataset.tabletHotfix='1';panel.classList.remove('hidden');return true
}
function clampPitchSlots(){const pitch=doc.getElementById('v08Pitch');if(!pitch||pitch.clientWidth<120)return;const width=pitch.clientWidth;pitch.querySelectorAll('.v08PitchSlot').forEach(slot=>{const raw=parseFloat(slot.style.left);if(!Number.isFinite(raw))return;const half=(Math.max(76,slot.offsetWidth||104)/2+5)/width*100;const next=`${Number(clamp(raw,half,100-half).toFixed(2))}%`;if(slot.style.left!==next)slot.style.left=next})}
function posCode(node){const txt=String(node.querySelector('.lafPos')?.textContent||'').trim().toUpperCase();return txt.match(/^(GK|RB|RWB|RCB|CB|LCB|LB|LWB|RDM|LDM|DM|RM|RCM|CM|LCM|LM|AM|RW|LW|RST|ST|LST)\b/)?.[1]||''}
function opponentFormation(){return doc.querySelector('#lafOpponentFormation select')?.value||'4-3-3'}
function tacticalY(slot,geom,side){
 if(!slot)return 50;if(slot.position==='GK')return side==='own'?91:7;
 const lastOut=Math.max(0,(geom?.rows?.length||2)-2),t=lastOut?clamp(slot.row,0,lastOut)/lastOut:0;
 return side==='own'?32+t*40:61-t*38
}
function setNodePoint(node,x,y){const left=`${Number(clamp(x,8,92).toFixed(2))}%`,top=`${Number(clamp(y,6,94).toFixed(2))}%`;if(node.style.left!==left)node.style.left=left;if(node.style.top!==top)node.style.top=top}
function relayoutActionField(){
 const pitch=doc.querySelector('#v08LiveActionField #lafPitch');if(!pitch||pitch.clientWidth<200)return;
 const ownGeom=global.ClubMatchV08PitchLayout?.geometry?.(lastSnapshot?.match?.formation_code||'4-3-3'),oppGeom=global.ClubMatchV08PitchLayout?.geometry?.(opponentFormation());if(!ownGeom?.slots||!oppGeom?.slots)return;
 const ownMap=new Map(ownGeom.slots.map(s=>[s.position,s])),oppMap=new Map(oppGeom.slots.map(s=>[s.position,s]));
 pitch.querySelectorAll('.lafOwn').forEach(node=>{const slot=ownMap.get(posCode(node));if(slot)setNodePoint(node,slot.x,tacticalY(slot,ownGeom,'own'))});
 pitch.querySelectorAll('.lafOpp').forEach(node=>{const slot=oppMap.get(posCode(node));if(slot)setNodePoint(node,100-slot.x,tacticalY(slot,oppGeom,'opp'))});
 const dir=pitch.querySelector('.lafDir');if(dir)dir.textContent='↑ ONS AANVALSRICHTING · DOEL TEGENSTANDER'
}
function nearestAssignments(code){
 const players=(lastSnapshot?.players||[]).filter(p=>p.selected&&p.is_on_field);if(players.length!==11)throw new Error(`Formatie wijzigen vereist 11 veldspelers; nu ${players.length}`);
 const oldGeom=global.ClubMatchV08PitchLayout?.geometry?.(lastSnapshot?.match?.formation_code||'4-3-3'),nextGeom=global.ClubMatchV08PitchLayout?.geometry?.(code);if(!oldGeom?.slots||!nextGeom?.slots||nextGeom.slots.length!==11)throw new Error('Formatiegeometrie ontbreekt');
 const oldMap=new Map(oldGeom.slots.map(s=>[s.position,s]));let targets=nextGeom.slots.slice(),assigned=[];const exact=[];
 for(const p of players){const position=p.current_position||p.starting_position||'',hit=targets.find(t=>t.position===position);if(hit){exact.push({player_id:p.player_id,position:hit.position});targets=targets.filter(t=>t.position!==hit.position)}}assigned.push(...exact);const used=new Set(exact.map(a=>a.player_id));
 const rest=players.filter(p=>!used.has(p.player_id)).sort((a,b)=>(oldMap.get(b.current_position||b.starting_position||'')?.y??50)-(oldMap.get(a.current_position||a.starting_position||'')?.y??50));
 for(const p of rest){const src=oldMap.get(p.current_position||p.starting_position||'')||{x:50,y:50};let best=targets[0],bestD=Infinity;for(const t of targets){const d=Math.hypot(src.x-t.x,src.y-t.y);if(d<bestD){best=t;bestD=d}}assigned.push({player_id:p.player_id,position:best.position});targets=targets.filter(t=>t.position!==best.position)}return assigned
}
function ensureFormationControl(){
 const card=doc.getElementById('v08Pitch')?.closest('.card');if(!card||card.querySelector('#v08LiveFormationControl'))return;
 const pitch=doc.getElementById('v08Pitch'),box=doc.createElement('div');box.id='v08LiveFormationControl';box.className='v08LiveFormationControl';box.innerHTML=`<div class="v08LiveFormationControlHead"><b>Formatie tijdens wedstrijd</b><span class="muted">Past de huidige 11 veldspelers aan; de historische basisopstelling blijft intact.</span></div><div class="v08LiveFormationControlRow"><select id="v08LiveFormationSelect">${FORMATIONS.map(f=>`<option value="${f}">${f}</option>`).join('')}</select><button id="v08LiveFormationApply" type="button">Formatie toepassen</button><span id="v08LiveFormationStatus" class="v08LiveFormationStatus"></span></div>`;card.insertBefore(box,pitch);
 const select=box.querySelector('#v08LiveFormationSelect'),button=box.querySelector('#v08LiveFormationApply'),status=box.querySelector('#v08LiveFormationStatus');select.value=lastSnapshot?.match?.formation_code||'4-3-3';button.onclick=async()=>{if(!runtime?.changeFormation)return;button.disabled=true;status.className='v08LiveFormationStatus';status.textContent='Formatie opslaan…';try{const code=select.value,assignments=nearestAssignments(code);await runtime.changeFormation({formationCode:code,assignments,updateBasis:false});status.className='v08LiveFormationStatus ok';status.textContent=`${code} toegepast ✓`}catch(error){console.error(error);status.className='v08LiveFormationStatus bad';status.textContent=error.message||String(error)}finally{button.disabled=false}}
}
function syncFormationControl(){const select=doc.getElementById('v08LiveFormationSelect');if(select&&doc.activeElement!==select)select.value=lastSnapshot?.match?.formation_code||'4-3-3'}
function moveQuickRegistration(){const bar=doc.getElementById('v08PossessionBar'),workspace=doc.getElementById('v08LiveMatchWorkspace');if(!bar||!workspace)return false;let card=doc.getElementById('v08QuickRegistrationCard');if(!card){card=doc.createElement('section');card.id='v08QuickRegistrationCard';card.className='card';card.innerHTML='<h2>Snelle registratie</h2><div class="v08QuickRegistrationHint">Acties en balbezit snel registreren. Dit staat bewust onder Live monitoring en Gebeurtenissen zodat de live veldopstellingen overzichtelijk blijven.</div>';workspace.appendChild(card)}if(bar.parentElement!==card)card.appendChild(bar);return true}
function sync(){if(!isLive())return;ensureStyles();markWorkspace();forceActionField();ensureFormationControl();syncFormationControl();moveQuickRegistration();clampPitchSlots();relayoutActionField()}
function schedule(){if(queued)return;queued=true;(global.requestAnimationFrame||global.setTimeout)(()=>{queued=false;sync()},0)}
function onConfirmed(event){runtime=event?.detail?.runtime||runtime;lastSnapshot=event?.detail?.snapshot||runtime?.snapshot||lastSnapshot;if(isLive())schedule()}
function boot(){ensureStyles();stampBuild();global.addEventListener?.('clubmatch:v08-runtime-ready',event=>{runtime=event?.detail?.runtime||runtime});global.addEventListener?.('clubmatch:v08-confirmed',onConfirmed);global.addEventListener?.('pageshow',()=>{if(isLive())schedule()});global.addEventListener?.('resize',()=>{if(isLive())global.setTimeout?.(schedule,100)});doc?.addEventListener?.('change',event=>{if(event.target?.closest?.('#lafOpponentFormation select')&&isLive())schedule()},true)}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08TabletHotfix=Object.freeze({BUILD,sync,forceActionField,relayoutActionField,nearestAssignments,moveQuickRegistration,tacticalY});
})(typeof window!=='undefined'?window:globalThis);
