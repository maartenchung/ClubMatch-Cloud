import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={console,globalThis:null,window:null,location:{hash:'#recovery'},Date};context.globalThis=context;context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./security-controller.js',import.meta.url),'utf8'),context);
let resetArgs=null,updated=null,signedOut=0,verified=false,enrolled=false,removed=false;
const factors=[{id:'f1',factor_type:'totp',status:'verified'}];
const client={auth:{
  importRecoveryFromUrl(){return {data:{recovery:true},error:null}},
  async resetPasswordForEmail(email,opts){resetArgs={email,opts};return {data:{sent:true},error:null}},
  async updateUser(attrs){updated=attrs;return {data:{user:{id:'u1'}},error:null}},
  async signOut(){signedOut++;return {error:null}},
  mfa:{
    async listFactors(){return {data:{all:factors,totp:factors,phone:[]},error:null}},
    async getAuthenticatorAssuranceLevel(){return {data:{currentLevel:verified?'aal2':'aal1',nextLevel:'aal2'},error:null}},
    async enroll(){enrolled=true;return {data:{id:'f2',totp:{qr_code:'qr',secret:'secret',uri:'otpauth://clubmatch'}},error:null}},
    async challenge({factorId}){return {data:{id:'c-'+factorId},error:null}},
    async verify(){verified=true;return {data:{access_token:'x'},error:null}},
    async unenroll(){removed=true;return {data:{},error:null}}
  }
}};
const S=context.ClubMatchV08Security.createSecurityController({client});
assert.equal(S.passwordCheck('short').ok,false);assert.equal(S.passwordCheck('abcdefghijkl','abcdefghijkm').ok,false);assert.equal(S.passwordCheck('abcdefghijkl','abcdefghijkl').ok,true);
S.importRecovery();assert.equal(S.state.recoveryMode,true);
const requested=await S.requestPasswordReset(' test@example.com ','https://preview/reset');assert.equal(requested.sent,true);assert.equal(resetArgs.email,'test@example.com');
await S.updateRecoveredPassword('abcdefghijkl','abcdefghijkl');assert.equal(updated.password,'abcdefghijkl');assert.equal(signedOut,1);assert.equal(S.state.recoveryMode,false);
let state=await S.refreshMfa();assert.equal(state.mfa.needsChallenge,true);
state=await S.beginTotpEnrollment();assert.equal(enrolled,true);assert.equal(state.enrollment.factorId,'f2');assert.equal(state.enrollment.secret,'secret');
state=await S.verifyTotpEnrollment('123456');assert.equal(state.enrollment,null);assert.equal(state.mfa.currentLevel,'aal2');assert.equal(state.mfa.needsChallenge,false);
verified=false;state=await S.verifyLoginMfa('654321');assert.equal(state.mfa.currentLevel,'aal2');
await S.unenroll('f1');assert.equal(removed,true);
console.log('PASS security-controller: recovery + password update + TOTP MFA lifecycle');
