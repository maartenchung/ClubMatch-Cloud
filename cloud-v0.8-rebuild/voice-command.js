/* ClubMatch Cloud v0.8 - pure Dutch voice/text command parser */
(function(global){
'use strict';
function clean(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim()}
const POSITION_ALIASES=Object.freeze({
  'gk':'GK','keeper':'GK','doelman':'GK','doelkeeper':'GK',
  'rb':'RB','rechtsback':'RB','rechter back':'RB','rechterverdediger':'RB',
  'lb':'LB','linksback':'LB','linker back':'LB','linkerverdediger':'LB',
  'rcb':'RCB','rechter centrale verdediger':'RCB','rechts centraal achterin':'RCB',
  'lcb':'LCB','linker centrale verdediger':'LCB','links centraal achterin':'LCB',
  'cb':'CB','centrale verdediger':'CB','centrumverdediger':'CB',
  'dm':'DM','verdedigende middenvelder':'DM','controleur':'DM',
  'cm':'CM','middenvelder':'CM','centrale middenvelder':'CM',
  'am':'AM','aanvallende middenvelder':'AM','nummer tien':'AM','nummer 10 positie':'AM',
  'rw':'RW','rechtsbuiten':'RW','rechtervleugel':'RW',
  'lw':'LW','linksbuiten':'LW','linkervleugel':'LW',
  'st':'ST','spits':'ST','centrumspits':'ST'
});
function playerAliases(player){
  const values=new Set();
  [player?.display_name,player?.full_name,player?.name].filter(Boolean).forEach(name=>{const n=clean(name);if(n){values.add(n);const parts=n.split(' ');if(parts.length>1){values.add(parts[0]);values.add(parts[parts.length-1])}}});
  const number=player?.shirt_number??player?.shirtNumber??player?.number;if(number!==null&&number!==undefined&&String(number)!==''){values.add(String(number));values.add(`nummer ${number}`);values.add(`rugnummer ${number}`)}
  return [...values].sort((a,b)=>b.length-a.length);
}
function selectedPlayers(snapshot){return (snapshot?.players||[]).filter(p=>p.selected!==false)}
function resolvePlayer(fragment,snapshot){
  const target=clean(fragment);if(!target)return {player:null,error:'Geen speler genoemd'};
  const candidates=[];for(const player of selectedPlayers(snapshot)){const aliases=playerAliases(player);const exact=aliases.some(a=>a===target);const contained=aliases.filter(a=>a.length>=2&&new RegExp(`(^| )${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}( |$)`).test(target));if(exact||contained.length)candidates.push({player,score:exact?1000:Math.max(...contained.map(a=>a.length))})}
  candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)return {player:null,error:`Speler niet gevonden: ${fragment}`};if(candidates.length>1&&candidates[0].score===candidates[1].score)return {player:null,error:`Speler is niet eenduidig: ${fragment}`};return {player:candidates[0].player,error:null};
}
function positionCode(fragment){const value=clean(fragment);if(!value)return null;const exact=POSITION_ALIASES[value];if(exact)return exact;const key=Object.keys(POSITION_ALIASES).sort((a,b)=>b.length-a.length).find(k=>new RegExp(`(^| )${k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}( |$)`).test(value));return key?POSITION_ALIASES[key]:null}
function result(action,summary,payload={}){return Object.freeze({ok:true,action,summary,payload:Object.freeze(payload)})}
function error(message){return Object.freeze({ok:false,error:message,action:null,summary:'',payload:Object.freeze({})})}
function parseCommand(text,snapshot){
  const raw=String(text??'').trim(),t=clean(raw);if(!t)return error('Geen opdracht gehoord of ingevoerd');
  if(/^(pauze|pauzeren|stop klok)$/.test(t))return result('CLOCK','Wedstrijdklok pauzeren',{clockAction:'pause'});
  if(/^(hervat|hervatten|doorgaan|verder)$/.test(t))return result('CLOCK','Wedstrijdklok hervatten',{clockAction:'resume'});
  if(/^(rust|start rust|halftime)$/.test(t))return result('CLOCK','Rust starten',{clockAction:'halftime'});
  if(/^(tweede helft|2e helft|start tweede helft)$/.test(t))return result('CLOCK','Tweede helft starten',{clockAction:'second_half'});
  if(/^doelpunt (tegen|tegenstander)$/.test(t)||/^(tegenstander )?doelpunt tegen$/.test(t))return result('GOAL_AGAINST','Doelpunt voor de tegenstander',{side:'against'});

  let m=t.match(/^wissel\s+(.+?)\s+(?:voor|met|eruit\s+en)\s+(.+)$/);if(m){const out=resolvePlayer(m[1],snapshot),inn=resolvePlayer(m[2],snapshot);if(out.error)return error(out.error);if(inn.error)return error(inn.error);if(out.player.player_id===inn.player.player_id)return error('Kies twee verschillende spelers');return result('SUBSTITUTION',`Wissel ${out.player.display_name||out.player.full_name} uit, ${inn.player.display_name||inn.player.full_name} in`,{outId:out.player.player_id,inId:inn.player.player_id})}

  m=t.match(/^ruil\s+(.+?)\s+(?:met|en)\s+(.+)$/);if(m){const a=resolvePlayer(m[1],snapshot),b=resolvePlayer(m[2],snapshot);if(a.error)return error(a.error);if(b.error)return error(b.error);if(a.player.player_id===b.player.player_id)return error('Kies twee verschillende spelers');return result('SWAP',`Posities ruilen: ${a.player.display_name||a.player.full_name} en ${b.player.display_name||b.player.full_name}`,{playerId:a.player.player_id,otherPlayerId:b.player.player_id})}

  m=t.match(/^positie\s+(.+?)\s+(?:naar|op|als)\s+(.+)$/);if(m){const p=resolvePlayer(m[1],snapshot);if(p.error)return error(p.error);const position=positionCode(m[2]);if(!position)return error(`Positie niet herkend: ${m[2]}`);return result('POSITION',`${p.player.display_name||p.player.full_name} naar ${position}`,{playerId:p.player.player_id,position})}

  m=t.match(/^doelpunt\s+(.+?)(?:\s+assist\s+(.+))?$/);if(m){const scorer=resolvePlayer(m[1],snapshot);if(scorer.error)return error(scorer.error);let assistId=null,assistName='';if(m[2]){const assist=resolvePlayer(m[2],snapshot);if(assist.error)return error(assist.error);if(assist.player.player_id===scorer.player.player_id)return error('Maker en assist mogen niet dezelfde speler zijn');assistId=assist.player.player_id;assistName=` · assist ${assist.player.display_name||assist.player.full_name}`};return result('GOAL_FOR',`Doelpunt ${scorer.player.display_name||scorer.player.full_name}${assistName}`,{side:'for',scorerId:scorer.player.player_id,assistId})}

  return error('Opdracht niet herkend. Voorbeelden: “wissel 13 voor 9”, “doelpunt Wai Sam”, “positie 13 rechtsbuiten”, “pauze”.');
}
global.ClubMatchV08VoiceCommand={clean,playerAliases,resolvePlayer,positionCode,parseCommand};
})(typeof window!=='undefined'?window:globalThis);
