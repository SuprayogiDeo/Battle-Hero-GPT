#!/usr/bin/env node
'use strict';
/* Tahap 9A: gapura dihapus, tak ada penumpukan bangunan, jembatan kayu, minimap terbuka, panel FOKUS bisa diminimalkan, tanpa popup memancing. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..'); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const I = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/index.json'), 'utf8'));
const BT = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/bridge_tiles.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(root, 'tools/world_design.json'), 'utf8'));
// 1) tanpa gapura
ok(D.biomeGates.length === 0 && !I.objects.some(o => o.k === 'gate_arch'), 'tidak ada gapura');
// 2) tidak ada penumpukan: badan (60% bawah) bangunan/kios >= 30 px lebar tidak boleh bertumpuk > 4 px
const S = I.spr, big = I.objects.filter(o => o.k && S[o.k] && (/^(b_|stall|house|tower|windmill|shop)/.test(o.k) || S[o.k].w >= 30));
const box = o => { const s = S[o.k]; return [o.x - s.w / 2, o.y - s.h * .6, o.x + s.w / 2, o.y]; };
for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) { const A = box(big[i]), B = box(big[j]); ok(!(Math.min(A[2], B[2]) - Math.max(A[0], B[0]) > 4 && Math.min(A[3], B[3]) - Math.max(A[1], B[1]) > 4), 'penumpukan: ' + big[i].k + '@' + (big[i].x >> 4) + ',' + (big[i].y >> 4) + ' dengan ' + big[j].k + '@' + (big[j].x >> 4) + ',' + (big[j].y >> 4)); }
// 3) jembatan kayu: tile ada di sheet, semua sel jembatan memakai tile jembatan, papan biome tidak di atas jembatan
const br = D.bridges[0], ids = new Set(Object.values(BT.ids)); ok(br.style === 'plank', 'jembatan bergaya plank');
const ch = {}; for (const f of fs.readdirSync(path.join(root, 'assets/world/chunks'))) { const c = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/chunks', f), 'utf8')); ch[c.x + ',' + c.y] = c; }
const tileAt = (L, x, y) => { for (const k in ch) { const c = ch[k]; if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) return c.layers[L][(y - c.y) * c.w + (x - c.x)]; } return 0; };
const [[x0, yc], [x1]] = br.points, top = yc - 1;
for (let x = x0; x <= x1; x++) for (let y = top; y <= top + 2; y++) ok(ids.has(tileAt('ground', x, y)), 'sel jembatan ' + x + ',' + y + ' bukan tile kayu');
ok(Object.values(BT.ids).some(i => tileAt('decor', x0, top - 1) === i || tileAt('decor', x0 + 2, top - 1) === i), 'tiang jembatan ada di layer decor');
ok(Math.max(...ids) < 32 * 5, 'id tile jembatan dalam sheet 5 baris');
ok(!I.objects.some(o => o.biomeSign && (o.x >> 4) >= x0 && (o.x >> 4) <= x1 && ((o.y >> 4) - 1) >= top - 1 && ((o.y >> 4) - 1) <= top + 3), 'papan biome tidak menutupi jembatan');
// 4) minimap terbuka penuh; tanpa popup memancing/E-KETUK saat dekat air
const tm = fs.readFileSync(path.join(root, 'js/tilemap.js'), 'utf8'); ok(/seen=true;/.test(tm) && !/seen=discKey/.test(tm), 'minimap langsung terbuka penuh');
for (const f of fs.readdirSync(path.join(root, 'js'))) { if (f === 'i18n.js') continue; const s = fs.readFileSync(path.join(root, 'js', f), 'utf8'); ok(!/'E \/ KETUK|MEMANCING|GIGITAN!/.test(s), 'popup memancing/E-KETUK tersisa di ' + f); }
// 5) panel FOKUS: di bawah minimap, ketuk meminimalkan, status tersimpan di S.journal.fmin
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} }; new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 5000 });
ev("sfx=function(){};st='world';wI=null;wFade=null;wDlg=0;wTalk=null;S.journal={};S.set=S.set||{};S.set.ui=1;jrEnsure()");
const r0 = ev('jrFocusRect()'); ok(r0.x === 4 && r0.y >= 4 + 76 + 6 && !r0.mn, 'panel FOKUS di bawah minimap, terbuka');
ev('hudDown(1,' + (r0.x + 10) + ',' + (r0.y + 5) + ')'); ok(ev('S.journal.fmin') === 1 && ev('jrFocusRect().mn') === 1 && ev('jrFocusRect().w') < r0.w, 'ketuk meminimalkan panel');
ev('hudDown(1,' + (r0.x + 10) + ',' + (r0.y + 5) + ')'); ok(!ev('S.journal.fmin') && !ev('jrFocusRect().mn'), 'ketuk lagi membuka panel');
ev('S.set.ui=2'); ok(ev('jrFocusRect().y') > r0.y, 'panel mengikuti skala UI minimap');
console.log('PASS: Tahap 9A (' + n + ' pemeriksaan)');
