/* ClubMatch Cloud v0.8 - gedeeld veldmodel voor voorbereiding, live en actieveld */
(function(global){
'use strict';
const POSITION_LABELS=Object.freeze({
 GK:'Doelman',RB:'Rechtsback',RWB:'Rechter wingback',RCB:'Rechter centrale verdediger',CB:'Centrale verdediger',LCB:'Linker centrale verdediger',LB:'Linksback',LWB:'Linker wingback',
 RDM:'Rechter controlerende middenvelder',LDM:'Linker controlerende middenvelder',DM:'Controlerende middenvelder',RM:'Rechtermiddenvelder',RCM:'Rechter centrale middenvelder',CM:'Centrale middenvelder',LCM:'Linker centrale middenvelder',LM:'Linkermiddenvelder',AM:'Aanvallende middenvelder',RAM:'Rechter aanvallende middenvelder',LAM:'Linker aanvallende middenvelder',
 RW:'Rechtsbuiten',LW:'Linksbuiten',RST:'Rechter spits',ST:'Spits',LST:'Linker spits'
});
const FORMATION_ROWS=Object.freeze({
 '4-3-3':Object.freeze([Object.freeze(['LW','ST','RW']),Object.freeze(['LCM','DM','RCM']),Object.freeze(['LB','LCB','RCB','RB']),Object.freeze(['GK'])]),
 '4-2-3-1':Object.freeze([Object.freeze(['ST']),Object.freeze(['LW','AM','RW']),Object.freeze(['LDM','RDM']),Object.freeze(['LB','LCB','RCB','RB']),Object.freeze(['GK'])]),
 '4-4-2':Object.freeze([Object.freeze(['LST','RST']),Object.freeze(['LM','LCM','RCM','RM']),Object.freeze(['LB','LCB','RCB','RB']),Object.freeze(['GK'])]),
 '4-1-4-1':Object.freeze([Object.freeze(['ST']),Object.freeze(['LM','LCM','RCM','RM']),Object.freeze(['DM']),Object.freeze(['LB','LCB','RCB','RB']),Object.freeze(['GK'])]),
 '4-5-1':Object.freeze([Object.freeze(['ST']),Object.freeze(['LM','LCM','CM','RCM','RM']),Object.freeze(['LB','LCB','RCB','RB']),Object.freeze(['GK'])]),
 '4-4-1-1':Object.freeze([Object.freeze(['ST']),Object.freeze(['AM']),Object.freeze(['LM','LCM','RCM','RM']),Object.freeze(['LB','LCB','RCB','RB']),Object.freeze(['GK'])]),
 '4-3-1-2':Object.freeze([Object.freeze(['LST','RST']),Object.freeze(['AM']),Object.freeze(['LCM','DM','RCM']),Object.freeze(['LB','LCB','RCB','RB']),Object.freeze(['GK'])]),
 '3-5-2':Object.freeze([Object.freeze(['LST','RST']),Object.freeze(['LWB','LCM','CM','RCM','RWB']),Object.freeze(['LCB','CB','RCB']),Object.freeze(['GK'])]),
 '3-4-3':Object.freeze([Object.freeze(['LW','ST','RW']),Object.freeze(['LM','LCM','RCM','RM']),Object.freeze(['LCB','CB','RCB']),Object.freeze(['GK'])]),
 '3-4-2-1':Object.freeze([Object.freeze(['ST']),Object.freeze(['LAM','RAM']),Object.freeze(['LWB','LCM','RCM','RWB']),Object.freeze(['LCB','CB','RCB']),Object.freeze(['GK'])]),
 '3-4-1-2':Object.freeze([Object.freeze(['LST','RST']),Object.freeze(['AM']),Object.freeze(['LWB','LCM','RCM','RWB']),Object.freeze(['LCB','CB','RCB']),Object.freeze(['GK'])]),
 '5-3-2':Object.freeze([Object.freeze(['LST','RST']),Object.freeze(['LCM','CM','RCM']),Object.freeze(['LWB','LCB','CB','RCB','RWB']),Object.freeze(['GK'])]),
 '5-4-1':Object.freeze([Object.freeze(['ST']),Object.freeze(['LM','LCM','RCM','RM']),Object.freeze(['LWB','LCB','CB','RCB','RWB']),Object.freeze(['GK'])]),
 '5-2-3':Object.freeze([Object.freeze(['LW','ST','RW']),Object.freeze(['LCM','RCM']),Object.freeze(['LWB','LCB','CB','RCB','RWB']),Object.freeze(['GK'])])
});
function formationRows(code='4-3-3'){return FORMATION_ROWS[code]||FORMATION_ROWS['4-3-3']}
function positions(code='4-3-3'){return Object.freeze(formationRows(code).flat())}
function positionLabel(code){const key=String(code||'').trim().toUpperCase();return POSITION_LABELS[key]||key||'Onbekende positie'}
function slotLabel(code){const key=String(code||'').trim().toUpperCase();return key?`${key} · ${positionLabel(key)}`:''}
function geometry(code='4-3-3'){
 const rows=formationRows(code),n=rows.length,top=n===5?11:15,bottom=89,step=n>1?(bottom-top)/(n-1):0,slots=[];
 rows.forEach((row,rowIndex)=>{const count=row.length;row.forEach((position,index)=>{const x=count===1?50:10+(80*index/(count-1)),y=top+step*rowIndex;slots.push(Object.freeze({position,label:positionLabel(position),fullLabel:slotLabel(position),x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),row:rowIndex,index,count}))})});
 return Object.freeze({code:FORMATION_ROWS[code]?code:'4-3-3',rows,slots:Object.freeze(slots)})
}
function slot(code,position){return geometry(code).slots.find(item=>item.position===String(position||'').trim().toUpperCase())||null}
function validate(){return Object.entries(FORMATION_ROWS).map(([code,rows])=>({code,count:rows.flat().length,unique:new Set(rows.flat()).size})).filter(x=>x.count!==11||x.unique!==11)}
global.ClubMatchV08PitchLayout={POSITION_LABELS,FORMATION_ROWS,formationRows,positions,positionLabel,slotLabel,geometry,slot,validate};
})(typeof window!=='undefined'?window:globalThis);
