(()=>{
const FAV_KEY='clubmatch_favorites_v064';
const getFavs=()=>{try{return new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]'))}catch(e){return new Set()}};
const saveFavs=s=>localStorage.setItem(FAV_KEY,JSON.stringify([...s]));

const style=document.createElement('style');
style.textContent=`
#matchClockCard.clockRunning064{border:3px solid #1976d2!important;background:#eef6ff!important;box-shadow:0 0 0 3px rgba(25,118,210,.10)}
#matchClockCard.clockRunning064 .clockValue{color:#135ca6!important}
.scoreBoard.liveActive064{border:3px solid #6f42c1!important;box-shadow:0 0 0 3px rgba(111,66,193,.10)}
.matchcard.activeCloud064{border:3px solid #6f42c1!important;background:#eee2fa!important;box-shadow:0 0 0 3px rgba(111,66,193,.10)}
.activeBadge064{display:inline-block;background:#6f42c1;color:#fff;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:900;margin-left:6px}

#livePitch .slot{min-width:64px}
#livePitch .dot{position:relative}
#livePitch .pitchMinute064{position:absolute;right:-18px;top:-9px;min-width:28px;padding:2px 4px;border-radius:999px;background:#fff;color:#301846;border:2px solid #d8c4ef;font-size:9px;font-weight:900;line-height:1.2;box-shadow:0 1px 4px rgba(0,0,0,.18);z-index:5}
#livePitch .slot.swapNever064 .dot{background:#fff!important;color:#4b2672!important;outline:3px solid rgba(255,255,255,.95);outline-offset:2px}
#livePitch .slot.swapPast064 .dot{background:#6f42c1!important;color:#fff!important;outline:4px solid #d8c4ef;outline-offset:2px}
#livePitch .slot.swapRecentIn064 .dot{background:#1976d2!important;color:#fff!important;outline:4px solid #b9d9ff;outline-offset:2px}
#livePitch .slot.swapNever064 .pitchName{background:#fff!important;color:#301846!important}
#livePitch .slot.swapPast064 .pitchName{background:#eadff5!important;color:#3b2055!important}
#livePitch .slot.swapRecentIn064 .pitchName{background:#dbeafe!important;color:#174ea6!important}

#swapLegend064{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:8px 2px 0;padding:8px 10px;border-radius:10px;background:#faf7fd;border:1px solid #eadcf5;font-size:11px;color:#4b2672}
.legendDot064{width:11px;height:11px;border-radius:50%;display:inline-block;margin-right:4px;vertical-align:-1px;border:1px solid rgba(36,22,51,.18)}
.legendNever064{background:#fff}.legendPast064{background:#6f42c1}.legendIn064{background:#1976d2}.legendOut064{background:#d39118}

.liveplayer{position:relative}
.swapChip064{position:absolute;right:72px;top:9px;z-index:3;display:none;align-items:center;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:900;line-height:1;background:#e8dcf5;color:#4b2672;border:1px solid #b99bd7;white-space:nowrap}
.swapChip064.show{display:inline-flex}.swapChip064.recentIn{background:#dbeafe;color:#174ea6;border-color:#7fb3ef}.swapChip064.recentOut{background:#fff0cf;color:#785000;border-color:#e5bf6e}
.liveplayer.swapPastCard064{border-color:#7d4bb3!important;background:#f7f2fc!important;box-shadow:inset 4px 0 0 #7d4bb3}
.liveplayer.swapRecentInCard064{border-color:#1976d2!important;background:#eef6ff!important;box-shadow:inset 4px 0 0 #1976d2}
.liveplayer.swapRecentOutCard064{border-color:#d39118!important;background:#fff8e8!important;box-shadow:inset 4px 0 0 #d39118}

.favBtn064{width:auto!important;min-height:28px!important;padding:3px 8px!important;margin:0 4px 0 0!important;font-size:17px!important;background:#f1e9f8!important;color:#6f42c1!important}
.favBtn064.on{background:#f4c95d!important;color:#4a3500!important;box-shadow:0 0 0 2px #d3a927!important}
.tile.favorite064{border:3px solid #d3a927!important;background:#fff9df!important}
@media(max-width:720px){.swapChip064{right:58px;top:8px;padding:2px 5px;font-size:9px}#swapLegend064{gap:6px 10px;font-size:10px}}
`;
document.head.appendChild(style);

function substitutionStats064(){
  const map={},subs=(state?.events||[]).filter(e=>e.type==='WISSEL').slice().sort((a,b)=>(a.minute-b.minute)||((a.seq||0)-(b.seq||0)));
  (state?.selectedIds||[]).forEach(id=>map[id]={in:0,out:0,total:0});
  for(const e of subs){
    map[e.outId]??={in:0,out:0,total:0};map[e.inId]??={in:0,out:0,total:0};
    map[e.outId].out++;map[e.outId].total++;map[e.inId].in++;map[e.inId].total++;
  }
  return {map,last:subs.at(-1)||null};
}

function ensureLegend064(){
  const pitch=document.getElementById('livePitch');if(!pitch)return;
  let legend=document.getElementById('swapLegend064');
  if(!legend){
    legend=document.createElement('div');legend.id='swapLegend064';
    legend.innerHTML='<b>Wisselstatus:</b><span><i class="legendDot064 legendNever064"></i>nog niet gewisseld</span><span><i class="legendDot064 legendPast064"></i>al gewisseld</span><span><i class="legendDot064 legendIn064"></i>net IN</span><span><i class="legendDot064 legendOut064"></i>net UIT / bank</span>';
    pitch.after(legend);
  }
}

function updatePitch064(){
  if(!state?.startMs)return;
  const pitch=document.getElementById('livePitch');if(!pitch)return;
  const ss=substitutionStats064();let snap;try{snap=snapshot()}catch(e){return}
  pitch.querySelectorAll('.slot').forEach(slot=>{
    const dot=slot.querySelector('.dot');if(!dot)return;
    const num=dot.childNodes[0]?.textContent?.trim()||dot.textContent.trim();
    const id=(state.selectedIds||[]).find(x=>String(p(x).number)===String(num));if(!id)return;
    const st=ss.map[id]||{total:0};
    slot.classList.toggle('swapNever064',!st.total);
    slot.classList.toggle('swapPast064',!!st.total&&ss.last?.inId!==id);
    slot.classList.toggle('swapRecentIn064',ss.last?.inId===id);
    let minute=dot.querySelector('.pitchMinute064');
    if(!minute){minute=document.createElement('span');minute.className='pitchMinute064';dot.appendChild(minute)}
    const next=(snap.play[id]||0)+'m';if(minute.textContent!==next)minute.textContent=next;
  });
  ensureLegend064();
}

function updateCards064(){
  if(!state?.startMs)return;
  const ss=substitutionStats064();let snap;try{snap=snapshot()}catch(e){return}
  for(const rootId of ['fieldBoard','benchBoard']){
    const root=document.getElementById(rootId);if(!root)continue;
    [...root.children].forEach(card=>{
      let id=card.dataset.playerId;
      if(!id){
        const num=(card.querySelector('.num')?.textContent||'').replace(/\D/g,'');
        id=(state.selectedIds||[]).find(x=>String(p(x).number)===num)||'';if(id)card.dataset.playerId=id;
      }
      if(!id)return;
      const st=ss.map[id]||{in:0,out:0,total:0};
      card.classList.toggle('swapPastCard064',!!st.total&&ss.last?.inId!==id&&ss.last?.outId!==id);
      card.classList.toggle('swapRecentInCard064',ss.last?.inId===id);
      card.classList.toggle('swapRecentOutCard064',ss.last?.outId===id);
      let chip=card.querySelector('.swapChip064');if(!chip){chip=document.createElement('span');chip.className='swapChip064';card.appendChild(chip)}
      chip.className='swapChip064';
      if(!st.total){chip.textContent='';continue}
      chip.classList.add('show');
      if(ss.last?.inId===id){chip.classList.add('recentIn');chip.textContent='↑ IN '+st.in+'×'}
      else if(ss.last?.outId===id){chip.classList.add('recentOut');chip.textContent='↓ UIT '+st.out+'×'}
      else chip.textContent='↕ '+st.total+'×';
    });
  }
}

function updateActiveState064(){
  const running=state?.cloud?state.cloudClockStatus==='running':!!state?.startMs&&!state?.paused&&!state?.finished;
  const mc=document.getElementById('matchClock');if(mc&&!document.getElementById('matchClockCard'))mc.closest('.clockCard')?.setAttribute('id','matchClockCard');
  document.getElementById('matchClockCard')?.classList.toggle('clockRunning064',running);
  document.querySelector('#liveCard .scoreBoard')?.classList.toggle('liveActive064',!!state?.cloud&&!!state?.startMs&&!state?.finished);
  const root=document.getElementById('cloudOpenMatches');if(!root)return;
  root.querySelectorAll('.matchcard').forEach(card=>{
    const btn=card.querySelector('.cloudResumeBtn'),active=btn?.dataset.id===cloudActiveMatchId;
    card.classList.toggle('activeCloud064',!!active);
    let badge=card.querySelector('.activeBadge064');
    if(active&&!badge){badge=document.createElement('span');badge.className='activeBadge064';badge.textContent='● LIVE ACTIEF';card.querySelector('b')?.after(badge)}
    if(!active&&badge)badge.remove();
  });
}

function updateFavorites064(){
  if(!cloudDashboardData?.players)return;
  const tiles=document.getElementById('tilesWrap');if(!tiles)return;
  const favs=getFavs();
  [...tiles.children].forEach(card=>{
    const name=card.querySelector('.tileName')?.textContent||'';
    const x=cloudDashboardData.players.find(y=>name.includes(String(y.name)));if(!x)return;
    const key=String(x.player_id||x.id||x.legacy_key||x.name||'');card.dataset.favKey=key;
    const on=favs.has(key);card.classList.toggle('favorite064',on);
    let b=card.querySelector('.favBtn064');if(!b){b=document.createElement('button');b.className='favBtn064';card.querySelector('.tileTop')?.prepend(b)}
    b.classList.toggle('on',on);b.textContent=on?'★':'☆';
    b.onclick=ev=>{ev.stopPropagation();const s=getFavs();s.has(key)?s.delete(key):s.add(key);saveFavs(s);updateFavorites064()};
  });
  [...tiles.children].sort((a,b)=>(favs.has(b.dataset.favKey)?1:0)-(favs.has(a.dataset.favKey)?1:0)).forEach(x=>tiles.appendChild(x));
}

function tick064(){try{updateActiveState064();updatePitch064();updateCards064();updateFavorites064()}catch(e){}}
setInterval(tick064,1000);setTimeout(tick064,150);
})();