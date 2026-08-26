import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
assert.ok(scripts.length>=19,'expected full v0.8 browser module set');
assert.ok(scripts.every(src=>/\?v=20260826\.1409$/.test(src)),`unversioned script found: ${scripts.filter(src=>!/\?v=20260826\.1409$/.test(src)).join(', ')}`);
for(const expected of ['cloud-client.js','action-policy.js','lifecycle-sync.js','match-selection.js','preparation-controller.js','preparation-ui.js','dashboard-controller.js','dashboard-ui.js','security-controller.js','security-ui.js','app.js']){
  assert.ok(scripts.some(src=>src.startsWith(`${expected}?v=`)),`missing version-pinned ${expected}`);
}
assert.ok(html.includes('build 20260826.1409'),'visible build marker missing');
console.log('PASS asset-versioning: all browser scripts are version-pinned and build marker is visible');
