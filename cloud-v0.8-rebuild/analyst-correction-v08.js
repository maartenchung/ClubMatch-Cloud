/* ClubMatch Cloud v0.8 - touch-first one-tap analyst correction */
(function(global){
'use strict';
const doc=global.document;
const URL='https://fnbqyogbamufytcabfzm.supabase.co';
const KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const MODE_KEY='clubmatch.v08.action.mode';
const state={runtime:null,snapshot:null,client:null,button:null,wrap:null,armed:false,armTimer:null,busy:false,lastVisible:null,mountTimer:null,mountTries:0};
function id(){return global.crypto?.randomUUID?.()||`undo-${Date.now()}-${Math.random().toString(16).slice(2)}`}
function client(){if(state.client)return state.client;const api=global.ClubMatchV08CloudClient;if(!api?.createClient)return null;state.client=api.createClient(URL,KEY);return state.client}
function analystOn(){try{return global.localStorage?.getItem(MODE_KEY)==='analyst'}catch{return !!doc?.getElementById?.('v08AnalystMode')?.classList.contains('on')}}
function notice(message,tone='normal'){try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-notice',{detail:{message:String(message||''),tone}}))}catch{}}
function setFlag(el,name,on){if(!el?.classList)return false;const next=!!on,current=el.classList.contains(name);if(current===next)return false;el.classList.toggle(name,next);return true}
function setDisabled(el,disabled){if(!el||el.disabled===!!disabled)return false;el.disabled=!!disabled;return true}
function setText(el,value){const next=String(value??'');if(!el||el.textContent===next)return false;el.textContent=next;return true}
function clearArm(){
 const changed=state.armed||!!state.armTimer;state.armed=false;if(state.armTimer)global.clearTimeout?.(state.armTimer);state.armTimer=null;
 if(state.button){setFlag(state.button,'armed',false);setText(state.button,'↶ Laatste analistactie');setDisabled(state.button,state.busy)}
 return changed;
}
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
function ensureMounted(){
 const wrap=ensureUi();if(wrap){if(state.mountTimer)global.clearTimeout?.(state.mountTimer);state.mountTimer=null;return wrap}
 if(state.mountTimer||state.mountTries>=30)return null;state.mountTries++;
 state.mountTimer=global.setTimeout?.(()=>{state.mountTimer=null;ensureMounted();render()},100)||null;return null;
}
function render(){
 const wrap=ensureUi();if(!wrap){ensureMounted();return false}
 const live=state.snapshot?.match?.status==='live'||state.snapshot?.match?.status==='halftime',visible=!!state.runtime?.activeMatchId&&live&&analystOn();
 setFlag(wrap,'hidden',!visible);if(!visible&&state.armed)clearArm();setDisabled(state.button,state.busy);state.lastVisible=visible;return visible;
}
async function performUndo(){
 const c=client();if(!c||!state.runtime?.activeMatchId)throw new Error('Geen actieve Cloud-wedstrijd');
 const result=await c.rpc('undo_last_analyst_input_v08',{p_match_id:state.runtime.activeMatchId,p_client_event_id:id(),p_reason:'Snelle correctie vanuit Analistmodus'});if(result?.error)throw result.error;
 await state.runtime.refresh('analist-undo');const count=Number(result?.data?.voided_count)||1,label=String(result?.data?.label||'actie');notice(`Laatste analistregistratie teruggedraaid · ${label} · ${count} gekoppelde event${count===1?'':'s'}.`,'ok');return result?.data;
}
function onUndoClick(){
 if(state.busy)return;if(!state.armed){state.armed=true;setFlag(state.button,'armed',true);setText(state.button,'↶ Tik nogmaals om terug te draaien');try{global.navigator?.vibrate?.(30)}catch{}state.armTimer=global.setTimeout?.(clearArm,3000)||null;return}
 clearArm();state.busy=true;setDisabled(state.button,true);setFlag(state.button,'busy',true);setText(state.button,'Terugdraaien…');performUndo().catch(error=>{console.error(error);notice(`Terugdraaien mislukt: ${error.message||error}`,'danger')}).finally(()=>{state.busy=false;setFlag(state.button,'busy',false);clearArm();render()})
}
function onRuntimeReady(event){if(event?.detail?.runtime)state.runtime=event.detail.runtime;state.mountTries=0;ensureMounted();render()}
function onConfirmed(event){if(event?.detail?.runtime)state.runtime=event.detail.runtime;state.snapshot=event?.detail?.snapshot||state.runtime?.snapshot||null;state.mountTries=0;ensureMounted();render()}
function relevantMutation(){return false}
function boot(){
 ensureMounted();global.addEventListener?.('clubmatch:v08-runtime-ready',onRuntimeReady);global.addEventListener?.('clubmatch:v08-confirmed',onConfirmed);global.addEventListener?.('clubmatch:v08-stopped',()=>{state.snapshot=null;clearArm();render()});
 doc?.addEventListener?.('click',event=>{if(event.target?.closest?.('#v08AnalystMode'))global.setTimeout?.(render,0)});render()
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.ClubMatchV08AnalystCorrection=Object.freeze({render,performUndo,clearArm,relevantMutation,get state(){return {...state}}});
})(typeof window!=='undefined'?window:globalThis);
