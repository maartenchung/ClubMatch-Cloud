/* ClubMatch Cloud v0.8 - DOM-only pre-match preparation UI */
(function(global){
'use strict';
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const STANDARD_POSITIONS=['GK','RB','RCB','CB','LCB','LB','RWB','LWB','DM','CM1','CM2','CM','AM','RW','LW','ST'];
function positionOptions(player){const values=[...new Set([...STANDARD_POSITIONS,...(player.preferredPositions||[]).map(String),player.position].filter(Boolean))];return '<option value="">— positie —</option>'+values.map(p=>`<option value="${esc(p)}"${p===player.position?' selected':''}>${esc(p)}</option>`).join('')}
function createPreparationUi(options={}){
  const doc=options.document||global.document,controller=options.controller; if(!doc||!controller)throw new Error('document and preparation controller are required');
  let panel=null,lastState=null;
  function ensureMounted(){
    if(panel)return panel;
    const app=doc.getElementById('appPanel');if(!app)throw new Error('appPanel is missing');
    panel=doc.createElement('section');panel.id='v08Preparation';panel.className='card';
    const first=app.firstElementChild;first?.after(panel);if(!first)app.prepend(panel);
    return panel;
  }
  function teamOptions(state){return '<option value="">— team/seizoen —</option>'+state.teamSeasons.map(t=>`<option value="${esc(t.team_season_id)}"${t.team_season_id===state.meta.teamSeasonId?' selected':''}>${esc(t.club_name)} · ${esc(t.team_name)} · ${esc(t.season_name)}</option>`).join('')}
  function rosterHtml(state){
    if(!state.setup)return '<div class="muted">Kies eerst een team/seizoen.</div>';
    return `<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:720px"><thead><tr><th style="text-align:left">Speler</th><th>Aanwezig</th><th>Selectie</th><th>Basis</th><th style="text-align:left">Positie</th></tr></thead><tbody>${state.players.map(player=>`<tr data-prep-player="${esc(player.playerId)}" style="border-top:1px solid #eee"><td style="padding:7px 5px"><b>#${esc(player.shirtNumber??'—')} ${esc(player.name)}</b><div class="muted">${esc((player.preferredPositions||[]).join(' · '))}</div></td><td style="text-align:center"><input type="checkbox" data-prep-field="attendance" ${player.attendance?'checked':''}></td><td style="text-align:center"><input type="checkbox" data-prep-field="selected" ${player.selected?'checked':''} ${!player.attendance?'disabled':''}></td><td style="text-align:center"><input type="checkbox" data-prep-field="starter" ${player.starter?'checked':''} ${!player.attendance?'disabled':''}></td><td><select data-prep-field="position" ${!player.starter?'disabled':''}>${positionOptions(player)}</select></td></tr>`).join('')}</tbody></table></div>`;
  }
  function render(state){
    lastState=state;const root=ensureMounted();const v=state.validation||{errors:[],selectedCount:0,starterCount:0,ok:false};
    const ready=v.ok&&!state.dirty&&!!state.meta.matchId;
    root.innerHTML=`<div class="sectionTitle"><div><h2 style="margin-bottom:3px">Wedstrijdvoorbereiding</h2><div class="muted">Cloud-selectie, basisopstelling en formatie vóór de live wedstrijd.</div></div><div class="controls"><button id="prepNewBtn" class="secondary" data-v08-action>Nieuwe voorbereiding</button><button id="prepCloseBtn" class="secondary" data-v08-action>Sluiten</button></div></div>
      <div class="grid3" style="margin-top:10px"><label>Team / seizoen<select id="prepTeam">${teamOptions(state)}</select></label><label>Tegenstander<input id="prepOpponent" value="${esc(state.meta.opponentName)}" placeholder="Tegenstander"></label><label>Formatie<input id="prepFormation" value="${esc(state.meta.formationCode)}" placeholder="4-3-3"></label></div>
      <div class="grid3" style="margin-top:8px"><label>Datum<input id="prepDate" type="date" value="${esc(state.meta.matchDate)}"></label><label>Tijd<input id="prepTime" type="time" value="${esc(state.meta.scheduledTime)}"></label><label>Wedstrijdduur (min)<input id="prepDuration" type="number" min="1" max="180" value="${esc(state.meta.officialDurationMinutes)}"></label></div>
      <div style="margin:10px 0;padding:8px;border-radius:10px;background:#f8f4fc"><b>${v.selectedCount} geselecteerd · ${v.starterCount} basis</b> · ${state.dirty?'niet opgeslagen':'opgeslagen'}${state.meta.matchId?` · match ${esc(state.meta.matchId).slice(0,8)}…`:''}<div class="muted" style="margin-top:4px">${v.errors.length?esc(v.errors.join(' · ')):'✓ Basisopstelling voldoet aan de 11-spelerscontrole.'}</div></div>
      ${rosterHtml(state)}
      <div class="controls" style="margin-top:10px"><button id="prepSaveBtn" data-v08-action ${!state.setup?'disabled':''}>Voorbereiding opslaan</button><button id="prepStartBtn" data-v08-action ${!ready?'disabled':''}>▶ Wedstrijd starten</button></div>`;
    bind(root);root.classList.remove('hidden');return root;
  }
  function syncMeta(){controller.setMeta({opponentName:doc.getElementById('prepOpponent')?.value||'',formationCode:doc.getElementById('prepFormation')?.value||'',matchDate:doc.getElementById('prepDate')?.value||'',scheduledTime:doc.getElementById('prepTime')?.value||'',officialDurationMinutes:Number(doc.getElementById('prepDuration')?.value||80)})}
  function bind(root){
    const team=root.querySelector('#prepTeam');if(team)team.onchange=()=>options.run?.('Team laden',()=>controller.loadTeam(team.value));
    ['prepOpponent','prepFormation','prepDate','prepTime','prepDuration'].forEach(id=>{const el=root.querySelector(`#${id}`);if(el)el.onchange=syncMeta});
    root.querySelectorAll('[data-prep-player]').forEach(row=>row.querySelectorAll('[data-prep-field]').forEach(input=>input.onchange=()=>{const field=input.dataset.prepField,value=field==='position'?input.value:!!input.checked;controller.patchPlayer(row.dataset.prepPlayer,{[field]:value})}));
    root.querySelector('#prepSaveBtn')?.addEventListener('click',()=>options.run?.('Voorbereiding opslaan',async()=>{syncMeta();const snap=await controller.save();await options.onSaved?.(snap);return snap}));
    root.querySelector('#prepStartBtn')?.addEventListener('click',()=>options.run?.('Wedstrijd starten',async()=>{const id=controller.state.meta.matchId;const result=await controller.start();await options.onStarted?.(id,result);return result}));
    root.querySelector('#prepNewBtn')?.addEventListener('click',()=>{controller.clear();render(controller.state)});
    root.querySelector('#prepCloseBtn')?.addEventListener('click',hide);
  }
  function hide(){ensureMounted().classList.add('hidden')}
  function show(){ensureMounted().classList.remove('hidden');if(lastState)render(lastState)}
  async function openExisting(match){const state=await controller.openExisting(match);return render(state)}
  function renderCurrent(){return render(controller.state)}
  return Object.freeze({render,renderCurrent,openExisting,show,hide,get visible(){return panel&&!panel.classList.contains('hidden')}});
}
global.ClubMatchV08PreparationUi={createPreparationUi};
})(typeof window!=='undefined'?window:globalThis);
