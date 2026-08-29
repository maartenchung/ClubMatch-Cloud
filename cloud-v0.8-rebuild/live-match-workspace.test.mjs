import fs from 'node:fs';import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(new URL(`./${f}`,import.meta.url),'utf8');
const workspace=read('live-match-workspace-v08.js'),html=read('index.html');
assert.match(workspace,/v08LiveMatchWorkspace/);assert.match(workspace,/v08LiveLineupColumn/);assert.match(workspace,/v08LiveAnalystColumn/);assert.match(workspace,/v08LiveActionFieldHost/);assert.match(workspace,/v08PlayerTileZone/);
assert.match(workspace,/cardFor\('v08Pitch'\)/);assert.match(workspace,/cardFor\('v08Timeline'\)/);assert.match(workspace,/cardFor\('v08FieldTiles'\)/);assert.match(workspace,/cardFor\('v08BenchTiles'\)/);assert.match(workspace,/rightCol\.appendChild\(eventsCard\)/,'Gebeurtenissen moeten onder het Actieveld in analistkolom komen');
assert.match(workspace,/v08FormationFlow/);assert.match(workspace,/ClubMatchV08PitchLayout\?\.geometry/);assert.match(workspace,/current_position\|\|p\?\.starting_position/);assert.match(workspace,/v08FlowName/);assert.match(workspace,/v08FlowPos/);assert.match(workspace,/@media\(max-width:980px\)\{\.v08LiveMatchWorkspace\{grid-template-columns:1fr\}/,'tablet moet dezelfde workspace stapelen');
assert.match(workspace,/quickObserver\.observe\(bar,\{childList:true,subtree:true\}\)/,'Snelle registratie observer moet alleen eigen bar volgen');assert.doesNotMatch(workspace,/observe\(doc\.body/,'geen globale body observer');assert.doesNotMatch(workspace,/setInterval/,'workspace mag niet pollen');
assert.ok(html.indexOf('live-match-workspace-v08.js')<html.indexOf('analyst-live-input-v08.js'),'workspace host moet vóór Live Actieveld laden');new Function(workspace);
console.log('PASS live-match-workspace: live lineup + analyst field side-by-side, events nearby, tiles below and formation-shaped quick input');
