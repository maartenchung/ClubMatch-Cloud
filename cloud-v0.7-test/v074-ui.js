(()=>{
const fmt074=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const css=document.createElement('style');
css.textContent=`
#liveIntegrity074{margin:8px 0 10px;padding:9px 11px;border-radius:10px;font-size:11px;font-weight:800;background:#eaf7ee;color:#1f6638;border:1px solid #9ed5ad}
#liveIntegrity074.bad{background:#fff1f1;color:#8b1f1f;border-color:#e2a2a2}
#fieldBoard .liveplayer,#benchBoard .liveplayer{min-height:122px!important;box-sizing:border-box!important}
.live074Grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:7px}
.live074Metric{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:42px;padding:5px;border-radius:8px;background:#f8f4fc;font-size:9px;color:#6b5877;text-align:center}.live074Metric b{font-size:14px;color:#301846;margin-top:2px}
.live074Metric.currentField{background:#eaf3ff}.live074Metric.currentBench{background:#fff4db}.live074Meta{display:flex;flex-wrap:wrap;gap:4px 6px;margin-top:6px;font-size:9px}.live074Meta span{padding:2px 5px;border-radius:999px;background:#f1e9f8}.live074Meta .stateField{background:#dbeafe;color:#174ea6;font-weight:900}.live074Meta .stateBench{background:#fff0cf;color:#785000;font-weight:900}
#livePitch .pitch074{font-size:8px;font-weight:900;background:rgba(255,255,255,.96);color:#301846;border-radius:6px;padding:2px 4px;margin-top:2px;white-space:nowrap;min-width:100px;box-sizing:border-box}
#rotation074{margin:8px 0;padding:10px;border:2px solid #d8c4ef;border-radius:12px;background:#fff;color:#4b2672;font-size:10px}.rot074Title{font-size:13px;font-weight:900;margin-bottom:6px}.rot074Row{display:grid;grid-template-columns:1.5fr .7fr .7fr .8fr;gap:6px;padding:5px 0;border-top:1px solid #eee}.rot074Head{font-weight:900;background:#faf7fd}.rot074Warn{color:#8a5a00;font-weight:900}
#legend074{display:flex;flex-wrap:wrap;gap:7px 12px;margin:7px 0;padding:8px 10px;border:1px solid #eadcf5;border-radius:10px;background:#faf7fd;color:#4b2672;font-size:10px}
@media(max-width:720px){.rot074Row{grid-template-columns:1.3fr .7fr .7fr}.rot074Row span:nth-child(4){display:none}#livePitch .pitch074{font-size:7px;min-width:92px}}
`;
document.head.appendChild(css);

function eventSecond074(e){return Math.max(0,Number(e.second??((e.minute||0)*60))||0)}
function unified074(){
  const snap=snapshot(),now=Math.max(0,Math.floor(rawActiveMs()/1000)),starters=new Set(state.starterIds||[]),map={};
  (state.selectedIds||[]).forEach(id=>map[id]={id,status:snap.open[id]!==undefined?'field':'bench',position:snap.positions?.[id]||'',playSec:(Number(snap.play?.[id])||0)*60,benchSec:(Number(snap.bench?.[id])||0)*60,started:starters.has(id),in:0,out:0,total:0,last:null,currentStart:0,currentSec:0,valid:true});
  const sim={};(state.selectedIds||[]).forEach(id=>sim[id]=starters.has(id)?'field':'bench');
  const subs=(state.events||[]).filter(e=>e.type==='WISSEL').slice().sort((a,b)=>eventSecond074(a)-eventSecond074(b)||((a.seq||0)-(b.seq||0)));
  for(const e of subs){
    const sec=Math.min(now,eventSecond074(e));
    const out=map[e.outId],inn=map[e.inId];
    if(out){out.out++;out.total++;out.last={dir:'UIT',minute:e.minute??Math.floor(sec/60),second:sec};if(sim[e.outId]!=='field')out.valid=false;sim[e.outId]='bench'}
    if(inn){inn.in++;inn.total++;inn.last={dir:'IN',minute:e.minute??Math.floor(sec/60),second:sec};if(sim[e.inId]!=='bench')inn.valid=false;sim[e.inId]='field'}
  }
  Object.values(map).forEach(x=>{
    const relevant=subs.filter(e=>x.status==='field'?e.inId===x.id:e.outId===x.id).sort((a,b)=>eventSecond074(a)-eventSecond074(b)).at(-1);
    if(relevant)x.currentStart=eventSecond074(relevant);
    else x.currentStart=0;
    x.currentSec=Math.max(0,now-x.currentStart);
    x.share=now?Math.round(100*x.playSec/now):0;
  });
  const fieldIds=Object.values(map).filter(x=>x.status==='field').map(x=>x.id),benchIds=Object.values(map).filter(x=>x.status==='bench').map(x=>x.id);
  const issues=[];
  if(fieldIds.length!==11)issues.push(`veld=${fieldIds.length} i.p.v. 11`);
  Object.values(map).forEach(x=>{if(!x.valid)issues.push(`${p(x.id)?.name||x.id}: ongeldige wisselvolgorde`);const total=x.playSec+x.benchSec;if(Math.abs(total-now)>90)issues.push(`${p(x.id)?.name||x.id}: speel+bank ${fmt074(total)} ≠ klok ${fmt074(now)}`)});
  return {snap,now,map,fieldIds,benchIds,issues};
}
function cardId074(card){if(card.dataset.playerId)return card.dataset.playerId;const n=(card.querySelector('.num')?.textContent||'').replace(/\D/g,'');const id=(state.selectedIds||[]).find(x=>String(p(x).number)===n)||'';if(id)card.dataset.playerId=id;return id}
function updateCards074(u){
  ['fieldBoard','benchBoard'].forEach(rootId=>{const root=document.getElementById(rootId);if(!root)return;[...root.children].forEach(card=>{const id=cardId074(card),x=u.map[id];if(!id||!x)return;let g=card.querySelector('.live074Grid');if(!g){g=document.createElement('div');g.className='live074Grid';g.innerHTML='<div class="live074Metric">Speeltijd<b></b></div><div class="live074Metric">Banktijd<b></b></div><div class="live074Metric currentField">Huidige veldbeurt<b></b></div><div class="live074Metric currentBench">Huidige bankbeurt<b></b></div>';card.appendChild(g)}const b=g.querySelectorAll('b');b[0].textContent=fmt074(x.playSec);b[1].textContent=fmt074(x.benchSec);b[2].textContent=x.status==='field'?fmt074(Math.min(x.currentSec,x.playSec)):'—';b[3].textContent=x.status==='bench'?fmt074(Math.min(x.currentSec,x.benchSec)):'—';let m=card.querySelector('.live074Meta');if(!m){m=document.createElement('div');m.className='live074Meta';card.appendChild(m)}m.innerHTML=`<span class="${x.status==='field'?'stateField':'stateBench'}">${x.status==='field'?'VELD':'BANK'}</span><span>${x.started?'BASIS':'RESERVE'}</span><span>${x.position||'—'}</span><span>IN ${x.in}×</span><span>UIT ${x.out}×</span><span>↕ ${x.total}×</span><span>${x.last?'laatste '+x.last.dir+' '+x.last.minute+"'":'geen wissel'}</span><span>veld ${x.share}%</span>`})})}
function updatePitch074(u){const pitch=document.getElementById('livePitch');if(!pitch)return;pitch.querySelectorAll('.slot').forEach(slot=>{const dot=slot.querySelector('.dot');if(!dot)return;const txt=[...dot.childNodes].find(n=>n.nodeType===3&&n.textContent.trim()),num=(txt?.textContent||'').replace(/\D/g,''),id=(state.selectedIds||[]).find(x=>String(p(x).number)===num),x=u.map[id];if(!x||x.status!=='field')return;let inf=slot.querySelector('.pitch074');if(!inf){inf=document.createElement('div');inf.className='pitch074';slot.appendChild(inf)}inf.textContent=`Σ ${fmt074(x.playSec)} · ▶ ${fmt074(Math.min(x.currentSec,x.playSec))} · ↕${x.total}`})}
function renderIntegrity074(u){let anchor=document.getElementById('livePlayerLegend070')||document.getElementById('benchBoard');if(!anchor)return;let box=document.getElementById('liveIntegrity074');if(!box){box=document.createElement('div');box.id='liveIntegrity074';anchor.after(box)}box.classList.toggle('bad',u.issues.length>0);box.textContent=u.issues.length?`⚠ Live status inconsistent: ${u.issues.slice(0,4).join(' · ')}${u.issues.length>4?' · …':''}`:`✓ Live status consistent · 11 veld · ${u.benchIds.length} bank · één gedeelde spelerstatus`;let l=document.getElementById('legend074');if(!l){l=document.createElement('div');l.id='legend074';box.after(l)}l.innerHTML='<b>Legenda:</b><span>Σ = totale speeltijd</span><span>▶ = huidige veldbeurt</span><span>↕ = totaal wisselmomenten</span><span>Speeltijd + banktijd hoort gelijk te zijn aan de effectieve wedstrijdtijd.</span>'}
function renderRotation074(u){let anchor=document.getElementById('liveIntegrity074');if(!anchor)return;let r=document.getElementById('rotation074');if(!r){r=document.createElement('div');r.id='rotation074';anchor.after(r)}const rows=Object.values(u.map).sort((a,b)=>b.currentSec-a.currentSec);r.innerHTML='<div class="rot074Title">Wisselmonitor · dezelfde live-status als veld en bank</div><div class="rot074Row rot074Head"><span>Speler</span><span>Status</span><span>Huidige beurt</span><span>Totaal</span></div>'+rows.map(x=>`<div class="rot074Row"><span>${p(x.id)?.name||x.id}</span><span>${x.status==='field'?'VELD':'BANK'}</span><span class="${x.status==='bench'&&x.currentSec>=900?'rot074Warn':''}">${fmt074(x.currentSec)}</span><span>${x.status==='field'?fmt074(x.playSec):fmt074(x.benchSec)}</span></div>`).join('')}
function tick074(){try{if(!state?.cloud||!state?.startMs)return;const u=unified074();updateCards074(u);updatePitch074(u);renderIntegrity074(u);renderRotation074(u)}catch(e){console.warn('v0.7.4',e)}}
setInterval(tick074,1000);setTimeout(tick074,250);
})();