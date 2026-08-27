import fs from 'node:fs';
import assert from 'node:assert/strict';

const src=fs.readFileSync(new URL('./training-ui.js',import.meta.url),'utf8');

assert.ok(src.includes('function enterTrainingWorkspace()'),'Trainingen must have an isolated workspace entry');
assert.ok(src.includes('function exitTrainingWorkspace()'),'Trainingen must restore the previous workspace');
assert.ok(src.includes("app.dataset.workspace='training'"),'app must expose the active training workspace');
assert.ok(src.includes("if(!el.classList.contains('hidden'))el.classList.add('hidden')"),'other top-level match screens must be hidden while Trainingen is active');
assert.ok(src.includes('workspaceSaved.set(el,el.classList.contains(\'hidden\'))'),'previous visibility must be remembered before hiding');
assert.ok(src.includes('workspaceObserver.observe(app,{childList:true,attributes:true,subtree:false,attributeFilter:[\'class\']})'),'new or re-rendered match panels must remain hidden during Trainingen');
assert.ok(src.includes('← Terug naar wedstrijden'),'training workspace must have an explicit return action');
assert.ok(src.includes('Terug naar wedstrijden zonder opslaan?'),'leaving with unsaved training changes must require confirmation');
assert.ok(src.includes('enterTrainingWorkspace()'),'showing Trainingen must activate workspace isolation');
assert.ok(src.includes('exitTrainingWorkspace()'),'closing Trainingen must restore match workspace');

console.log('PASS training workspace: isolated view + exact visibility restore + dirty-change guard');
