/* ClubMatch Cloud v0.8 - password recovery + MFA security controller */
(function(global){
'use strict';
function invariant(condition,message){if(!condition)throw new Error(message)}
function clean(value){return String(value??'').trim()}
function createSecurityController(options={}){
  const client=options.client;invariant(client?.auth,'Cloud Auth client is required');
  let recoveryMode=false,enrollment=null,mfaState={currentLevel:null,nextLevel:null,factors:[],needsChallenge:false};
  function snapshot(){return Object.freeze({recoveryMode,enrollment:enrollment?Object.freeze({...enrollment}):null,mfa:Object.freeze({...mfaState,factors:Object.freeze([...mfaState.factors])})})}
  function emit(){const state=snapshot();options.onChange?.(state);return state}
  function passwordCheck(password,confirmation=password){
    const value=String(password||''),errors=[];
    if(value.length<12)errors.push('Gebruik minimaal 12 tekens');
    if(value!==String(confirmation||''))errors.push('De twee wachtwoorden zijn niet gelijk');
    return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
  }
  function importRecovery(locationLike=global.location){const result=client.auth.importRecoveryFromUrl(locationLike);if(result?.error)throw result.error;recoveryMode=!!result?.data?.recovery;emit();return result}
  async function requestPasswordReset(email,redirectTo){
    const address=clean(email);invariant(address,'Vul je e-mailadres in');
    const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo});if(error)throw error;
    return Object.freeze({sent:true,message:'Als dit e-mailadres bij ClubMatch hoort, ontvang je een resetmail.'});
  }
  async function updateRecoveredPassword(password,confirmation){
    invariant(recoveryMode,'Geen geldige password-recovery sessie');const check=passwordCheck(password,confirmation);if(!check.ok)throw new Error(check.errors.join(' · '));
    const {error}=await client.auth.updateUser({password:String(password)});if(error)throw error;
    await client.auth.signOut();recoveryMode=false;emit();return Object.freeze({updated:true});
  }
  async function refreshMfa(){
    const factors=await client.auth.mfa.listFactors();if(factors.error)throw factors.error;
    const all=factors.data.all||[],hasVerified=all.some(f=>f?.status==='verified');
    // No enrolled/verified factor means an AAL2 challenge is impossible. Do not put a
    // second /auth/v1/user request in the critical app bootstrap for an unused feature.
    if(!hasVerified){mfaState={currentLevel:'aal1',nextLevel:'aal1',factors:all,needsChallenge:false};return emit()}
    const aal=await client.auth.mfa.getAuthenticatorAssuranceLevel();if(aal.error)throw aal.error;
    const currentLevel=aal.data.currentLevel,nextLevel=aal.data.nextLevel;
    mfaState={currentLevel,nextLevel,factors:all,needsChallenge:currentLevel==='aal1'&&nextLevel==='aal2'};return emit();
  }
  async function beginTotpEnrollment(friendlyName='ClubMatch Authenticator'){
    const result=await client.auth.mfa.enroll({factorType:'totp',friendlyName});if(result.error)throw result.error;
    invariant(result.data?.id&&result.data?.totp,'Supabase returned incomplete MFA enrollment');
    enrollment={factorId:result.data.id,qrCode:result.data.totp.qr_code,secret:result.data.totp.secret,uri:result.data.totp.uri||null};emit();return snapshot();
  }
  async function verifyTotpEnrollment(code){
    invariant(enrollment?.factorId,'Start eerst 2FA-instelling');const value=clean(code);invariant(/^\d{6,10}$/.test(value),'Vul de code uit je authenticator-app in');
    const challenge=await client.auth.mfa.challenge({factorId:enrollment.factorId});if(challenge.error)throw challenge.error;
    const verify=await client.auth.mfa.verify({factorId:enrollment.factorId,challengeId:challenge.data.id,code:value});if(verify.error)throw verify.error;
    enrollment=null;await refreshMfa();return snapshot();
  }
  async function verifyLoginMfa(code,factorId=null){
    const state=await refreshMfa();const verified=state.mfa.factors.filter(f=>f.status==='verified'&&(f.factor_type==='totp'||f.type==='totp'));
    const factor=factorId?verified.find(f=>f.id===factorId):verified[0];invariant(factor,'Geen geverifieerde authenticator-factor gevonden');
    const value=clean(code);invariant(/^\d{6,10}$/.test(value),'Vul de code uit je authenticator-app in');
    const challenge=await client.auth.mfa.challenge({factorId:factor.id});if(challenge.error)throw challenge.error;
    const verify=await client.auth.mfa.verify({factorId:factor.id,challengeId:challenge.data.id,code:value});if(verify.error)throw verify.error;
    await refreshMfa();return snapshot();
  }
  async function unenroll(factorId){invariant(factorId,'factorId is required');const result=await client.auth.mfa.unenroll({factorId});if(result.error)throw result.error;await refreshMfa();return snapshot()}
  function cancelEnrollment(){enrollment=null;return emit()}
  return Object.freeze({importRecovery,requestPasswordReset,updateRecoveredPassword,passwordCheck,refreshMfa,beginTotpEnrollment,verifyTotpEnrollment,verifyLoginMfa,unenroll,cancelEnrollment,get state(){return snapshot()}});
}
global.ClubMatchV08Security={createSecurityController};
})(typeof window!=='undefined'?window:globalThis);
