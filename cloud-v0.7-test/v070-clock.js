(()=>{
const style=document.createElement('style');
style.textContent=`
#pauseClockCard.pauseActive070{border:3px solid #d39118!important;background:#fff7e6!important;box-shadow:0 0 0 3px rgba(211,145,24,.12)}
#pauseClockCard.pauseActive070 .clockValue{color:#8a5b00!important}
#pauseBtn.resumeActive070{background:#1976d2!important;color:#fff!important;border-color:#1976d2!important}
`;
document.head.appendChild(style);

function updatePause070(){
 const btn=document.getElementById('pauseBtn');if(!btn||!state?.cloud)return;
 const paused=state.cloudClockStatus==='paused'||state.cloudPeriod==='halftime';
 btn.classList.toggle('resumeActive070',paused);
 document.getElementById('pauseClockCard')?.classList.toggle('pauseActive070',paused);
 if(state.finished){btn.textContent='✓ Wedstrijd afgelopen';btn.disabled=true;return}
 btn.disabled=false;
 if(state.cloudPeriod==='halftime')btn.textContent='▶ Start tweede helft';
 else if(state.cloudClockStatus==='paused')btn.textContent='▶ Hervat wedstrijd';
 else btn.textContent='⏸ Rust / pauze starten';
}
async function rpcClock070(action,minutes=null){
 const params={p_match_id:cloudActiveMatchId,p_action:action,p_client_event_id:cloudUuid(),p_minutes:minutes};
 let {data,error}=await cloudClient.rpc('advance_match_clock',params);
 if(error&&/permission denied|jwt|token|auth/i.test(error.message||'')){
   try{await cloudClient.auth.refreshSession()}catch(e){}
   params.p_client_event_id=cloudUuid();({data,error}=await cloudClient.rpc('advance_match_clock',params));
 }
 if(error)throw error;
 await cloudReloadActiveMatch();
 return data;
}
async function togglePause070(){
 if(!state?.cloud||!cloudActiveMatchId)return;
 const btn=document.getElementById('pauseBtn');if(btn)btn.disabled=true;
 try{
   const elapsed=Math.floor(rawActiveMs()/1000),half=Math.floor((state.officialDuration||80)*60/2);
   let action;
   if(state.cloudPeriod==='halftime')action='second_half';
   else if(state.cloudClockStatus==='paused')action='resume';
   else if(state.cloudPeriod==='first_half'&&elapsed>=half-60)action='halftime';
   else action='pause';
   await rpcClock070(action);
   setStatus(action==='resume'||action==='second_half'?'Wedstrijd centraal hervat.':'Rust/pauze centraal gestart.',true);
 }catch(e){setStatus('Klokactie mislukt: '+e.message);cloudSetStatus('Klokactie mislukt: '+e.message)}
 finally{updatePause070()}
}
document.addEventListener('click',ev=>{
 const btn=ev.target.closest?.('#pauseBtn');if(!btn||!state?.cloud)return;
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();togglePause070();
},true);
setInterval(updatePause070,500);setTimeout(updatePause070,100);
})();