#!/usr/bin/env node
'use strict';
/* Tes zoom dunia opt-in (?zoom=0.5..0.99; default 1 = tampilan lama tidak berubah).
   Mengunci: (1) parsing parameter URL; (2) kamera & culling tile memakai ukuran virtual (kanvas/z) sehingga area terlihat lebih luas;
   (3) VW/OX/VH dan g.save/restore selalu dipulihkan, juga bila penggambaran melempar galat; (4) konversi sentuh/overlay
   layar<->dunia konsisten (farmWorldCoords, wScrX/wScrY); (5) interior tidak ikut di-zoom. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports; const ev = c => vm.runInContext(c, context, { timeout: 5000 });
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const near = (a, b, m) => ok(Math.abs(a - b) < 1e-6, `${m} (didapat ${a}, diharapkan ${b})`);

// (1) parsing ?zoom= — jalankan ulang baris yang sama persis dari assets.js
const parseLine = fs.readFileSync(path.join(root, 'js/assets.js'), 'utf8').split('\n').find(l => l.startsWith('try{const zm='));
ok(!!parseLine, 'baris parsing ?zoom= ada di assets.js');
ok(ev('WZOOM') === 1, 'default tanpa parameter: WZOOM = 1');
[['?zoom=0.8', .8], ['?perf=1&zoom=0.5', .5], ['?zoom=1', 1], ['?zoom=2', 1], ['?zoom=0.3', 1], ['?zoom=abc', 1], ['', 1]].forEach(([q, want]) => {
  ev('WZOOM=1;location.search=' + JSON.stringify(q)); ev(parseLine);
  ok(ev('WZOOM') === want, `?zoom parse "${q}" -> ${want}`);
});
ev("location.search='';WZOOM=1");

// penyiapan dunia (jalur tile lama; tanpa Tmap) + pemantau gambar
ev("st='world';wI=null;wVon=false;wTalk=null;wDlg=0;wFade=null;S.world={x:640,y:480};var __tiles=[];wTile=function(t,x,y,tx,ty){__tiles.push([tx,ty])};" +
   "var __sv=0,__rs=0,__sc=[];g.save=function(){__sv++};g.restore=function(){__rs++};g.scale=function(a,b){__sc.push([a,b])}");
const WW = ev('WW'), WH = ev('WH'), WS = ev('WS');
const run = (z) => {
  ev(`WZOOM=${z};VW=800;OX=80;EX=3;VH=360;wcx=null;wcy=0;S.world={x:640,y:480};__tiles=[];__sv=0;__rs=0;__sc=[]`);
  ev('updWorld(1/60)'); const cam = [ev('wcx'), ev('wcy')];
  ev('drawWorld()');
  return { cam, tiles: ev('__tiles'), sv: ev('__sv'), rs: ev('__rs'), sc: ev('__sc') };
};
const exp = (z) => { const vw = 800 / z, vh = 360 / z, cx = Math.max(0, Math.min(WW * WS - vw, 640 - vw / 2)), cy = Math.max(0, Math.min(WH * WS - vh, 480 - 14 - vh / 2));
  const rx = Math.round(cx), ry = Math.round(cy); return { cx, cy, x0: Math.max(0, Math.floor(rx / WS)), x1: Math.min(WW - 1, Math.floor((rx + vw) / WS)), y0: Math.max(0, Math.floor(ry / WS)), y1: Math.min(WH - 1, Math.floor((ry + vh) / WS)) }; };
const R = {};
[1, .8, .5].forEach(z => {
  const r = R[z] = run(z), e = exp(z), xs = r.tiles.map(t => t[0]), ys = r.tiles.map(t => t[1]);
  near(r.cam[0], e.cx, `kamera x (z=${z})`); near(r.cam[1], e.cy, `kamera y (z=${z})`);
  ok(Math.min(...xs) === e.x0 && Math.max(...xs) === e.x1, `rentang tile x (z=${z}): ${Math.min(...xs)}..${Math.max(...xs)} vs ${e.x0}..${e.x1}`);
  ok(Math.min(...ys) === e.y0 && Math.max(...ys) === e.y1, `rentang tile y (z=${z}): ${Math.min(...ys)}..${Math.max(...ys)} vs ${e.y0}..${e.y1}`);
  ok(ev('VW') === 800 && ev('OX') === 80 && ev('VH') === 360, `VW/OX/VH dipulihkan setelah drawWorld (z=${z})`);
  ok(r.sv === r.rs, `g.save/restore seimbang (z=${z}): ${r.sv}/${r.rs}`);
  const zs = r.sc.filter(s => s[0] === s[1] && s[0] < 1);
  // zoom dipakai untuk lapisan dunia dan untuk overlay drop item (life.js); keduanya harus memakai skala z yang sama
  ok(z === 1 ? zs.length === 0 : zs.length >= 1 && zs.every(s => s[0] === z), `skala kanvas zoom ${z === 1 ? 'tidak dipakai pada z=1' : 'dipakai dengan z yang benar'}`);
});
ok(R[.8].tiles.length > R[1].tiles.length && R[.5].tiles.length > R[.8].tiles.length, `tile terlihat bertambah saat zoom-out (${R[1].tiles.length} < ${R[.8].tiles.length} < ${R[.5].tiles.length})`);

// (3) galat saat menggambar tidak boleh meninggalkan VW/OX/VH atau transform dalam keadaan tertukar
ev("WZOOM=.8;VW=800;OX=80;VH=360;wcx=null;__sv=0;__rs=0;wTile=function(){throw new Error('boom')}");
assert.throws(() => ev('drawWorld()'), /boom/); n++;
ok(ev('VW') === 800 && ev('OX') === 80 && ev('VH') === 360, 'VW/OX/VH dipulihkan walau penggambaran melempar galat');
ok(ev('__sv') === ev('__rs'), 'g.save/restore seimbang walau penggambaran melempar galat');

// (4) konversi layar<->dunia: titik dunia (900,600), kamera (500,300), VW=800, OX=80
const conv = (z, sx, sy) => {
  ev(`WZOOM=${z};VW=800;OX=80;VH=360;wI=null;wcx=500;wcy=300`);
  const q = ev(`farmWorldCoords(${sx},${sy})`);
  near(q.x, 900, `farmWorldCoords x -> dunia (z=${z})`); near(q.y, 600, `farmWorldCoords y -> dunia (z=${z})`);
  near(ev('wScrX(900,500)'), sx, `wScrX (z=${z})`); near(ev('wScrY(600,300)'), sy, `wScrY (z=${z})`);
};
conv(1, 900 - 500 - 80, 600 - 300);
conv(.8, .8 * (900 - 500) - 80, .8 * (600 - 300));
conv(.5, .5 * (900 - 500) - 80, .5 * (600 - 300));

// (5) interior tidak di-zoom
ev("WZOOM=.8;VW=800;OX=80;VH=360;wI={};wcx=500;wcy=300");
ok(ev('wZoomActive()') === false && ev('wZoomOn()') === null, 'zoom nonaktif saat interior aktif');
near(ev('wScrX(900,500)'), 900 - 500 - 80, 'wScrX interior tanpa zoom');
ev("wI=null;WZOOM=1;VW=640;OX=0;VH=360");

console.log(`PASS: world zoom (?zoom=) parsing, camera/culling, restore-on-error, screen<->world conversion, interior bypass (${n} pemeriksaan).`);
