/* ClubMatch Cloud v0.8 - one-shot speech + typed fallback + explicit confirmation */
(function(global){
'use strict';
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function createVoiceUi(options={}){
  const doc=options.document||global.document,controller=options.controller;if(!doc||!controller)throw new Error('Document en spraakcontroller zijn verplicht');
  const Recognition=options.SpeechRecognition||global.SpeechRecognition||global.webkitSpeechRecognition||null;
  let panel=null,recognition=null,listening=false,localMessage='';
  function ensureStyles(){if(doc.getElementById('v08VoiceStyles'))return;const s=doc.createElement('style');s.id='v08VoiceStyles';s.textContent=`.voiceRow{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:end}.voicePending{margin-top:8px;padding:9px;border:1px solid #cdb6e6;background:#f8f3fd;border-radius:10px}.voiceListening{animation:v08pulse 1s infinite}@keyframes v08pulse{50%{opacity:.55}}@media(max-width:650px){.voiceRow{grid-template-columns:1fr}.voiceRow button{width:100%}}`;doc.head.appendChild(s)}
  function ensureMounted(){if(panel)return panel;ensureStyles();const app=doc.getElementById('appPanel');if(!app)throw new Error('ClubMatch-appscherm ontbreekt');panel=doc.createElement('section');panel.id='v08Voice';panel.className='card';const correction=doc.getElementById('v08Corrections'),live=app.querySelector('.liveLayout');if(correction)app.insertBefore(panel,correction);else if(live)app.insertBefore(panel,live);else app.appendChild(panel);return panel}
  function messageFor(state){if(localMessage)return localMessage;if(state.lastError)return state.lastError;if(!state.hasMatch)return 'Open eerst een actieve wedstrijd. Typen blijft beschikbaar zodra een wedstrijd actief is.';if(!Recognition)return 'Microfoonherkenning is in deze browser niet beschikbaar. Typ de opdracht hieronder.';return 'Je kunt spreken of typen. Er wordt pas geschreven nadat je de opdracht bevestigt.'}
  function render(state=controller.state){
    const root=ensureMounted(),pending=state.pending;
    root.innerHTML=`<div class="sectionTitle"><div><h2 style="margin-bottom:3px">Spraak & snelle invoer</h2><div class="muted">Nederlands · spelernaam of rugnummer · altijd eerst controleren en bevestigen</div></div><span class="badge">${Recognition?'MIC + TEKST':'TEKST'}</span></div>
      <div class="voiceRow" style="margin-top:9px"><label>Opdracht<input id="voiceText" value="${esc(state.lastText||'')}" placeholder="Bijv. wissel 13 voor 9"></label><button id="voiceListen" class="secondary ${listening?'voiceListening':''}" data-v08-action ${!Recognition||!state.hasMatch?'disabled':''}>${listening?'● Luistert…':'🎙 Luisteren'}</button><button id="voiceCheck" data-v08-action ${!state.hasMatch?'disabled':''}>Opdracht controleren</button></div>
      <div id="voiceMessage" class="muted" style="margin-top:6px">${esc(messageFor(state))}</div>
      <div class="muted" style="margin-top:5px">Voorbeelden: “wissel 13 voor 9” · “doelpunt Wai Sam assist 9” · “positie 13 rechtsbuiten” · “ruil 13 met 10” · “pauze”</div>
      ${pending?`<div class="voicePending"><b>ClubMatch begrijpt:</b> ${esc(pending.summary)}<div class="controls" style="margin-top:7px"><button id="voiceConfirm" data-v08-action>✓ Bevestigen</button><button id="voiceCancel" class="secondary" data-v08-action>Annuleren</button></div></div>`:''}`;
    bind(root);return root
  }
  function prepare(text){localMessage='';const result=controller.prepare(text);render(controller.state);return result}
  function bind(root){
    const input=root.querySelector('#voiceText');input?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();prepare(input.value)}});
    root.querySelector('#voiceCheck')?.addEventListener('click',()=>prepare(input?.value||''));
    root.querySelector('#voiceCancel')?.addEventListener('click',()=>{controller.cancel();localMessage='Opdracht geannuleerd; er is niets opgeslagen.';render(controller.state)});
    root.querySelector('#voiceConfirm')?.addEventListener('click',()=>options.run?.('Spraakopdracht bevestigen',async()=>{const summary=controller.state.pending?.summary||'Opdracht';const result=await controller.confirm();localMessage=`Opgeslagen: ${summary}`;render(controller.state);return result}));
    root.querySelector('#voiceListen')?.addEventListener('click',startListening);
  }
  function setupRecognition(){
    if(!Recognition||recognition)return recognition;recognition=new Recognition();recognition.lang='nl-NL';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onstart=()=>{listening=true;localMessage='Luisteren… spreek één korte opdracht uit.';render(controller.state)};
    recognition.onresult=event=>{const text=event?.results?.[0]?.[0]?.transcript||'';listening=false;localMessage='';prepare(text)};
    recognition.onerror=event=>{listening=false;const code=event?.error||'onbekend';localMessage=code==='not-allowed'||code==='service-not-allowed'?'Microfoontoegang is geweigerd. Je kunt dezelfde opdracht typen.':`Spraakherkenning lukte niet (${code}). Typ de opdracht of probeer opnieuw.`;render(controller.state)};
    recognition.onend=()=>{if(listening){listening=false;render(controller.state)}};return recognition
  }
  function startListening(){
    if(!controller.state.hasMatch){localMessage='Open eerst een actieve wedstrijd.';return render(controller.state)}
    const r=setupRecognition();if(!r){localMessage='Microfoonherkenning is niet beschikbaar; typ de opdracht.';return render(controller.state)}
    try{r.start()}catch(error){listening=false;localMessage=`Microfoon kon niet starten: ${error.message||error}. Typ de opdracht.`;render(controller.state)}
  }
  function stopListening(){if(recognition){try{recognition.abort?.()}catch{}}listening=false}
  function setSnapshot(snapshot){controller.setSnapshot(snapshot);localMessage='';return render(controller.state)}
  function clear(){stopListening();controller.clear();localMessage='';if(panel)render(controller.state)}
  return Object.freeze({render,setSnapshot,prepare,startListening,stopListening,clear,get supported(){return !!Recognition},get listening(){return listening}})
}
global.ClubMatchV08VoiceUi={createVoiceUi};
})(typeof window!=='undefined'?window:globalThis);
