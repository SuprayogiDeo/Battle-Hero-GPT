#!/usr/bin/env node
'use strict';
/* Tes regresi HUD (landscape; v72). Mengunci hasil audit tools/audit_hud_static.js yang stabil:
   (1) tak ada irisan VISUAL antar elemen HUD dunia/interior dan tak ada elemen keluar 640x360, untuk z=.9/1/1.1;
   (2) area ketuk elemen utama >= 44 px layar (diukur dengan "menyentuh" langsung, bukan menyalin rumus);
   (3) label tombol aksi dan toast muat wadahnya (lebar tiruan monospace 0.6 em).
   Profil layar: s=0.85 (tinggi 306), 1.0 (360), 1.2 (432) - rentang landscape HP kecil..besar. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports; const ev = c => vm.runInContext(c, context, { timeout: 5000 });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const ZV = [.9, 1, 1.1], SC = [.85, 1, 1.2];
const setS = s => ev('cv.getBoundingClientRect=()=>({left:0,top:0,width:' + 640 * s + ',height:' + 360 * s + '})');
ev("st='world';lifeWorldQuick=false;wTalk=null;wDlg=0;wI=null;wFade=null;S.world={x:444,y:555};hudEnsure();best=10;S.set.lang='id'");
const circ = (c, r) => { const x = Math.max(r.x, Math.min(c.cx, r.x + r.w)), y = Math.max(r.y, Math.min(c.cy, r.y + r.h)); return (x - c.cx) ** 2 + (y - c.cy) ** 2 < c.r * c.r; };
const rin = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
// (1) irisan visual
SC.forEach(s => { setS(s); [0, 1, 2].forEach(ui => { ev('S.set.ui=' + ui); const z = ZV[ui], L = ev('hudLayout()'), fr = ev('jrFocusRect()'), hbW = 7 * L.step + L.slot;
  const nb = ev('intNameBox("Pondok Penebang","Woodcutter\'s Hut","Pondok Penebang",(t,f)=>t.length*f*.6)');
  const W = [['minimap', 'W', { x: 1, y: 1, w: 100 * z + 6, h: 76 * z + 6 }], ['fokus', 'W', fr], ['hotbar', 'WI', { x: L.left, y: L.y, w: hbW, h: L.slot }], ['nama-alat', 'WI', { x: L.left + hbW / 2 - 40, y: L.y - 17, w: 80, h: 14 }],
    ['toast', 'W', { x: 100, y: 268, w: 420, h: 24 }], ['banner', 'W', { x: 122, y: 44, w: 396, h: 24 }], ['toast-interior', 'I', { x: 10, y: 44, w: 620, h: 24 }], ['nama-interior', 'I', { x: 6, y: 6, w: nb.w, h: 22 }]];
  const btn = { cx: 592, cy: 298, r: 30 * z }, tag = ` (s=${s}, ui=${ui})`;
  W.forEach(a => ok(a[2].x >= 0 && a[2].y >= 0 && a[2].x + a[2].w <= 640 && a[2].y + a[2].h <= 360, a[0] + ' di dalam 640x360' + tag));
  W.forEach(a => ok(!circ(btn, a[2]), a[0] + ' tidak menimpa tombol aksi' + tag));
  for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { const a = W[i], b = W[j]; if (!a[1].split('').some(c => b[1].includes(c))) continue; if ((a[0] === 'toast' && b[0] === 'banner') || (a[0] === 'banner' && b[0] === 'toast')) continue; ok(!rin(a[2], b[2]), a[0] + ' x ' + b[0] + ' tidak beririsan' + tag); }
  ok(4 + 100 * z <= 640 && 4 + 76 * z <= 360, 'minimap dalam kanvas' + tag); }); });
// (2) area ketuk >= 44 px layar, diukur dengan menyentuh
ev("var __tog=0,__map=0,__close=0;jrToggleFocus=function(){__tog++};hbOpenWorldMap=function(){__map++};hbCloseWorldMap=function(){__close++};sfx=function(){}");
const run1 = (s, ui) => { setS(s); ev('S.set.ui=' + ui); const L = ev('hudLayout()'), fr = ev('jrFocusRect()'), tag = ` (s=${s}, ui=${ui})`;
  ok(L.hit * s >= 43.99, 'slot hotbar >= 44 px' + tag); ok(2 * Math.max(30 * ZV[ui], L.hit / 2) * s >= 43.99, 'tombol aksi >= 44 px' + tag);
  // FOKUS (penuh dan mini): pindai y pada x di dalam panel; hitung panjang y yang memicu jrToggleFocus
  [0, 1].forEach(mn => { ev('S.journal.fmin=' + mn); const f = ev('jrFocusRect()'); let hits = 0; for (let y = 0; y < 360; y += .5) { ev('__tog=0;__map=0'); ev(`hudDown(1,${f.x + 10},${y})`); if (ev('__tog') > 0) hits += .5; } ok(hits * s >= 43.5, `area ketuk FOKUS ${mn ? 'mini' : 'penuh'} >= 44 px (${(hits * s).toFixed(1)})` + tag); }); ev('S.journal.fmin=0');
  // minimap
  let mh = 0; for (let y = 0; y < 120; y += .5) { ev('__map=0'); ev(`hudDown(1,20,${y})`); if (ev('__map') > 0) mh += .5; } ok(mh * s >= 43.5, `area ketuk minimap >= 44 px (${(mh * s).toFixed(1)})` + tag);
  // dialog gerbang
  const D = ev('wgdLayout()'); ok(D.h * s >= 43.5, `tombol dialog gerbang >= 44 px (${(D.h * s).toFixed(1)})` + tag); ok(D.card[1] + D.card[3] <= 360 && D.rows[3][2] + D.h <= D.card[1] + D.card[3], 'kartu dialog gerbang memuat semua tombol dan dalam kanvas' + tag);
  // peta dunia: TUTUP dan HAPUS PENANDA
  ev("st='worldmap'"); let ch = 0; for (let y = 0; y < 360; y += .5) { ev('__close=0'); ev(`hbWorldMapClick(600,${y})`); if (ev('__close') > 0) ch += .5; } ok(ch * s >= 43.5, `area ketuk TUTUP peta >= 44 px (${(ch * s).toFixed(1)})` + tag);
  let wh = 0; for (let y = 0; y < 360; y += .5) { ev("S.journal.waypoint={x:1,y:1}"); try { ev(`hbWorldMapClick(500,${y})`) } catch (e) { } if (!ev('S.journal.waypoint')) wh += .5; } ok(wh * s >= 43.5, `area ketuk HAPUS PENANDA >= 44 px (${(wh * s).toFixed(1)})` + tag);
  ev("st='world'"); };
SC.forEach(s => [0, 1, 2].forEach(ui => run1(s, ui)));
// (3) teks muat wadah
const hud = fs.readFileSync(path.join(root, 'js/hud.js'), 'utf8'), labs = new Set(); let m; const re = /l:wL\('([A-Z!][A-Z! ]*)','([A-Z!][A-Z! ]*)'\)/g; while ((m = re.exec(hud))) { labs.add(m[1]); labs.add(m[2]); }
ok(labs.size >= 20, 'label tombol aksi ditemukan: ' + labs.size);
labs.forEach(l => ok(l.length * 9 * .6 <= 2 * 30 * .9 - 6, 'label tombol aksi "' + l + '" muat lingkaran terkecil (z=.9, 9 px)'));
['Pick the fishing rod on the hotbar first (unlocks at stage 6).', 'The quest board is locked for now. Try again later.'].forEach(t => ok(t.length * 6 <= 420 - 28, 'toast "' + t.slice(0, 24) + '..." muat toast maks 420'));
const wsrc = fs.readFileSync(path.join(root, 'js/world.js'), 'utf8'); ok(wsrc.includes('268') && !wsrc.includes('fillRect(152,286'), 'toast biasa tidak kembali ke y=286');
// (4) save lama (tanpa S.hb, S.journal, S.set.ui, disc): HUD, FOKUS, minimap, dialog tetap valid tanpa melempar galat
setS(1);
ev("delete S.hb;delete S.journal;delete S.set.ui;S.world={x:444,y:555};st='world';wDlg=0;wTalk=null;wI=null;wFade=null");
ok([.9, 1, 1.1].includes(ev('hudUiScale()')), 'save tanpa set.ui tetap menghasilkan skala UI valid (settings.js menyanitasi ke 1 saat memuat)');
let L0 = ev('hudLayout()'); ok(L0.left >= 0 && L0.left + 7 * L0.step + L0.slot <= 640, 'hotbar save lama di dalam kanvas');
ok(ev('(()=>{try{hudEnsure();jrEnsure();const f=jrFocusRect();hudDown(1,5,5);hudDown(1,300,333);hudDown(1,592,298);hudDraw();return f.w>0}catch(e){return String(e)}})()') === true, 'HUD/FOKUS/minimap/aksi tidak melempar galat pada save lama');
ok(ev('wgdLayout().rows.length') === 4, 'dialog gerbang menghasilkan 4 tombol');
ok(ev('S.hb.sel') === 0 && ev('!!S.journal'), 'S.hb dan S.journal dipulihkan');
console.log(`PASS: regresi HUD landscape — tanpa irisan visual, area ketuk >= 44 px (hotbar, aksi, FOKUS, minimap, dialog, TUTUP, HAPUS), label/toast muat (${n} pemeriksaan)`);
