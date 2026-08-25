(()=>{
function subStatsLayout064(){
  const map={},subs=(state?.events||[]).filter(e=>e.type==='WISSEL').sort((a,b)=>(a.minute-b.minute)||((a.seq||0)-(b.seq||0)));
  (state?.selectedIds||[]).forEach(id=>map[id]={in:0,out:0,total:0});
  subs.forEach(e=>{map[e.outId]??={in:0,out:0,total:0};map[e.inId]??={in:0,out:0,total:0};map[e.outId].out++;map[e.outId].total++;map[e.inId].in++;map[e.inId].total++;});
  return {map,last:subs.at(-1)||null};
}
function ensureLegend064(){
  const pitch=document.getElementById('livePitch');if(!pitch)return;
  let leg=document.getElementById('swapLegend064');
  if(!leg){
    leg=document.createElement('div');leg.id='swapLegend064';
    leg.innerHTML='<b>Legenda wissels:</b><span><i class="legendDot064 legendNone064"></i>nog niet gewisseld</span><span><i class="legendDot064 legendPast064"></i>eerder gewisseld</span><span><i class="legendDot064 legendIn064"></i>net IN</span><span><i class="legendDot064 legendOut064"></i>net UIT (bank)</span>';
    pitch.after(leg);
  }
}
function applyPitchSwapState064(ss){
  const pitch=document.getElementById('livePitch');if(!pitch)return;
  pitch.querySelectorAll('.slot').forEach(slot=>{
    slot.classList.remove('swapNone064','swapPast064','swapRecentIn064');
    const num=slot.querySelector('.dot')?.textContent?.trim();if(!num)return;
    const id=(state?.selectedIds||[]).find(x=>String(p(x).number)===num);if(!id)return;
    const st=ss.map[id]||{total:0};
    if(ss.last?.inId===id)slot.classList.add('swapRecentIn064');
    else if(st.total>0)slot.classList.add('swapPast064');
    else slot.classList.add('swapNone064');
  });
}
function applyCompactSwapBadges064(){
  if(!state?.startMs)return;
  const ss=subStatsLayout064();
  const roots=['fieldBoard','benchBoard'];
  roots.forEach(rootId=>{
    const root=document.getElementById(rootId);if(!root)return;
    const snap=snapshot();
    const ids=(state.selectedIds||[]).filter(id=>rootId==='fieldBoard'?(snap.open[id]!==undefined):(snap.open[id]===undefined)).sort((a,b)=>Number(p(a).number)-Number(p(b).number));
    [...root.children].forEach((card,i)=>{
      const id=ids[i];if(!id)return;
      card.querySelectorAll('.subInfo063,.swapChip064').forEach(x=>x.remove());
      const st=ss.map[id]||{in:0,out:0,total:0};
      if(!st.total)return;
      const chip=document.createElement('span');chip.className='swapChip064';
      if(ss.last?.inId===id){chip.classList.add('in');chip.textContent=`↑${st.in}`;chip.title=`${st.in}× ingewisseld`}
      else if(ss.last?.outId===id){chip.classList.add('out');chip.textContent=`↓${st.out}`;chip.title=`${st.out}× uitgewisseld`}
      else{chip.textContent=`↕${st.total}`;chip.title=`${st.total} wisselmoment(en)`}
      card.appendChild(chip);
    });
  });
  applyPitchSwapState064(ss);
  ensureLegend064();
}
setInterval(()=>{try{applyCompactSwapBadges064()}catch(e){}},800);
setTimeout(()=>{try{applyCompactSwapBadges064()}catch(e){}},100);
})();