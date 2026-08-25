(()=>{
const V063_FAV='clubmatch_favorites_v063';
const esc063=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const favs063=()=>{try{return new Set(JSON.parse(localStorage.getItem(V063_FAV)||'[]'))}catch(e){return new Set()}};
const saveFavs063=s=>localStorage.setItem(V063_FAV,JSON.stringify([...s]));
const subStats063=()=>{
  const map={},subs=(state?.events||[]).filter(e=>e.type==='WISSEL').sort((a,b)=>(a.minute-b.minute)||((a.seq||0)-(b.seq||0)));
  (state?.selectedIds||[]).forEach(id=>map[id]={in:0,out:0,total:0});
  subs.forEach(e=>{
    map[e.outId]??={in:0,out:0,total:0}; map[e.inId]??={in:0,out:0,total:0};
    map[e.outId].out++;map[e.outId].total++;map[e.inId].in++;map[e.inId].total++;
  });
  return {map,last:subs.at(-1)||null,count:subs.length};
};
const playerKey063=x=>String(x?.player_id||x?.id||x?.legacy_key||x?.name||'');

const style=document.createElement('style');
style.textContent=`
#matchClockCard.clockRunning063{border-color:#237a43!important;background:#e3f4e8!important;box-shadow:0 0 0 3px rgba(35,122,67,.12)}
#matchClockCard.clockRunning063 .clockValue{color:#237a43!important}
.scoreBoard.liveActive063{border-color:#237a43!important;box-shadow:0 0 0 3px rgba(35,122,67,.10)}
.matchcard.activeCloud063{border:3px solid #6f42c1!important;background:#f3ebfa!important}
.activeBadge063{display:inline-block;background:#6f42c1;color:white;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:900;margin-left:6px}
.liveplayer.subHistory063{box-shadow:inset 4px 0 0 #b98928}
.liveplayer.recentIn063{border:3px solid #237a43!important;background:#e3f4e8!important}
.liveplayer.recentOut063{border:3px solid #b98928!important;background:#fff4db!important}
.subBadge063{font-size:10px;font-weight:900;border-radius:999px;padding:3px 6px;background:#f1e9f8;color:#4b2672;display:inline-block;margin:3px 3px 0 0}
.subBadge063.in{background:#e3f4e8;color:#245a33}.subBadge063.out{background:#fff4db;color:#6a531c}
.pitchTime063{font-size:9px;background:rgba(36,22,51,.82);color:#fff;font-weight:900;border-radius:6px;padding:2px 4px;margin:2px auto 0;display:table}
.slot.recentIn063 .dot{background:#237a43!important;outline:4px solid #c8ead2;outline-offset:2px}
.slot.subHistory063:not(.recentIn063) .dot{outline:3px solid #b98928;outline-offset:2px}
#liveMatchKpis063{margin:8px 0}
.favBtn063{width:auto!important;min-height:28px!important;padding:3px 7px!important;margin:0 4px 0 0!important;font-size:16px!important;background:#f1e9f8!important;color:#4b2672!important}
.favBtn063.on{background:#fff4db!important;color:#8b6200!important}
.tile.favorite063{border:2px solid #b98928!important;background:#fffdf7!important}
.extraStats063{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:6px}
.extraStats063>div{font-size:9px;background:#f8f4fc;border-radius:7px;padding:5px}.extraStats063 b{display:block;font-size:14px;color:#4b2672}
@media(max-width:720px){.extraStats063{grid-template-columns:repeat(2,1fr)}}
`;
document.head.appendChild(style);

if(document.getElementById('matchClock')&&!document.getElementById('matchClockCard')){
  document.getElementById('matchClock').closest('.clockCard')?.setAttribute('id','matchClockCard');
}
const liveDash=document.getElementById('liveDashboardCard');
if(liveDash&&!document.getElementById('liveMatchKpis063')){
  const k=document.createElement('div');k.id='liveMatchKpis063';k.className='kpis';liveDash.querySelector('h2')?.after(k);
}

try{
  const oldClockAction063=cloudClockAction;
  cloudClockAction=async function(action,minutes=null){
    try{
      const {data:{session}}=await cloudClient.auth.getSession();
      if(session){
        const rr=await cloudClient.auth.refreshSession();
        if(rr.error)console.warn('ClubMatch token refresh:',rr.error.message);
      }
    }catch(e){}
    return oldClockAction063(action,minutes);
  };
}catch(e){}

function decorateOpenMatches063(){
  const root=document.getElementById('cloudOpenMatches');if(!root)return;
  root.querySelectorAll('.matchcard').forEach(card=>{
    const btn=card.querySelector('.cloudResumeBtn'),id=btn?.dataset.id,active=!!id&&id===cloudActiveMatchId;
    card.classList.toggle('activeCloud063',active);
    card.querySelector('.activeBadge063')?.remove();
    if(active){
      const b=document.createElement('span');b.className='activeBadge063';b.textContent='● ACTIEF';
      card.querySelector('b')?.after(b);
      if(btn)btn.textContent='✓ Geopend';
    }
  });
}
function decorateClock063(){
  const running=state?.cloud?state.cloudClockStatus==='running':!!state?.startMs&&!state?.paused&&!state?.finished;
  document.getElementById('matchClockCard')?.classList.toggle('clockRunning063',running);
  document.querySelector('#liveCard .scoreBoard')?.classList.toggle('liveActive063',running);
}
function decoratePitch063(){
  if(!state?.startMs)return;
  let snap;try{snap=snapshot()}catch(e){return}
  const ss=subStats063(),root=document.getElementById('livePitch');if(!root)return;
  root.querySelectorAll('.slot').forEach(slot=>{
    slot.classList.remove('recentIn063','subHistory063');
    slot.querySelector('.pitchTime063')?.remove();
    const num=slot.querySelector('.dot')?.textContent?.trim();
    if(!num)return;
    const id=(state.selectedIds||[]).find(id=>String(p(id).number)===num);if(!id)return;
    const st=ss.map[id]||{total:0};
    if(st.total)slot.classList.add('subHistory063');
    if(ss.last?.inId===id)slot.classList.add('recentIn063');
    const t=document.createElement('div');t.className='pitchTime063';
    t.textContent=`${snap.play[id]||0}m${st.total?` · ↕${st.total}`:''}`;slot.appendChild(t);
  });
}
function decorateLiveCards063(){
  if(!state?.startMs)return;
  let snap;try{snap=snapshot()}catch(e){return}
  const ss=subStats063();
  const decorate=(rootId,ids,inField)=>{
    const root=document.getElementById(rootId);if(!root)return;
    const cards=[...root.children],sorted=ids.slice().sort((a,b)=>Number(p(a).number)-Number(p(b).number));
    cards.forEach((card,i)=>{
      const id=sorted[i];if(!id)return;const st=ss.map[id]||{in:0,out:0,total:0};
      card.classList.toggle('subHistory063',!!st.total);
      card.classList.toggle('recentIn063',ss.last?.inId===id);
      card.classList.toggle('recentOut063',ss.last?.outId===id);
      card.querySelector('.subInfo063')?.remove();
      const box=document.createElement('div');box.className='subInfo063';
      box.innerHTML=`${st.in?`<span class="subBadge063 in">↑ IN ${st.in}×</span>`:''}${st.out?`<span class="subBadge063 out">↓ UIT ${st.out}×</span>`:''}${st.total?`<span class="subBadge063">↕ ${st.total}× gewisseld</span>`:'<span class="subBadge063">nog niet gewisseld</span>'}`;
      card.querySelector('.livehead')?.after(box);
    });
  };
  const field=(state.selectedIds||[]).filter(id=>snap.open[id]!==undefined),bench=(state.selectedIds||[]).filter(id=>snap.open[id]===undefined);
  decorate('fieldBoard',field,true);decorate('benchBoard',bench,false);
  const ownGoals=(state.events||[]).filter(e=>e.type==='GOAL'&&e.side==='home').length;
  const assists=(state.events||[]).filter(e=>e.type==='GOAL'&&e.side==='home'&&e.assistId).length;
  const used=(state.selectedIds||[]).filter(id=>(snap.play[id]||0)>0||snap.open[id]!==undefined).length;
  const pos=(state.events||[]).filter(e=>e.type==='POSITIE').length;
  const totalPlay=(state.selectedIds||[]).reduce((n,id)=>n+(snap.play[id]||0),0);
  const k=document.getElementById('liveMatchKpis063');
  if(k)k.innerHTML=`<div class="kpi"><b>${ss.count}</b><span>wissels</span></div><div class="kpi"><b>${used}</b><span>spelers gebruikt</span></div><div class="kpi"><b>${ownGoals}</b><span>goals</span></div><div class="kpi"><b>${assists}</b><span>assists</span></div><div class="kpi"><b>${totalPlay}</b><span>speelmin.</span></div><div class="kpi"><b>${pos}</b><span>pos.wijzigingen</span></div>`;
}
function decorateDashboard063(){
  if(!cloudDashboardData?.players)return;
  const players=cloudDashboardData.players,f=favs063(),tiles=document.getElementById('tilesWrap');if(!tiles)return;
  const cards=[...tiles.children];
  cards.forEach(card=>{
    const name=card.querySelector('.tileName')?.textContent||'';
    const x=players.find(p=>name.includes(String(p.name)));if(!x)return;
    const key=playerKey063(x),on=f.has(key);card.dataset.favKey=key;card.classList.toggle('favorite063',on);
    let btn=card.querySelector('.favBtn063');if(!btn){btn=document.createElement('button');btn.className='favBtn063';card.querySelector('.tileTop')?.prepend(btn)}
    btn.classList.toggle('on',on);btn.textContent=on?'★':'☆';btn.title=on?'Favoriet verwijderen':'Favoriet bovenaan';
    btn.onclick=ev=>{ev.stopPropagation();const ff=favs063();ff.has(key)?ff.delete(key):ff.add(key);saveFavs063(ff);decorateDashboard063()};
    let extra=card.querySelector('.extraStats063');if(!extra){extra=document.createElement('div');extra.className='extraStats063';card.appendChild(extra)}
    const selected=Number(x.selected)||0,present=Number(x.present)||0,absent=Number(x.absent)||0,play=Number(x.play)||0,goals=Number(x.goals)||0,assists=Number(x.assists)||0;
    const startPct=selected?Math.round(100*(Number(x.starts)||0)/selected):0,avail=(present+absent)?Math.round(100*present/(present+absent)):0,g80=play?Math.round(800*goals/play)/10:0,a80=play?Math.round(800*assists/play)/10:0;
    extra.innerHTML=`<div>G+A<b>${goals+assists}</b></div><div>Basis%<b>${startPct}%</b></div><div>Aanw.%<b>${avail}%</b></div><div>G/80<b>${g80}</b></div><div>A/80<b>${a80}</b></div>`;
  });
  const order=[...tiles.children].sort((a,b)=>(f.has(b.dataset.favKey)?1:0)-(f.has(a.dataset.favKey)?1:0));
  order.forEach(x=>tiles.appendChild(x));
}
function decorateDiagnostics063(){
  const box=document.getElementById('cloudDiagnostics');if(!box||!cloudActiveMatchId)return;
  const rows=[...box.querySelectorAll('div')],r=rows.find(x=>x.textContent.includes('Actieve wedstrijdsnapshot'));
  if(r&&state?.opponent&&!r.textContent.includes(state.opponent))r.append(` · ${state.team} vs ${state.opponent} · klok ${state.cloudClockStatus||'—'}`);
}
function tick063(){
  try{decorateOpenMatches063();decorateClock063();decoratePitch063();decorateLiveCards063();decorateDashboard063();decorateDiagnostics063()}catch(e){}
}
setInterval(tick063,1000);setTimeout(tick063,100);
})();