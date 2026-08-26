import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const calls=[];
let now=Math.floor(Date.now()/1000);
const fetch=async(url,options={})=>{
  calls.push({url,options});
  const json=value=>({ok:true,status:200,text:async()=>JSON.stringify(value)});
  if(url.includes('/auth/v1/token?grant_type=password'))return json({access_token:'a1',refresh_token:'r1',expires_at:now+3600,user:{id:'u1',email:'test@example.com'}});
  if(url.includes('/auth/v1/token?grant_type=refresh_token'))return json({access_token:'a2',refresh_token:'r2',expires_at:now+3600,user:{id:'u1',email:'test@example.com'}});
  if(url.includes('/rest/v1/rpc/get_my_open_matches'))return json([{match_id:'m1'}]);
  if(url.includes('/auth/v1/logout'))return {ok:true,status:204,text:async()=>''};
  return {ok:false,status:404,text:async()=>JSON.stringify({message:'not found'})};
};
const context={console,globalThis:null,window:null,fetch,localStorage,Date};context.globalThis=context;context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./cloud-client.js',import.meta.url),'utf8'),context);
const {createClient}=context.ClubMatchV08CloudClient;
const client=createClient('https://example.supabase.co','sb_publishable_test',{fetch,storage:localStorage});

const login=await client.auth.signInWithPassword({email:'test@example.com',password:'secret'});
assert.equal(login.error,null);assert.equal(login.data.session.user.email,'test@example.com');assert.equal(client.transport,'native-fetch');
let authEvent=null;const sub=client.auth.onAuthStateChange(event=>authEvent=event);
const rpc=await client.rpc('get_my_open_matches');assert.equal(rpc.error,null);assert.equal(rpc.data[0].match_id,'m1');
const rpcCall=calls.find(c=>c.url.includes('/rest/v1/rpc/'));
assert.equal(rpcCall.options.headers.apikey,'sb_publishable_test');assert.equal(rpcCall.options.headers.Authorization,'Bearer a1');
const session=await client.auth.getSession();assert.equal(session.data.session.access_token,'a1');
await client.auth.refreshSession();assert.equal(client.session.access_token,'a2');assert.equal(authEvent,'TOKEN_REFRESHED');
const out=await client.auth.signOut();assert.equal(out.error,null);assert.equal(client.session,null);assert.equal(authEvent,'SIGNED_OUT');sub.data.subscription.unsubscribe();
console.log('PASS cloud-client: auth + rpc + refresh + signout');
