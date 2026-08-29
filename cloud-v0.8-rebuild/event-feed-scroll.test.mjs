import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('./event-feed-ui.js',import.meta.url),'utf8');
assert.match(src,/maxHeight='360px'/,'event feed needs a bounded scroll viewport');
assert.match(src,/overflowY='auto'/,'event feed must scroll vertically');
assert.match(src,/Scroll omhoog voor oudere gebeurtenissen/,'scroll affordance must be explained');
assert.doesNotMatch(src,/visibleLimit/,'event feed should no longer batch-hide older rows');
assert.doesNotMatch(src,/visibleLimit\+=/,'old load-more batching must be removed');
console.log('PASS event feed scroll: all filtered history remains in one scrollable menu');
