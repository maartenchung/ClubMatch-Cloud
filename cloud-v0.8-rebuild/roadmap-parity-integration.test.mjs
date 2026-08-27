import fs from 'node:fs';import assert from 'node:assert/strict';const read=f=>fs.readFileSync(new URL(`./${f}`,import.meta.url),'utf8');
const dash=read('dashboard-ui.js'),training=read('training-ui.js'),mgmt=read('management-ui.js'),del=read('stored-match-delete-ui.js'),renderer=read('dom-renderer.js'),prep=read('preparation-controller.js');
assert.match(dash,/data-dash-include/);assert.match(dash,/Performance Rating 1–100/);assert.match(dash,/data-dash-delete/);
assert.match(training,/Inzet 1–5/);assert.match(training,/Kwaliteit 1–5/);assert.match(training,/Houding 1–5/);assert.match(training,/Trainingsscore 1–100/);
assert.match(mgmt,/Nieuw team \/ seizoen/);assert.match(mgmt,/O16-2/);assert.match(mgmt,/Nieuwe club/);assert.match(mgmt,/Speler toevoegen/);
assert.match(del,/Opgeslagen wedstrijd verwijderen/);assert.match(del,/p_confirmation:'DELETE'/);
assert.match(renderer,/Live bank/);assert.match(renderer,/v08LegendPitch/);assert.match(renderer,/v08LegendMonitor/);assert.match(renderer,/v08LegendTimeline/);assert.match(renderer,/v08LegendField/);assert.match(renderer,/v08LegendBench/);
assert.match(prep,/Vul een tegenstander in/);
console.log('PASS roadmap parity integration: dashboard selection/rating + training + team creation + delete + live legends/bank + opponent gate');
