/* ClubMatch Cloud v0.8 - touch-first one-tap analyst correction */
(function(global){
'use strict';
const doc=global.document;
const URL='https://fnbqyogbamufytcabfzm.supabase.co';
const KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const MODE_KEY='clubmatch.v08.action.mode';
const state={runtime:null,snapshot:null,client:null,button:null,wrap:null,armed:false,armTimer:null,busy:false,observer:null};
function id(){return global.crypto?.randomUUID?.()||`undo-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function client(){if(state.client)return state.client;const api=global.ClubMatchV08CloudClient;if(!api?.createClient)return null;state.client=api.createClient(URL,KEY);return state.client}
function analystOn(){try{return global.localStorage?.getItem(MODE_KEY)==='analyst'}catch{return !!doc?.getElementById?.('v08AnalystMode')?.classList.contains('on')}}
function notice(message,tone='normal'){try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-notice',{detail:{message:String(message||''),tone}}))}catch{}}
function clearArm(){state.armed=false;if(state.armTimer)global.clearTimeout?.(state.armTimer);state.armTimer=null;if(state.button){state.button.classList.remove('armed');state.button.textContent='↶ Laatste analistactie';state.button.disabled=state.busy}}
function ensureStyles(){if(!doc||doc.getElementById('v08AnalystCorrectionStyles'))return;const s=doc.createElement('style');s.id='v08AnalystCorrectionStyles';s.textContent=`
.analystUndoWrap{display:flex;gap:8px;align-items:center;margin:10px 0 4px;padding:8px;border:1px solid #d8c4ef;border-radius:12px;background:#faf7fd}.analystUndoWrap .hint{flex:1;font-size:10px;color:#6b5877}.analystUndoBtn{min-height:58px;min-width:210px;border:0;border-radius:12px;padding:10px 14px;background:#eadff5;color:#4b2672;font-weight:900;touch-action:manipulation}.analystUndoBtn.armed{background:#f5c04a;color:#382500}.analystUndoBtn.busy{opacity:.65}.analystUndoBtn:disabled{opacity:.45}
@media(pointer:coarse){.analystUndoBtn{min-height:68px;font-size:15px;min-width:235px}}
@media(max-width:620px){.analystUndoWrap{display:grid;grid-template-columns:1fr}.analystUndoBtn{width:100%;min-width:0}.analystUndoWrap .hint{text-align:center}}
`;doc.head.appendChild(s)}
function ensureUi(){
 const bar=doc?.getElementById?.('v08PossessionBar');if(!bar)return null;if(state.wrap?.isConnected)return state.wrap;ensureStyles();
 const wrap=doc.createElement('div');wrap.className='analystUndoWrap hidden';wrap.innerHTML='<button type="button" class="analystUndoBtn" data-v08-action>↶ Laatste analistactie</button><div class="hint">Fout getikt? Eerste tik wapent de correctie; tik binnen 3 seconden nogmaals. De originele invoer blijft in de auditgeschiedenis.</div>';
 const anchor=bar.querySelector('.quickRegHead')||bar.firstElementChild;anchor?.after?.(wrap);if(!anchor)bar.prepend(wrap);state.wrap=wrap;state.button=wrap.querySelector('.analystUndoBtn');state.button.onclick=onUndoClick;return wrap;
}
function render(){const wrap=ensureUi();if(!wrap)return false;const live=state.snapshot?.match?.status==='live'||state.snapshot?.match?.status==='halftime',visible=!!state.runtime?.activeMatchId&&live&&analystOn();wrap.classList.toggle('hidden',!visible);if(!visible)clearArm();state.button.disabled=state.busy;return visible}
async function performUndo(){
 const c=client();if(!c||!state.runtime?.activeMatchId)throw new Error('Geen actieve Cloud-wedstrijd');
 const result=await c.rpc('undo_last_analyst_input_v08',{p_match_id:state.runtime.activeMatchId,p_client_event_id:id(),p_reason:'Snelle correctie vanuit Analistmodus'});if(result?.error)throw result.error;
 await state.runtime.refresh('analist-undo');const count=Number(result?.data?.voided_count)||1,label=String(result?.data?.label||'actie');notice(`Laatste analistregistratie teruggedraaid · ${label} · ${count} gekoppelde event${count===1?'':'s'}.`,'ok');return result?.data;
}
function onUndoClick(){
 if(state.busy)return;if(!state.armed){state.armed=true;state.button.classList.add('armed');state.button.textContent='↶ Tik nogmaals om terug te draaien';try{global.navigator?.vibrate?.(30)}catch{}state.armTimer=global.setTimeout?.(clearArm,3000)||null;return}
 clearArm();state.busy=true;state.button.disabled=true;state.button.classList.add('busy');state.button.textContent='Terugdraaien…';performUndo().catch(error=>{console.error(error);notice(`Terugdraaien mislukt: ${error.message||error}`,'danger')}).finally(()=>{state.busy=false;state.button?.classList.remove('busy');clearArm();render()})
}
function onRuntimeReady(event){if(event?.detail?.runtime)state.runtime=event.detail.runtime;render()}
function onConfirmed(event){if(event?.detail?.runtime)state.runtime=event.detail.runtime;state.snapshot=event?.detail?.snapshot||state.runtime?.snapshot||null;render()}
function boot(){ensureUi();global.addEventListener?.('clubmatch:v08-runtime-ready',onRuntimeReady);global.addEventListener?.('clubmatch:v08-confirmed',onConfirmed);global.addEventListener?.('clubmatch:v08-stopped',()=>{state.snapshot=null;clearArm();render()});if(doc?.body&&global.MutationObserver){state.observer=new global.MutationObserver(()=>render());state.observer.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['class']})}render()}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08AnalystCorrection=Object.freeze({render,performUndo,clearArm,get state(){return {...state}}});
})(typeof window!=='undefined'?window:globalThis);
