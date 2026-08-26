import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const calls=[];
let now=Math.floor(Date.now()/1000);
const jwt=aal=>`x.${Buffer.from(JSON.stringify({aal,amr:[{method:aal==='aal2'?'totp':'password',timestamp:now}]})).toString('base64url')}.y`;
const fetch=async(url,options={})=>{
  calls.push({url,options});
  const json=value=>({ok:true,status:200,text:async()=>JSON.stringify(value)});
  if(url.includes('/auth/v1/token?grant_type=password'))return json({access_token:jwt('aal1'),refresh_token:'r1',expires_at:now+3600,user:{id:'u1',email:'test@example.com'}});
  if(url.includes('/auth/v1/token?grant_type=refresh_token'))return json({access_token:jwt('aal1'),refresh_token:'r2',expires_at:now+3600,user:{id:'u1',email:'test@example.com'}});
  if(url.includes('/auth/v1/recover'))return json({});
  if(url.endsWith('/auth/v1/user')&&options.method==='PUT')return json({id:'u1',email:'test@example.com'});
  if(url.endsWith('/auth/v1/factors')&&(!options.method||options.method==='GET'))return json([{id:'f1',factor_type:'totp',status:'verified',friendly_name:'ClubMatch'}]);
  if(url.endsWith('/auth/v1/factors')&&options.method==='POST')return json({id:'f2',factor_type:'totp',status:'unverified',totp:{qr_code:'data:image/svg+xml,test',secret:'SECRET',uri:'otpauth://test'}});
  if(url.includes('/auth/v1/factors/f2/challenge'))return json({id:'c1'});
  if(url.includes('/auth/v1/factors/f2/verify'))return json({access_token:jwt('aal2'),refresh_token:'r3',expires_at:now+3600,user:{id:'u1',email:'test@example.com'}});
  if(url.includes('/auth/v1/factors/f1')&&options.method==='DELETE')return json({id:'f1'});
  if(url.includes('/rest/v1/rpc/get_my_open_matches'))return json([{match_id:'m1'}]);
  if(url.includes('/auth/v1/logout'))return {ok:true,status:204,text:async()=>''};
  return {ok:false,status:404,text:async()=>JSON.stringify({message:'not found'})};
};
const context={console,globalThis:null,window:null,fetch,localStorage,Date,atob,URLSearchParams};context.globalThis=context;context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./cloud-client.js',import.meta.url),'utf8'),context);
const {createClient}=context.ClubMatchV08CloudClient;
const client=createClient('https://example.supabase.co','sb_publishable_test',{fetch,storage:localStorage});

const login=await client.auth.signInWithPassword({email:'test@example.com',password:'secret'});
assert.equal(login.error,null);assert.equal(login.data.session.user.email,'test@example.com');assert.equal(client.transport,'native-fetch');
let authEvent=null;const sub=client.auth.onAuthStateChange(event=>authEvent=event);
const rpc=await client.rpc('get_my_open_matches');assert.equal(rpc.error,null);assert.equal(rpc.data[0].match_id,'m1');
const rpcCall=calls.find(c=>c.url.includes('/rest/v1/rpc/'));
assert.equal(rpcCall.options.headers.apikey,'sb_publishable_test');assert.equal(rpcCall.options.headers.Authorization,`Bearer ${jwt('aal1')}`);

const reset=await client.auth.resetPasswordForEmail('test@example.com',{redirectTo:'https://preview.example/reset'});assert.equal(reset.error,null);assert.equal(reset.data.sent,true);
const recoverCall=calls.find(c=>c.url.includes('/auth/v1/recover'));assert.ok(recoverCall.url.includes('redirect_to='));assert.equal(JSON.parse(recoverCall.options.body).email,'test@example.com');
const update=await client.auth.updateUser({password:'new-password-123'});assert.equal(update.error,null);assert.equal(update.data.user.id,'u1');

const factors=await client.auth.mfa.listFactors();assert.equal(factors.error,null);assert.equal(factors.data.totp[0].id,'f1');
const aal=await client.auth.mfa.getAuthenticatorAssuranceLevel();assert.equal(aal.data.currentLevel,'aal1');assert.equal(aal.data.nextLevel,'aal2');
const enrolled=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'ClubMatch'});assert.equal(enrolled.data.id,'f2');
const challenge=await client.auth.mfa.challenge({factorId:'f2'});assert.equal(challenge.data.id,'c1');
const verified=await client.auth.mfa.verify({factorId:'f2',challengeId:'c1',code:'123456'});assert.equal(verified.error,null);assert.equal(client.session.refresh_token,'r3');assert.equal(authEvent,'MFA_CHALLENGE_VERIFIED');
const aal2=await client.auth.mfa.getAuthenticatorAssuranceLevel();assert.equal(aal2.data.currentLevel,'aal2');
const unenrolled=await client.auth.mfa.unenroll({factorId:'f1'});assert.equal(unenrolled.error,null);

const session=await client.auth.getSession();assert.equal(session.data.session.refresh_token,'r3');
await client.auth.refreshSession();assert.equal(client.session.refresh_token,'r2');assert.equal(authEvent,'TOKEN_REFRESHED');
const out=await client.auth.signOut();assert.equal(out.error,null);assert.equal(client.session,null);assert.equal(authEvent,'SIGNED_OUT');sub.data.subscription.unsubscribe();

const recoveryStorage=new Map(),recoveryLocal={getItem:k=>recoveryStorage.get(k)||null,setItem:(k,v)=>recoveryStorage.set(k,String(v)),removeItem:k=>recoveryStorage.delete(k)};
let replaced='';const recoveryContext={...context,localStorage:recoveryLocal,location:{hash:`#access_token=${encodeURIComponent(jwt('aal1'))}&refresh_token=rr&type=recovery&expires_in=3600`,pathname:'/reset',search:''},history:{replaceState(_a,_b,url){replaced=url}},document:{title:'Reset'}};
recoveryContext.globalThis=recoveryContext;recoveryContext.window=recoveryContext;vm.createContext(recoveryContext);vm.runInContext(fs.readFileSync(new URL('./cloud-client.js',import.meta.url),'utf8'),recoveryContext);
const recoveryClient=recoveryContext.ClubMatchV08CloudClient.createClient('https://example.supabase.co','sb_publishable_test',{fetch,storage:recoveryLocal});
let recoveryEvent=null;recoveryClient.auth.onAuthStateChange(event=>recoveryEvent=event);
const imported=recoveryClient.auth.importRecoveryFromUrl(recoveryContext.location);assert.equal(imported.error,null);assert.equal(imported.data.recovery,true);assert.equal(recoveryEvent,'PASSWORD_RECOVERY');assert.equal(recoveryClient.session.refresh_token,'rr');assert.equal(replaced,'/reset');

const failingFetch=async()=>({ok:false,status:400,text:async()=>JSON.stringify({code:'invalid_credentials',message:'Invalid login credentials'})});
const failing=createClient('https://example.supabase.co','sb_publishable_test',{fetch:failingFetch,storage:localStorage,storageKey:'failed'});
const bad=await failing.auth.signInWithPassword({email:'test@example.com',password:'wrong'});
assert.equal(bad.error.code,'invalid_credentials');assert.equal(bad.error.message,'E-mail of wachtwoord klopt niet.');
console.log('PASS cloud-client: auth + recovery + MFA + rpc + refresh + signout');
