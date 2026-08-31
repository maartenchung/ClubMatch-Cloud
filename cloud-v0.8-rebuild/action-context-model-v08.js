/* ClubMatch Cloud v0.8 - action context model: tactical coordinates != event coordinates */
(function(global){
'use strict';
const MAX_RECENT=8,DEFAULT_CHAIN_GAP=18;
const DIRECTIONAL=new Set(['pass','pass_completed','progression','switch_play','cross','dribble']);
const CHAIN_BREAKING=new Set(['goal_for','goal_against','penalty','offside']);
const CONTEXT_OPTIONS=Object.freeze({
  pass:{pressure:['free','pressure','heavy_pressure'],passing_options:['available','limited','none'],direction:['forward','lateral','backward'],result:['completed','intercepted','out']},
  pass_completed:{pressure:['free','pressure','heavy_pressure'],passing_options:['available','limited','none'],direction:['forward','lateral','backward'],result:['completed']},
  bad_pass:{pressure:['free','pressure','heavy_pressure'],passing_options:['available','limited','none'],direction:['forward','lateral','backward'],result:['intercepted','out','misdirected']},
  dribble:{pressure:['free','pressure','heavy_pressure'],duel:['one_v_one','space'],result:['won','lost']},
  cross:{pressure:['free','pressure','heavy_pressure'],target:['occupied','unoccupied','unknown'],result:['completed','blocked','out','intercepted']},
  shot:{pressure:['free','pressure','heavy_pressure'],chance:['open','contested'],zone:['inside_box','outside_box'],result:['on_target','off_target','blocked','goal']},
  shot_on_target:{pressure:['free','pressure','heavy_pressure'],chance:['open','contested'],zone:['inside_box','outside_box'],result:['saved','goal','blocked']},
  ball_loss:{pressure:['free','pressure','heavy_pressure'],passing_options:['available','limited','none'],result:['bad_pass','duel_lost','poor_control','dribble','other']},
  interception:{pressure:['free','pressure','heavy_pressure'],result:['won']},
  ball_recovery:{pressure:['free','pressure','heavy_pressure'],result:['won']},
  duel_won:{pressure:['pressure','heavy_pressure'],result:['won']},
  duel_lost:{pressure:['pressure','heavy_pressure'],result:['lost']}
});
function clamp(v,a=0,b=100){const n=Number(v);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):null}
function point(x,y){const px=clamp(x),py=clamp(y);return px===null||py===null?null:Object.freeze({x:px,y:py})}
function clean(v){return String(v??'').trim()}
function makeId(){return global.crypto?.randomUUID?.()||`ctx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}
function exactSecond(snapshot){return Math.max(0,Number(snapshot?.state?.effective_elapsed_seconds)||Number(snapshot?.state?.elapsed_seconds)||0)}
function tacticalPoint(snapshot,playerId){
 const player=(snapshot?.players||[]).find(p=>p.player_id===playerId)||null,position=clean(player?.current_position||player?.starting_position),formation=snapshot?.match?.formation_code||'4-3-3',geometry=global.ClubMatchV08PitchLayout?.geometry?.(formation),slot=geometry?.slots?.find(s=>s.position===position)||null;
 return Object.freeze({playerId:playerId||null,position:position||null,point:slot?point(slot.x,slot.y):null,source:slot?'tactical':'fallback'});
}
function eventFromSnapshot(event){const p=event?.payload||{},sx=point(p.action_start_x??p.start_x,p.action_start_y??p.start_y),ex=point(p.action_end_x??p.end_x,p.action_end_y??p.end_y),tx=point(p.tactical_x,p.tactical_y);if(!sx&&!ex&&!p.action_chain_id)return null;return Object.freeze({id:event.id||null,clientEventId:event.client_event_id||null,action:p.action||event.event_type,side:p.side||'for',playerId:event.subject_player_id||null,chainId:p.action_chain_id||null,matchSecond:Math.max(0,(Number(event.match_minute)||0)*60+(Number(event.match_second)||0)),start:sx,end:ex,tactical:{position:p.tactical_position||null,point:tx},coordinateSource:p.action_coordinate_source||'unknown',context:p.action_context||{},confirmed:true});}
function createSession(options={}){
 const idFactory=options.idFactory||makeId,chainGap=Math.max(5,Number(options.chainGapSeconds)||DEFAULT_CHAIN_GAP);let chainId=null,chainSide=null,lastSecond=null,lastEnd=null,recent=[],lastAction=null;
 function newChain(side){chainId=idFactory();chainSide=side;lastSecond=null;lastEnd=null;return chainId}
 function shouldNew(side,second){return !chainId||chainSide!==side||lastSecond===null||Math.max(0,second-lastSecond)>chainGap}
 function propose(input={}){
   const snapshot=input.snapshot||{},side=input.side==='against'?'against':'for',second=Number.isFinite(Number(input.matchSecond))?Math.max(0,Number(input.matchSecond)):exactSecond(snapshot),tactical=tacticalPoint(snapshot,input.playerId||null);if(shouldNew(side,second))newChain(side);
   let start=null,source='fallback';const explicit=point(input.start?.x,input.start?.y);if(explicit){start=explicit;source=input.coordinateSource||'direct_field'}else if(lastEnd&&chainSide===side){start=lastEnd;source='chain'}else if(tactical.point){start=tactical.point;source='tactical'}else start=point(50,50);
   const end=point(input.end?.x,input.end?.y),draft={id:idFactory(),clientEventId:input.clientEventId||idFactory(),action:clean(input.action)||'unknown',side,playerId:input.playerId||null,relatedPlayerIds:[...(input.relatedPlayerIds||[])].filter(Boolean),chainId,matchSecond:second,start,end,tactical,coordinateSource:source,scoreFor:Number(snapshot?.match?.score_for)||0,scoreAgainst:Number(snapshot?.match?.score_against)||0,matchPhase:snapshot?.state?.period||null,context:{...(input.context||{})},note:clean(input.note)||null,confirmed:false,pending:true};return Object.freeze(draft);
 }
 function commit(draft){if(!draft)return null;lastSecond=draft.matchSecond;lastEnd=draft.end||draft.start||lastEnd;chainId=draft.chainId||chainId;chainSide=draft.side||chainSide;lastAction=Object.freeze({...draft,pending:false});recent=[lastAction,...recent.filter(x=>x.id!==draft.id)].slice(0,MAX_RECENT);if(CHAIN_BREAKING.has(draft.action))endChain();return lastAction}
 function replace(draft){if(!draft)return null;lastAction=Object.freeze({...draft});recent=[lastAction,...recent.filter(x=>x.id!==draft.id)].slice(0,MAX_RECENT);if(lastAction.chainId===chainId)lastEnd=lastAction.end||lastAction.start||lastEnd;return lastAction}
 function correct(draft,start,end=null,source='manual'){if(!draft)return null;const s=point(start?.x,start?.y),e=point(end?.x,end?.y);if(!s)return draft;return replace({...draft,start:s,end:e,coordinateSource:source,context:{...(draft.context||{}),location_corrected:true}})}
 function mergeContext(draft,patch={}){if(!draft)return null;return replace({...draft,context:{...(draft.context||{}),...patch}})}
 function hydrate(snapshot){const contextual=(snapshot?.events||[]).map(eventFromSnapshot).filter(Boolean).sort((a,b)=>b.matchSecond-a.matchSecond).slice(0,MAX_RECENT);recent=contextual;lastAction=contextual[0]||null;if(lastAction?.chainId){chainId=lastAction.chainId;chainSide=lastAction.side;lastSecond=lastAction.matchSecond;lastEnd=lastAction.end||lastAction.start}else{chainId=null;chainSide=null;lastSecond=null;lastEnd=null}return state()}
 function endChain(){chainId=null;chainSide=null;lastSecond=null;lastEnd=null}
 function contextPayload(draft){if(!draft)return {};return {context_version:1,action_start_x:draft.start?.x??null,action_start_y:draft.start?.y??null,action_end_x:draft.end?.x??null,action_end_y:draft.end?.y??null,action_coordinate_source:draft.coordinateSource||'unknown',tactical_x:draft.tactical?.point?.x??null,tactical_y:draft.tactical?.point?.y??null,tactical_position:draft.tactical?.position||null,action_chain_id:draft.chainId||null,match_phase:draft.matchPhase||null,score_for_at_event:draft.scoreFor??0,score_against_at_event:draft.scoreAgainst??0,pressure:draft.context?.pressure||null,passing_options:draft.context?.passing_options||null,result:draft.context?.result||null,involved_player_ids:draft.relatedPlayerIds||[],spoken_context:draft.context?.spoken_context||null,note_context:draft.context?.note_context||null,video_reference:draft.context?.video_reference||null,action_context:draft.context||{}}}
 function state(){return Object.freeze({chainId,chainSide,lastSecond,lastEnd,recent:[...recent],lastAction})}
 return Object.freeze({propose,commit,correct,mergeContext,hydrate,endChain,contextPayload,get state(){return state()}})
}
function contextOptions(action){return CONTEXT_OPTIONS[action]||{pressure:['free','pressure','heavy_pressure'],passing_options:['available','limited','none'],result:['successful','neutral','unsuccessful']}}
function isDirectional(action){return DIRECTIONAL.has(action)}
global.ClubMatchV08ActionContext=Object.freeze({createSession,tacticalPoint,eventFromSnapshot,contextOptions,isDirectional,point,exactSecond,MAX_RECENT});
})(typeof window!=='undefined'?window:globalThis);
