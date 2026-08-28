import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Target{constructor(){this.handlers={}}addEventListener(n,fn){(this.handlers[n]??=new Set()).add(fn)}removeEventListener(n,fn){this.handlers[n]?.delete(fn)}fire(n){for(const fn of this.handlers[n]||[])fn()}}
const win=new Target(),doc=new Target();doc.visibilityState='visible';
const context={console,globalThis:null,window:null,document:doc,Date};context.globalThis=context;context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('./lifecycle-sync.js',import.meta.url),'utf8'),context);
let calls=[];let now=1000;
const runtime={activeMatchId:'m1',viewModel:{ok:true},async refresh(reason){calls.push(reason);return this.viewModel}};
const sync=context.ClubMatchV08LifecycleSync.createLifecycleSync({runtime,window:win,document:doc,now:()=>now,minGapMs:500});
sync.install();assert.equal(sync.installed,true);
win.fire('focus');await new Promise(r=>setTimeout(r,0));assert.deepEqual(calls,['focus']);
now=1200;win.fire('online');await new Promise(r=>setTimeout(r,0));assert.deepEqual(calls,['focus'],'minimum gap should coalesce resume noise');
now=1700;doc.visibilityState='visible';doc.fire('visibilitychange');await new Promise(r=>setTimeout(r,0));assert.deepEqual(calls,['focus','visible']);
now=2300;win.fire('pageshow');await new Promise(r=>setTimeout(r,0));assert.deepEqual(calls,['focus','visible','pageshow']);
runtime.activeMatchId=null;now=3000;win.fire('focus');await new Promise(r=>setTimeout(r,0));assert.equal(calls.length,3,'no refresh without active match');
sync.uninstall();assert.equal(sync.installed,false);
console.log('PASS lifecycle-sync: focus + visibility + online/pageshow resync');
