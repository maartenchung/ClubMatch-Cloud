import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context={console,globalThis:null,window:null};context.globalThis=context;context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./security-ui.js',import.meta.url),'utf8'),context);
const {deriveRecoveryUi}=context.ClubMatchV08SecurityUi;
assert.equal(typeof deriveRecoveryUi,'function');
let state=deriveRecoveryUi('abcdefghijk','abcdefghijk');
assert.equal(state.length,11);assert.equal(state.lengthOk,false);assert.equal(state.match,true);assert.equal(state.ready,false);
state=deriveRecoveryUi('abcdefghijkl','abcdefghijkl');
assert.equal(state.length,12);assert.equal(state.lengthOk,true);assert.equal(state.match,true);assert.equal(state.ready,true);
state=deriveRecoveryUi('abcdefghijkl','abcdefghijkm');
assert.equal(state.lengthOk,true);assert.equal(state.match,false);assert.equal(state.ready,false);
const controllerCheck=(password,confirmation)=>({ok:password.length>=12&&password===confirmation,errors:password.length>=12?[]:['Gebruik minimaal 12 tekens']});
state=deriveRecoveryUi('123456789012','123456789012',controllerCheck);assert.equal(state.ready,true);
console.log('PASS security-ui: live 12-character counter + matching gate');
