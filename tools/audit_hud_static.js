#!/usr/bin/env node
'use strict';
/* AUDIT SEKALI PAKAI (TIDAK didaftarkan di run_tests.js): geometri HUD, ukuran tap, teks kecil, kontras WCAG, teks terpanjang.
   Pola harness sama dengan tools/test_interior_hud.js. Hanya membaca; tidak mengubah berkas apa pun.
   Pakai: node tools/audit_hud_static.js [--json]. Keluar dengan kode 0 (laporan, bukan tes). */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports; const ev = c => vm.runInContext(c, context, { timeout: 5000 });
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const ZS = [0, 1, 2], ZV = { 0: .9, 1: 1, 2: 1.1 };
const PROF = { landscape: { w: 640, h: 360 }, portrait: { w: 390, h: 390 * 360 / 640 } }; // s = tinggi/360
const sOf = p => PROF[p].h / 360;
const setProfile = p => ev('cv.getBoundingClientRect=()=>({left:0,top:0,width:' + PROF[p].w + ',height:' + PROF[p].h + '})');
const F = []; const add = (area, msg) => F.push({ area, msg });
const f1 = x => (Math.round(x * 10) / 10);

/* ---------- (a) persegi panjang HUD & irisan ---------- */
const inter = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const circ = (c, r) => { const cx = Math.max(r.x, Math.min(c.cx, r.x + r.w)), cy = Math.max(r.y, Math.min(c.cy, r.y + r.h)); return (cx - c.cx) ** 2 + (cy - c.cy) ** 2 < c.r * c.r; };
const bbox = e => e.c ? { x: e.c.cx - e.c.r, y: e.c.cy - e.c.r, w: 2 * e.c.r, h: 2 * e.c.r } : e;
const touch = (a, b) => (a.c && b.c) ? Math.hypot(a.c.cx - b.c.cx, a.c.cy - b.c.cy) < a.c.r + b.c.r : a.c ? circ(a.c, b) : b.c ? circ(b.c, a) : inter(a, b);
const out = [];
function rects(z, prof) {
  ev('S.set.ui=' + z); setProfile(prof);
  const zz = ZV[z], L = ev('hudLayout()'), fr = ev('jrFocusRect()'), frm = ev('(()=>{const r=jrFocusRect();S.journal.fmin=1;const m=jrFocusRect();S.journal.fmin=0;return m})()');
  const hbW = 7 * L.step + L.slot, R = [];
  const el = (n, ctx, x, y, w, h, extra) => R.push(Object.assign({ n, ctx, x, y, w, h }, extra || {}));
  el('minimap+frame', 'W', 1, 1, 100 * zz + 6, 76 * zz + 6);
  el('FOKUS(penuh)', 'W', fr.x, fr.y, fr.w, fr.h);
  el('FOKUS(mini)', 'W', frm.x, frm.y, frm.w, frm.h, { alt: 'FOKUS(penuh)' });
  el('hotbar', 'WI', L.left, L.y, hbW, L.slot);
  el('hotbar-nama/titik', 'WI', 280, L.y - 17, 80, 14);
  R.push({ n: 'tombol-aksi', ctx: 'WI', c: { cx: 592, cy: 298, r: 30 * zz }, x: 592 - 30 * zz, y: 298 - 30 * zz, w: 60 * zz, h: 60 * zz });
  R.push({ n: 'tombol-aksi(hit)', ctx: 'WI', hit: 1, c: { cx: 592, cy: 298, r: Math.max(30 * zz, L.hit / 2) }, x: 0, y: 0, w: 0, h: 0 });
  el('hotbar(hit)', 'WI', L.left + L.slot / 2 - L.hit / 2, 333 - L.hit / 2, hbW - L.slot + L.hit, L.hit, { hit: 1 });
  el('toast-biasa(maks 420)', 'W', 100, 268, 420, 24, { grp: 'toast' });
  el('banner-discovery', 'W', 122, 44, 396, 24, { grp: 'toast' });
  el('toast-interior(maks)', 'I', 10, 44, 620, 24);
  const nb = ev('intNameBox("Pondok Penebang","Woodcutter\'s Hut","Pondok Penebang",(t,f)=>t.length*f*.6)');
  el('kotak-nama-interior', 'I', 6, 6, nb.w, 22);
  R.forEach(e => { if (e.c && e.x === 0 && e.w === 0) { e.x = e.c.cx - e.c.r; e.y = e.c.cy - e.c.r; e.w = e.h = 2 * e.c.r; } });
  for (let i = 0; i < R.length; i++) {
    const a = R[i];
    if (a.x < 0 || a.y < 0 || a.x + a.w > 640 || a.y + a.h > 360) out.push({ z: zz, prof, kind: 'LUAR-KANVAS', n: a.n, d: `x ${f1(a.x)}..${f1(a.x + a.w)} y ${f1(a.y)}..${f1(a.y + a.h)}${a.hit ? ' (area ketuk)' : ''}` });
    for (let j = i + 1; j < R.length; j++) {
      const b = R[j];
      if (!a.ctx.split('').some(c => b.ctx.includes(c))) continue;
      if (a.grp && a.grp === b.grp) continue; if (a.alt === b.n || b.alt === a.n) continue;
      if (!!a.hit !== !!b.hit) continue; // visual vs visual, hit vs hit
      if (touch(a, b)) out.push({ z: zz, prof, kind: a.hit ? 'IRISAN-AREA-KETUK' : 'IRISAN-VISUAL', n: a.n + ' x ' + b.n, d: `${a.n}[${f1(a.x)},${f1(a.y)},${f1(a.w)}x${f1(a.h)}] ${b.n}[${f1(b.x)},${f1(b.y)},${f1(b.w)}x${f1(b.h)}]` });
    }
  }
  return { L, R };
}
for (const prof of Object.keys(PROF)) for (const z of ZS) rects(z, prof);
console.log('== (a) Irisan & luar-kanvas ==');
if (!out.length) console.log('  (tidak ada)'); out.forEach(o => console.log(`  z=${o.z} ${o.prof.padEnd(9)} ${o.kind} ${o.n}\n      ${o.d}`));
// batas minimap wajib
ZS.forEach(z => { const zz = ZV[z]; if (!(4 + 100 * zz <= 640 && 4 + 76 * zz <= 360)) add('geom', 'minimap keluar kanvas z=' + zz); });

/* ---------- (b) ukuran tap ---------- */
console.log('\n== (b) Ukuran tap (px layar); * = < 44 ==');
const hv = { min: 99999 };
const taps = [];
for (const prof of Object.keys(PROF)) { const s = sOf(prof); for (const z of ZS) { const zz = ZV[z]; ev('S.set.ui=' + z); setProfile(prof); const L = ev('hudLayout()'), fr = ev('jrFocusRect()');
  taps.push([prof, zz, 'hud: slot hotbar', L.hit, L.hit], [prof, zz, 'hud: tombol aksi', 2 * Math.max(30 * zz, L.hit / 2), 2 * Math.max(30 * zz, L.hit / 2)],
    [prof, zz, 'hud: minimap -> peta', 100 * zz, 76 * zz], [prof, zz, 'hud: FOKUS (penuh)', fr.w, Math.max(fr.h + 8, Math.min(56, L.hit))]);
  ev('S.journal.fmin=1'); const fm = ev('jrFocusRect()'); ev('S.journal.fmin=0'); taps.push([prof, zz, 'hud: FOKUS (mini)', fm.w, Math.max(fm.h + 8, Math.min(56, L.hit))]); } }
for (const prof of Object.keys(PROF)) { const zz = 1; setProfile(prof); const tu = ev('hudTouchUnit()'), wl = Math.max(294, 313.5 - tu / 2), dh = ev('wgdLayout().h');
  // v72: area ketuk TUTUP = x>=530, y<max(42,24.5+tu/2); HAPUS PENANDA = y dari max(294,313.5-tu/2) setinggi max(tu,34) (dipotong 360); tombol dialog = wgdLayout().h
  taps.push([prof, zz, 'adv: TUTUP peta (area ketuk)', 90, Math.max(42, 24.5 + tu / 2)], [prof, zz, 'adv: TUTUP (kotak tampak 78x25, tidak diubah)', 78, 25],
    [prof, zz, 'adv: HAPUS PENANDA (area ketuk)', 204, Math.min(360, wl + Math.max(tu, 34)) - wl], [prof, zz, 'adv: baris wilayah (198x43; pitch tetap, DITUNDA)', 198, 43],
    [prof, zz, 'adv: petak peta (375/128 per petak; pilih terdekat; DITUNDA)', 375 / 128, 375 / 128],
    [prof, zz, 'dialog gerbang: tombol (wgdLayout)', 260, dh],
    [prof, zz, 'tutorial: LEWATI (64x44; DITUNDA)', 64, 44], [prof, zz, 'tutorial: aksi (88x44; DITUNDA)', 88, 44]);
}
const tapBad = [];
taps.forEach(t => { const s = sOf(t[0]), w = t[3] * s, h = t[4] * s, bad = Math.min(w, h) < 43.5; if (bad) tapBad.push(t); console.log(`  ${bad ? '*' : ' '} ${t[0].padEnd(9)} z=${t[1]} ${t[2].padEnd(58)} ${f1(w)}x${f1(h)} px`); });
const interSrc = rd('js/interior.js');
console.log('  catatan: interior.js hanya memakai tombol aksi/hotbar HUD (tidak ada rect ketuk sendiri): ' + !/worldDown|intDown/.test(interSrc.replace(/\/\*[\s\S]*?\*\//g, '')));

/* ---------- (c) teks kecil <= 9 px logis ---------- */
console.log('\n== (c) T()/g.font ukuran logis <= 9 ==');
function splitArgs(s, i) { // s[i] = '(' ; kembalikan {args, end}
  let d = 0, q = null, cur = '', a = [];
  for (let k = i; k < s.length; k++) { const c = s[k];
    if (q) { cur += c; if (c === '\\') { cur += s[++k]; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; cur += c; continue; }
    if (c === '(' || c === '[' || c === '{') { d++; if (d > 1) cur += c; continue; }
    if (c === ')' || c === ']' || c === '}') { d--; if (d === 0) { a.push(cur); return { a, end: k }; } cur += c; continue; }
    if (c === ',' && d === 1) { a.push(cur); cur = ''; continue; } cur += c; }
  return { a, end: s.length };
}
const FILES = ['js/hud.js', 'js/world.js', 'js/interior.js', 'js/adventure.js', 'js/tilemap.js', 'js/journal.js', 'js/life.js', 'js/npc.js'];
const small = [];
FILES.forEach(f => { const s = rd(f);
  const ln = i => s.slice(0, i).split('\n').length;
  const re = /(^|[^\w$.])T\(/g; let m;
  while ((m = re.exec(s))) { const o = m.index + m[1].length + 1, r = splitArgs(s, o), a = r.a; if (a.length < 5) continue; const sz = a[4].trim(); if (/^\d+(\.\d+)?$/.test(sz) && +sz <= 9) small.push({ f, line: ln(m.index), sz: +sz, txt: a[0].trim().slice(0, 54), dyn: 0 }); else if (!/^\d/.test(sz) && sz.length < 40 && /fs|z\b|size/.test(sz)) small.push({ f, line: ln(m.index), sz: sz, txt: a[0].trim().slice(0, 54), dyn: 1 }); }
  const rf = /font\s*=\s*'bold '\s*\+\s*([A-Za-z_.()0-9 ]+?)\s*\+\s*'px|font\s*=\s*['"](?:bold )?(\d+(?:\.\d+)?)px/g;
  while ((m = rf.exec(s))) { const n = m[2] ? +m[2] : null; if (n !== null && n <= 9) small.push({ f, line: ln(m.index), sz: n, txt: '(g.font)', dyn: 0 }); else if (n === null) small.push({ f, line: ln(m.index), sz: m[1].trim(), txt: '(g.font adaptif)', dyn: 1 }); }
});
const deco = t => /^['"][▾▸▴▪•·]/.test(t) || t === '(g.font)';
small.forEach(o => { if (o.dyn) { console.log(`  ~ ${o.f}:${o.line} ukuran dinamis "${o.sz}" ${o.txt}`); return; }
  const l = f1(o.sz * sOf('landscape')), p = f1(o.sz * sOf('portrait'));
  console.log(`  ${(o.sz * sOf('portrait') < 6.5 ? '*' : ' ')} ${o.f}:${o.line} ${o.sz}px logis -> ${l} px (landscape) / ${p} px (portrait) | ${deco(o.txt) ? 'dekoratif?' : 'informatif'} | ${o.txt}`); });
// ukuran minimum yang bisa dicapai papan dinding (wallSign mengecil sampai 7 logis)
const idx = JSON.parse(rd('assets/world/index.json')), WALL = { workshop: 'b_workshop', kitchen: 'b_kitchen', village_hall: 'b_hall', woodcutter_hut: 'b_woodcutter', fisher_hut: 'b_fisher' };
const wallRes = [];
for (const lf of [11, 13]) idx.places.filter(p => WALL[p.type]).forEach(p => [['ID', p.name], ['EN', p.name_en]].forEach(([lg, nm]) => { const r = idx.spr[WALL[p.type]], lim = r.w * 2 - 6; let fs = lf; for (;;) { const w = Math.ceil(nm.length * fs * .6) + 8; if (w <= lim || fs <= 7) break; fs--; } wallRes.push({ lf, lg, nm, lim, fs }); }));
console.log('  papan dinding (tiruan 0.6em; LF=11 landscape, LF=13 portrait): ukuran akhir fs logis -> layar');
wallRes.forEach(w => { const sc = w.lf === 13 ? sOf('portrait') : 1; if (w.fs < w.lf) console.log(`    LF=${w.lf} ${w.lg} "${w.nm}" lebar-maks ${w.lim}: fs ${w.lf}->${w.fs} = ${f1(w.fs * sc)} px layar`); });
const wallMinScreenP = Math.min(...wallRes.filter(w => w.lf === 13).map(w => w.fs * sOf('portrait')));

/* ---------- (d) kontras WCAG ---------- */
console.log('\n== (d) Kontras WCAG (ambang 4.5:1 untuk teks kecil) ==');
const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const lin = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
const Lm = rgb => .2126 * lin(rgb[0]) + .7152 * lin(rgb[1]) + .0722 * lin(rgb[2]);
const cr = (a, b) => { const x = Lm(a), y = Lm(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const pairs = [
  ['papan dinding teks #2a1c12 / #d9b982', hex('#2a1c12'), hex('#d9b982'), 1],
  ['label melayang #fff0b0 di outline (3px) #101811', hex('#fff0b0'), hex('#101811'), 1],
  ['kotak nama interior #fee888 / rgba(8,6,16,.78) atas putih', hex('#ffee88'), over([8, 6, 16], .78, [255, 255, 255]), 1],
  ['kotak nama interior #fee888 / rgba(8,6,16,.78) atas terang(#d9b982)', hex('#ffee88'), over([8, 6, 16], .78, hex('#d9b982')), 1],
  ['FOKUS judul #fc4 / rgba(8,16,24,.86) atas putih', hex('#ffcc44'), over([8, 16, 24], .86, [255, 255, 255]), 1],
  ['FOKUS detail #cde / rgba(8,16,24,.86) atas putih', hex('#ccddee'), over([8, 16, 24], .86, [255, 255, 255]), 1],
  ['tombol aksi label aktif #fe8 / rgba(30,24,50,.88) atas putih', hex('#ffee88'), over([30, 24, 50], .88, [255, 255, 255]), 1],
  ['tombol aksi label nonaktif #99a / rgba(30,24,50,.88) atas putih', hex('#9999aa'), over([30, 24, 50], .88, [255, 255, 255]), 1],
  ['tombol aksi label nonaktif #99a / rgba(30,24,50,.88) atas hitam', hex('#9999aa'), over([30, 24, 50], .88, [0, 0, 0]), 1],
  ['btn() putih / #2a7a4a (aktif)', [255, 255, 255], hex('#2a7a4a'), 1], ['btn() putih / #4aa56c (sorot aktif)', [255, 255, 255], hex('#4aa56c'), 1],
  ['btn() putih / #4a4a55 (nonaktif)', [255, 255, 255], hex('#4a4a55'), 1], ['btn() putih / #6a6a7a (sorot nonaktif)', [255, 255, 255], hex('#6a6a7a'), 1],
  ['kartu peta #aab8b1 (8px) / #2b2545', hex('#aab8b1'), hex('#2b2545'), 1], ['kartu peta #8ca39a (7px) / #2b2545', hex('#8ca39a'), hex('#2b2545'), 1],
  ['kartu peta #9f9 (7px) / #2b2545', hex('#99ff99'), hex('#2b2545'), 1], ['kartu peta #afc7b4 (8px) / #2b2545 (card() selalu mengisi #2b2545)', hex('#afc7b4'), hex('#2b2545'), 1],
  ['ket. peta #cde (8px) / #263a35', hex('#ccddee'), hex('#263a35'), 1],
  ['toast biasa #cde / rgba(0,0,0,.78) atas putih', hex('#ccddee'), over([0, 0, 0], .78, [255, 255, 255]), 1], ['toast discovery #fe8 / rgba(0,0,0,.78) atas putih', hex('#ffee88'), over([0, 0, 0], .78, [255, 255, 255]), 1],
  ['banner jalur #ffd39b / rgba(14,23,38,.78) atas putih', hex('#ffd39b'), over([14, 23, 38], .78, [255, 255, 255]), 1],
  ['papan atap malam (dim .35) rgb(160,135,58) / #2a1c12 bayangan', [160, 135, 58], hex('#2a1c12'), 1],
];
const cBad = [];
pairs.forEach(p => { const r = cr(p[1], p[2]); const bad = r < 4.5; if (bad) cBad.push([p[0], r]); console.log(`  ${bad ? '*' : ' '} ${r.toFixed(2).padStart(5)}:1  ${p[0]}`); });

/* ---------- (e) teks terpanjang pada wadah tetap ---------- */
console.log('\n== (e) Teks terpanjang vs wadah (lebar tiruan = jumlah karakter x ukuran x 0.6) ==');
const eRows = [], mw = (t, s) => t.length * s * .6;
const chk = (name, txt, size, avail) => { const w = mw(txt, size), bad = w > avail; eRows.push({ name, txt, size, w, avail, bad }); console.log(`  ${bad ? '*' : ' '} ${name.padEnd(34)} ${String(f1(w)).padStart(6)} / ${String(f1(avail)).padStart(5)}  "${txt}"`); };
const labels = { act: ['TARIK!', 'TUNGGU', 'MASUK', 'AMBIL', 'LEMPAR', 'TEBANG', 'GALI', 'PETIK', 'ISI AIR', 'BICARA', 'KANDANG', 'MISI', 'PAKAN', 'GUNAKAN', 'PALUNG', 'MISI', 'GERBANG', 'KELUAR', 'BELI', 'REEL!', 'TROUGH', 'QUEST', 'CAST', 'CHOP', 'FEED', 'ENTER', 'TALK', 'FILL', 'USE', 'PICK UP', 'WAIT'] };
ZS.forEach(z => { const zz = ZV[z]; labels.act.forEach(l => { if (mw(l, 9) > 2 * 30 * zz - 4) chk(`label tombol aksi r=${f1(30 * zz)} (z=${zz})`, l, 9, 2 * 30 * zz - 4); }); });
// panel FOKUS: judul <= 22 + detail <= 38 karakter (slice di kode)
ZS.forEach(z => { const fr = (ev('S.set.ui=' + z), ev('jrFocusRect()')); chk(`FOKUS judul (22 krc+"FOKUS: ") z=${ZV[z]}`, 'FOKUS: ' + 'x'.repeat(22), 10, fr.w - 8 - 14); chk(`FOKUS detail (38 krc) z=${ZV[z]}`, 'x'.repeat(38), 9, fr.w - 16); });
// wadah tombol btn(): kode mengecil sampai 7px; periksa teks pada 7 px
const BTN = [['TUTUP/CLOSE', 78], ['HAPUS PENANDA', 202], ['CLEAR WAYPOINT', 202], ['MAIN STAGE', 260], ['MENARA HARIAN', 260], ['DUNGEON', 260]];
BTN.forEach(([t, w]) => { const w10 = mw(t, 10); chk('btn() ' + t, t, w10 > w - 8 ? Math.max(7, Math.floor(10 * (w - 8) / w10)) : 10, w - 8); });
// plat peta: nama wilayah di kartu REGIONS (lebar kartu 202, teks mulai +33, 8px)
(idx.regions || []).forEach(r => { [r.name, r.name_en].filter(Boolean).forEach(n => chk('kartu wilayah ' + (n === r.name ? 'ID' : 'EN'), n, 8, 202 - 33 - 6)); });
// banner discovery & toast 'discovery' (kode mengukur lebar nyata hanya di interior; dunia tetap 396/336)
['Kamu menemukan: Hutan Jamur Tersembunyi di timur desa', 'You discovered: Hidden Mushroom Grove east of the village'].forEach(t => { chk('banner discovery 11px', t, 11, 396 - 8); });
['Pilih Pancing di hotbar dulu (terbuka di stage 6).', 'Pick the fishing rod on the hotbar first (unlocks at stage 6).', 'Ember terisi penuh, cukup untuk enam kali siram.'].forEach(t => chk('toast biasa 10px', t, 10, Math.min(420, Math.max(336, t.length * 6 + 28)) - 8));
// kotak nama interior (maks 260, fs turun hingga 8)
const nbs = []; (ev('INT_B.map(b=>b.n)') || []).forEach(n => { const o = ev('intNameBox(' + JSON.stringify(n[0]) + ',' + JSON.stringify(n[1]) + ',' + JSON.stringify(n[0]) + ',(t,f)=>t.length*f*.6)'); chk('kotak nama interior ' + n[0], n[0], o.fs, o.w - 12); });
const eBad = eRows.filter(r => r.bad);

console.log('\n== RINGKAS ==');
console.log('  irisan/luar:', out.length, '| tap<44:', tapBad.length, '| kontras<4.5:', cBad.length, '| teks melebihi wadah:', eBad.length, '| papan dinding portrait min', f1(wallMinScreenP), 'px layar');
if (process.argv.includes('--json')) console.log(JSON.stringify({ out, tapBad, cBad, eBad, small, wallRes }, null, 1));
