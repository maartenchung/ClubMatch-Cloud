/* ClubMatch Cloud v0.8 - pure formation presets and starter assignment */
(function(global){
'use strict';
const FORMATIONS=Object.freeze({
  '4-3-3':Object.freeze(['GK','RB','RCB','LCB','LB','DM','RCM','LCM','RW','ST','LW']),
  '4-2-3-1':Object.freeze(['GK','RB','RCB','LCB','LB','RDM','LDM','RW','AM','LW','ST']),
  '4-4-2':Object.freeze(['GK','RB','RCB','LCB','LB','RM','RCM','LCM','LM','RST','LST']),
  '3-5-2':Object.freeze(['GK','RCB','CB','LCB','RWB','RCM','CM','LCM','LWB','RST','LST']),
  '3-4-3':Object.freeze(['GK','RCB','CB','LCB','RM','RCM','LCM','LM','RW','ST','LW']),
  '5-3-2':Object.freeze(['GK','RWB','RCB','CB','LCB','LWB','RCM','CM','LCM','RST','LST'])
});
const FAMILIES={
  GK:['GK'],RB:['RB','RWB'],RWB:['RWB','RB','RM'],LB:['LB','LWB'],LWB:['LWB','LB','LM'],
  RCB:['RCB','CB','RB'],CB:['CB','RCB','LCB'],LCB:['LCB','CB','LB'],
  RDM:['DM','RDM','CM','RCM'],LDM:['DM','LDM','CM','LCM'],DM:['DM','CM'],
  RM:['RM','RW','RWB'],LM:['LM','LW','LWB'],RCM:['RCM','CM','DM','AM'],LCM:['LCM','CM','DM','AM'],CM:['CM','DM','AM'],AM:['AM','CM','ST'],
  RW:['RW','RM','ST'],LW:['LW','LM','ST'],ST:['ST','AM'],RST:['ST','RST','RW'],LST:['ST','LST','LW']
};
function normalized(value){return String(value||'').trim().toUpperCase()}
function score(player,slot){
  const current=normalized(player.position),target=normalized(slot),prefs=(player.preferredPositions||[]).map(normalized);
  if(current===target)return 1000;
  if(prefs.includes(target))return 600;
  const family=FAMILIES[target]||[target];
  const currentIndex=family.indexOf(current);if(currentIndex>=0)return 350-currentIndex*10;
  let best=-1;prefs.forEach(pref=>{const i=family.indexOf(pref);if(i>=0)best=Math.max(best,250-i*10)});
  if(best>=0)return best;
  if(target==='GK'&&prefs.includes('GK'))return 500;
  if(target!=='GK'&&prefs.includes('GK'))return -100;
  return 0;
}
function getFormation(code='4-3-3'){const key=FORMATIONS[code]?code:'4-3-3';return Object.freeze({code:key,slots:FORMATIONS[key]})}
function assignFormation(players=[],code='4-3-3'){
  const starters=players.filter(p=>p.starter);if(starters.length!==11)throw new Error(`Kies eerst exact 11 basisspelers; nu ${starters.length}`);
  const {slots}=getFormation(code),remaining=[...starters],assignments=[];
  for(const slot of slots){
    let bestIndex=0,bestScore=-Infinity;
    remaining.forEach((player,index)=>{const s=score(player,slot);if(s>bestScore){bestScore=s;bestIndex=index}});
    const [player]=remaining.splice(bestIndex,1);assignments.push(Object.freeze({playerId:player.playerId,position:slot,score:bestScore}));
  }
  return Object.freeze({code:getFormation(code).code,slots,assignments:Object.freeze(assignments)});
}
function pitchRows(code='4-3-3'){
  const slots=getFormation(code).slots;
  const rowFor=slot=>slot==='GK'?4:/^(RB|RWB|RCB|CB|LCB|LB|LWB)$/.test(slot)?3:/^(DM|RDM|LDM|RM|LM|RCM|CM|LCM|AM)$/.test(slot)?2:1;
  return Object.freeze([1,2,3,4].map(row=>Object.freeze(slots.filter(slot=>rowFor(slot)===row))));
}
global.ClubMatchV08Formation={FORMATIONS,getFormation,assignFormation,pitchRows,score};
})(typeof window!=='undefined'?window:globalThis);
