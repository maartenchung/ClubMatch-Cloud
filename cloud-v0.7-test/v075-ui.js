(()=>{
const css=document.createElement('style');
css.textContent=`
.liveMinute075{font-size:10px;color:#4b2672;font-weight:800;margin-top:3px}
#positionIntegrity075{margin:7px 0;padding:8px 10px;border-radius:10px;background:#eef6ff;border:1px solid #b9d9ff;color:#174ea6;font-size:10px;font-weight:800}
#positionIntegrity075.bad{background:#fff1f1;border-color:#e2a2a2;color:#8b1f1f}
`;
document.head.appendChild(css);

let manualSwapMinute075=false,manualPosMinute075=false,lastPosAttempt075=null;
const swapMinute075=()=>document.getElementById('swapMinute');
const posMinute075=()=>document.getElementById('positionMinute');
function currentMinute075(){try{return Math.max(0,nowMinute())}catch(e){return 0}}
function syncMinuteInputs075(){
  if(!state?.startMs||state?.finished)return;
  const m=currentMinute075(),s=swapMinute075(),p=posMinute075();
  if(s&&document.activeElement!==s&&!manualSwapMinute075)s.value=m;
  if(p&&document.activeElement!==p&&!manualPosMinute075)p.value=m;
  let sm=document.getElementById('swapMinuteLive075');
  if(s&&!sm){sm=document.createElement('div');sm.id='swapMinuteLive075';sm.className='liveMinute075';s.after(sm)}
  if(sm)sm.textContent=`Live wedstrijdminuut: ${m}'`;
  let pm=document.getElementById('posMinuteLive075');
  if(p&&!pm){pm=document.createElement('div');pm.id='posMinuteLive075';pm.className='liveMinute075';p.after(pm)}
  if(pm)pm.textContent=`Live wedstrijdminuut: ${m}'`;
}
function bindMinuteInputs075(){
  const s=swapMinute075(),p=posMinute075();
  if(s&&!s.dataset.bound075){s.dataset.bound075='1';s.addEventListener('input',()=>manualSwapMinute075=true);s.addEventListener('dblclick',()=>{manualSwapMinute075=false;s.value=currentMinute075()})}
  if(p&&!p.dataset.bound075){p.dataset.bound075='1';p.addEventListener('input',()=>manualPosMinute075=true);p.addEventListener('dblclick',()=>{manualPosMinute075=false;p.value=currentMinute075()})}
}

/* Wissel: standaard actuele klokminuut gebruiken tenzij gebruiker bewust handmatig corrigeert. */
try{
  const oldManualSwap075=manualSwap;
  manualSwap=function(){
    const s=swapMinute075();
    if(s&&!manualSwapMinute075)s.value=currentMinute075();
    return oldManualSwap075();
  };
}catch(e){}

/* Positiewijziging: dezelfde live status en actuele minuut gebruiken. */
try{
  const oldChange075=changePosition;
  changePosition=function(){
    const pmin=posMinute075();if(pmin&&!manualPosMinute075)pmin.value=currentMinute075();
    const playerId=document.getElementById('positionPlayer')?.value||'',newPos=document.getElementById('newPosition')?.value||'';
    const before=snapshot(),oldPos=before.positions?.[playerId]||'';
    if(!playerId||!newPos)return setStatus('Kies speler en nieuwe positie.');
    if(before.open?.[playerId]===undefined)return setStatus('Positie wijzigen kan alleen voor een speler die nu op het veld staat.');
    const result=oldChange075();
    lastPosAttempt075={playerId,oldPos,newPos,minute:Number(pmin?.value)||currentMinute075(),at:Date.now(),matchId:cloudActiveMatchId||null};
    setTimeout(()=>verifyPosition075(),250);
    return result;
  };
}catch(e){}

function ensurePositionBox075(){
  let b=document.getElementById('positionIntegrity075');
  const anchor=document.getElementById('liveIntegrity074')||document.getElementById('positionPlayer')?.closest('.actionBox')||document.getElementById('liveCard');
  if(anchor&&!b){b=document.createElement('div');b.id='positionIntegrity075';anchor.after(b)}
  return b;
}
function verifyPosition075(){
  const b=ensurePositionBox075();if(!b)return;
  if(!lastPosAttempt075){b.classList.remove('bad');b.textContent='Positiewijzigingen gebruiken nu standaard de actuele live wedstrijdminuut.';return}
  let s;try{s=snapshot()}catch(e){return}
  const actual=s.positions?.[lastPosAttempt075.playerId]||'';
  const ok=actual===lastPosAttempt075.newPos;
  b.classList.toggle('bad',!ok);
  if(ok)b.textContent=`✓ Positie lokaal actief: ${p(lastPosAttempt075.playerId)?.name||''} → ${lastPosAttempt075.newPos} in minuut ${lastPosAttempt075.minute}'. Wacht op Cloud-sync voor centrale bevestiging.`;
  else b.textContent=`⚠ Positiewijziging niet toegepast: verwacht ${lastPosAttempt075.newPos}, huidige positie ${actual||'—'}.`;
}

/* Veldopstelling en monitor lezen positie alleen uit snapshot().positions. */
function patchVisiblePositions075(){
  if(!state?.startMs)return;
  let s;try{s=snapshot()}catch(e){return}
  document.querySelectorAll('#fieldBoard .liveplayer').forEach(card=>{
    const id=card.dataset.playerId;if(!id)return;
    const pill=card.querySelector('.pill');if(pill&&s.open[id]!==undefined)pill.textContent=s.positions[id]||'VELD';
  });
  const monitor=document.getElementById('rotation074');
  if(monitor){
    monitor.querySelectorAll('.rot074Row:not(.rot074Head)').forEach(row=>{
      const name=row.children[0]?.textContent||'';
      const id=(state.selectedIds||[]).find(x=>(p(x)?.name||'')===name);
      if(id&&row.children[1]?.textContent==='VELD')row.children[1].title=`Positie: ${s.positions[id]||'—'}`;
    });
  }
}

function tick075(){try{bindMinuteInputs075();syncMinuteInputs075();patchVisiblePositions075();verifyPosition075()}catch(e){}}
setInterval(tick075,1000);setTimeout(tick075,200);
})();