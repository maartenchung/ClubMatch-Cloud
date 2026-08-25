(()=>{
// Layout-stabilisatie: laad compacte wisselbadges zonder extra tekstregel/hoogte.
if(!document.querySelector('link[data-v063-layoutfix]')){
 const l=document.createElement('link');l.rel='stylesheet';l.href='v063-layoutfix.css?v=0634';l.dataset.v063Layoutfix='1';document.head.appendChild(l);
}
if(!document.querySelector('script[data-v063-layoutfix]')){
 const s=document.createElement('script');s.src='v063-layoutfix.js?v=0634';s.dataset.v063Layoutfix='1';document.head.appendChild(s);
}
const style=document.createElement('style');
style.textContent=`
#pauseClockCard.pauseActive063{border-color:#d39118!important;background:#fff4db!important;box-shadow:0 0 0 3px rgba(211,145,24,.13)}
#pauseClockCard.pauseActive063 .clockValue{color:#9b6500!important}
#pauseBtn.resumeActive063{background:#237a43!important;color:#fff!important;border-color:#237a43!important}
#pauseBtn.pauseActive063{background:#fff4db!important;color:#6a531c!important;border:2px solid #d39118!important}
`;
document.head.appendChild(style);

function ensurePauseCard063(){
 const pc=document.getElementById('pauseClock');
 if(pc&&!document.getElementById('pauseClockCard'))pc.closest('.clockCard')?.setAttribute('id','pauseClockCard');
}
function isCloudPaused063(){
 return !!state?.cloud && (state.cloudClockStatus==='paused'||state.cloudPeriod==='halftime');
}
function updatePauseUi063(){
 ensurePauseCard063();
 const btn=document.getElementById('pauseBtn');if(!btn)return;
 if(!state?.cloud)return;
 const paused=isCloudPaused063(),half=state.cloudPeriod==='halftime';
 btn.classList.toggle('resumeActive063',paused);
 btn.classList.toggle('pauseActive063',!paused);
 document.getElementById('pauseClockCard')?.classList.toggle('pauseActive063',paused);
 if(state.finished){btn.textContent='✓ Wedstrijd afgelopen';btn.disabled=true;return}
 btn.disabled=false;
 if(half)btn.textContent='▶ Start tweede helft';
 else if(state.cloudClockStatus==='paused')btn.textContent='▶ Hervat wedstrijd';
 else btn.textContent='⏸ Rust / pauze starten';
}

async function doClockRpc063(action,minutes=null){
 const params={p_match_id:cloudActiveMatchId,p_action:action,p_client_event_id:(crypto.randomUUID?crypto.randomUUID():cloudUuid()),p_minutes:minutes};
 let res=await cloudClient.rpc('advance_match_clock',params);
 if(res.error&&/permission denied|jwt|token|auth/i.test(res.error.message||'')){
   try{await cloudClient.auth.refreshSession()}catch(e){}
   params.p_client_event_id=(crypto.randomUUID?crypto.randomUUID():cloudUuid());
   res=await cloudClient.rpc('advance_match_clock',params);
 }
 if(res.error)throw res.error;
 await cloudReloadActiveMatch();
 try{await cloudLoadTeamsAndOpenMatches()}catch(e){}
 return res.data;
}

async function robustTogglePause063(){
 if(!state?.cloud||!cloudActiveMatchId)return;
 const btn=document.getElementById('pauseBtn');if(btn)btn.disabled=true;
 try{
   const elapsed=Math.floor(rawActiveMs()/1000),half=Math.floor((state.officialDuration||80)*60/2);
   let action;
   if(state.cloudPeriod==='halftime') action='second_half';
   else if(state.cloudClockStatus==='paused') action='resume';
   else if(state.cloudPeriod==='first_half'&&elapsed>=half-60) action='halftime';
   else action='pause';
   await doClockRpc063(action,null);
   setStatus(action==='resume'||action==='second_half'?'Wedstrijd centraal hervat.':'Pauze/rust centraal gestart.',true);
   cloudSetStatus('Klok centraal bijgewerkt.',true);
 }catch(e){
   setStatus('Klokactie mislukt: '+e.message);
   cloudSetStatus('Klokactie mislukt: '+e.message);
 }finally{updatePauseUi063()}
}

document.addEventListener('click',ev=>{
 const btn=ev.target.closest?.('#pauseBtn');
 if(!btn||!state?.cloud)return;
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
 robustTogglePause063();
},true);

setInterval(updatePauseUi063,500);
setTimeout(updatePauseUi063,100);

// v0.6.3.4: stabiele renderer. Geen volledige spelertegel-rebuild meer iedere seconde.
if(!document.querySelector('script[data-v064-stable]')){
 const sr=document.createElement('script');sr.src='v064-stablerender.js?v=0634';sr.dataset.v064Stable='1';sr.async=false;document.body.appendChild(sr);
}
})();