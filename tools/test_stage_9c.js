#!/usr/bin/env node
'use strict';
/* Perbaikan 9A-9D: taman/ladang, gerbang simetris, jalan sejajar pintu, dek jembatan bebas, jamur bisa dipetik tanpa ikon E. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const I = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/index.json'), 'utf8')), W = I.w, S = I.spr;
const col = {}; for (const c of I.chunks) { const d = JSON.parse(fs.readFileSync(path.join(root, 'assets/world', c.file), 'utf8')); for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) col[(d.y + y) * W + d.x + x] = d.layers.collision[y * d.w + x]; }
const js = f => fs.readFileSync(path.join(root, 'js', f), 'utf8');
// 9A: bangunan selatan hilang, petak tanam di ladang barat, celah gerbang ladang
ok(!I.objects.some(o => (o.x === 448 || o.x === 560) && o.y === 512 && /^b_/.test(o.k || '')), 'Rumah Kamu dan rumah selatan sudah dihapus');
ok(!I.objects.some(o => o.k === 'fence_h' && o.x >= 616 && o.x <= 840 && o.y === 464), 'padang timur tanpa pagar');
const F = I.bld.F; ok(I.farm.length === 24 && I.farm.every(([px, py]) => px / 16 > F[0] + 1 && px / 16 < F[2] && py / 16 > F[1] && py / 16 < F[3] + 1), '24 petak tanam di dalam ladang barat');
ok(I.farmGate && I.farmGate.side === 'N' && I.farmGate.cols.join() === '13,14', 'gerbang ladang di utara x=13..14');
ok(I.farmGate.cols.every(x => !col[28 * W + x]), 'celah gerbang ladang bebas collision');
ok(I.grid[28][12] === 'F' && I.grid[28][15] === 'F', 'tiang gerbang ladang tetap pagar');
const INT = js('interior.js'); ok(!/id:'home'|id:'res7'/.test(INT), 'INT_B tanpa bangunan yang dihapus');
// 9B: gerbang petualangan simetris terhadap jalan x=29..32 (sumbu 31)
const tw = I.objects.filter(o => o.k === 'tower' && o.c === 'G').map(o => o.x / 16).sort((a, b) => a - b);
ok(tw.length === 2 && Math.abs((tw[0] + tw[1]) / 2 - 31) < 1e-9, 'menara gerbang simetris terhadap sumbu jalan: ' + tw);
ok(I.bld.G.join() === '27,8,34,8', 'bld.G mengikuti menara baru');
ok(!I.objects.some(o => o.k === 'board' && (o.x === 456 || o.x === 536) && o.y === 160), 'plat kosong gerbang dihapus');
ok(I.labels && I.labels[0].name === 'Gerbang', 'label melayang Gerbang');
const WJ = js('world.js'), HUD = js('hud.js');
ok(!/Ladangnya di petak rumput terbuka/.test(WJ + HUD), 'teks ladang lama dihapus');
ok(/wNear\.c!='F'&&wNear\.c!='G'/.test(WJ), 'tanpa sorot kuning untuk ladang/gerbang');
// 9C: jalan b_res2 simetris pada pintunya (tengah tile x=50)
const rowRoad = y => [...Array(64).keys()].filter(x => x >= 44 && x <= 56 && I.grid[y][x] === ',');
for (const y of [20, 21]) { const r = rowRoad(y).filter(x => x >= 49 && x <= 51); ok(r.join() === '49,50,51' || (y === 20 && r.join() === '50'), 'jalan rumah timur baris ' + y + ': ' + r); }
ok(I.grid[20][48] !== ',' && I.grid[21][48] !== ',', 'jalan lama x=48 dihapus');
// 9E: seluruh sel jembatan terbuka di level tile; tepi (pagar) padat per pita piksel lewat Tmap.railSolid (bukan tile penuh)
const rs = new Function('V', fs.readFileSync(path.join(root, 'js/tilemap.js'), 'utf8').match(/function railSolid\(px, py\) \{[\s\S]*?\n  \}\n/)[0] + '\nreturn railSolid;')(I);
const wsrc = fs.readFileSync(path.join(root, 'js/world.js'), 'utf8'); ok(/Tmap\.railSolid\(px,py\)/.test(wsrc), 'wSolid memakai Tmap.railSolid');
ok(Array.isArray(I.bridgeRails) && I.bridgeRails.length === 1, 'metadata bridgeRails ada');
for (let x = 53; x <= 60; x++) {
  for (const y of [22, 23, 24]) ok(I.grid[y][x] === '+' && !col[y * W + x], 'sel jembatan terbuka di level tile ' + x + ',' + y);
  const px = x * 32 + 16;
  ok(rs(px, 22 * 32 + 4) === true && rs(px, 22 * 32 + 15) === true, 'pagar atas padat ' + x);
  ok(rs(px, 22 * 32 + 16) === false && rs(px, 22 * 32 + 31) === false, 'papan baris atas bisa diinjak ' + x);
  ok(rs(px, 23 * 32 + 1) === false && rs(px, 23 * 32 + 31) === false, 'baris tengah bebas ' + x);
  ok(rs(px, 24 * 32 + 0) === false && rs(px, 24 * 32 + 17) === false, 'papan baris bawah bisa diinjak ' + x);
  ok(rs(px, 24 * 32 + 18) === true && rs(px, 24 * 32 + 31) === true, 'pagar bawah padat ' + x);
}
ok(rs(52 * 32 + 16, 23 * 32) === undefined && rs(56 * 32, 21 * 32) === undefined && rs(61 * 32, 24 * 32 + 25) === undefined, 'di luar jembatan memakai collision biasa');
// kotak kaki pemain (setengah lebar 9, tinggi 8) bisa masuk jembatan dari jalan kanan pada lantai papan baris bawah: kaki y=24*32+10
const feetOk = (x, y) => ![rs(x - 9, y - 8), rs(x + 9, y - 8), rs(x - 9, y), rs(x + 9, y)].includes(true);
ok(feetOk(60 * 32 + 16, 24 * 32 + 10) && feetOk(57 * 32, 23 * 32 + 16) && feetOk(57 * 32, 22 * 32 + 26), 'pemain bisa berdiri di lantai papan, termasuk dekat tepi');
ok(!feetOk(57 * 32, 22 * 32 + 10) && !feetOk(57 * 32, 24 * 32 + 28), 'pemain tidak bisa berdiri di atas pagar');
// 9F: kios lama diganti Pasar besar (hall b_market, 13x9 tile) di taman timur yang dikosongkan; kasir pindah ke interior
ok(!I.objects.some(o => o.k === 'stall_red' && (o.serviceId === 'market_cashier' || (o.x === 552 && o.y === 416))), 'kios lama dihapus');
ok(!I.objects.some(o => o.k === 'board' && !o.serviceId), 'tidak ada papan kosong tanpa fungsi');
ok(I.objects.some(o => o.serviceId === 'quest_board'), 'papan misi tetap ada');
const hall = I.objects.find(o => o.k === 'b_market'); ok(!!hall && hall.x === 728 && hall.y === 544, 'hall pasar ada di (728,544)');
const hm = I.spr.b_market; ok(hm && hm.w === 208 && hm.h === 144 && hm.door && hm.win.length === 4 && hm.sign, 'meta sprite b_market lengkap (pintu, jendela, papan nama)');
for (let y = 25; y <= 33; y++) for (let x = 39; x <= 51; x++) ok(col[y * W + x] === 1 && I.grid[y][x] === 'X', 'hall padat ' + x + ',' + y);
for (let x = 44; x <= 46; x++) for (const y of [34, 35]) ok(!col[y * W + x] && !'XT~'.includes(I.grid[y][x]), 'halaman depan pintu bebas ' + x + ',' + y);
const reg = (x, y) => x >= 36 && x <= 52 && y >= 25 && y <= 35;
ok(!I.objects.some(o => o !== hall && reg(o.x >> 4, (o.y - 1) >> 4)), 'taman timur dikosongkan: tidak ada objek lain di x36..52,y25..35');
// jalan dari jalan utama (y=24) ke pintu (45,34) bisa ditempuh lewat jalur barat
{ const seen = new Set(['37,24']), q = [[37, 24]]; while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= W || ny >= I.h || seen.has(k) || col[ny * W + nx] || 'XT~'.includes(I.grid[ny][nx])) continue; seen.add(k); q.push([nx, ny]); } }
  ok(seen.has('45,34') && seen.has('45,35'), 'pintu Pasar terjangkau dari jalan utama'); for (let x = 37; x <= 38; x++) for (let y = 25; y <= 35; y++) ok(I.grid[y][x] === ',', 'jalur barat berupa jalan ' + x + ',' + y); }
const mp = I.places.find(p => p.id === 'village_market'); ok(mp && mp.sprite === 'b_market' && mp.name === 'Pasar' && mp.name_en === 'Market', 'tempat village_market = bangunan "Pasar"');
ok(!I.serviceObjects.some(s => s.type === 'market_cashier'), 'kasir tidak lagi layanan luar ruangan');
// 9C: jamur
const LIFE = js('life.js'), TM = js('tilemap.js');
ok(!/T\('E',x,y-29/.test(LIFE), 'ikon E dihapus dari sumber daya');
ok(/lifeMushState/.test(LIFE) && /lifeMushState/.test(TM), 'jamur dekor bisa dipetik dan disembunyikan');
const mush = I.objects.filter(o => o.deco === 'mushroom'); ok(mush.length > 20, 'ada banyak jamur dekor: ' + mush.length);
// 9D: bengkel/dapur dijauhkan dari jalan utama (x=65) dan sejajar; plat Hutan Jamur
for (const [k, id] of [['b_workshop', 'village_workshop'], ['b_kitchen', 'village_kitchen']]) {
  const o = I.objects.find(q => q.k === k), m = S[k], right = (o.x - m.ax + m.w) / 16, pl = I.places.find(q => q.id === id);
  ok(65 - right >= 3, k + ' berjarak >= 3 petak dari jalan utama: ' + (65 - right).toFixed(2));
  ok(o.x === 952 && pl.x === 59 && Math.floor(o.x / 16) === pl.x, k + ' sejajar di tile 59 dan cocok dengan data tempat');
}
const IN = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/interior.json'), 'utf8'));
ok(IN.buildingDoors.find(b => b.id === 'bengkel').exterior.x === 952 && IN.buildingDoors.find(b => b.id === 'dapur').exterior.x === 952, 'pintu interior bengkel/dapur mengikuti posisi baru');
ok(/id:'bengkel',tpl:'workshop',x:952/.test(INT) && /id:'dapur',tpl:'kitchen',x:952/.test(INT), 'INT_B bengkel/dapur diperbarui');
ok([57, 58, 59, 60, 61].every(x => I.grid[46][x] !== 'X' && !col[46 * W + x]) && I.grid[46][59] === ',', 'jalan di depan pintu bengkel bebas dan berjalan');
const ms = I.objects.find(o => o.placeSign === 'mushroom_wood'); ok(ms && ms.k === 'sign' && ms.signName === 'Hutan Jamur', 'plat Hutan Jamur ada');
ok(I.places.find(p => p.id === 'mushroom_wood').noLabel === true && /p\.noLabel/.test(TM), 'label melayang ganda Hutan Jamur dimatikan');
console.log(`PASS: perbaikan 9A-9D (${n} pemeriksaan)`);
