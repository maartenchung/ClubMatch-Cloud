/* ClubMatch Cloud v0.8 - Supabase snapshot to LiveMatchState input */
(function(global){
'use strict';

function totalSecond(event){
  return Math.max(0,(Number(event.match_minute)||0)*60+(Number(event.match_second)||0));
}

function mapConfirmedEvents(events){
  const list=Array.isArray(events)?events:[];
  const voided=new Set(list.filter(e=>/_voided$/.test(e.event_type)&&e.target_event_id).map(e=>e.target_event_id));
  const corrected=new Map(list.filter(e=>/_corrected$/.test(e.event_type)&&e.target_event_id).map(e=>[e.target_event_id,e]));
  const mapped=[];

  list.forEach((base,index)=>{
    if(voided.has(base.id))return;
    const correction=corrected.get(base.id);
    const event=correction||base;
    const matchSecond=totalSecond(event);
    const id=event.client_event_id||event.id||base.id;

    if(base.event_type==='substitution'){
      const detail=event.substitution||base.substitution||{};
      mapped.push({
        id,type:'SUBSTITUTION',matchSecond,seq:index+1,
        outId:event.subject_player_id||detail.player_out_id,
        inId:event.related_player_id||detail.player_in_id,
        position:event.payload?.new_position||detail.new_position||base.payload?.new_position||''
      });
    }else if(base.event_type==='position_changed'){
      const detail=event.position_change||base.position_change||{};
      const swap=event.payload?.swap===true||base.payload?.swap===true;
      mapped.push({
        id,type:'POSITION_CHANGED',matchSecond,seq:index+1,
        playerId:event.subject_player_id||detail.player_id,
        position:event.payload?.player_a_new_position||event.payload?.new_position||detail.new_position||'',
        otherPlayerId:swap?(event.related_player_id||base.related_player_id):null,
        otherPosition:swap?(event.payload?.player_b_new_position||base.payload?.player_b_new_position||''):null
      });
    }
  });
  return mapped.filter(e=>e.playerId||e.outId);
}

function snapshotToStateInput(snapshot){
  if(!snapshot?.state)throw new Error('Supabase snapshot has no match state');
  const players=Array.isArray(snapshot.players)?snapshot.players:[];
  const selected=players.filter(p=>p.selected);
  return {
    effectiveMatchSecond:Math.max(0,Math.floor(Number(snapshot.state.effective_elapsed_seconds)||0)),
    selectedIds:selected.map(p=>p.player_id),
    starterIds:selected.filter(p=>p.is_starter).map(p=>p.player_id),
    startingPositionsById:Object.fromEntries(selected.filter(p=>p.is_starter).map(p=>[p.player_id,p.starting_position||''])),
    events:mapConfirmedEvents(snapshot.events)
  };
}

function deriveSnapshot(snapshot){
  if(!global.ClubMatchV08?.deriveLiveMatchState)throw new Error('ClubMatchV08 LiveMatchState engine is not loaded');
  return global.ClubMatchV08.deriveLiveMatchState(snapshotToStateInput(snapshot));
}

global.ClubMatchV08SnapshotAdapter={totalSecond,mapConfirmedEvents,snapshotToStateInput,deriveSnapshot};
})(typeof window!=='undefined'?window:globalThis);
