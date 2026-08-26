/* ClubMatch Cloud v0.8 - stable DOM renderer; no match calculations */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function text(el,value){if(el&&el.textContent!==String(value??''))el.textContent=String(value??'')}
function clearStateClasses(el){['swapNever080','swapPast080','swapIn080','swapOut080'].forEach(c=>el.classList.remove(c))}

function createRenderer(doc){
  invariant(doc?.getElementById,'document is required');
  const refs={
    clock:doc.getElementById('v08Clock'),score:doc.getElementById('v08Score'),integrity:doc.getElementById('v08Integrity'),
    field:doc.getElementById('v08FieldTiles'),bench:doc.getElementById('v08BenchTiles'),pitch:doc.getElementById('v08Pitch'),
    monitor:doc.getElementById('v08Monitor'),timeline:doc.getElementById('v08Timeline')
  };
  Object.entries(refs).forEach(([key,value])=>invariant(value,`Missing v0.8 DOM target: ${key}`));
  const cards=new Map(),pitchNodes=new Map(),monitorNodes=new Map(),timelineNodes=new Map();

  function ensureCard(player){
    let card=cards.get(player.id);if(card)return card;
    card=doc.createElement('article');card.className='v08Player';card.dataset.playerId=player.id;
    card.innerHTML='<div class="v08PlayerHead"><b class="v08PlayerName"></b><span class="v08PlayerPos"></span></div><div class="v08PlayerMeta"></div><div class="v08Metrics"></div>';
    const metrics=card.querySelector('.v08Metrics');
    for(let i=0;i<4;i++){
      const m=doc.createElement('div');m.className='v08Metric';m.dataset.slot=String(i);m.innerHTML='<span></span><b></b>';metrics.appendChild(m);
    }
    cards.set(player.id,card);return card;
  }

  function updateCard(player){
    const card=ensureCard(player);clearStateClasses(card);card.classList.add(player.cssClass);
    text(card.querySelector('.v08PlayerName'),`${player.shirtNumber??'—'} · ${player.name}`);
    text(card.querySelector('.v08PlayerPos'),player.role==='FIELD'?(player.position||'—'):'BANK');
    text(card.querySelector('.v08PlayerMeta'),`${player.changeState} · IN ${player.inCount}× · UIT ${player.outCount}× · ↕ ${player.substitutionCount}×`);
    const slots=card.querySelectorAll('.v08Metric');
    player.metrics.forEach((metric,index)=>{const slot=slots[index];slot.classList.toggle('active',!!metric.active);text(slot.querySelector('span'),metric.label);text(slot.querySelector('b'),metric.display)});
    return card;
  }

  function placeCards(list,target){
    const wanted=new Set(list.map(p=>p.id));
    list.forEach(player=>target.appendChild(updateCard(player)));
    [...target.children].forEach(node=>{if(!wanted.has(node.dataset.playerId))node.remove()});
  }

  function ensurePitch(player){
    let node=pitchNodes.get(player.id);if(node)return node;
    node=doc.createElement('div');node.className='v08PitchPlayer';node.dataset.playerId=player.id;
    node.innerHTML='<b class="v08PitchPos"></b><span class="v08PitchName"></span><small class="v08PitchTime"></small>';
    pitchNodes.set(player.id,node);return node;
  }
  function renderPitch(list){
    const wanted=new Set(list.map(p=>p.id));
    list.forEach(player=>{const node=ensurePitch(player);clearStateClasses(node);node.classList.add(player.cssClass);text(node.querySelector('.v08PitchPos'),player.position);text(node.querySelector('.v08PitchName'),`${player.shirtNumber??'—'} ${player.name}`);text(node.querySelector('.v08PitchTime'),`Σ ${player.play} · ▶ ${player.current} · ↕ ${player.substitutions}`);refs.pitch.appendChild(node)});
    [...refs.pitch.children].forEach(node=>{if(node.dataset.playerId&&!wanted.has(node.dataset.playerId))node.remove()});
  }

  function ensureMonitor(row){
    let node=monitorNodes.get(row.id);if(node)return node;
    node=doc.createElement('div');node.className='v08MonitorRow';node.dataset.playerId=row.id;
    node.innerHTML='<span class="mName"></span><span class="mRole"></span><span class="mPos"></span><b class="mCurrent"></b><span class="mTotal"></span>';
    monitorNodes.set(row.id,node);return node;
  }
  function renderMonitor(rows){
    const wanted=new Set(rows.map(r=>r.id));
    rows.forEach(row=>{const node=ensureMonitor(row);clearStateClasses(node);node.classList.add(row.cssClass);text(node.querySelector('.mName'),row.name);text(node.querySelector('.mRole'),row.role);text(node.querySelector('.mPos'),row.position||'—');text(node.querySelector('.mCurrent'),row.currentStint);text(node.querySelector('.mTotal'),row.total);refs.monitor.appendChild(node)});
    [...refs.monitor.children].forEach(node=>{if(node.dataset.playerId&&!wanted.has(node.dataset.playerId))node.remove()});
  }

  function ensureTimeline(row){
    let node=timelineNodes.get(row.id);if(node)return node;
    node=doc.createElement('div');node.className='v08TimelineRow';node.dataset.eventId=row.id;node.innerHTML='<b></b><span></span><small></small>';
    timelineNodes.set(row.id,node);return node;
  }
  function renderTimeline(rows){
    const wanted=new Set(rows.map(r=>r.id));
    rows.forEach(row=>{const node=ensureTimeline(row);text(node.querySelector('b'),row.minuteLabel);text(node.querySelector('span'),row.type);text(node.querySelector('small'),row.clock);refs.timeline.appendChild(node)});
    [...refs.timeline.children].forEach(node=>{if(node.dataset.eventId&&!wanted.has(node.dataset.eventId))node.remove()});
  }

  function render(frame){
    const validation=global.ClubMatchV08UiFrame?.validateUiFrame(frame);
    invariant(validation?.ok,`Refusing invalid UI frame: ${(validation?.errors||[]).join(' · ')}`);
    text(refs.clock,frame.clock);text(refs.score,frame.scoreboard.display);
    text(refs.integrity,`✓ Eén confirmed state · ${frame.field.length} veld · ${frame.bench.length} bank · ${frame.clock}`);
    refs.integrity.classList.add('ok');
    placeCards(frame.field,refs.field);placeCards(frame.bench,refs.bench);renderPitch(frame.pitch);renderMonitor(frame.monitor);renderTimeline(frame.timeline);
    return frame;
  }

  return Object.freeze({render});
}

global.ClubMatchV08DomRenderer={createRenderer};
})(typeof window!=='undefined'?window:globalThis);
