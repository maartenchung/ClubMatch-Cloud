(()=>{
let prepSig070='';
const oldApply070=cloudApplyLiveSnapshot;

function restoreBasis070(snap){
  const m=snap?.match||{},players=snap?.players||[];
  const starters=players.filter(x=>x.legacy_key&&x.is_starter);
  const sig=[m.id,m.formation_code,...starters.map(x=>x.legacy_key+':'+(x.starting_position||'')).sort()].join('|');
  if(!m.id||sig===prepSig070)return;
  prepSig070=sig;

  const team=document.getElementById('team');
  if(team&&[...team.options].some(o=>o.value===(m.team_name||state.team)))team.value=m.team_name||state.team;
  const formation=document.getElementById('formation');if(formation)formation.value=m.formation_code||state.formation||'4-3-3';
  const opponent=document.getElementById('opponent');if(opponent)opponent.value=m.opponent_name||'';
  const date=document.getElementById('matchDate');if(date)date.value=m.match_date||((m.scheduled_start||'').slice(0,10));
  const time=document.getElementById('scheduledTime');if(time)time.value=(m.scheduled_time||'').slice(0,5);
  const duration=document.getElementById('officialDuration');if(duration)duration.value=m.official_duration_minutes||80;

  loadMatchRoster(false);
  const byKey=Object.fromEntries(players.filter(x=>x.legacy_key).map(x=>[x.legacy_key,x]));
  document.querySelectorAll('.rosterRow').forEach(r=>{
    const x=byKey[r.dataset.id];if(!x)return;
    r.querySelector('.att').checked=x.attendance_status==='present';
    r.querySelector('.sel').checked=!!x.selected;
    r.querySelector('.starter').checked=!!x.is_starter;
    r.querySelector('.posSetup').value=x.starting_position||'';
  });
  validateStart();renderSetupPitch();

  let note=document.getElementById('basisCloudNote070');
  const pitch=document.getElementById('setupPitch');
  if(pitch&&!note){
    note=document.createElement('div');note.id='basisCloudNote070';note.className='status ok';
    pitch.after(note);
  }
  if(note)note.textContent='✓ Basisopstelling hersteld uit Cloud · vastgelegd bij de start van deze wedstrijd.';
}

cloudApplyLiveSnapshot=function(snap){
  oldApply070(snap);
  try{restoreBasis070(snap)}catch(e){console.warn('Basisopstelling herstellen:',e)}
};
})();