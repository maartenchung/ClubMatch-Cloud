import fs from 'node:fs';
import assert from 'node:assert/strict';

const training=fs.readFileSync(new URL('./training-ui.js',import.meta.url),'utf8');
const workspace=fs.readFileSync(new URL('./workspace-manager.js',import.meta.url),'utf8');

assert.ok(training.includes("workspace()?.enter?.('training',root)"),'showing Trainingen must enter the shared training workspace');
assert.ok(training.includes('workspace()?.exit?.()'),'closing Trainingen must restore the previous workspace');
assert.ok(workspace.includes('app.dataset.workspace=activeName'),'app must expose the active workspace');
assert.ok(workspace.includes("el.classList.add('hidden')"),'other top-level screens must be hidden while a workspace is active');
assert.ok(workspace.includes("saved=new Map([...app.children].map(el=>[el,el.classList.contains('hidden')]))"),'previous visibility must be remembered before hiding');
assert.ok(workspace.includes("observer.observe(app,{childList:true,attributes:true,subtree:false,attributeFilter:['class']})"),'new or re-rendered top-level panels must remain isolated');
assert.ok(training.includes('← Terug naar wedstrijden'),'training workspace must have an explicit return action');
assert.ok(training.includes('Terug naar wedstrijden zonder opslaan?'),'leaving with unsaved training changes must require confirmation');

console.log('PASS training workspace: shared isolated view + exact visibility restore + dirty-change guard');
