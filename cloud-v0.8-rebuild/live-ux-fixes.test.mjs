import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(new URL(`./${f}`,import.meta.url),'utf8');
const html=read('index.html');
const roadmap=read('roadmap-ux-v08.js');
const fast=read('fast-resume-v08.js');
const playerUi=read('player-action-ui.js');
const device=read('device-security-ux-v08.js');
const analystUndo=read('analyst-correction-v08.js');
const mgmtVisibility=read('management-visibility.js');
const mgmtController=read('management-controller.js');
const smart=read('smart-registration-v08.js');
const liveField=read('analyst-live-input-v08.js');
const stabilize=read('v08-stabilization.js');

assert.match(html,/build 20260829\.0125/);
for(const asset of ['cloud-client.js','realtime-native.js','roadmap-ux-v08.js','smart-registration-v08.js','analyst-live-input-v08.js','analyst-correction-v08.js','device-security-ux-v08.js','app.js'])assert.match(html,new RegExp(`${asset.replaceAll('.','\\.')}\\?v=20260829\\.0125`));
assert.match(html,/id="authPanel" class="card hidden"/);
assert.ok([...html.matchAll(/<script\s+src="[^"]+"([^>]*)>/g)].every(m=>/\bdefer\b/.test(m[1])),'alle browsermodules moeten defer laden');
assert.ok(html.indexOf('cloud-client.js')<html.indexOf('realtime-native.js')&&html.indexOf('realtime-native.js')<html.indexOf('roadmap-ux-v08.js')&&html.indexOf('roadmap-ux-v08.js')<html.indexOf('app.js'),'shared-client volgorde onjuist');
assert.doesNotMatch(html,/action-field-controller\.js\?v=/);
assert.doesNotMatch(html,/action-field-ui\.js\?v=/);

assert.match(roadmap,/__sharedBrowserClient/);
assert.match(roadmap,/registry\.has/);
assert.doesNotMatch(roadmap,/MutationObserver/,'uitgefaseerd Actieveld mag geen permanente observer houden');
assert.doesNotMatch(roadmap,/get_my_team_seasons| get_my_open_matches/,'shared-client guard mag geen startup-RPC warmen');

assert.doesNotMatch(fast,/createClient\(/);
assert.doesNotMatch(fast,/runtime\.start\(/);
assert.match(fast,/clubmatch:v08-confirmed/);

assert.match(device,/probePromise/,'sessiecontrole moet single-flight zijn');
assert.match(device,/clearSessionCheckStatus/,'sessiecontrole-status moet na succes verdwijnen');
assert.match(device,/__ClubMatchShellBoot\?\.build/);
assert.match(device,/20260829\.0125/);
assert.doesNotMatch(device,/MutationObserver/,'sessiediagnostiek mag de hele app-DOM niet observeren');

assert.match(playerUi,/lastStructureKey/);
assert.match(playerUi,/structureKey===lastStructureKey/);
assert.match(playerUi,/setInterval\(updatePossessionClocks,1000\)/,'timer mag alleen bezitstekst bijwerken');
assert.doesNotMatch(playerUi,/setInterval\(renderPossessionBar/,'Snelle registratie mag niet per seconde volledig herbouwen');
assert.match(playerUi,/Categorieën/);
assert.match(playerUi,/A–Z/);

assert.doesNotMatch(mgmtVisibility,/setInterval/,'geen async 75ms beheerpolling');
assert.doesNotMatch(mgmtVisibility,/loadAll\(/,'knopzichtbaarheid mag geen volledige beheercontext laden');
assert.match(mgmtVisibility,/if\(inFlight\)return inFlight/);
assert.match(mgmtVisibility,/loadContext\(\).*loadUserAdmin\(\)/s);
assert.match(mgmtController,/function singleFlight/);
assert.match(mgmtController,/Promise\.all\(\[loadTeamSeasons\(\),loadContext\(\),loadUserAdmin\(\)\]\)/);

assert.match(analystUndo,/undo_last_analyst_input_v08/);
assert.match(analystUndo,/Tik nogmaals om terug te draaien/);
assert.doesNotMatch(analystUndo,/MutationObserver/,'analistcorrectie moet event-driven zijn');
assert.match(smart,/record_analyst_goal_v08/);
assert.match(smart,/assistCandidate/);
assert.match(liveField,/Live Actieveld/);
assert.match(liveField,/offside/);
assert.match(liveField,/penalty/);
assert.doesNotMatch(stabilize,/client\.rpc\s*=/);
assert.doesNotMatch(stabilize,/Actieve wedstrijd veilig hervatten vanuit Cloud/);

console.log('PASS live-ux-fixes: build 0125 persisted-session + stable DOM + single-flight beheer + retained live UX');
