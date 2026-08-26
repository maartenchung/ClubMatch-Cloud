/* ClubMatch Cloud v0.8 - restore last/open match without making local state authoritative */
(function(global){
'use strict';
function createMemoryStorage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
function createMatchSelection(options={}){
  const storage=options.storage||global.localStorage||createMemoryStorage();
  const key=options.key||'clubmatch-v08-active-match';
  function remember(matchId){try{matchId?storage.setItem(key,String(matchId)):storage.removeItem(key)}catch{}return matchId||null}
  function recalled(){try{return storage.getItem(key)||null}catch{return null}}
  function choose(matches=[]){
    const list=Array.isArray(matches)?matches:[],remembered=recalled();
    if(remembered&&list.some(m=>m.match_id===remembered))return remembered;
    if(list.length===1)return list[0].match_id;
    return null;
  }
  function clear(){return remember(null)}
  return Object.freeze({remember,recalled,choose,clear,key});
}
global.ClubMatchV08MatchSelection={createMatchSelection};
})(typeof window!=='undefined'?window:globalThis);
