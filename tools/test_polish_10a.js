#!/usr/bin/env node
'use strict';
/* Tahap 10A (polish): jembatan pas, footprint bangunan, plat nama, kandang per spesies, jamur, siklus sumber daya acak, memancing di air luas. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const I = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/index.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(root, 'tools/world_design.json'), 'utf8'));
const col = {}; for (const f of fs.readdirSync(path.join(root, 'assets/world/chunks'))) { const c = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/chunks', f), 'utf8')); for (let i = 0; i < c.layers.collision.length; i++) col[(c.y + ((i / c.w) | 0)) * I.w + c.x + i % c.w] = c.layers.collision[i]; }
const solid = (x, y) => col[y * I.w + x] === 1 || 'XT~'.includes(I.grid[y][x]);
// 1) jembatan: menutup seluruh air di barisnya, ujung berpijak di darat
const [[bx0, by], [bx1]] = D.bridges[0].points;
const water = []; for (let x = 40; x < 80; x++) if (I.grid[by - 2][x] === '~') water.push(x);
ok(water.length > 0 && bx0 === Math.min(...water) - 1 && bx1 === Math.max(...water) + 1, 'jembatan pas menutupi air + satu petak tumpuan di tiap sisi');
// 2) bangunan: baris di depan pintu bebas, tidak ada collision di depan sprite
for (const p of I.places.filter(q => q.sprite)) for (let x = p.x - 2; x <= p.x + 2; x++) ok(!solid(x, p.y) || x === p.x - 2 && false, 'baris depan bangunan bebas: ' + p.id + ' x=' + x);
for (const p of I.places.filter(q => q.sprite)) { ok(!!p.signAt, 'plat bangunan punya posisi samping: ' + p.id); ok(p.signAt[0] / 16 >= p.x + 1.5 || p.signAt[0] / 16 <= p.x - 1.5, 'plat tidak menimpa pintu: ' + p.id); }
// 3) hutan jamur: jamur asli, tanpa batu emas
const grove = I.places.find(p => p.type === 'mushroom_grove');
const near = I.objects.filter(o => Math.abs(o.x / 16 - grove.x) <= 6 && Math.abs(o.y / 16 - grove.y) <= 5);
ok(near.filter(o => /^mush_/.test(o.a || '')).length >= 15, 'hutan jamur penuh jamur beranimasi');
ok(!near.some(o => /^rock_/.test(o.k || '')), 'tidak ada batu di hutan jamur');
// 4) kandang: satu per spesies, pagar tertutup, pintu terbuka, interior dapat dimasuki
ok(I.pens.length === 4 && new Set(I.pens.map(p => p.animal)).size === 4, 'empat kandang terpisah per spesies');
ok(I.animals.length === 0, 'tidak ada hewan campur di satu halaman');
for (const p of I.pens) {
  for (let x = p.x; x < p.x + p.w; x++) { ok(solid(x, p.y), 'pagar atas menyambung ' + p.id + x); const gate = x >= p.gateCols[0] && x <= p.gateCols[1]; ok(solid(x, p.y + p.h - 1) === !gate, 'pagar bawah + pintu ' + p.id + x); }
  for (let y = p.y; y < p.y + p.h; y++) ok(solid(p.x, y) && solid(p.x + p.w - 1, y), 'pagar samping menyambung ' + p.id);
  for (let y = p.y + 1; y < p.y + p.h - 1; y++) for (let x = p.x + 1; x < p.x + p.w - 1; x++) ok(!solid(x, y), 'interior bebas ' + p.id);
  ok(!solid(p.gateCols[0], p.gateRow + 1), 'jalan di depan pintu bebas ' + p.id);
}
// 5) batu bersifat padat
const rocks = I.objects.filter(o => /^rock_/.test(o.k || '') && o.x / 16 > 60); ok(rocks.every(o => col[Math.floor((o.y - 1) / 16) * I.w + Math.floor(o.x / 16)] === 1), 'batu baru memblokir pemain');
// 6) perilaku runtime
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} }; new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, __dirname, mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 8000 });
context.__W = I;
ev("sfx=function(){};say=function(){};st='world';Tmap.data=()=>__W;S.set=S.set||{};S.world={x:0,y:0};lifeEnsure();S.gather.nodes={};S.gather.count=0");
// memancing: air luas dan harus mentok
const lake = D.waterFeatures.find(w => w.id === 'lake_main'), lx = lake.x + 12, ly = lake.y; // tepi utara danau
let shore = null; for (let y = ly - 6; y < ly + 6 && !shore; y++) if (I.grid[y][lx] === '~' && I.grid[y - 1][lx] !== '~') shore = y - 1;
ok(shore != null, 'tepi danau ditemukan');
ev(`S.world.x=${(lx + .5) * 32};S.world.y=${(shore + 1) * 32 - 9}`); ok(ev('lifeFishingSpot()') !== null, 'mentok ke tepi danau: bisa memancing');
ev(`S.world.y=${(shore - 2) * 32}`); ok(ev('lifeFishingSpot()') === null, 'dua petak dari air: tidak bisa memancing');
const bridgeX = (bx0 + 1) * 32 + 16; ev(`S.world.x=${bridgeX};S.world.y=${by * 32 + 16 - 9}`);
const spotAny = ev('lifeFishingSpot()'); ok(spotAny === null || ev('lifeDeepWater(__W,lifeFishingSpot().x,lifeFishingSpot().y)'), 'target lempar selalu air dalam');
// sumber daya: hilang total, muncul acak di zona yang sama
const mr = I.resources.find(r => r.kind === 'mushroom'), z = mr.zone;
ev(`S.world.x=${(mr.x + .5) * 32};S.world.y=${(mr.y + 1) * 32}`);
const r0 = ev('lifeNearResource()'); ok(r0 && r0.kind === 'mushroom', 'jamur terdeteksi saat dekat');
ev('lifeDoGather(lifeNearResource())'); ok(ev('lifeNearResource()') === null || ev('lifeNearResource().id') !== mr.id, 'jamur hilang setelah dipanen');
const pos = ev(`S.gather.nodes['${mr.id}'].pos`); ok(pos.x >= z[0] && pos.x < z[0] + z[2] && pos.y >= z[1] && pos.y < z[1] + z[3], 'posisi baru tetap di hutan jamur');
ok(I.grid[pos.y][pos.x] === '.', 'posisi baru bebas rintangan');
ok(!/globalAlpha=\.35/.test(fs.readFileSync(path.join(root, 'js/life.js'), 'utf8').split('function lifeDrawResourceNodes')[1].split('function ')[0]), 'tidak ada bayangan 35% sumber daya');
// pohon peta: asli terbuka permanen, pohon baru padat setelah jeda
const tr = I.objects.find(o => o.a && o.a.startsWith('tree') && o.x / 16 >= 120 && o.y / 16 > 5 && o.y / 16 < 50);
ev(`S.world.x=${tr.x * 2};S.world.y=${tr.y * 2}`); const rt = ev('lifeNearResource()'); ok(rt && rt.kind === 'tree', 'pohon tepi hutan bisa ditebang');
ev('lifeDoGather(lifeNearResource())'); const id = 'tree_obj_' + tr.x + '_' + tr.y, nd = ev(`S.gather.nodes['${id}']`);
ok(nd && nd.gone === 1 && nd.pos && (nd.pos.x !== Math.floor(tr.x / 16) || nd.pos.y !== Math.floor(tr.y / 16) - 1), 'pohon asli hilang permanen, posisi baru berbeda');
ok(ev(`lifeDynSolid(${Math.floor(tr.x / 16)},${Math.floor((tr.y - 1) / 16)})`) === false, 'bekas pohon tidak jadi dinding tak terlihat');
ev(`S.gather.nodes['${id}'].readyAt=Date.now()-1;S.lifeClock=Date.now()+5;lifeDynRev++`);
ok(ev('lifeMovedTrees().length') >= 1 && ev(`lifeDynSolid(${nd.pos.x},${nd.pos.y})`) === true, 'pohon tumbuh lagi di titik baru dan padat');
// kandang di dunia
ev("S.ranch=null;ranchGet()"); ok(ev('ranchWorldCounts().chicken') === 2, 'kandang hias sebelum dibeli');
ev("S.ranch.level=1;S.ranch.animals=[{id:'a',type:'chicken',pending:3,x:.5,y:.5,tx:.5,ty:.5,fedUntil:0,nextAt:0}]"); ok(ev('ranchWorldCounts().chicken') === 1 && ev('ranchWorldCounts().cow') === 0, 'hewan sesuai kepemilikan');
ev("ranchCollectType('chicken')"); ok(ev('S.ranch.stock.egg') === 3, 'telur diambil langsung dari kandang ayam');
console.log('PASS: Tahap 10A (' + n + ' pemeriksaan)');
