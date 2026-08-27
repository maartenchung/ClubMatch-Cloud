/* ClubMatch Cloud v0.8 - live pitch drag/drop + atomic formation intents */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function createLivePitchController(options={}){
  const doc=options.document||global.document,runtime=options.runtime,run=options.run||((_,fn)=>fn());invariant(doc&&runtime,'Document en live-runtime zijn verplicht');
  let installed=false,dragPlayerId='',controls=null;
  function snapshot(){return runtime.snapshot}
  function hasSubstitution(){return (snapshot()?.events||[]).some(e=>e.event_type==='substitution')}
  function currentFormation(){return snapshot()?.match?.formation_code||'4-3-3'}
  function currentAssignments(){const state=runtime.liveState;invariant(state?.fieldIds?.length===11,'Live veld heeft geen 11 bevestigde spelers');return state.fieldIds.map(id=>({playerId:id,position:state.players[id]?.currentPosition||''}))}
  function atomicAssignmentsForMove(playerId,targetPosition){
    const assignments=currentAssignments().map(item=>({...item})),source=assignments.find(a=>a.playerId===playerId);invariant(source,'Gesleepte speler staat niet op het bevestigde veld');const target=assignments.find(a=>a.position===targetPosition&&a.playerId!==playerId);if(source.position===targetPosition)return assignments;
    const old=source.position;source.position=targetPosition;if(target)target.position=old;
    const positions=assignments.map(a=>a.position);invariant(positions.every(Boolean)&&new Set(positions).size===11,'Basisverschuiving moet 11 unieke posities behouden');return assignments;
  }
  async function movePlayer(playerId,targetPosition){
    const snap=snapshot();invariant(snap?.match?.status==='live','Slepen kan alleen tijdens een live wedstrijd');const state=runtime.liveState,source=state?.players?.[playerId];invariant(source?.currentRole==='FIELD','Speler staat niet op het veld');if(source.currentPosition===targetPosition)return null;
    if(!hasSubstitution())return runtime.changeFormation({formationCode:currentFormation(),assignments:atomicAssignmentsForMove(playerId,targetPosition),updateBasis:true});
    const occupant=state.fieldIds.find(id=>id!==playerId&&state.players[id]?.currentPosition===targetPosition);return occupant?runtime.swapPositions({playerId,otherPlayerId:occupant}):runtime.changePosition({playerId,position:targetPosition});
  }
  function suggestedAssignments(code){
    const state=runtime.liveState;invariant(state?.fieldIds?.length===11,'Live veld heeft geen 11 bevestigde spelers');invariant(global.ClubMatchV08Formation?.assignFormation,'Formatiemodule ontbreekt');const pseudo=state.fieldIds.map(id=>({playerId:id,starter:true,position:state.players[id]?.currentPosition||'',preferredPositions:[]}));return global.ClubMatchV08Formation.assignFormation(pseudo,code).assignments.map(a=>({playerId:a.playerId,position:a.position}));
  }
  async function applyFormation(code){const formation=global.ClubMatchV08Formation?.getFormation?.(code);invariant(formation,'Onbekende formatie');return runtime.changeFormation({formationCode:formation.code,assignments:suggestedAssignments(formation.code),updateBasis:!hasSubstitution()})}
  function ensureControls(){
    if(controls)return controls;const pitch=doc.getElementById('v08Pitch');if(!pitch)return null;const card=pitch.closest('.card')||pitch.parentElement;controls=doc.createElement('div');controls.id='v08LiveFormationControls';controls.style.cssText='display:grid;grid-template-columns:minmax(150px,220px) auto 1fr;gap:8px;align-items:end;margin:7px 0 10px';const formations=Object.keys(global.ClubMatchV08Formation?.FORMATIONS||{'4-3-3':[]});controls.innerHTML=`<label>Live formatie<select id="v08LiveFormationSelect">${formations.map(code=>`<option value="${code}">${code}</option>`).join('')}</select></label><button id="v08ApplyLiveFormation" class="secondary" data-v08-action>Formatie toepassen</button><div id="v08LiveFormationNote" class="muted"></div>`;pitch.before(controls);controls.querySelector('#v08ApplyLiveFormation').addEventListener('click',()=>run('Live formatie wijzigen',()=>applyFormation(controls.querySelector('#v08LiveFormationSelect').value)));return controls
  }
  function syncControls(){const c=ensureControls();if(!c)return;const select=c.querySelector('#v08LiveFormationSelect'),code=currentFormation();if([...select.options].some(o=>o.value===code))select.value=code;const editable=!!runtime.activeMatchId&&['live','halftime'].includes(snapshot()?.match?.status);c.querySelector('#v08ApplyLiveFormation').disabled=!editable;const beforeFirst=!hasSubstitution();c.querySelector('#v08LiveFormationNote').textContent=beforeFirst?'Nog geen wissel: verschuiven/formeren werkt ook de basisopstelling bij.':'Na de eerste wissel blijft de basis historisch; wijzigingen gelden alleen voor de live opstelling.'}
  function bindPitch(){const pitch=doc.getElementById('v08Pitch');if(!pitch||pitch.dataset.dragBound==='1')return;pitch.dataset.dragBound='1';pitch.addEventListener('dragstart',event=>{const player=event.target.closest?.('.v08PitchPlayer');if(!player)return;dragPlayerId=player.dataset.playerId||'';event.dataTransfer?.setData('text/plain',dragPlayerId);if(event.dataTransfer)event.dataTransfer.effectAllowed='move'});pitch.addEventListener('dragover',event=>{const slot=event.target.closest?.('.v08PitchSlot');if(!slot)return;event.preventDefault();slot.classList.add('dragOver')});pitch.addEventListener('dragleave',event=>event.target.closest?.('.v08PitchSlot')?.classList.remove('dragOver'));pitch.addEventListener('drop',event=>{const slot=event.target.closest?.('.v08PitchSlot');if(!slot)return;event.preventDefault();slot.classList.remove('dragOver');const id=event.dataTransfer?.getData('text/plain')||dragPlayerId;if(id)run('Live positie wijzigen',()=>movePlayer(id,slot.dataset.position))})}
  function install(){if(installed)return;installed=true;bindPitch();ensureControls();global.addEventListener?.('clubmatch:v08-confirmed',syncControls);global.addEventListener?.('clubmatch:v08-stopped',syncControls);syncControls()}
  function destroy(){installed=false;controls?.remove();controls=null}
  return Object.freeze({install,destroy,movePlayer,applyFormation,suggestedAssignments,hasSubstitution,syncControls,get canUpdateBasis(){return !hasSubstitution()}})
}
global.ClubMatchV08LivePitch={createLivePitchController};
})(typeof window!=='undefined'?window:globalThis);
