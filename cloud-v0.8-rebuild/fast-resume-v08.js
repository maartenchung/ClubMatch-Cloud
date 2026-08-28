/* ClubMatch Cloud v0.8 - confirmed Cloud Fast Resume */
(function(global){
'use strict';
const doc=global.document;
const URL='https://fnbqyogbamufytcabfzm.supabase.co';
const KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const RESUMABLE=new Set(['live','halftime','paused','in_progress']);
const state={runtime:null,client:null,selection:null,running:false,done:false,startedAt:0,lastMs:null,observer:null};

function now(){return global.performance?.now?.()??Date.now()}
function appVisible(){const app=doc?.getElementById?.('appPanel');return !!app&&!app.classList.contains('hidden')}
function resumableStatus(value){return RESUMABLE.has(String(value||'').toLowerCase())}
function ensureStatus(){
  if(!doc)return null;
  let el=doc.getElementById('v08FastResumeStatus');
  if(el?.isConnected)return el;
  const anchor=doc.getElementById('v08Integrity')||doc.getElementById('v08ScoreCard');
  if(!anchor)return null;
  el=doc.createElement('div');el.id='v08FastResumeStatus';el.setAttribute('role','status');el.style.cssText='margin-top:6px;padding:6px 9px;border-radius:999px;display:inline-block;font-size:10px;font-weight:900;border:1px solid #d8c4ef;background:#faf7fd;color:#5d4770';anchor.after(el);return el;
}
function renderStatus(message,tone='normal'){
  const el=ensureStatus();if(!el)return;
  el.textContent=message;
  if(tone==='ok'){el.style.background='#eaf7ee';el.style.color='#1f6638';el.style.borderColor='#9ed5ad'}
  else if(tone==='warn'){el.style.background='#fff4dd';el.style.color='#704800';el.style.borderColor='#e3bd68'}
  else{el.style.background='#faf7fd';el.style.color='#5d4770';el.style.borderColor='#d8c4ef'}
}
function emit(detail){try{global.dispatchEvent?.(new global.CustomEvent('clubmatch:v08-fast-resume',{detail}))}catch{}}
function getClient(){if(state.client)return state.client;state.client=global.ClubMatchV08CloudClient?.createClient?.(URL,KEY)||null;return state.client}
function getSelection(){if(state.selection)return state.selection;state.selection=global.ClubMatchV08MatchSelection?.createMatchSelection?.()||null;return state.selection}
function captureRuntime(event){state.runtime=event?.detail?.runtime||state.runtime;queue()}

async function lazyLateCandidates(matchId){
  const select=doc?.getElementById?.('latePlayer'),client=getClient();if(!select||!client||!matchId)return;
  try{
    const {data,error}=await client.rpc('get_late_arrival_candidates_v08',{p_match_id:matchId});if(error)throw error;
    const list=Array.isArray(data)?data:[];const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    select.innerHTML='<option value="">— kies speler —</option>'+list.map(p=>`<option value="${esc(p.player_id)}">#${esc(p.shirt_number??'—')} ${esc(p.display_name||p.full_name||'')}</option>`).join('');
  }catch(error){console.debug('Fast Resume: late-arrival lijst later laden',error)}
}

async function maybeResume(){
  if(state.running||state.done||!state.runtime||!appVisible())return false;
  const selection=getSelection(),matchId=selection?.recalled?.();if(!matchId){state.done=true;return false}
  const client=getClient();if(!client)return false;
  state.running=true;state.startedAt=now();renderStatus('↻ Actieve wedstrijd direct uit Cloud herstellen…');
  try{
    const session=(await client.auth.getSession()).data?.session;if(!session)return false;
    if(state.runtime.activeMatchId===matchId){state.done=true;return true}
    const probe=await client.rpc('get_match_snapshot',{p_match_id:matchId});if(probe?.error)throw probe.error;
    const snapshot=probe?.data,status=snapshot?.match?.status;
    if(!snapshot?.match?.id){renderStatus('Fast Resume · geen bevestigde actieve wedstrijd','warn');state.done=true;return false}
    if(!resumableStatus(status)){
      if(String(status||'').toLowerCase()==='finished')selection?.clear?.();
      state.done=true;return false;
    }
    await state.runtime.start(matchId);
    state.lastMs=Math.max(0,Math.round(now()-state.startedAt));state.done=true;
    renderStatus(`⚡ Fast Resume · live wedstrijd hersteld in ${(state.lastMs/1000).toFixed(1)}s`,'ok');
    emit({matchId,elapsedMs:state.lastMs,status:'resumed'});
    Promise.resolve().then(()=>lazyLateCandidates(matchId));
    return true;
  }catch(error){
    console.debug('Fast Resume valt terug op normale Cloud-bootstrap',error);
    renderStatus('Fast Resume niet gebruikt · normale Cloud-herstelroute actief','warn');
    emit({matchId,error:error?.message||String(error),status:'fallback'});
    return false;
  }finally{state.running=false}
}
function queue(){Promise.resolve().then(maybeResume)}
function boot(){
  getClient();getSelection();ensureStatus();
  global.addEventListener?.('clubmatch:v08-runtime-ready',captureRuntime);
  const app=doc?.getElementById?.('appPanel');if(app&&global.MutationObserver){state.observer=new global.MutationObserver(queue);state.observer.observe(app,{attributes:true,attributeFilter:['class']})}
  queue();
}
if(doc?.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot);else boot();
global.ClubMatchV08FastResume=Object.freeze({maybeResume,resumableStatus,appVisible,renderStatus,get state(){return {...state}}});
})(typeof window!=='undefined'?window:globalThis);
