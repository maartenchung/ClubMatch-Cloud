(()=>{
const FAV070='clubmatch_favorites_v070';
const getFav070=()=>{try{return new Set(JSON.parse(localStorage.getItem(FAV070)||'[]'))}catch(e){return new Set()}};
const saveFav070=s=>localStorage.setItem(FAV070,JSON.stringify([...s]));
const pct070=(a,b)=>b>0?Math.round(100*a/b):0;
const one070=n=>Math.round((Number(n)||0)*10)/10;

const style=document.createElement('style');
style.textContent=`
/* v0.7 dashboard */
#tilesWrap{gap:10px!important}
#tilesWrap .tile{padding:12px!important;border:2px solid #d8c4ef!important;background:#fff!important;border-radius:14px!important;min-height:0!important}
#tilesWrap .tileTop{align-items:flex-start!important;gap:8px!important}
#tilesWrap .tileName{font-size:15px!important;line-height:1.2!important}
#tilesWrap .tileMetrics{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;margin-top:8px!important}
#tilesWrap .tileMetric{padding:7px!important;min-height:0!important;border-radius:9px!important;background:#f8f4fc!important;font-size:9px!important}
#tilesWrap .tileMetric b{font-size:15px!important;margin-top:2px!important}
.tile070Head{display:flex;align-items:center;gap:7px;min-width:0}.tile070Rank{display:inline-grid;place-items:center;min-width:25px;height:25px;border-radius:50%;background:#6f42c1;color:#fff;font-size:11px;font-weight:900}
.fav070{width:31px!important;min-width:31px!important;height:31px!important;min-height:31px!important;padding:0!important;margin:0!important;border-radius:50%!important;background:#eee4f7!important;color:#6f42c1!important;font-size:18px!important}
.fav070.on{background:#f4c95d!important;color:#4a3500!important;box-shadow:0 0 0 2px #d3a927!important}
#tilesWrap .tile.favorite070{border:3px solid #d3a927!important;background:#fff9df!important;box-shadow:0 0 0 2px rgba(211,169,39,.10)}
.tile070Summary{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.tile070Chip{font-size:10px;font-weight:800;padding:3px 6px;border-radius:999px;background:#eee4f7;color:#4b2672}.tile070Chip.goal{background:#fff0cf;color:#6a531c}.tile070Chip.play{background:#dbeafe;color:#174ea6}

#dashLegend070,#livePlayerLegend070{display:flex;flex-wrap:wrap;gap:7px 13px;align-items:center;margin:9px 0;padding:8px 10px;border:1px solid #eadcf5;border-radius:10px;background:#faf7fd;color:#4b2672;font-size:10px;line-height:1.35}
#dashLegend070 b,#livePlayerLegend070 b{font-size:11px}
.legendDot070{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px;border:1px solid rgba(36,22,51,.2)}
.legendNever070{background:#fff}.legendPast070{background:#6f42c1}.legendIn070{background:#1976d2}.legendOut070{background:#d39118}

/* live speel/bank: alleen kleur wijzigen, geen extra hoogte */
.liveplayer{position:relative;transition:border-color .15s ease,background-color .15s ease,box-shadow .15s ease}
.liveplayer.swapNever070{border-color:#d8c4ef!important;background:#fff!important}
.liveplayer.swapPast070{border-color:#7d4bb3!important;background:#f7f2fc!important;box-shadow:inset 4px 0 0 #7d4bb3}
.liveplayer.swapIn070{border-color:#1976d2!important;background:#eef6ff!important;box-shadow:inset 4px 0 0 #1976d2}
.liveplayer.swapOut070{border-color:#d39118!important;background:#fff8e8!important;box-shadow:inset 4px 0 0 #d39118}
.swap070{position:absolute;right:68px;top:8px;height:20px;display:none;align-items:center;padding:0 6px;border-radius:999px;font-size:9px;font-weight:900;background:#eee4f7;color:#4b2672;white-space:nowrap}.swap070.show{display:flex}.swap070.in{background:#dbeafe;color:#174ea6}.swap070.out{background:#fff0cf;color:#785000}

/* actieve match / klok */
.matchcard.active070{border:3px solid #6f42c1!important;background:#eee2fa!important;box-shadow:0 0 0 3px rgba(111,66,193,.10)}
.active070Badge{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:999px;background:#6f42c1;color:white;font-size:10px;font-weight:900}
#matchClockCard.running070{border:3px solid #1976d2!important;background:#eef6ff!important;box-shadow:0 0 0 3px rgba(25,118,210,.10)}
#matchClockCard.running070 .clockValue{color:#135ca6!important}

@media(max-width:720px){#tilesWrap .tileMetrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}.swap070{right:58px;font-size:8px}}
`;
document.head.appendChild(style);

function sub070(){
  const map={},subs=(state?.events||[]).filter(e=>e.type==='WISSEL').slice().sort((a,b)=>(a.minute-b.minute)||((a.seq||0)-(b.seq||0)));
  (state?.selectedIds||[]).forEach(id=>map[id]={in:0,out:0,total:0});
  for(const e of subs){map[e.outId]??={in:0,out:0,total:0};map[e.inId]??={in:0,out:0,total:0};map[e.outId].out++;map[e.outId].total++;map[e.inId].in++;map[e.inId].total++}
  return {map,last:subs.at(-1)||null};
}
function playerIdForCard070(card){
  if(card.dataset.playerId)return card.dataset.playerId;
  const num=(card.querySelector('.num')?.textContent||'').replace(/\D/g,'');
  const id=(state?.selectedIds||[]).find(x=>String(p(x).number)===num)||'';if(id)card.dataset.playerId=id;return id;
}
function ensureLiveLegend070(){
  const bench=document.getElementById('benchBoard');if(!bench)return;
  let l=document.getElementById('livePlayerLegend070');if(l)return;
  l=document.createElement('div');l.id='livePlayerLegend070';
  l.innerHTML='<b>Kleur spelertegels:</b><span><i class="legendDot070 legendNever070"></i>nog niet gewisseld</span><span><i class="legendDot070 legendPast070"></i>al gewisseld</span><span><i class="legendDot070 legendIn070"></i>net IN</span><span><i class="legendDot070 legendOut070"></i>net UIT / bank</span><span>↕ = totaal wisselmomenten</span>';
  bench.after(l);
}
function updateLiveCards070(){
  if(!state?.cloud||!state?.startMs)return;
  const ss=sub070();
  ['fieldBoard','benchBoard'].forEach(rootId=>{
    const root=document.getElementById(rootId);if(!root)return;
    [...root.children].forEach(card=>{
      const id=playerIdForCard070(card);if(!id)return;
      const st=ss.map[id]||{in:0,out:0,total:0};
      card.classList.toggle('swapNever070',!st.total);
      card.classList.toggle('swapPast070',!!st.total&&ss.last?.inId!==id&&ss.last?.outId!==id);
      card.classList.toggle('swapIn070',ss.last?.inId===id);
      card.classList.toggle('swapOut070',ss.last?.outId===id);
      let c=card.querySelector('.swap070');if(!c){c=document.createElement('span');c.className='swap070';card.appendChild(c)}
      c.className='swap070';
      if(!st.total){c.textContent='';return}
      c.classList.add('show');
      if(ss.last?.inId===id){c.classList.add('in');c.textContent='↑ '+st.in+'× IN'}
      else if(ss.last?.outId===id){c.classList.add('out');c.textContent='↓ '+st.out+'× UIT'}
      else c.textContent='↕ '+st.total+'×';
    });
  });
  ensureLiveLegend070();
}
function updateActive070(){
  const mc=document.getElementById('matchClock');if(mc&&!document.getElementById('matchClockCard'))mc.closest('.clockCard')?.setAttribute('id','matchClockCard');
  document.getElementById('matchClockCard')?.classList.toggle('running070',state?.cloud&&state.cloudClockStatus==='running');
  const root=document.getElementById('cloudOpenMatches');if(!root)return;
  root.querySelectorAll('.matchcard').forEach(card=>{
    const btn=card.querySelector('.cloudResumeBtn'),active=btn?.dataset.id===cloudActiveMatchId;
    card.classList.toggle('active070',!!active);
    let badge=card.querySelector('.active070Badge');
    if(active&&!badge){badge=document.createElement('span');badge.className='active070Badge';badge.textContent='● LIVE ACTIEF';card.querySelector('b')?.after(badge)}
    if(!active&&badge)badge.remove();
  });
}

function stat070(x,k){
 const present=Number(x.present)||0,absent=Number(x.absent)||0,selected=Number(x.selected)||0,starts=Number(x.starts)||0,play=Number(x.play)||0,bench=Number(x.bench)||0,goals=Number(x.goals)||0,assists=Number(x.assists)||0;
 const vals={
   play,bench,goals,assists,ga:goals+assists,starts,selected,present,absent,
   startPct:pct070(starts,selected),attPct:pct070(present,present+absent),subApps:Math.max(0,selected-starts),
   g80:play?one070(goals*80/play):0,a80:play?one070(assists*80/play):0,ga80:play?one070((goals+assists)*80/play):0,
   minGoal:goals?Math.round(play/goals):'—',minGA:(goals+assists)?Math.round(play/(goals+assists)):'—'
 };
 return vals[k];
}
const statDefs070=[
 ['play','Speel','min'],['bench','Bank','min'],['goals','Goals',''],['assists','Ass.',''],['ga','G+A',''],['startPct','Basis','%'],['attPct','Aanw.','%'],['subApps','Inval',''],['g80','G/80',''],['a80','A/80',''],['ga80','G+A/80',''],['minGA','min/G+A','']
];

const oldCloudSeason070=renderCloudSeason;
renderCloudSeason=function(){
  const pref=getPrefs(),d=cloudDashboardData||{players:[],matches:[],kpis:{}},ps=d.players||[],k=d.kpis||{};
  document.getElementById('seasonKpis').innerHTML=`<div class="kpi"><b>${k.matches||0}</b><span>wedstrijden</span></div><div class="kpi"><b>${k.play_minutes||0}</b><span>speelmin.</span></div><div class="kpi"><b>${k.bench_minutes||0}</b><span>bankmin.</span></div><div class="kpi"><b>${k.goals||0}</b><span>goals</span></div><div class="kpi"><b>${k.assists||0}</b><span>assists</span></div><div class="kpi"><b>${k.absent||0}</b><span>afwezig</span></div>`;
  document.getElementById('rankingTitle').textContent='Cloud ranking · '+METRICS[pref.rank].label;
  document.getElementById('dynamicRanking').innerHTML=rankHtml(ps,pref.rank);document.getElementById('benchRanking').innerHTML=rankHtml(ps,'bench');
  const sorted=ps.slice().sort((a,b)=>metricValue(b,pref.rank)-metricValue(a,pref.rank)||a.name.localeCompare(b.name));
  const head=['Rank','#','Speler',...pref.metrics.map(k=>METRICS[k].short)];document.getElementById('seasonHead').innerHTML='<tr>'+head.map(x=>`<th>${esc(x)}</th>`).join('')+'</tr>';
  const body=document.getElementById('seasonBody');body.innerHTML='';sorted.forEach((x,i)=>{const tr=document.createElement('tr');tr.innerHTML=[i+1,x.number,x.name,...pref.metrics.map(k=>metricValue(x,k)+(k==='playPct'?'%':''))].map(v=>`<td>${esc(v)}</td>`).join('');body.appendChild(tr)});

  const tiles=document.getElementById('tilesWrap');tiles.innerHTML='';const fav=getFav070();
  sorted.forEach((x,i)=>{
    const key=String(x.player_id||x.id||x.legacy_key||x.name||''),isFav=fav.has(key),t=document.createElement('div');t.className='tile'+(isFav?' favorite070':'');t.dataset.favKey=key;
    const rankVal=metricValue(x,pref.rank)+(pref.rank==='playPct'?'%':'');
    t.innerHTML=`<div class="tileTop"><div class="tile070Head"><span class="tile070Rank">${i+1}</span><div><div class="tileName">#${esc(x.number)} ${esc(x.name)}</div><div class="tile070Summary"><span class="tile070Chip play">${esc(METRICS[pref.rank].short)} ${esc(rankVal)}</span><span class="tile070Chip goal">⚽ ${stat070(x,'goals')} · 🅰 ${stat070(x,'assists')}</span></div></div></div><button class="fav070${isFav?' on':''}" title="Favoriet">${isFav?'★':'☆'}</button></div><div class="tileMetrics">${statDefs070.map(([k,l,u])=>`<div class="tileMetric">${esc(l)}<b>${esc(stat070(x,k))}${u}</b></div>`).join('')}</div>`;
    t.querySelector('.fav070').onclick=()=>{const f=getFav070();f.has(key)?f.delete(key):f.add(key);saveFav070(f);renderCloudSeason()};tiles.appendChild(t);
  });
  [...tiles.children].sort((a,b)=>(fav.has(b.dataset.favKey)?1:0)-(fav.has(a.dataset.favKey)?1:0)).forEach(x=>tiles.appendChild(x));
  let legend=document.getElementById('dashLegend070');if(!legend){legend=document.createElement('div');legend.id='dashLegend070';tiles.before(legend)}
  legend.innerHTML='<b>Statistieken:</b><span>G+A = goals + assists</span><span>Basis% = basisplaatsen / selecties</span><span>Aanw.% = aanwezig / aanwezig+afwezig</span><span>Inval = geselecteerd maar niet gestart</span><span>G/80, A/80, G+A/80 = per 80 speelminuten</span><span>min/G+A = speelminuten per goal of assist</span><span>★ = persoonlijke favoriet</span>';
  document.getElementById('tableWrap').classList.toggle('hidden',pref.view!=='table');tiles.classList.toggle('hidden',pref.view!=='tiles');enableSort(document.getElementById('seasonTable'));renderCloudMatches();
};

function tick070(){try{updateActive070();updateLiveCards070()}catch(e){}}
setInterval(tick070,1000);setTimeout(tick070,150);
})();