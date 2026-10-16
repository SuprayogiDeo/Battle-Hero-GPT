#!/usr/bin/env node
'use strict';
/* Tes kotak nama ruangan interior (Batch 9B-15): semua ruangan INT_B x ID/EN, dengan measureText tiruan
   (lebar = jumlah karakter * ukuran * 0.6). Lebar kotak harus 150..260 dan teks harus muat. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports; const ev = c => vm.runInContext(c, context, { timeout: 5000 });
const rooms = ev('INT_B.map(b=>({id:b.id,n:b.n}))');
const mw = (t, f) => String(t).length * f * 0.6;
const box = (n0, n1, cur) => ev('intNameBox(' + JSON.stringify(n0) + ',' + JSON.stringify(n1) + ',' + JSON.stringify(cur) + ',(t,f)=>String(t).length*f*0.6)');
let n = 0, maxW = 0, cases = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
assert.ok(rooms.length > 0, 'INT_B kosong');
rooms.forEach(r => ['id', 'en'].forEach((lang, li) => {
  const b = box(r.n[0], r.n[1], r.n[li]); cases++; maxW = Math.max(maxW, b.w);
  ok(b.w >= 150 && b.w <= 260, r.id + '/' + lang + ': lebar kotak ' + b.w + ' di luar 150..260');
  ok(b.fs >= 8 && b.fs <= 10, r.id + '/' + lang + ': font ' + b.fs + ' di luar 8..10');
  ok(mw(b.text, b.fs) + 12 <= b.w + 1e-9, r.id + '/' + lang + ': teks "' + b.text + '" tidak muat (' + mw(b.text, b.fs) + '+12 > ' + b.w + ')');
}));
// lebar sama untuk kedua bahasa (tidak melompat saat ganti bahasa)
rooms.forEach(r => ok(box(r.n[0], r.n[1], r.n[0]).w === box(r.n[0], r.n[1], r.n[1]).w, r.id + ': lebar berbeda antar bahasa'));
// kasus batas: nama sangat panjang mengecil ke 8 px lalu dipotong dengan "…"
const long = 'X'.repeat(60), lb = box(long, 'Y', long);
ok(lb.fs === 8 && lb.w === 260 && /\u2026$/.test(lb.text) && mw(lb.text, 8) + 12 <= 260, 'nama panjang tidak dipotong benar');
const sh = box('Toko', 'Shop', 'Toko'); ok(sh.w === 150 && sh.fs === 10 && sh.text === 'Toko', 'nama pendek harus 150 px, 10 px, tanpa potong');
console.log('PASS: kotak nama interior — ' + rooms.length + ' ruangan x 2 bahasa = ' + cases + ' kasus, lebar terbesar ' + maxW + ' px (' + n + ' pemeriksaan)');
