/* ClubMatch Cloud v0.8 - stable matchday UI 20260829.0510 */
(function(global){
'use strict';
const doc=global.document;
const BUILD='20260829.0510';
const MODE_KEY='clubmatch.v08.action.mode';
const OFFSET_PREFIX='clubmatch.v08.laf.offsets.';
let runtime=null,lastSnapshot=null,queued=false,contextMenuBound=false,offsetCacheKey='',offsetCache={},suppressTileClickUntil=0;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
const status=()=>String(lastSnapshot?.match?.status||'');
const isMatchOpen=()=>['live','halftime'].includes(status());
const isActionActive=()=>status()==='live'&&String(lastSnapshot?.state?.clock_status||'')==='running';
function setText(el,value){const next=String(value??'');if(el&&el.textContent!==next)el.textContent=next}
function periodLabel(value){return ({first_half:'Eerste helft',halftime:'Rust',second_half:'Tweede helft',extra_time:'Verlenging',penalties:'Strafschoppen',finished:'Afgelopen'}[value]||String(value||'—'))}
function findByPlayer(root,selector,id){return [...(root?.querySelectorAll?.(selector)||[])].find(node=>node.dataset.playerId===id)||null}
function renderStructureSignature(frame){
 const players=list=>(list||[]).map(p=>`${p.id}:${p.role||''}:${p.position||''}:${p.cssClass||''}`).join('|');
 const pitch=(frame?.pitch||[]).map(p=>`${p.id}:${p.position||''}:${p.cssClass||''}`).join('|');
 return [frame?.formationCode||'',players(frame?.field),players(frame?.bench),pitch].join('§');
}
function patchMetricCard(root,player){
 const card=findByPlayer(root,'.v08Player[data-player-id]',player.id);if(!card)return;
 const slots=card.querySelectorAll('.v08Metric');(player.metrics||[]).forEach((metric,index)=>{const slot=slots[index];if(!slot)return;slot.classList.toggle('active',!!metric.active);setText(slot.querySelector('span'),metric.label);setText(slot.querySelector('b'),metric.display)});
}
function ensureTimelineRow(root,row){
 let node=[...root.querySelectorAll('.v08TimelineRow')].find(item=>item.dataset.eventId===String(row.id));
 if(node)return node;
 node=doc.createElement('div');node.className='v08TimelineRow';node.dataset.eventId=String(row.id);node.innerHTML='<i class="v08EventDot"></i><b class="v08TimelineMinute"></b><div class="v08TimelineText"><strong class="v08TimelineLabel"></strong><span class="v08TimelineDescription"></span></div><small class="v08TimelineClock"></small>';return node
}
function patchTimeline(targetDoc,frame){
 const root=targetDoc.getElementById('v08Timeline');if(!root)return;
 const desired=[...(frame?.timeline||[])].reverse(),wanted=new Set(desired.map(row=>String(row.id)));
 desired.forEach((row,index)=>{const node=ensureTimelineRow(root,row);node.dataset.eventType=row.type||'';node.className=`v08TimelineRow tone-${row.tone||'neutral'}`;setText(node.querySelector('.v08TimelineMinute'),row.minuteLabel);setText(node.querySelector('.v08TimelineLabel'),row.label||'Gebeurtenis');setText(node.querySelector('.v08TimelineDescription'),row.description||'');setText(node.querySelector('.v08TimelineClock'),row.clock);const at=root.children[index]||null;if(at!==node)root.insertBefore(node,at)});
 [...root.querySelectorAll('.v08TimelineRow')].forEach(node=>{if(!wanted.has(String(node.dataset.eventId||'')))node.remove()});
 const newest=desired[0]?.id?String(desired[0].id):'';if(newest&&root.dataset.cmNewestId!==newest){root.dataset.cmNewestId=newest;root.scrollTop=0}
}
function patchDynamicRenderer(targetDoc,frame){
 const s=frame?.scoreboard||{};
 setText(targetDoc.getElementById('v08Clock'),frame?.clock||'0:00');setText(targetDoc.getElementById('v08Score'),s.display||'0–0');
 const breakWrap=targetDoc.getElementById('v08BreakClockWrap'),breakClock=targetDoc.getElementById('v08BreakClock');setText(breakClock,frame?.breakClock||'0:00');breakWrap?.classList.toggle('hidden',!frame?.breakActive);
 const pauseWrap=targetDoc.getElementById('v08PauseClockWrap'),pauseClock=targetDoc.getElementById('v08PauseClock');setText(pauseClock,frame?.pauseClock||'0:00');pauseWrap?.classList.toggle('hidden',!frame?.pauseActive);
 const injuryWrap=targetDoc.getElementById('v08InjuryClockWrap'),injuryClock=targetDoc.getElementById('v08InjuryClock');setText(injuryClock,Number(s.injuryTimeMinutes)>0?`+${s.injuryTimeMinutes} min · ${s.injuryClock} / ${s.injuryTimeMinutes}:00`:'');injuryWrap?.classList.toggle('hidden',!(Number(s.injuryTimeMinutes)>0&&s.period==='second_half'));
 const integrity=targetDoc.getElementById('v08Integrity');if(integrity){setText(integrity,`✓ Bevestigde Cloud-status · ${periodLabel(s.period)} · ${(frame?.field||[]).length} veld · ${(frame?.bench||[]).length} bank · ${frame?.formationCode||'—'} · wedstrijd ${frame?.clock||'0:00'}`);integrity.classList.add('ok')}
 const fieldRoot=targetDoc.getElementById('v08FieldTiles'),benchRoot=targetDoc.getElementById('v08BenchTiles');(frame?.field||[]).forEach(p=>patchMetricCard(fieldRoot,p));(frame?.bench||[]).forEach(p=>patchMetricCard(benchRoot,p));
 const livePitch=targetDoc.getElementById('v08Pitch');(frame?.pitch||[]).forEach(p=>{const node=findByPlayer(livePitch,'.v08PitchPlayer[data-player-id]',p.id);if(node)setText(node.querySelector('.v08PitchTime'),`Σ ${p.play} · ▶ ${p.current} · ↕ ${p.substitutions}`)});
 const pitchBench=targetDoc.getElementById('v08PitchBench');(frame?.bench||[]).forEach(p=>{const node=findByPlayer(pitchBench,'.v08PitchBenchPlayer[data-player-id]',p.id);if(node)setText(node.querySelector('.pbTime'),`Bank ${p.metrics?.[1]?.display||'0:00'} · huidige beurt ${p.metrics?.[3]?.display||'—'} · ↕ ${p.substitutionCount}×`)});
 const monitorRoot=targetDoc.getElementById('v08Monitor');(frame?.monitor||[]).forEach(row=>{const node=findByPlayer(monitorRoot,'.v08MonitorRow[data-player-id]',row.id);if(!node)return;setText(node.querySelector('.mCurrent'),row.currentStint);setText(node.querySelector('.mTotal'),row.total);setText(node.querySelector('.mChange'),row.lastChange||'—')});
 patchTimeline(targetDoc,frame)
}
function installNoFlickerRenderer(){
 const base=global.ClubMatchV08DomRenderer;if(!base?.createRenderer||base.__clubmatchNoFlicker)return false;
 const originalCreate=base.createRenderer;
 global.ClubMatchV08DomRenderer={...base,__clubmatchNoFlicker:true,createRenderer(targetDoc){const renderer=originalCreate(targetDoc);let signature='';return Object.freeze({render(frame){const next=renderStructureSignature(frame);if(next!==signature){signature=next;renderer.render(frame)}patchDynamicRenderer(targetDoc,frame);return frame},clear(){signature='';return renderer.clear()}})}};return true
}
installNoFlickerRenderer();
function ensureStyles(){
 if(!doc||doc.getElementById('v08TabletHotfixStyles'))return;
 const s=doc.createElement('style');s.id='v08TabletHotfixStyles';s.textContent=`
#v08LiveActionField[data-tablet-hotfix="1"][data-action-active="1"]{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important}
#v08LiveActionField[data-tablet-hotfix="1"][data-action-active="0"]{display:none!important}
#v08LiveMatchWorkspace.v08TabletMatchday{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;align-items:start!important}
#v08LiveMatchWorkspace.v08TabletMatchday>#v08LiveLineupColumn,#v08LiveMatchWorkspace.v08TabletMatchday>#v08LiveAnalystColumn{display:contents!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08BasisLineup{grid-column:1!important;grid-row:1!important;margin:0!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixPitchCard{grid-column:2!important;grid-row:1!important;margin:0!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08LiveActionFieldHost{grid-column:1/-1!important;grid-row:2!important;min-width:0!important;width:100%!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixMonitorCard{grid-column:1!important;grid-row:3!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixEventsCard{grid-column:2!important;grid-row:3!important;min-width:0!important}
#v08LiveMatchWorkspace.v08TabletMatchday #v08QuickRegistrationCard{grid-column:1/-1!important;grid-row:4!important;margin:0 0 12px!important;min-width:0!important}
.v08HotfixPitchCard #v08Pitch{overflow:hidden!important;padding:5px!important;min-width:0!important}.v08HotfixPitchCard .v08PitchSlot{width:106px!important;height:80px!important;min-height:80px!important;max-height:80px!important;box-sizing:border-box!important}.v08HotfixPitchCard .v08PitchPlayer{height:76px!important;min-height:76px!important;max-height:76px!important;padding:5px!important;overflow:hidden!important;box-sizing:border-box!important}.v08HotfixPitchCard .v08PitchName{font-size:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.v08HotfixPitchCard .v08PitchPos{font-size:9px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.v08HotfixPitchCard .v08PitchTime{font-size:8px!important;white-space:nowrap!important}.v08HotfixPitchCard .v08SlotLabel{font-size:7px!important;max-width:106px!important;overflow:hidden!important;text-overflow:ellipsis!important}
#v08LiveFormationControls{display:grid!important;grid-template-columns:minmax(160px,220px) auto minmax(180px,1fr)!important;gap:8px!important;align-items:end!important;margin:8px 0 10px!important;padding:10px!important;border:1px solid #d8c4ef!important;border-radius:12px!important;background:#faf7fd!important}#v08LiveFormationControls label{font-weight:900;color:#4b2672}#v08LiveFormationControls button{min-height:42px;border:0!important;border-radius:10px!important;background:#6f42c1!important;color:#fff!important;font-weight:900!important;padding:9px 12px!important}
#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:126px!important;height:56px!important;min-height:56px!important;max-height:56px!important;padding:6px 8px!important;border-radius:11px!important;transition:none!important;left:var(--cm-match-left)!important;top:var(--cm-match-top)!important;touch-action:none!important;cursor:grab!important;box-sizing:border-box!important}#v08LiveActionField .lafOwn:active,#v08LiveActionField .lafOpp:active{cursor:grabbing!important}#v08LiveActionField .lafName{font-size:11px!important;line-height:1.12!important}#v08LiveActionField .lafPos{font-size:8px!important;line-height:1.1!important}#v08LiveActionField .lafNo{font-size:11px!important}#v08LiveActionField .lafDir{font-size:10px!important;font-weight:900!important}
#v08QuickRegistrationCard{border:2px solid #d8c4ef!important;background:linear-gradient(180deg,#fff,#faf7fd)!important}#v08QuickRegistrationCard h2{margin-bottom:3px}#v08QuickRegistrationCard .v08QuickRegistrationHint{font-size:11px;color:#6b5877;margin-bottom:7px}#v08QuickRegistrationCard #v08PossessionBar{margin-top:0!important}
.v08ActionPausedNotice{grid-column:1/-1!important;padding:10px 12px;border:1px solid #e2c77e;border-radius:11px;background:#fff8e8;color:#765716;font-size:11px;font-weight:800;margin:0 0 12px}.v08ActionPausedNotice.hidden{display:none!important}
@media(pointer:coarse){#v08LiveActionField .lafActionDock button{min-height:52px!important}#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:128px!important;height:58px!important;min-height:58px!important;max-height:58px!important}#v08LiveFormationControls button{min-height:48px!important}}
@media(max-width:700px){#v08LiveMatchWorkspace.v08TabletMatchday{grid-template-columns:1fr!important}#v08LiveMatchWorkspace.v08TabletMatchday #v08BasisLineup,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixPitchCard,#v08LiveMatchWorkspace.v08TabletMatchday #v08LiveActionFieldHost,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixMonitorCard,#v08LiveMatchWorkspace.v08TabletMatchday .v08HotfixEventsCard,#v08LiveMatchWorkspace.v08TabletMatchday #v08QuickRegistrationCard{grid-column:1!important;grid-row:auto!important}.v08HotfixPitchCard .v08PitchSlot{width:98px!important;height:78px!important;min-height:78px!important;max-height:78px!important}.v08HotfixPitchCard .v08PitchPlayer{height:74px!important;min-height:74px!important;max-height:74px!important}#v08LiveActionField .lafOwn,#v08LiveActionField .lafOpp{width:100px!important;height:52px!important;min-height:52px!important;max-height:52px!important}#v08LiveFormationControls{grid-template-columns:1fr!important}#v08LiveFormationControls button{width:100%}}
`;
 doc.head.appendChild(s)
}
function stampBuild(){const badge=[...doc.querySelectorAll('.badge')].find(el=>/v0\.8.*build/i.test(el.textContent||''));if(badge)badge.textContent=`v0.8 ONTWIKKELING · build ${BUILD}`;if(global.__ClubMatchShellBoot)global.__ClubMatchShellBoot.build=BUILD;doc.documentElement.dataset.clubmatchBuild=BUILD}
function markWorkspace(){global.ClubMatchV08LiveWorkspace?.ensureWorkspace?.();const workspace=doc.getElementById('v08LiveMatchWorkspace');if(!workspace)return null;const basis=doc.getElementById('v08BasisLineup');if(basis&&basis.parentElement!==workspace)workspace.prepend(basis);workspace.classList.add('v08TabletMatchday');doc.getElementById('v08Pitch')?.closest('.card')?.classList.add('v08HotfixPitchCard');doc.getElementById('v08Monitor')?.closest('.card')?.classList.add('v08HotfixMonitorCard');doc.getElementById('v08Timeline')?.closest('.card')?.classList.add('v08HotfixEventsCard');return workspace}
function ensurePauseNotice(active){const host=doc.getElementById('v08LiveActionFieldHost');if(!host)return;let note=doc.getElementById('v08ActionPausedNotice');if(!note){note=doc.createElement('div');note.id='v08ActionPausedNotice';note.className='v08ActionPausedNotice hidden';host.appendChild(note)}note.textContent=status()==='halftime'?'Rust · Live Actieveld is tijdelijk verborgen. Na start tweede helft verschijnt het automatisch weer.':'Wedstrijd gepauzeerd · Live Actieveld is tijdelijk verborgen. Na hervatten verschijnt het automatisch weer.';note.classList.toggle('hidden',!!active)}
function forceActionField(){
 if(!isMatchOpen())return false;try{global.localStorage?.setItem(MODE_KEY,'analyst')}catch{}
 const api=global.ClubMatchV08AnalystLiveInput;let panel=doc.getElementById('v08LiveActionField');if(!panel&&api?.render){try{api.render()}catch(error){console.error('Live Actieveld render',error)}}panel=doc.getElementById('v08LiveActionField');if(!panel)return false;
 const active=isActionActive();panel.dataset.tabletHotfix='1';panel.dataset.matchupManaged='1';panel.dataset.actionActive=active?'1':'0';panel.classList.toggle('hidden',!active);ensurePauseNotice(active);if(active)bindActionTileDrag(panel);return active
}
function clampPitchSlots(){const pitch=doc.getElementById('v08Pitch');if(!pitch||pitch.clientWidth<120)return;const width=pitch.clientWidth;pitch.querySelectorAll('.v08PitchSlot').forEach(slot=>{const raw=parseFloat(slot.style.left);if(!Number.isFinite(raw))return;const half=(Math.max(78,slot.offsetWidth||106)/2+5)/width*100;const next=`${Number(clamp(raw,half,100-half).toFixed(2))}%`;if(slot.style.left!==next)slot.style.left=next})}
function posCode(node){const txt=String(node.querySelector('.lafPos')?.textContent||'').trim().toUpperCase();return txt.match(/^(GK|RB|RWB|RCB|CB|LCB|LB|LWB|RDM|LDM|DM|RM|RCM|CM|LCM|LM|AM|RW|LW|RST|ST|LST)\b/)?.[1]||''}
function opponentFormation(){return doc.querySelector('#lafOpponentFormation select')?.value||lastSnapshot?.match?.opponent_formation_code||'4-3-3'}
function tacticalY(slot,geom,side){if(!slot)return 50;if(slot.position==='GK')return side==='own'?91:7;const lastOut=Math.max(0,(geom?.rows?.length||2)-2),t=lastOut?clamp(slot.row,0,lastOut)/lastOut:0;return side==='own'?32+t*40:61-t*38}
function offsetKey(){return `${OFFSET_PREFIX}${runtime?.activeMatchId||lastSnapshot?.match?.id||'default'}`}
function loadOffsets(){const key=offsetKey();if(key===offsetCacheKey)return offsetCache;offsetCacheKey=key;try{offsetCache=JSON.parse(global.localStorage?.getItem(key)||'{}')||{}}catch{offsetCache={}}return offsetCache}
function saveOffsets(){try{global.localStorage?.setItem(offsetKey(),JSON.stringify(offsetCache||{}))}catch{}}
function tileKey(node){return node.classList.contains('lafOwn')?`own:${node.dataset.playerId||''}`:`opp:${node.dataset.oppId||''}`}
function actualPoint(node){return {x:parseFloat(node.style.getPropertyValue('--cm-match-left'))||50,y:parseFloat(node.style.getPropertyValue('--cm-match-top'))||50}}
function applyStoredOffset(node){const baseX=Number(node.dataset.cmBaseX||50),baseY=Number(node.dataset.cmBaseY||50),saved=loadOffsets()[tileKey(node)]||{},dx=Number(saved.dx)||0,dy=Number(saved.dy)||0,x=clamp(baseX+dx,8,92),y=clamp(baseY+dy,6,94);node.dataset.cmOffsetX=String(x-baseX);node.dataset.cmOffsetY=String(y-baseY);node.style.setProperty('--cm-match-left',`${Number(x.toFixed(2))}%`);node.style.setProperty('--cm-match-top',`${Number(y.toFixed(2))}%`);return {x,y}}
function setNodePoint(node,x,y){node.dataset.cmBaseX=String(clamp(x,8,92));node.dataset.cmBaseY=String(clamp(y,6,94));return applyStoredOffset(node)}
function syncOpponentState(node,x,y,position){const state=global.ClubMatchV08AnalystLiveInput?.state,oppId=node.dataset.oppId,opp=state?.opponents?.find?.(item=>item.id===oppId);if(!opp)return;opp.x=clamp(x,8,92);opp.y=clamp(y,6,94);opp.position=position}
function relayoutActionField(){
 const pitch=doc.querySelector('#v08LiveActionField #lafPitch');if(!pitch||pitch.clientWidth<200)return;
 const ownGeom=global.ClubMatchV08PitchLayout?.geometry?.(lastSnapshot?.match?.formation_code||'4-3-3'),oppGeom=global.ClubMatchV08PitchLayout?.geometry?.(opponentFormation());if(!ownGeom?.slots||!oppGeom?.slots)return;
 const ownMap=new Map(ownGeom.slots.map(s=>[s.position,s])),oppMap=new Map(oppGeom.slots.map(s=>[s.position,s]));
 pitch.querySelectorAll('.lafOwn').forEach(node=>{const slot=ownMap.get(posCode(node));if(slot)setNodePoint(node,slot.x,tacticalY(slot,ownGeom,'own'))});
 pitch.querySelectorAll('.lafOpp').forEach(node=>{const slot=oppMap.get(posCode(node));if(!slot)return;const actual=setNodePoint(node,100-slot.x,tacticalY(slot,oppGeom,'opp'));syncOpponentState(node,actual.x,actual.y,slot.position)});
 const dir=pitch.querySelector('.lafDir');if(dir&&dir.textContent!=='↑ ONS AANVALSRICHTING · DOEL TEGENSTANDER')dir.textContent='↑ ONS AANVALSRICHTING · DOEL TEGENSTANDER'
}
function bindActionTileDrag(panel){
 if(panel.dataset.cmTileDragBound==='1')return;panel.dataset.cmTileDragBound='1';let drag=null;
 panel.addEventListener('pointerdown',event=>{const node=event.target.closest?.('.lafOwn,.lafOpp');if(!node||event.button>0)return;const pitch=node.closest('#lafPitch');if(!pitch)return;const point=actualPoint(node);drag={node,pitch,pointerId:event.pointerId,startClientX:event.clientX,startClientY:event.clientY,startX:point.x,startY:point.y,moved:false};node.title='Tik = actie · sleep een klein stukje = visuele tactische verschuiving'});
 panel.addEventListener('pointermove',event=>{if(!drag||drag.pointerId!==event.pointerId)return;const dxPx=event.clientX-drag.startClientX,dyPx=event.clientY-drag.startClientY;if(!drag.moved&&Math.hypot(dxPx,dyPx)<6)return;drag.moved=true;event.preventDefault();try{drag.node.setPointerCapture?.(event.pointerId)}catch{}const x=clamp(drag.startX+dxPx/Math.max(1,drag.pitch.clientWidth)*100,8,92),y=clamp(drag.startY+dyPx/Math.max(1,drag.pitch.clientHeight)*100,6,94);drag.node.style.setProperty('--cm-match-left',`${Number(x.toFixed(2))}%`);drag.node.style.setProperty('--cm-match-top',`${Number(y.toFixed(2))}%`);const baseX=Number(drag.node.dataset.cmBaseX||50),baseY=Number(drag.node.dataset.cmBaseY||50);drag.node.dataset.cmOffsetX=String(x-baseX);drag.node.dataset.cmOffsetY=String(y-baseY);if(drag.node.classList.contains('lafOpp'))syncOpponentState(drag.node,x,y,posCode(drag.node))});
 const finish=event=>{if(!drag||drag.pointerId!==event.pointerId)return;if(drag.moved){const key=tileKey(drag.node);offsetCache=loadOffsets();offsetCache[key]={dx:Number(drag.node.dataset.cmOffsetX)||0,dy:Number(drag.node.dataset.cmOffsetY)||0};saveOffsets();suppressTileClickUntil=Date.now()+350;event.preventDefault()}try{drag.node.releasePointerCapture?.(event.pointerId)}catch{}drag=null};panel.addEventListener('pointerup',finish);panel.addEventListener('pointercancel',finish);panel.addEventListener('click',event=>{if(Date.now()>suppressTileClickUntil)return;if(event.target.closest?.('.lafOwn,.lafOpp')){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()}},true)
}
function installContextMenuGuard(){if(contextMenuBound)return;contextMenuBound=true;doc.addEventListener('contextmenu',event=>{if(event.target.closest?.('#v08Pitch .v08PitchPlayer,#v08Pitch .v08PitchSlot,#v08PitchBenchWrap .v08PitchBenchPlayer')){event.preventDefault();event.stopPropagation()}},true)}
function normalizeFormationControl(){doc.getElementById('v08LiveFormationControl')?.remove();const ctl=doc.getElementById('v08LiveFormationControls');if(!ctl)return false;const label=ctl.querySelector('label');if(label?.firstChild?.nodeType===3)label.firstChild.nodeValue='Formatie tijdens wedstrijd';return true}
function moveQuickRegistration(){const bar=doc.getElementById('v08PossessionBar'),workspace=doc.getElementById('v08LiveMatchWorkspace');if(!bar||!workspace)return false;let card=doc.getElementById('v08QuickRegistrationCard');if(!card){card=doc.createElement('section');card.id='v08QuickRegistrationCard';card.className='card';card.innerHTML='<h2>Snelle registratie</h2><div class="v08QuickRegistrationHint">Snelle acties en balbezit. Dit blok staat bewust onder Live monitoring en Gebeurtenissen, los van de Live veldopstelling.</div>';workspace.appendChild(card)}if(card.parentElement!==workspace)workspace.appendChild(card);if(bar.parentElement!==card)card.appendChild(bar);return true}
function sync(){if(!isMatchOpen())return;ensureStyles();markWorkspace();normalizeFormationControl();moveQuickRegistration();installContextMenuGuard();clampPitchSlots();forceActionField();if(isActionActive())relayoutActionField()}
function schedule(){if(queued)return;queued=true;(global.requestAnimationFrame||global.setTimeout)(()=>{queued=false;sync()},0)}
function onConfirmed(event){runtime=event?.detail?.runtime||runtime;lastSnapshot=event?.detail?.snapshot||runtime?.snapshot||lastSnapshot;if(isMatchOpen())schedule()}
function boot(){ensureStyles();stampBuild();installNoFlickerRenderer();installContextMenuGuard();global.addEventListener?.('clubmatch:v08-runtime-ready',event=>{runtime=event?.detail?.runtime||runtime});global.addEventListener?.('clubmatch:v08-confirmed',onConfirmed);global.addEventListener?.('pageshow',()=>{if(isMatchOpen())schedule()});global.addEventListener?.('resize',()=>{if(isMatchOpen())global.setTimeout?.(schedule,100)});doc?.addEventListener?.('change',event=>{if(event.target?.closest?.('#lafOpponentFormation select')&&isActionActive())schedule()},true)}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08TabletHotfix=Object.freeze({BUILD,sync,forceActionField,relayoutActionField,moveQuickRegistration,tacticalY,installNoFlickerRenderer});
})(typeof window!=='undefined'?window:globalThis);
