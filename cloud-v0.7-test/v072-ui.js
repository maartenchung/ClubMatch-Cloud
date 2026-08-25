(()=>{
const fmtSec072=s=>{s=Math.max(0,Math.floor(Number(s)||0));const m=Math.floor(s/60),r=s%60;return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`};

const css=document.createElement('style');
css.textContent=`
/* v0.7.2: één vaste infobalk onder iedere speler op het veld */
#livePitch .pitchMin071,#livePitch .pitchSwap071{display:none!important}
#livePitch .pitchInfo072{font-size:8px;font-weight:900;line-height:1.15;background:rgba(255,255,255,.96);color:#301846;border-radius:6px;padding:2px 4px;margin-top:2px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15);min-width:102px;box-sizing:border-box}
#livePitch .slot.swapPast071 .pitchInfo072{background:#eadff5;color:#3b2055}
#livePitch .slot.swapIn071 .pitchInfo072{background:#dbeafe;color:#174ea6}

/* Live speel/bank-kaarten reserveren vanaf het begin vaste ruimte: geen layout-sprong */
#fieldBoard .liveplayer,#benchBoard .liveplayer{min-height:154px!important;box-sizing:border-box!important}
.stintGrid072{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:7px}
.stintMetric072{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:43px;padding:5px;border-radius:8px;background:#f8f4fc;text-align:center;font-size:9px;color:#6b5877;box-sizing:border-box}
.stintMetric072 b{font-size:14px;color:#301846;margin-top:2px;line-height:1.05}
.stintMetric072.nowField{background:#eaf3ff}.stintMetric072.nowField b{color:#174ea6}
.stintMetric072.nowBench{background:#fff4db}.stintMetric072.nowBench b{color:#785000}
.liveMeta072{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center;margin-top:6px;font-size:9px;color:#5e4b69}
.liveMeta072 span{padding:2px 5px;border-radius:999px;background:#f1e9f8;white-space:nowrap}
.liveMeta072 .basis{background:#e8dcf5;color:#4b2672;font-weight:900}.liveMeta072 .reserve{background:#eee;color:#555;font-weight:900}.liveMeta072 .last{background:#fff0cf;color:#6a531c}.liveMeta072 .impact{background:#eaf3ff;color:#174ea6}
#stintLegend072{display:flex;flex-wrap:wrap;gap:7px 12px;align-items:center;margin:7px 0 10px;padding:8px 10px;border:1px solid #eadcf5;border-radius:10px;background:#faf7fd;color:#4b2672;font-size:10px;line-height:1.35}
#stintLegend072 b{font-size:11px}
@media(max-width:720px){#livePitch .pitchInfo072{font-size:7px;min-width:94px}.stintGrid072{gap:4px}.stintMetric072{min-height:40px;padding:4px}.stintMetric072 b{font-size:13px}}
`;
document.head.appendChild(css);

/* Bewaar exacte match_second uit de Cloud snapshot bij de gemapte wissel-events. */
const applyBefore072=cloudApplyLiveSnapshot;
cloudApplyLiveSnapshot=function(snap){
  applyBefore072(snap);
  try{
    const raw=snap?.events||[],byId=Object.fromEntries(raw.map(e=>[e.id,e]));
    const corrections=raw.filter(e=>e.event_type==='substitution_corrected'&&e.target_event_id);
    (state?.events||[]).forEach(e=>{
      if(e.type!=='WISSEL'||!e.cloudEventId)return;
      const r=byId[e.cloudEventId],c=corrections.filter(x=>x.target_event_id===e.cloudEventId).at(-1);
      e.second=Number(c?.match_second??r?.match_second??((c?.match_minute??r?.match_minute??e.minute??0)*60))||0;
      e.occurredAt=c?.occurred_at||r?.occurred_at||null;
    });
  }catch(err){}
};

function liveStats072(){
  if(!state?.selectedIds)return {now:0,map:{}};
  const now=Math.max(0,Math.floor(rawActiveMs()/1000));
  const starter=new Set(state.starterIds||[]),map={};
  state.selectedIds.forEach(id=>map[id]={status:starter.has(id)?'field':'bench',segmentStart:0,play:0,bench:0,in:0,out:0,total:0,last:null,fieldStints:starter.has(id)?1:0,benchStints:starter.has(id)?0:1});
  const subs=(state.events||[]).filter(e=>e.type==='WISSEL').slice().sort((a,b)=>((Number(a.second??a.minute*60)||0)-(Number(b.second??b.minute*60)||0))||((a.seq||0)-(b.seq||0)));
  const close=(id,sec)=>{
    const x=map[id];if(!x)return;
    const d=Math.max(0,sec-x.segmentStart);
    if(x.status==='field')x.play+=d;else x.bench+=d;
    x.segmentStart=sec;
  };
  for(const e of subs){
    const sec=Math.max(0,Math.min(now,Number(e.second??e.minute*60)||0));
    if(map[e.outId]){close(e.outId,sec);const x=map[e.outId];x.status='bench';x.out++;x.total++;x.benchStints++;x.last={dir:'UIT',minute:e.minute??Math.floor(sec/60),second:sec}}
    if(map[e.inId]){close(e.inId,sec);const x=map[e.inId];x.status='field';x.in++;x.total++;x.fieldStints++;x.last={dir:'IN',minute:e.minute??Math.floor(sec/60),second:sec}}
  }
  Object.values(map).forEach(x=>{const d=Math.max(0,now-x.segmentStart);if(x.status==='field')x.play+=d;else x.bench+=d;x.current=d;x.share=now?Math.round(100*x.play/now):0});
  return {now,map};
}
function goalStats072(id){
  let goals=0,assists=0;
  (state?.events||[]).forEach(e=>{if(e.type==='GOAL'&&e.side==='home'){if(e.scorerId===id)goals++;if(e.assistId===id)assists++}});
  return {goals,assists};
}
function cardId072(card){
  if(card.dataset.playerId)return card.dataset.playerId;
  const n=(card.querySelector('.num')?.textContent||'').replace(/\D/g,'');
  const id=(state?.selectedIds||[]).find(x=>String(p(x).number)===n)||'';if(id)card.dataset.playerId=id;return id;
}
function updatePitch072(stats){
  const pitch=document.getElementById('livePitch');if(!pitch)return;
  pitch.querySelectorAll('.slot').forEach(slot=>{
    const dot=slot.querySelector('.dot');if(!dot)return;
    const first=[...dot.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
    const num=(first?.textContent||'').replace(/\D/g,'');
    const id=(state.selectedIds||[]).find(x=>String(p(x).number)===num);if(!id)return;
    const x=stats.map[id];if(!x||x.status!=='field')return;
    let info=slot.querySelector('.pitchInfo072');if(!info){info=document.createElement('div');info.className='pitchInfo072';slot.appendChild(info)}
    const text=`Σ ${fmtSec072(x.play)} · ▶ ${fmtSec072(x.current)} · ↕${x.total}`;
    if(info.textContent!==text)info.textContent=text;
  });
  let leg=document.getElementById('pitchLegend071');if(leg){
    leg.querySelectorAll('.extra072').forEach(x=>x.remove());
    leg.insertAdjacentHTML('beforeend','<span class="extra072">Σ = totale speeltijd</span><span class="extra072">▶ = huidige veldbeurt sinds laatste IN/start</span>');
  }
}
function ensureStintLegend072(){
  const live=document.getElementById('livePlayerLegend070');if(!live)return;
  let l=document.getElementById('stintLegend072');if(l)return;
  l=document.createElement('div');l.id='stintLegend072';
  l.innerHTML='<b>Live tijden:</b><span>Speeltijd totaal = alle veldbeurten samen</span><span>Huidige veldbeurt = tijd sinds start/laatste IN</span><span>Banktijd totaal = alle bankbeurten samen</span><span>Huidige bankbeurt = tijd sinds start op bank/laatste UIT</span><span>Veld% = aandeel van verstreken wedstrijd op het veld</span>';
  live.after(l);
}
function updateCards072(stats){
  ['fieldBoard','benchBoard'].forEach(rootId=>{
    const root=document.getElementById(rootId);if(!root)return;
    [...root.children].forEach(card=>{
      const id=cardId072(card),x=stats.map[id];if(!id||!x)return;
      const gs=goalStats072(id),starter=(state.starterIds||[]).includes(id);
      let grid=card.querySelector('.stintGrid072');if(!grid){grid=document.createElement('div');grid.className='stintGrid072';grid.innerHTML='<div class="stintMetric072 totalPlay">Speeltijd totaal<b></b></div><div class="stintMetric072 currentField">Huidige veldbeurt<b></b></div><div class="stintMetric072 totalBench">Banktijd totaal<b></b></div><div class="stintMetric072 currentBench">Huidige bankbeurt<b></b></div>';card.appendChild(grid)}
      grid.querySelector('.totalPlay b').textContent=fmtSec072(x.play);
      grid.querySelector('.totalBench b').textContent=fmtSec072(x.bench);
      const cf=grid.querySelector('.currentField'),cb=grid.querySelector('.currentBench');
      cf.classList.toggle('nowField',x.status==='field');cb.classList.toggle('nowBench',x.status==='bench');
      cf.querySelector('b').textContent=x.status==='field'?fmtSec072(x.current):'—';
      cb.querySelector('b').textContent=x.status==='bench'?fmtSec072(x.current):'—';
      let meta=card.querySelector('.liveMeta072');if(!meta){meta=document.createElement('div');meta.className='liveMeta072';card.appendChild(meta)}
      const last=x.last?`${x.last.dir} ${x.last.minute}'`:'nog geen wissel';
      meta.innerHTML=`<span class="${starter?'basis':'reserve'}">${starter?'BASIS':'RESERVE'}</span><span>IN ${x.in}×</span><span>UIT ${x.out}×</span><span>↕ ${x.total}×</span><span class="last">laatste ${last}</span><span class="impact">veld ${x.share}%</span><span>⚽ ${gs.goals} · 🅰 ${gs.assists}</span>`;
    });
  });
  ensureStintLegend072();
}
function tick072(){
  try{if(!state?.cloud||!state?.startMs)return;const s=liveStats072();updatePitch072(s);updateCards072(s)}catch(e){}
}
setInterval(tick072,1000);setTimeout(tick072,250);
})();