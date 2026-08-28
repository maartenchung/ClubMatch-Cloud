/* ClubMatch Cloud v0.8 - native Supabase Realtime bridge for confirmed-state runtime */
(function(global){
'use strict';
const PROJECT_URL='https://fnbqyogbamufytcabfzm.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_skGPpngOQ_1OpEbreV2kXA__2OL_Mbp';
const api=global.ClubMatchV08CloudClient;
if(!api?.createClient||api.__realtimeBridge)return;
const originalCreate=api.createClient.bind(api);
let refSeq=0;
function nextRef(){return String(++refSeq)}
function wsUrl(){return `${PROJECT_URL.replace(/^http/,'ws')}/realtime/v1/websocket?apikey=${encodeURIComponent(PUBLISHABLE_KEY)}&vsn=1.0.0`}
function createChannel(base,name){
  const handlers=[];let socket=null,heartbeat=null,reconnectTimer=null,closed=false,joinRef=null,statusCb=null,retry=0,authSub=null;
  const topic=`realtime:${String(name||'clubmatch-v08')}`;
  function emitStatus(status,error){try{statusCb?.(status,error)}catch{}}
  function send(event,payload={},ref=nextRef(),useJoinRef=true){if(socket?.readyState!==1)return null;const msg={topic,event,payload,ref,join_ref:useJoinRef?joinRef:null};socket.send(JSON.stringify(msg));return ref}
  function cleanSocket(){if(heartbeat){global.clearInterval?.(heartbeat);heartbeat=null}if(socket){try{socket.onopen=socket.onmessage=socket.onerror=socket.onclose=null;socket.close()}catch{}}socket=null}
  function scheduleReconnect(){if(closed||reconnectTimer)return;const delays=[1000,2000,5000,10000],delay=delays[Math.min(retry++,delays.length-1)];emitStatus('RECONNECTING');reconnectTimer=global.setTimeout?.(()=>{reconnectTimer=null;connect()},delay)}
  function join(){joinRef=nextRef();const postgres_changes=handlers.filter(h=>h.type==='postgres_changes').map(h=>({event:h.filter.event||'*',schema:h.filter.schema||'public',table:h.filter.table||'*',filter:h.filter.filter||''}));send('phx_join',{config:{broadcast:{ack:false,self:false},presence:{enabled:false},postgres_changes,private:false},access_token:base.session?.access_token||undefined},joinRef,true)}
  function dispatch(message){if(message.event==='phx_reply'&&message.ref===joinRef){if(message.payload?.status==='ok'){retry=0;emitStatus('SUBSCRIBED')}else{emitStatus('CHANNEL_ERROR',message.payload);scheduleReconnect()}return}if(message.event==='phx_error'||message.event==='phx_close'){emitStatus('CHANNEL_ERROR',message.payload);scheduleReconnect();return}if(message.event!=='postgres_changes')return;const data=message.payload?.data||message.payload||{},eventType=data.type||data.eventType||'*',table=data.table||'';handlers.forEach(h=>{if(h.type!=='postgres_changes')return;const expected=String(h.filter.event||'*').toUpperCase(),actual=String(eventType||'*').toUpperCase();if(expected!=='*'&&expected!==actual)return;if(h.filter.table&&h.filter.table!==table)return;try{h.callback({eventType:actual,schema:data.schema,table,new:data.record||{},old:data.old_record||{},commit_timestamp:data.commit_timestamp,raw:message.payload})}catch(error){console.error(error)}})}
  function connect(){if(closed||typeof global.WebSocket!=='function'){emitStatus('CLOSED');return}cleanSocket();emitStatus('CONNECTING');try{socket=new global.WebSocket(wsUrl());socket.onopen=()=>{join();heartbeat=global.setInterval?.(()=>send('heartbeat',{},nextRef(),false),20000)};socket.onmessage=event=>{try{dispatch(JSON.parse(event.data))}catch(error){console.error('Realtime bericht kon niet worden gelezen',error)}};socket.onerror=()=>emitStatus('CHANNEL_ERROR');socket.onclose=()=>{if(!closed)scheduleReconnect()}}catch(error){emitStatus('CHANNEL_ERROR',error);scheduleReconnect()}}
  function updateToken(session){if(socket?.readyState===1&&joinRef&&session?.access_token)send('access_token',{access_token:session.access_token})}
  const channel={
    on(type,filter,callback){handlers.push({type,filter:filter||{},callback});return channel},
    subscribe(callback){statusCb=typeof callback==='function'?callback:null;closed=false;authSub=base.auth?.onAuthStateChange?.((_,session)=>updateToken(session))?.data?.subscription||null;connect();return channel},
    unsubscribe(){closed=true;if(reconnectTimer){global.clearTimeout?.(reconnectTimer);reconnectTimer=null}try{send('phx_leave',{})}catch{}cleanSocket();try{authSub?.unsubscribe?.()}catch{}authSub=null;emitStatus('CLOSED');return Promise.resolve('ok')}
  };
  return channel;
}
function createClient(url,key,options={}){const base=originalCreate(url,key,options);if(base?.channel&&base?.removeChannel)return base;return Object.freeze({...base,channel:name=>createChannel(base,name),removeChannel:channel=>channel?.unsubscribe?.()})}
global.ClubMatchV08CloudClient={...api,createClient,__realtimeBridge:true};if(global.supabase)global.supabase.createClient=createClient;
})(typeof window!=='undefined'?window:globalThis);
