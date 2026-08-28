/* ClubMatch Cloud v0.8 - minimal native Supabase Realtime Postgres Changes transport */
(function(global){
'use strict';

const RETRY_MS=Object.freeze([1000,2000,5000,10000]);
function invariant(ok,message){if(!ok)throw new Error(message)}
function socketUrl(url,key){return `${String(url||'').replace(/^http:/,'ws:').replace(/^https:/,'wss:')}/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`}
function normalizeMessage(data){try{const value=typeof data==='string'?JSON.parse(data):data;if(Array.isArray(value))return {join_ref:value[0],ref:value[1],topic:value[2],event:value[3],payload:value[4]||{}};return value||null}catch{return null}}
function publicConfig(config={}){const next={event:String(config.event||'*').toUpperCase(),schema:config.schema||'public',table:config.table||'*'};if(config.filter)next.filter=String(config.filter);return next}

function install(){
  const api=global.ClubMatchV08CloudClient;
  if(!api?.createClient||api.__nativeRealtime)return;
  const original=api.createClient.bind(api);

  function createClient(url,publishableKey,options={}){
    const base=original(url,publishableKey,options);
    if(typeof base?.channel==='function')return base;
    const WebSocketImpl=options.WebSocket||global.WebSocket;
    const channels=new Set();

    class NativeRealtimeChannel{
      constructor(name){
        invariant(name&&name!=='realtime','Realtime channelnaam is verplicht');
        this.name=String(name);this.topic=`realtime:${this.name}`;this.bindings=[];this.socket=null;this.statusCallback=null;this.ref=0;this.joinRef=null;this.serverBindings=new Map();this.heartbeatTimer=null;this.reconnectTimer=null;this.retryIndex=0;this.manualClose=false;this.joined=false;
      }
      on(type,config,callback){
        invariant(type==='postgres_changes','Alleen postgres_changes wordt in v0.8 ondersteund');
        invariant(typeof callback==='function','Realtime callback is verplicht');
        const normalized=publicConfig(config);this.bindings.push({type,config:normalized,callback});return this;
      }
      status(status,error=null){try{this.statusCallback?.(status,error)}catch(callbackError){console.error(callbackError)}}
      nextRef(){this.ref+=1;return String(this.ref)}
      send(event,payload={},ref=null,joinRef=this.joinRef){
        const socket=this.socket;if(!socket||socket.readyState!==1)return false;
        socket.send(JSON.stringify({topic:event==='heartbeat'?'phoenix':this.topic,event,payload,ref:ref||this.nextRef(),join_ref:event==='heartbeat'?null:joinRef}));return true;
      }
      async connect(){
        if(this.manualClose)return;
        if(!WebSocketImpl){this.status('CHANNEL_ERROR',new Error('WebSocket wordt door deze browser niet ondersteund'));return}
        this.cleanupSocket(false);
        let sessionResult;
        try{sessionResult=await base.auth.getSession()}catch(error){this.status('CHANNEL_ERROR',error);this.scheduleReconnect();return}
        const token=sessionResult?.data?.session?.access_token;
        if(!token){this.status('CHANNEL_ERROR',new Error('Realtime vereist een ingelogde sessie'));return}
        let socket;
        try{socket=new WebSocketImpl(socketUrl(url,publishableKey))}catch(error){this.status('CHANNEL_ERROR',error);this.scheduleReconnect();return}
        this.socket=socket;
        socket.onopen=()=>{
          if(this.manualClose||socket!==this.socket)return;
          this.joinRef=this.nextRef();
          const postgres_changes=this.bindings.map(binding=>binding.config);
          socket.send(JSON.stringify({topic:this.topic,event:'phx_join',payload:{config:{broadcast:{ack:false,self:false},presence:{enabled:false},postgres_changes,private:false},access_token:token},ref:this.joinRef,join_ref:this.joinRef}));
          this.startHeartbeat();
        };
        socket.onmessage=event=>this.handleMessage(normalizeMessage(event?.data));
        socket.onerror=event=>{if(socket!==this.socket||this.manualClose)return;this.status('CHANNEL_ERROR',event?.error||new Error('Realtime WebSocket-fout'))};
        socket.onclose=()=>{if(socket!==this.socket)return;this.stopHeartbeat();this.socket=null;this.joined=false;if(!this.manualClose){this.status('CHANNEL_ERROR',new Error('Realtime-verbinding verbroken'));this.scheduleReconnect()}};
      }
      handleMessage(message){
        if(!message||message.topic!==this.topic)return;
        if(message.event==='phx_reply'&&message.ref===this.joinRef){
          const payload=message.payload||{};
          if(payload.status!=='ok'){
            const reason=payload.response?.reason||'Realtime channel kon niet worden geopend';
            this.status('CHANNEL_ERROR',new Error(reason));this.socket?.close?.();return;
          }
          this.joined=true;this.retryIndex=0;this.serverBindings.clear();
          const returned=payload.response?.postgres_changes||[];
          returned.forEach((entry,index)=>{if(entry?.id!==undefined&&this.bindings[index])this.serverBindings.set(Number(entry.id),this.bindings[index])});
          this.status('SUBSCRIBED');return;
        }
        if(message.event==='system'){
          const payload=message.payload||{};
          if(payload.status==='error')this.status('CHANNEL_ERROR',new Error(payload.message||'Realtime databasekoppeling gedegradeerd'));
          return;
        }
        if(message.event==='phx_error'){
          this.status('CHANNEL_ERROR',new Error('Realtime channelfout'));try{this.socket?.close?.()}catch{}return;
        }
        if(message.event==='postgres_changes'){
          const payload=message.payload||{},data=payload.data||{},ids=(payload.ids||[]).map(Number);
          let targets=[];
          if(ids.length&&this.serverBindings.size)targets=ids.map(id=>this.serverBindings.get(id)).filter(Boolean);
          if(!targets.length)targets=this.bindings.filter(binding=>{
            const c=binding.config;return (c.schema==='*'||c.schema===data.schema)&&(c.table==='*'||c.table===data.table)&&(c.event==='*'||c.event===String(data.type||'').toUpperCase());
          });
          const normalized={schema:data.schema,table:data.table,commit_timestamp:data.commit_timestamp,eventType:data.type,new:data.record||{},old:data.old_record||{},errors:data.errors||null};
          [...new Set(targets)].forEach(binding=>{try{binding.callback(normalized)}catch(error){console.error(error)}});
        }
      }
      startHeartbeat(){this.stopHeartbeat();this.heartbeatTimer=global.setInterval?.(()=>{this.send('heartbeat',{},this.nextRef(),null)},20000)||null}
      stopHeartbeat(){if(this.heartbeatTimer!==null)global.clearInterval?.(this.heartbeatTimer);this.heartbeatTimer=null}
      scheduleReconnect(){if(this.manualClose||this.reconnectTimer!==null)return;const delay=RETRY_MS[Math.min(this.retryIndex,RETRY_MS.length-1)];this.retryIndex+=1;this.reconnectTimer=global.setTimeout?.(()=>{this.reconnectTimer=null;this.connect()},delay)||null}
      cleanupSocket(close=true){this.stopHeartbeat();if(this.reconnectTimer!==null)global.clearTimeout?.(this.reconnectTimer);this.reconnectTimer=null;const socket=this.socket;this.socket=null;this.joined=false;if(close&&socket){try{if(socket.readyState===1)this.send('phx_leave',{},this.nextRef());socket.close?.()}catch{}}}
      updateAuth(token){if(!token||!this.joined)return false;return this.send('access_token',{access_token:token})}
      subscribe(callback){this.statusCallback=typeof callback==='function'?callback:null;this.manualClose=false;this.connect();return this}
      unsubscribe(){this.manualClose=true;this.cleanupSocket(true);channels.delete(this);this.status('CLOSED');return Promise.resolve('ok')}
    }

    function channel(name){const next=new NativeRealtimeChannel(name);channels.add(next);return next}
    function removeChannel(channelInstance){if(!channelInstance)return Promise.resolve('ok');channels.delete(channelInstance);return channelInstance.unsubscribe?.()||Promise.resolve('ok')}
    const realtime=Object.freeze({setAuth(token){channels.forEach(channelInstance=>channelInstance.updateAuth(token));return true}});

    const wrapper={};
    Object.defineProperties(wrapper,Object.getOwnPropertyDescriptors(base));
    Object.defineProperties(wrapper,{channel:{value:channel,enumerable:true},removeChannel:{value:removeChannel,enumerable:true},realtime:{value:realtime,enumerable:true}});
    try{base.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){[...channels].forEach(channelInstance=>channelInstance.unsubscribe());return}const token=session?.access_token;if(token)channels.forEach(channelInstance=>channelInstance.updateAuth(token))})}catch{}
    return Object.freeze(wrapper);
  }

  global.ClubMatchV08CloudClient={...api,createClient,__nativeRealtime:true};
  if(global.supabase)global.supabase.createClient=createClient;
}

install();
global.ClubMatchV08NativeRealtime={install,socketUrl,normalizeMessage,publicConfig,RETRY_MS};
})(typeof window!=='undefined'?window:globalThis);
