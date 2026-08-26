/* ClubMatch Cloud v0.8 - native Supabase Auth + RPC transport (no CDN dependency) */
(function(global){
'use strict';

function invariant(condition,message){if(!condition)throw new Error(message)}
function nowSeconds(){return Math.floor(Date.now()/1000)}
function createMemoryStorage(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
function jsonOrText(text){if(!text)return null;try{return JSON.parse(text)}catch{return text}}
function makeError(status,payload){const message=payload?.msg||payload?.message||payload?.error_description||payload?.error||`Cloud request failed (${status})`;const e=new Error(message);e.status=status;e.payload=payload;return e}

function createClient(url,publishableKey,options={}){
  invariant(/^https:\/\//.test(url||''),'Supabase URL must use https');
  invariant(publishableKey&&String(publishableKey).startsWith('sb_publishable_'),'A Supabase publishable key is required');
  const fetchImpl=options.fetch||global.fetch?.bind(global);invariant(fetchImpl,'fetch is required');
  const storage=options.storage||global.localStorage||createMemoryStorage();
  const storageKey=options.storageKey||'clubmatch-v08-session';
  const listeners=new Set();
  let session=readStored();
  let refreshPromise=null;

  function readStored(){
    try{const raw=storage.getItem(storageKey);if(!raw)return null;const parsed=JSON.parse(raw);return parsed?.access_token&&parsed?.refresh_token?parsed:null}catch{return null}
  }
  function store(next){session=next||null;try{if(session)storage.setItem(storageKey,JSON.stringify(session));else storage.removeItem(storageKey)}catch{}return session}
  function emit(event){listeners.forEach(fn=>{try{fn(event,session)}catch(error){console.error(error)}})}
  function normalizedSession(payload){
    if(!payload?.access_token||!payload?.refresh_token)return null;
    const expiresAt=Number(payload.expires_at)||nowSeconds()+Number(payload.expires_in||3600);
    return {...payload,expires_at:expiresAt};
  }
  async function request(path,{method='GET',body,token,headers={}}={}){
    const h={apikey:publishableKey,...headers};
    if(body!==undefined)h['Content-Type']='application/json';
    if(token)h.Authorization=`Bearer ${token}`;
    let response;
    try{response=await fetchImpl(`${url}${path}`,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)})}
    catch(error){const e=new Error(`Cloud netwerkfout: ${error.message||error}`);e.cause=error;throw e}
    const text=await response.text();const payload=jsonOrText(text);
    if(!response.ok)throw makeError(response.status,payload);
    return payload;
  }
  async function refreshSession(force=false){
    if(!session?.refresh_token)return null;
    if(!force&&Number(session.expires_at||0)-nowSeconds()>90)return session;
    if(refreshPromise)return refreshPromise;
    refreshPromise=(async()=>{
      try{
        const payload=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
        const next=normalizedSession(payload);if(!next)throw new Error('Supabase returned an incomplete refreshed session');
        store(next);emit('TOKEN_REFRESHED');return next;
      }catch(error){store(null);emit('SIGNED_OUT');throw error}
      finally{refreshPromise=null}
    })();
    return refreshPromise;
  }
  async function usableSession(){
    if(!session)return null;
    if(Number(session.expires_at||0)-nowSeconds()<=90)return refreshSession(true);
    return session;
  }
  async function rpc(name,params={}){
    try{
      const current=await usableSession();
      if(!current)return {data:null,error:new Error('Authentication required')};
      const data=await request(`/rest/v1/rpc/${encodeURIComponent(name)}`,{method:'POST',body:params,token:current.access_token,headers:{Accept:'application/json'}});
      return {data,error:null};
    }catch(error){return {data:null,error}}
  }

  const auth={
    async getSession(){
      try{const current=await usableSession();return {data:{session:current},error:null}}
      catch(error){return {data:{session:null},error}}
    },
    async signInWithPassword(credentials={}){
      try{
        invariant(credentials.email&&credentials.password,'E-mail en wachtwoord zijn verplicht');
        const payload=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:credentials.email,password:credentials.password}});
        const next=normalizedSession(payload);if(!next)throw new Error('Supabase returned an incomplete login session');
        store(next);emit('SIGNED_IN');return {data:{session:next,user:next.user||null},error:null};
      }catch(error){return {data:{session:null,user:null},error}}
    },
    async signOut(){
      const current=session;
      store(null);
      try{if(current?.access_token)await request('/auth/v1/logout',{method:'POST',token:current.access_token})}
      catch(error){emit('SIGNED_OUT');return {error}}
      emit('SIGNED_OUT');return {error:null};
    },
    onAuthStateChange(callback){
      invariant(typeof callback==='function','Auth callback is required');listeners.add(callback);
      return {data:{subscription:{unsubscribe(){listeners.delete(callback)}}}};
    },
    async refreshSession(){
      try{const next=await refreshSession(true);return {data:{session:next,user:next?.user||null},error:null}}
      catch(error){return {data:{session:null,user:null},error}}
    }
  };

  return Object.freeze({rpc,auth,get transport(){return 'native-fetch'},get session(){return session}});
}

global.ClubMatchV08CloudClient={createClient};
if(!global.supabase)global.supabase={createClient};
})(typeof window!=='undefined'?window:globalThis);
