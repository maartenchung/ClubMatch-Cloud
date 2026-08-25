(()=>{
const originalRenderLive064=renderLive;
let pitchSig064='',controlSig064='',eventSig064='',lastLocalSave064=0;

const css=document.createElement('style');
css.textContent=`
#fieldBoard .liveplayer,#benchBoard .liveplayer{min-height:88px;contain:layout style}
#fieldBoard,#benchBoard{overflow-anchor:none}
`;
document.head.appendChild(css);

function cardId064(card){
 if(card.dataset.playerId)return card.dataset.playerId;
 const num=(card.querySelector('.num')?.textContent||'').replace(/\D/g,'');
 const id=(state?.selectedIds||[]).find(x=>String(p(x).number)===num);
 if(id)card.dataset.playerId=id;
 return id||'';
}
function makeCard064(id,inField,s){
 const d=document.createElement('div');
 d.className='liveplayer '+(inField?'field':'');
 d.dataset.playerId=id;
 d.innerHTML=`<div class="livehead"><div><span class="num">#${esc(p(id).number)}</span> <span class="pname">${esc(p(id).name)}</span></div><span class="pill"></span></div><div class="metrics"><div class="metric">Speeltijd<b></b></div><div class="metric">Banktijd<b></b></div></div>`;
 return d;
}
function syncCards064(rootId,ids,inField,s){
 const root=document.getElementById(rootId);if(!root)return;
 [...root.children].forEach(card=>cardId064(card));
 const wanted=ids.slice().sort((a,b)=>Number(p(a).number)-Number(p(b).number));
 const wantedSet=new Set(wanted);
 const map=new Map([...root.children].map(c=>[c.dataset.playerId,c]).filter(x=>x[0]));
 wanted.forEach((id,index)=>{
   let card=map.get(id);
   if(!card){
     card=document.querySelector(`#fieldBoard [data-player-id="${CSS.escape(id)}"],#benchBoard [data-player-id="${CSS.escape(id)}"]`)||makeCard064(id,inField,s);
   }
   card.dataset.playerId=id;
   card.classList.toggle('field',inField);
   const pill=card.querySelector('.pill');if(pill)pill.textContent=inField?(s.positions[id]||'VELD'):'BANK';
   const vals=card.querySelectorAll('.metric b');
   if(vals[0])vals[0].textContent=(s.play[id]||0)+' min';
   if(vals[1])vals[1].textContent=(s.bench[id]||0)+' min';
   const at=root.children[index];
   if(at!==card)root.insertBefore(card,at||null);
 });
 [...root.children].forEach(card=>{const id=card.dataset.playerId;if(id&&!wantedSet.has(id))card.remove()});
}
function updateGoalStrip064(){
 const strip=document.getElementById('goalStrip');if(!strip)return;
 strip.innerHTML=sortedEvents().filter(e=>e.type==='GOAL').map(e=>`<span class="goalChip">⚽ ${e.minute}' · ${esc(e.clockTime||'tijd onbekend')} · ${e.side==='home'?esc(display(e.scorerId)):esc(state.opponent)}</span>`).join('');
}

renderLive=function(){
 if(!state?.startMs)return;
 if(!state.cloud){originalRenderLive064();return}
 const s=snapshot();
 const q=id=>document.getElementById(id);
 q('minute').textContent=s.end+"'";
 q('matchClock').textContent=formatElapsed(rawActiveMs());
 q('pauseClock').textContent=formatElapsed(livePauseMs());
 const pc=q('pauseClockCard'),pcs=q('pauseClockState');
 if(pc)pc.classList.toggle('pauseActive',state.paused&&!state.autoStopped);
 if(pcs)pcs.textContent=state.autoStopped?'automatische stop — telt niet als rust':state.paused?'rust/pauze loopt live':'totale rust/pauze';
 q('scoreHome').textContent=state.cloudHomeScore??0;q('scoreAway').textContent=state.cloudAwayScore??0;
 q('liveClubName').textContent=loadSettings().clubName;q('liveTeam').textContent=state.team;q('liveOpponent').textContent=state.opponent;
 q('liveFormationLabel').textContent=state.formation;
 q('liveDateTime').textContent=`${fmtDate(state.matchDate)}${state.scheduledTime?' · gepland '+state.scheduledTime:''}`;
 q('actualStart').textContent=`werkelijke start ${state.actualStartIso?timeLocal(new Date(state.actualStartIso)):''}`;
 const auto=q('autoStopBox');if(state.autoStopped){auto.classList.remove('hidden');q('autoStopText').textContent=`Automatisch gestopt op ${state.timeLimit}'. Is de wedstrijd afgelopen of is er blessuretijd?`}else auto.classList.add('hidden');

 const field=state.selectedIds.filter(id=>s.open[id]!==undefined),bench=state.selectedIds.filter(id=>s.open[id]===undefined);
 q('fieldCount').textContent=field.length+' spelers';q('benchCount').textContent=bench.length+' spelers';
 syncCards064('fieldBoard',field,true,s);syncCards064('benchBoard',bench,false,s);

 const psig=state.formation+'|'+field.map(id=>id+':'+(s.positions[id]||'')).sort().join('|');
 if(psig!==pitchSig064){pitchSig064=psig;renderPitch('livePitch',state.formation,s.positions)}
 const csig=field.slice().sort().join(',')+'|'+bench.slice().sort().join(',')+'|'+psig;
 if(csig!==controlSig064){controlSig064=csig;updateControls(s)}
 const esig=state.events.map(e=>[e.type,e.seq,e.minute,e.outId,e.inId,e.scorerId,e.assistId,e.position].join(':')).join('|');
 if(esig!==eventSig064){eventSig064=esig;updateGoalStrip064();renderEventLog()}

 if(Date.now()-lastLocalSave064>30000){lastLocalSave064=Date.now();try{saveLive()}catch(e){}}
};

if(state?.cloud&&state?.startMs){clearInterval(timerId);timerId=setInterval(renderLive,1000);renderLive()}
})();