(()=>{
const style=document.createElement('style');
style.textContent=`
/* v0.7.1 live veld: vaste overlays, alleen inhoud/kleur verandert */
#livePitch .slot{min-width:68px}
#livePitch .dot{position:relative!important}
#livePitch .pitchMin071,#livePitch .pitchSwap071{position:absolute;z-index:6;display:flex;align-items:center;justify-content:center;height:18px;min-width:28px;padding:0 4px;border-radius:999px;font-size:9px;font-weight:900;line-height:1;background:#fff;color:#301846;border:2px solid #d8c4ef;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.18);pointer-events:none}
#livePitch .pitchMin071{left:-20px;top:-11px}
#livePitch .pitchSwap071{right:-25px;top:-11px}
#livePitch .slot.swapNever071 .dot{background:#fff!important;color:#4b2672!important;outline:3px solid rgba(255,255,255,.96)!important;outline-offset:2px}
#livePitch .slot.swapPast071 .dot{background:#6f42c1!important;color:#fff!important;outline:4px solid #d8c4ef!important;outline-offset:2px}
#livePitch .slot.swapIn071 .dot{background:#1976d2!important;color:#fff!important;outline:4px solid #b9d9ff!important;outline-offset:2px}
#livePitch .slot.swapNever071 .pitchName{background:#fff!important;color:#301846!important}
#livePitch .slot.swapPast071 .pitchName{background:#eadff5!important;color:#3b2055!important}
#livePitch .slot.swapIn071 .pitchName{background:#dbeafe!important;color:#174ea6!important}
#livePitch .slot.swapPast071 .pitchSwap071{background:#eadff5;color:#4b2672;border-color:#b99bd7}
#livePitch .slot.swapIn071 .pitchSwap071{background:#dbeafe;color:#174ea6;border-color:#7fb3ef}
#pitchLegend071{display:flex;flex-wrap:wrap;gap:7px 12px;align-items:center;margin:9px 0;padding:8px 10px;border:1px solid #eadcf5;border-radius:10px;background:#faf7fd;color:#4b2672;font-size:10px;line-height:1.35}
#pitchLegend071 b{font-size:11px}.legendDot071{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px;border:1px solid rgba(36,22,51,.2)}.legendNever071{background:#fff}.legendPast071{background:#6f42c1}.legendIn071{background:#1976d2}.legendOut071{background:#d39118}

/* speel/bank: ook 0 wissels zichtbaar zonder extra layouthoogte */
.swap070{display:flex!important}.swap070:not(.show)::before{content:'↕ 0×'}

/* dashboard controls exact op één lijn */
#seasonView details .grid3{align-items:stretch!important}
#seasonView details .grid3>label{display:flex!important;flex-direction:column!important;height:100%!important;margin:0!important}
#seasonView details .grid3>label>select{margin-top:auto!important;height:42px!important;min-height:42px!important;box-sizing:border-box!important}

/* dashboardtegels: cijfers centraal, labels rustig, relevante uitschieters accent */
#tilesWrap .tileMetric{text-align:center!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;min-height:58px!important;line-height:1.15!important}
#tilesWrap .tileMetric b{text-align:center!important;font-size:17px!important;line-height:1.05!important}
#tilesWrap .tileMetric.standout071{background:#fff6d8!important;border:1px solid #e3bf52!important;box-shadow:inset 0 0 0 1px rgba(211,169,39,.10)}
#tilesWrap .tileMetric.standout071 b{color:#6a4b00!important}
@media(max-width:720px){#livePitch .pitchMin071{left:-17px}#livePitch .pitchSwap071{right:-21px}#seasonView details .grid3>label>select{height:44px!important;min-height:44px!important}}
`;
document.head.appendChild(style);

function subs071(){
 const map={},subs=(state?.events||[]).filter(e=>e.type==='WISSEL').slice().sort((a,b)=>(a.minute-b.minute)||((a.seq||0)-(b.seq||0)));
 (state?.selectedIds||[]).forEach(id=>map[id]={in:0,out:0,total:0});
 for(const e of subs){
   map[e.outId]??={in:0,out:0,total:0};map[e.inId]??={in:0,out:0,total:0};
   map[e.outId].out++;map[e.outId].total++;map[e.inId].in++;map[e.inId].total++;
 }
 return {map,last:subs.at(-1)||null};
}
function pitchPlayer071(slot){
 const dot=slot.querySelector('.dot');if(!dot)return '';
 const first=[...dot.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
 const num=(first?.textContent||'').trim().replace(/\D/g,'');
 return (state?.selectedIds||[]).find(id=>String(p(id).number)===num)||'';
}
function ensurePitchLegend071(){
 const pitch=document.getElementById('livePitch');if(!pitch)return;
 let l=document.getElementById('pitchLegend071');if(l)return;
 l=document.createElement('div');l.id='pitchLegend071';
 l.innerHTML='<b>Live opstelling:</b><span><i class="legendDot071 legendNever071"></i>nog niet gewisseld</span><span><i class="legendDot071 legendPast071"></i>al gewisseld</span><span><i class="legendDot071 legendIn071"></i>net IN</span><span><i class="legendDot071 legendOut071"></i>net UIT = oranje bij bank</span><span>23m = speeltijd</span><span>↕2 = 2 wisselmomenten</span>';
 pitch.after(l);
}
function updatePitch071(){
 if(!state?.cloud||!state?.startMs)return;
 const pitch=document.getElementById('livePitch');if(!pitch)return;
 let snap;try{snap=snapshot()}catch(e){return}
 const ss=subs071();
 pitch.querySelectorAll('.slot').forEach(slot=>{
   const id=pitchPlayer071(slot);if(!id)return;
   const st=ss.map[id]||{total:0};
   slot.classList.toggle('swapNever071',st.total===0);
   slot.classList.toggle('swapPast071',st.total>0&&ss.last?.inId!==id);
   slot.classList.toggle('swapIn071',ss.last?.inId===id);
   const dot=slot.querySelector('.dot');
   let min=dot.querySelector('.pitchMin071');if(!min){min=document.createElement('span');min.className='pitchMin071';dot.appendChild(min)}
   let sw=dot.querySelector('.pitchSwap071');if(!sw){sw=document.createElement('span');sw.className='pitchSwap071';dot.appendChild(sw)}
   const m=(snap.play?.[id]||0)+'m',w='↕'+st.total;
   if(min.textContent!==m)min.textContent=m;
   if(sw.textContent!==w)sw.textContent=w;
 });
 ensurePitchLegend071();
}

function s071(x,k){
 const present=Number(x.present)||0,absent=Number(x.absent)||0,selected=Number(x.selected)||0,starts=Number(x.starts)||0,play=Number(x.play)||0,goals=Number(x.goals)||0,assists=Number(x.assists)||0;
 const pct=(a,b)=>b>0?Math.round(100*a/b):0,one=n=>Math.round(n*10)/10;
 return {play,goals,assists,ga:goals+assists,startPct:pct(starts,selected),attPct:pct(present,present+absent),g80:play?one(goals*80/play):0,a80:play?one(assists*80/play):0,ga80:play?one((goals+assists)*80/play):0}[k]??0;
}
function enhanceDashboard071(){
 const tiles=document.getElementById('tilesWrap'),players=cloudDashboardData?.players||[];if(!tiles||!players.length)return;
 const max={};['play','goals','assists','ga','ga80'].forEach(k=>max[k]=Math.max(...players.map(x=>Number(s071(x,k))||0)));
 [...tiles.children].forEach(tile=>{
   const title=tile.querySelector('.tileName')?.textContent||'';
   const x=players.find(p=>title.includes(String(p.name)));if(!x)return;
   const metrics=[...tile.querySelectorAll('.tileMetric')];
   if(metrics[0]){
     const b=metrics[0].querySelector('b');
     [...metrics[0].childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>{if(n.textContent.trim()==='Speel')n.textContent='Speeltijd'});
     if(b&&String(b.textContent).endsWith('min')===false)b.textContent=b.textContent;
   }
   const keys=['play','bench','goals','assists','ga','startPct','attPct','subApps','g80','a80','ga80','minGA'];
   metrics.forEach((m,i)=>{
     const k=keys[i];
     const standout=['play','goals','assists','ga','ga80'].includes(k)&&max[k]>0&&Number(s071(x,k))===Number(max[k]);
     m.classList.toggle('standout071',standout);
     if(standout)m.title='Uitschieter binnen de huidige dashboardselectie';else m.removeAttribute('title');
   });
 });
}

const priorRender071=renderCloudSeason;
renderCloudSeason=function(){priorRender071();setTimeout(enhanceDashboard071,0)};
function tick071(){try{updatePitch071();enhanceDashboard071()}catch(e){}}
setInterval(tick071,1000);setTimeout(tick071,200);
})();