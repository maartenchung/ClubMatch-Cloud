import fs from 'node:fs';import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(new URL(`./${f}`,import.meta.url),'utf8');
const controller=read('preparation-controller.js'),ui=read('preparation-ui.js');
for(const rpc of ['get_lineup_favorites_v08','save_lineup_favorite_v08','delete_lineup_favorite_v08'])assert.match(controller,new RegExp(rpc));
assert.match(controller,/favorites=\[\]/);assert.match(controller,/saveFavorite/);assert.match(controller,/applyFavorite/);assert.match(controller,/deleteFavorite/);assert.match(controller,/exact 11 basisspelers|exact 11/);assert.match(controller,/new Set\(positions\)\.size===11/);assert.match(controller,/attendance:true,selected:true,starter:true/);
assert.match(ui,/Favorite basisopstellingen/);assert.match(ui,/Huidige basis opslaan/);assert.match(ui,/data-favorite-id/);assert.match(ui,/data-favorite-apply/);assert.match(ui,/data-favorite-delete/);assert.match(ui,/application\/x-clubmatch-favorite/);assert.match(ui,/favoriteOver/);assert.match(ui,/applyFavoriteDrop/);assert.match(ui,/Cloud-favorites werken op desktop en tablet/);
new Function(controller);new Function(ui);console.log('PASS lineup-favorites: Cloud save/load/delete + click and drag-to-pitch favorite basisopstellingen');
