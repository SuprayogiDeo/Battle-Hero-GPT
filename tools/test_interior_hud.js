#!/usr/bin/env node
'use strict';
/* Tes logika Tahap 8A (tanpa browser nyata): pendaftaran bangunan, ruangan, alur masuk/keluar, hotbar, konteks aksi. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const head = src.slice(0, src.indexOf('assert.ok(vm.runInContext("typeof Save.readMain'));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports; const ev = c => vm.runInContext(c, context, { timeout: 5000 });
const I = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/index.json'), 'utf8'));
const IJ = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/interior.json'), 'utf8'));
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
// 1) setiap bangunan terdaftar cocok dengan objek b_* di index.json (kaki sprite) dan tiap pintu menghadap sel jalan
const bl = ev('INT_B.map(b=>({id:b.id,tpl:b.tpl,x:b.x,y:b.y}))');
const objs = I.objects.filter(o => (o.k || '').startsWith('b_') && o.k !== 'b_market');
ok(objs.length === bl.length, 'jumlah bangunan interior ' + objs.length + ' vs ' + bl.length);
ok(I.objects.some(o => o.k === 'b_market' && o.serviceType === 'market_cashier'), 'pasar fisik terdaftar sebagai layanan mandiri, bukan interior');
bl.forEach(b => { ok(objs.some(o => o.x === b.x && o.y === b.y), 'bangunan ' + b.id + ' tidak cocok dengan objek di index.json');
  const gx = (b.x >> 4), gy = (b.y >> 4), ch = I.grid[gy][gx]; ok(ch !== '~' && ch !== 'T' && ch !== 'X', 'sel pintu ' + b.id + ' tidak bisa dilalui: ' + ch); });
// 2) semua sprite yang dipakai ruangan ada di interior.json
ev('Object.values(INT_T)').forEach(t => { [...t.o, ...t.d, ...t.hg].forEach(a => ok(IJ.spr[a[0]], 'sprite hilang: ' + a[0])); t.fl.concat([t.wl, 'window', 'wall_side', 'wall_bot', 'door_gap']).forEach(k => ok(IJ.spr[k], 'ubin hilang: ' + k)); });
// 3) keterjangkauan: dari titik masuk, tiap objek interaktif punya sel depan bebas dan pintu keluar terjangkau
ev('INT_B').forEach(b => {
  const r = ev('intCompile(' + JSON.stringify(b) + ')'), sol = r.sol, w = r.w, h = r.h;
  const seen = new Set(), q = [[r.dx, h - 2]]; seen.add(r.dx + ',' + (h - 2)); ok(!sol[(h - 2) * w + r.dx], 'titik masuk tertutup ' + b.id);
  while (q.length) { const [x, y] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= w || ny >= h || sol[ny * w + nx] || seen.has(k)) return; seen.add(k); q.push([nx, ny]); }); }
  ok(seen.has(r.dx + ',' + (h - 1)), 'alkoof pintu tak terjangkau ' + b.id);
  r.objs.filter(o => o.act).forEach(o => { let hit = false; for (let x = o.x; x < o.x + o.fw; x++) if (seen.has(x + ',' + (o.y + o.fh))) hit = true; ok(hit, 'objek ' + o.s + ' di ' + b.id + ' tak terjangkau dari depan'); });
});
// 4) alur nyata: masuk toko lewat pintu, tombol aksi kasir -> layar shop, kembali -> tetap di interior, keluar -> titik pintu luar
ev("S.world={x:320*2,y:320*2+20};best=10;st='world';wI=null;wFade=null;hudEnsure()");
ok(ev('hudCtx()').l === 'MASUK', 'konteks pintu harus MASUK');
ev('wInteract()'); ok(ev('!!wFade'), 'fade masuk dimulai'); for (let i = 0; i < 40; i++) ev('updWorld(.016)');
ok(ev('!!wI&&wI.b.id')==='toko' || ev('wI.b.id') === 'toko', 'harus berada di interior toko');
const sx = ev('wI.room.sx'); ok(ev('S.world.x') === 640 && ev('S.world.y') === 660, 'S.world tetap di pintu luar (titik aman)');
ev("wI.x=wI.room.objs.find(o=>o.act=='cashier').x*WS+WS*1.5;wI.y=(wI.room.objs.find(o=>o.act=='cashier').y+1)*WS+16;wI.near=intNear()");
ok(ev('hudCtx().l') === 'BELI', 'dekat kasir => BELI'); ev('S.hb.sel=3'); ev('wInteract()'); ok(ev('st') === 'shop' && ev('shopTab') === 2, 'kasir membuka layar toko tab beli');
ev('goBack()'); ok(ev('st') === 'world' && ev('!!wI'), 'kembali dari panel tetap di interior'); ok(ev('S.world.x===640 && S.world.y===660 && S.hb.sel===3'), 'menutup panel memulihkan posisi dunia dan tool terpilih');
ev("wI.x=wI.room.objs.find(o=>o.act=='gacha').x*WS+WS;wI.y=(wI.room.objs.find(o=>o.act=='gacha').y+1)*WS+16;wI.near=intNear()");
ev('wInteract()'); ok(ev('st') === 'shop' && ev('shopTab') === 0, 'mesin gacha membuka tab panggil'); ev('goBack()');
ev('wI.x=wI.room.sx;wI.y=wI.room.sy;wI.near=intNear()'); ok(ev('hudCtx().l') === 'KELUAR', 'dekat pintu => KELUAR'); ev('wInteract()'); for (let i = 0; i < 40; i++) ev('updWorld(.016)');
ok(ev('wI') === null && ev('S.world.x') === 640, 'keluar kembali ke pintu eksterior');
// 5) bangunan terkunci: toast dengan syarat, pemain tetap di dunia
ev("best=1;S.world={x:712*2,y:320*2+20};wMsg={t:0,s:''};wInteract()"); ok(ev('wI') === null && /stage 3/.test(ev('wMsg.s')), 'Barak terkunci memberi pesan syarat'); ok(!ev('!!wFade'), 'tak ada fade untuk bangunan terkunci');
// 6) hotbar: pilihan tersimpan, alat terkunci menolak, alat tetap terpilih saat masuk bangunan
ev('best=10;hudSelect(3)'); ok(ev('S.hb.sel') === 3, 'Kapak terpilih'); ev('best=5;hudSelect(5)'); ok(ev('S.hb.sel') === 3, 'Pancing terkunci tidak berpindah');
ev("best=10;S.world={x:320*2,y:320*2+20};wInteract()"); for (let i = 0; i < 40; i++) ev('updWorld(.016)'); ok(ev('S.hb.sel') === 3, 'alat tetap terpilih di dalam bangunan'); ev('wI=null');
// 7) alat tidak sesuai tidak menjalankan aksi
ev("S.hb.sel=0;wMsg={t:0,s:''};lifeNearResource=()=>({id:'t1',kind:'tree',x:1,y:1});var __g=0;lifeDoGather=()=>{__g++};wI=null;wFade=null;S.world={x:5,y:5};");
ev('wInteract()'); ok(ev('__g') === 0 && /Kapak/.test(ev('wMsg.s')), 'tangan tak menebang; ada petunjuk memilih Kapak'); ev('S.hb.sel=3;wInteract()'); ok(ev('__g') === 1, 'kapak menebang');
// 8) save lama tetap valid (tanpa S.hb), jam digital, tata letak HUD responsif, dan tap tidak tembus.
ev('delete S.hb;hudEnsure()'); ok(ev('S.hb.sel') === 0, 'save tanpa hb dipulihkan'); ok(/^\d\d:\d\d$/.test(ev('hudClock()')), 'format jam');
for(let ui=0;ui<3;ui++){
  ev('S.set.ui='+ui);
  const L=ev('hudLayout()');
  ok(L.left>=0 && L.left+7*L.step+L.slot<=640, 'hotbar skala UI '+ui+' tetap di dalam kanvas');
  ok(L.y>=0 && L.y+L.slot+5*L.z<=360 && L.hit*ev('cv.getBoundingClientRect().width/VW')>=44, 'target hotbar skala UI '+ui+' minimal 44 px dan terlihat');
  ok(L.left>=0 && 4+100*L.z<=640 && 4+76*L.z<=360, 'minimap skala UI '+ui+' tidak keluar layar');
}
// Tap pada hotbar slot yang juga berada di area gerak dunia harus ditangkap UI, bukan mengubah tujuan gerak.
ev("st='world';lifeWorldQuick=false;wTalk=null;wDlg=0;wI=null;wFade=null;S.world={x:444,y:555};wjid=null;wjx=wjy=0;S.hb.sel=0;const __L=hudLayout();worldDown(879,__L.left+__L.slot/2,__L.centerY);");
ok(ev('!!hudSw && wjid===null && wjx===0 && wjy===0 && S.world.x===444 && S.world.y===555'), 'tap hotbar tidak diteruskan ke navigasi dunia'); ev('hudUp({pointerId:879})');
// Setting UI size, vibration, FX reduction and volumes must persist through Save.*.
ev("setPage=3;S.set.ui=1;(function(){const r=setRows()[0],b=r.o[2];setClick(b.x+b.w/2,r.y+r.h/2)})()");
ok(ev('S.set.ui===2 && Save.readMain().set.ui===2'), 'ukuran UI tersimpan melalui Save');
ev("setPage=1;(function(){const r=setRows()[0];r.o[1].f()})()");
ok(ev('S.set.mv===Math.min(10,7+1) && Save.readMain().set.mv===S.set.mv'), 'volume tersimpan melalui Save');
ev("setPage=3;(function(){const r=setRows()[2];r.o[1].f()})()");
ok(ev('S.set.vib===0 && Save.readMain().set.vib===0'), 'getaran perangkat tersimpan melalui Save');
ev("setPage=4;(function(){const r=setRows()[1];r.o[1].f()})()");
ok(ev('S.set.fx===0 && Save.readMain().set.fx===0'), 'pengurangan efek tersimpan melalui Save');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
ok(html.includes('safe-area-inset-top') && html.includes('safe-area-inset-bottom'), 'CSS safe-area diterapkan');
ok(html.includes('orientation:portrait') && html.includes('PUTAR HP KE LANDSCAPE'), 'instruksi putar tampil pada portrait');
const tilemap=fs.readFileSync(path.join(root,'js/tilemap.js'),'utf8');ok(!tilemap.includes('if(ZT>0){var b2='), 'banner biome duplikat tilemap dihapus');
const uiAtlas=path.join(root,'assets/world/ui.png');ok(fs.existsSync(uiAtlas) && fs.statSync(uiAtlas).size>0, 'atlas UI turunan Sunnyside tersedia');const setSrc=fs.readFileSync(path.join(root,'js/settings.js'),'utf8');ok(setSrc.includes('panel_tl')&&setSrc.includes("setUIImage(b.on?'confirm':'cancel'")&&setSrc.includes("setUIImage('bar_fill'"), 'panel 9-slice, confirm/cancel, dan bar UI digunakan');
ev("S.journal.seenBiomes.stage8b_test=undefined;delete S.journal.seenBiomes.stage8b_test;wMsg={t:0,s:''};jrDiscoverBiome('stage8b_test')");
ok(ev("wMsg.kind==='discovery' && wMsg.t>0"), 'banner besar hanya ditandai pada penemuan pertama');
ev("const __banner=wMsg;const __again=jrDiscoverBiome('stage8b_test');");ok(ev("__again===false && wMsg.kind==='discovery'"), 'penemuan biome idempoten dan tidak memicu ulang banner besar');
console.log('PASS: interior + HUD (' + n + ' pemeriksaan)');
