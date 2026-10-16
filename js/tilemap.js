/* Hero Battle - tilemap.js
 Skrip klasik. Memuat assets/world/village.json (+ tiles.png, sprites.png, sea.png), mem-bake lapisan tile
 (ground, shadow, decor) ke kanvas 1x, lalu menggambar HANYA bagian yang terlihat (blit subrect, x2).
 Laut = pola yang bergulir; ubin buih pantai beranimasi; objek (rumah/pohon/hewan/asap/kincir) diurutkan
 menurut posisi kaki agar pemain bisa lewat di belakang objek tinggi. Bergantung pada anim.js (opsional).
 Bila berkas gagal dimuat, ready() tetap false dan world.js memakai peta lama. */
var Tmap = (function () {
  var BASE = 'assets/world/', V = null, ti = null, si = null, sea = null, land = null, landS = null, seaP = null;
  var pend = 0, bad = false, okf = false, ANT = [], OB = [], CR = [], T = 0, VC = {};
  var CH = {}, CHL = [], CHSIZE = 32, CHMAX = 25, CHSEQ = 0, CHREQ = {}, CHFAIL = {}; // LRU cache; each baked canvas <=512x512
  var MAPC = null, MAPD = null, MAPSIZE = ''; // cached minimap raster; rebuild only when discovery changes
  var DISC_W = 128;
  var LF = 8, LFT = -9;   /* ukuran font label (px kanvas logis): dijaga >= ~11px layar agar terbaca di HP */
  function labelFont(g) {
    if (T - LFT < 1) return LF; LFT = T;
    try { var r = g.canvas.getBoundingClientRect(), k = r.height / 360; if (k > 0) LF = Math.max(8, Math.min(13, Math.round(11 / k))); } catch (e) { }
    return LF;
  }
  var BLK = Object.create(null), PENCNT = {}, LBL = []; /* BLK = tile padat tambahan (batu), PENCNT = jumlah hewan per kandang, LBL = plat/label yang digambar di lapisan atas */
  var FX = { n: 0, door: {} }, LT = [], GL = null, g_ = null;   /* n = tingkat malam 0..1, door = {huruf: 0..1}, LT = cahaya tampak frame ini */
  function glow() { if (GL) return GL; GL = cv(64, 64); var x = GL.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,214,120,.85)'); q.addColorStop(.35, 'rgba(255,180,80,.35)'); q.addColorStop(1, 'rgba(255,150,50,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64); return GL; }
  /* ladang hidup. farm(p, now, nm, FC): p = S.farm.p (12 petak, urutan = V.farm), nm = nama tanaman atlas per jenis, FC = daftar jenis (ms). Hanya MEMBACA. */
  var FM = null;
  function farm(p, now, nm, fc) { FM = (V && V.farm && p) ? { p: p, now: now, nm: nm, fc: fc } : null; }
  var TUF = [[-18, -14], [-8, -8], [4, -16], [14, -10], [-12, -3], [10, -2]];
  function farmGround(g, cx, cy, OX, VW, snow) {
    if (!FM) return; var F = V.farm, i, k, p, px, py;
    for (i = 0; i < F.length && i < FM.p.length; i++) {
      p = FM.p[i]; if (!p) continue; px = F[i][0] * 2 - cx - OX; py = F[i][1] * 2 - cy; if (px < -40 || px > VW + 40 || py < -10 || py > 400) continue;
      if (p.s == 0) { g.fillStyle = '#3f7d3a'; g.fillRect(px - 14, py - 12, 28, 22); g.fillStyle = '#5fae4c'; for (k = 0; k < 6; k++) { g.fillRect(px + TUF[k][0] * .5, py + TUF[k][1] * .5, 2, 3); } }
      else { g.fillStyle = p.w ? '#655033' : '#5a3a20'; g.fillRect(px - 14, py - 12, 28, 22); g.fillStyle = p.w ? '#476e74' : '#3d2615'; g.fillRect(px - 11, py - 8, 22, 2); g.fillRect(px - 11, py - 2, 22, 2); g.fillRect(px - 11, py + 4, 22, 2); if (p.w) { g.fillStyle = '#8ce7f5'; g.fillRect(px + 8, py - 9, 3, 3); } }
      g.strokeStyle = p.s === 2 ? '#d4aa58' : '#233a23'; g.lineWidth = 1; g.strokeRect(px - 14.5, py - 12.5, 29, 23);
      if (snow) { g.fillStyle = 'rgba(236,243,250,.4)'; g.fillRect(px - 14, py - 12, 28, 22); }
    }
  }
  function farmCrops(add) {
    if (!FM) return; var F = V.farm;
    F.forEach(function (s, i) {
      var p = FM.p[i], nm, q, ripe, st; if (!p || p.s != 2) return; nm = FM.nm[p.c]; if (!nm || !FM.fc[p.c]) return;
      q = Math.max(0, Math.min(1, (FM.now - p.t) / FM.fc[p.c].ms)); ripe = q >= 1; st = ripe ? 5 : Math.min(4, Math.floor(q * 5)); /* tahap Sunnyside Crops _00.._05 */
      add(s[0] * 2, s[1] * 2, 60, function (sx, sb) {
        Anim.draw(g_, 'crop_' + nm + '_' + st, 0, sx, sb - 4, false, 1.2);
        if (ripe) { var ph = (T * 2.2 + i * .37) % 1; if (ph < .5) { var ox = sx + (i % 3 - 1) * 9, oy = sb - 46; g_.fillStyle = 'rgba(255,246,176,' + Math.sin(ph * 6.2832).toFixed(2) + ')'; g_.fillRect(ox - 1, oy - 3, 2, 7); g_.fillRect(ox - 3, oy - 1, 7, 2); } }
      });
    });
  }
  function fx(n, door) { FX.n = n || 0; FX.door = door || {}; LT.length = 0; }
  /* pintu terbuka: celah gelap melebar dari tengah + cahaya hangat dari dalam */
  function doorFx(g, d, x, y, p) {
    var w = d[2] * 2, h = d[3] * 2, ow = Math.max(2, Math.round(w * p)), dx = Math.round(x + d[0] * 2 + (w - ow) / 2), dy = Math.round(y + d[1] * 2);
    g.fillStyle = '#150d1c'; g.fillRect(dx, dy, ow, h);
    var q = g.createLinearGradient(0, dy, 0, dy + h); q.addColorStop(0, 'rgba(255,200,110,0)'); q.addColorStop(1, 'rgba(255,200,110,.6)'); g.fillStyle = q; g.fillRect(dx, dy, ow, h);
    g.fillStyle = 'rgba(255,225,150,.9)'; g.fillRect(dx, dy + h - 2, ow, 2);
  }
  /* jendela menyala di malam hari (sebelum tint); 80% jendela menyala, deterministik */
  function winFx(g, r, o, x, y) {
    var a = FX.n, i, k; g.fillStyle = 'rgba(255,213,120,' + Math.min(1, a * 1.4).toFixed(2) + ')';
    for (i = 0; i < r.win.length; i++) {
      if ((((o.x * 7 + o.y * 3 + i * 5) % 10) + 10) % 10 > 7) continue; k = r.win[i];
      var wx = x + k[0] * 2, wy = y + k[1] * 2; g.fillRect(wx, wy, k[2] * 2, k[3] * 2);
      LT.push([wx + k[2], wy + k[3], 20, .55, wx, wy, k[2] * 2, k[3] * 2]);
    }
  }
  /* lapisan cahaya aditif: dipanggil world.js SETELAH tint malam supaya tetap terang */
  function lights(g) {
    if (FX.n < .02 || !LT.length) return; var old = g.globalCompositeOperation, i, l, im = glow(); g.globalCompositeOperation = 'lighter';
    for (i = 0; i < LT.length; i++) {
      l = LT[i]; g.globalAlpha = Math.min(1, FX.n * l[3]); g.drawImage(im, l[0] - l[2], l[1] - l[2], l[2] * 2, l[2] * 2);
      if (l.length > 4) { g.globalAlpha = FX.n * .35; g.fillStyle = '#a07828'; g.fillRect(l[4], l[5], l[6], l[7]); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = old;
  }
  function ready() { return okf && !bad; }
  function data() { return V; }
  function load(src, cb) { pend++; var im = new Image(); im.onload = function () { pend--; cb && cb(im); if (!pend) bake(); }; im.onerror = function () { bad = true; pend--; }; im.src = src; return im; }
  function init(base) {
    if (base) BASE = base;
    try {
      fetch(BASE + 'index.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
        V = j; CHSIZE = j.chunkSize || 32; ti = load(BASE + j.tiles); si = load(BASE + j.sprites); sea = load(BASE + j.sea);
      }).catch(function () { bad = true; });
    } catch (e) { bad = true; }
  }
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function bake() {
    if (bad || !V || !ti || !si || !sea || !ti.complete || !si.complete || !sea.complete) return;
    try {
      var p = cv(128,128), pc = p.getContext('2d'); pc.imageSmoothingEnabled = false; pc.drawImage(sea,0,0,64,64,0,0,128,128); seaP=p;
      OB = V.objects || []; ANT=[]; CR=[]; BLK = Object.create(null); PENCNT = {};
      OB.forEach(function(o){ if (o.k && o.k.indexOf('rock_') === 0) BLK[Math.floor((o.y - 1) / 16) * V.w + Math.floor(o.x / 16)] = 1; });
      syncPenAnimals(true);
      (V.pens && V.pens.length ? [] : (V.animals || [])).forEach(function(a){ for(var i=0;i<a.n;i++){var z=a.z,ox=z[0]+Math.random()*(z[2]-z[0]),oy=z[1]+Math.random()*(z[3]-z[1]);CR.push({a:a.a,x:ox,y:oy,tx:ox,ty:oy,w:Math.random()*3,fl:Math.random()<.5,mv:0,z:z,sp:a.a=='animal_chicken'?11:a.a=='animal_cow'?6:8});}});
      okf = true;
    } catch(e) { bad=true; }
  }
  function biomeAt(tx, ty) {
    if (!V || !V.biomeRegions) return null;
    for (var i=0;i<V.biomeRegions.length;i++){var b=V.biomeRegions[i];if(tx>=b.x&&ty>=b.y&&tx<b.x+b.w&&ty<b.y+b.h)return b;}
    return null;
  }
  function explore(px, py, disc) {
    if (!V) return disc || ''; var tx=Math.floor(px),ty=Math.floor(py);
    /* '*' = seluruh peta sudah dibuka; status ini hanya satu karakter di save lama hb_s4. */
    if(disc==='*')return '*';
    var total=V.w*V.h, s=(typeof disc==='string'?disc:'');
    if(s.length!==total)s=s.slice(0,total).padEnd(total,'0');
    var changed=false;
    for(var y=Math.max(0,ty-4);y<=Math.min(V.h-1,ty+4);y++)for(var x=Math.max(0,tx-4);x<=Math.min(V.w-1,tx+4);x++){
      if(Math.hypot(x-tx,y-ty)>4.5)continue;var i=y*V.w+x;if(s.charAt(i)!=='1'){s=s.substring(0,i)+'1'+s.substring(i+1);changed=true;}
    }
    return changed?s:(disc||s);
  }
  /* Minimap: jendela 64x48 petak yang mengikuti pemain (~1.5 px/petak, terbaca), dengan jalan, jembatan, bangunan, dan penanda tempat.
     Raster dasar di-cache; penanda dan pemain digambar tiap frame. Jalan dari V.roads (tools/build_minimap_roads.py). */
  function bakeMini() {
    MAPC = cv(V.w, V.h); var mg = MAPC.getContext('2d'), tx, ty, b, col, ch, rd = V.roads;
    for (ty = 0; ty < V.h; ty++) for (tx = 0; tx < V.w; tx++) {
      b = biomeAt(tx, ty); col = b && b.color || '#6f9b58'; ch = V.grid && V.grid[ty] ? V.grid[ty].charAt(tx) : '.';
      if (ch === '~') col = '#398ec0'; else if (ch === ',') col = '#c7b27f'; else if (ch === '+') col = '#e0a85a'; else if (ch === 'X') col = '#5c8a4a'; else if (ch === 'T') col = '#2f5a35';
      if (rd && rd[ty] && rd[ty].charAt(tx) === '1' && ch !== '~') col = '#c98f55';
      mg.fillStyle = col; mg.fillRect(tx, ty, 1, 1);
    }
    var B = V.bld || {}, k; for (k in B) { var r = B[k], f = k === 'F'; mg.fillStyle = f ? '#6a5530' : '#4a2c14'; mg.fillRect(r[0], r[1], r[2] - r[0] + 1, r[3] - r[1] + 1); mg.fillStyle = f ? '#b9a064' : '#e8a95a'; mg.fillRect(r[0] + (f ? 0 : .35), r[1] + (f ? 0 : .35), r[2] - r[0] + 1 - (f ? 0 : .7), r[3] - r[1] + 1 - (f ? 0 : .7)); }
    MAPD = V.w + 'x' + V.h + (rd ? 'r' : '');
  }
  function hud(g, disc, px, py, OX, VW, dt) {
    if (!V) return;
    var us = [.9, 1, 1.1][Math.max(0, Math.min(2, Math.round(Number(S && S.set && S.set.ui) || 0)))] || 1, x0 = 4, y0 = 4, w = Math.round(100 * us), h = Math.round(76 * us), VT = 64, HT = 48;
    if (!MAPC || MAPD !== V.w + 'x' + V.h + (V.roads ? 'r' : '')) bakeMini();
    var sx = Math.max(0, Math.min(V.w - VT, px - VT / 2)), sy = Math.max(0, Math.min(V.h - HT, py - HT / 2)), kx = w / VT, ky = h / HT;
    g.save(); g.globalAlpha = .96; g.fillStyle = '#17251d'; g.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
    g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(MAPC, sx, sy, VT, HT, x0, y0, w, h);
    var mk = function (tx, ty, c, r) { var mx = x0 + (tx - sx) * kx, my = y0 + (ty - sy) * ky; if (mx < x0 - 4 || my < y0 - 4 || mx > x0 + w + 4 || my > y0 + h + 4) return; g.fillStyle = '#17251d'; g.fillRect(mx - r - 1, my - r - 1, r * 2 + 2, r * 2 + 2); g.fillStyle = c; g.fillRect(mx - r, my - r, r * 2, r * 2); };
    (V.places || []).forEach(function (p) { if (p.type !== 'animal_pen' || true) mk(p.x + .5, p.y + .5, '#ffd24a', 1.5); });
    (V.labels || []).forEach(function (l) { mk(l.x, l.y, '#7fd8ff', 1.5); });
    mk(px, py, Math.sin(Date.now() / 220) > 0 ? '#ffffff' : '#ff5a4a', 2.5 * us);
    g.restore();
    g.save(); g.strokeStyle = '#e6c45a'; g.lineWidth = 1; g.strokeRect(x0 - .5, y0 - .5, w + 1, h + 1); g.restore();
  }
  function chunkKey(x,y){return x+'_'+y;}
  /* Jembatan: hanya pagar (tepi) yang padat. Baris atas padat di y-lokal < topSolid, baris bawah di y-lokal >= botSolid (piksel dunia),
     baris tengah bebas. true/false untuk petak jembatan, undefined di luar jembatan (pakai collision biasa). */
  function railSolid(px, py) {
    var B = V && V.bridgeRails; if (!B) return undefined;
    var tx = Math.floor(px / 32), ty = Math.floor(py / 32);
    for (var i = 0; i < B.length; i++) {
      var b = B[i]; if (tx < b.x0 || tx > b.x1) continue;
      if (ty === b.top) return (py - ty * 32) < b.topSolid;
      if (ty === b.bot) return (py - ty * 32) >= b.botSolid;
      if (ty > b.top && ty < b.bot) return false;
    }
    return undefined;
  }
  function collisionAt(tx,ty){
    if(!V||tx<0||ty<0||tx>=V.w||ty>=V.h)return true;
    if(BLK[ty*V.w+tx])return true;
    var ch=CH[chunkKey(Math.floor(tx/CHSIZE),Math.floor(ty/CHSIZE))];
    if(!ch)return null;
    var lx=tx%CHSIZE,ly=ty%CHSIZE;
    if(lx>=ch.tw||ly>=ch.th)return true;
    return ch.collision[ly*ch.tw+lx]===1;
  }
  function hasTag(tx,ty,tag){
    if(!V||tx<0||ty<0||tx>=V.w||ty>=V.h)return false;
    var ch=CH[chunkKey(Math.floor(tx/CHSIZE),Math.floor(ty/CHSIZE))];
    if(ch){var i=(ty%CHSIZE)*ch.tw+(tx%CHSIZE);if(ch.tags[i]&&ch.tags[i][tag])return true;}
    if(tag==='fishing_spot')return !!(V.grid&&V.grid[ty]&&V.grid[ty].charAt(tx)==='~');
    if(tag==='animal_pen_area'){var b=biomeAt(tx,ty);return !!(b&&b.id==='meadow');}
    return false;
  }
  /* Layanan dunia hanya terpicu oleh tombol aksi saat pemain dekat prop fisik. */
  function nearService(tx,ty){
    if(!V||!V.serviceObjects||!V.serviceObjects.length)return null;
    var best=null,bd=Infinity;
    for(var i=0;i<V.serviceObjects.length;i++){
      var s=V.serviceObjects[i],d=Math.hypot(tx-(s.x+.5),ty-(s.y+1));
      if(d<=Math.max(.5,+s.rangeTiles||1.5)&&d<bd){best=s;bd=d;}
    }
    return best;
  }

  /* ===== Kandang per spesies ===== */
  function penWorld(cnt, p) { var n = cnt && cnt[p.animal]; return n == null ? 2 : Math.max(0, Math.min(10, n | 0)); }
  function syncPenAnimals(force) {
    if (!V || !V.pens || !V.pens.length) return;
    var cnt = (typeof ranchWorldCounts === 'function') ? ranchWorldCounts() : null, changed = !!force, i, k;
    V.pens.forEach(function (p) { var n = penWorld(cnt, p); if (PENCNT[p.id] !== n) { PENCNT[p.id] = n; changed = true; } });
    if (!changed) return;
    CR = CR.filter(function (c) { return !c.pen; });
    V.pens.forEach(function (p) {
      var z = [p.interior[0] + 12, p.interior[1] + 22, p.interior[2] - 12, p.interior[3] - 8];
      for (i = 0; i < PENCNT[p.id]; i++) {
        var ox = z[0] + Math.random() * (z[2] - z[0]), oy = z[1] + Math.random() * (z[3] - z[1]);
        CR.push({ a: 'animal_' + p.animal, pen: p.id, x: ox, y: oy, tx: ox, ty: oy, w: Math.random() * 3, fl: Math.random() < .5, mv: 0, z: z, sp: p.animal == 'chicken' ? 11 : p.animal == 'cow' ? 6 : 8 });
      }
    });
  }
  var GO = {}, WSC = {}, WALL = { workshop: 'b_workshop', kitchen: 'b_kitchen', village_hall: 'b_hall', woodcutter_hut: 'b_woodcutter', fisher_hut: 'b_fisher' };
  /* gerbang kayu dua daun di celah pagar selatan kandang; o = keterbukaan 0..1 (membuka ke dalam saat pemain dekat) */
  function quad(g, c, pts) { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fill(); }
  function drawPenGate(g, sx, sb, o) {
    var hw = 31, lh = 23, k = 1 - .8 * o, lift = 10 * o, i, s, hx, fx, fy, P;
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(sx - hw, sb - 3, hw * 2, 4);
    for (i = 0; i < 2; i++) {
      s = i ? 1 : -1; hx = sx + s * hw; fx = hx - s * hw * k; fy = sb - 2 - lift;
      P = function (u, v) { return [hx + (fx - hx) * u, (sb - 2) + (fy - (sb - 2)) * u - lh * v]; };
      quad(g, '#3f2815', [P(0, 0), P(1, 0), P(1, 1), P(0, 1)]);
      quad(g, '#b9824c', [P(.05, .08), P(.95, .08), P(.95, .92), P(.05, .92)]);
      quad(g, '#e0ad72', [P(.05, .8), P(.95, .8), P(.95, .92), P(.05, .92)]);
      quad(g, '#7a4d2a', [P(.05, .2), P(.95, .2), P(.95, .34), P(.05, .34)]);
      quad(g, '#7a4d2a', [P(.05, .58), P(.95, .58), P(.95, .72), P(.05, .72)]);
      g.strokeStyle = '#3f2815'; g.lineWidth = 2; g.beginPath(); g.moveTo(P(.06, .12)[0], P(.06, .12)[1]); g.lineTo(P(.94, .86)[0], P(.94, .86)[1]); g.stroke();
      g.fillStyle = '#f0cf92'; g.fillRect(Math.round(P(.04, .5)[0]) - 1, Math.round(P(.04, .5)[1]) - 1, 3, 3);
    }
  }
  /* papan nama menempel di dinding, tepat di atas bingkai pintu (posisi dihitung dari data door sprite) */
  function wallSign(g, r, x0, y0, nm) {
    var d = r.door, key = nm + '|' + LF, c = WSC[key], fs, w;
    if (!c) { fs = LF; g.save(); for (;;) { g.font = 'bold ' + fs + 'px system-ui'; w = Math.ceil(g.measureText(nm).width) + 8; if (w <= r.w * 2 - 6 || fs <= 7) break; fs--; } g.restore(); c = WSC[key] = { w: w, fs: fs }; }
    w = c.w; fs = c.fs; var h = fs + 4, x = Math.round(x0 + (d[0] + d[2] / 2) * 2 - w / 2), y = y0 + d[1] * 2 - 3 - h;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 1, y + 2, w, h);
    g.fillStyle = '#2a1c12'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = '#d9b982'; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x, y, w, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + h - 2, w, 2);
    g.fillStyle = '#2a1c12'; g.fillRect(x + 2, y + 3, 1, 1); g.fillRect(x + w - 3, y + 3, 1, 1);
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold ' + fs + 'px system-ui'; g.fillStyle = '#2a1c12'; g.fillText(nm, x + w / 2, y + h / 2 + 1); g.restore();
    var dk = signDim(); if (dk) { g.fillStyle = 'rgba(0,0,0,' + dk.toFixed(3) + ')'; g.fillRect(x - 1, y - 1, w + 2, h + 2); }
  }
  /* Papan digambar di overlay() (sesudah tint malam). Redup halus 0.35*FX.n hanya di papan; siang (FX.n < .02) = 0, tampilan identik. */
  function signDim() { return FX.n < .02 ? 0 : .35 * FX.n; }
  /* papan nama di atap (meta sign = kotak papan dalam piksel sprite): teks dari nama tempat, ikut bahasa */
  function roofSign(g, r, k, x0, y0) {
    var nm = null, i, p;
    for (i = 0; V && V.places && i < V.places.length; i++) { p = V.places[i]; if (p.sprite === k) { nm = (S && S.set && S.set.lang === 'en' ? p.name_en : p.name) || p.name; break; } }
    if (!nm) return; nm = nm.toUpperCase();
    var bx = x0 + r.sign[0] * 2, by = y0 + r.sign[1] * 2, bw = r.sign[2] * 2, bh = r.sign[3] * 2, fs = 17;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    do { g.font = 'bold ' + fs + 'px system-ui'; fs--; } while (g.measureText(nm).width > bw - 12 && fs > 8);
    var dk = signDim(), m = 1 - dk;
    g.fillStyle = '#2a1c12'; g.fillText(nm, bx + bw / 2 + 1, by + bh / 2 + 2); g.fillStyle = dk ? 'rgb(' + Math.round(246 * m) + ',' + Math.round(207 * m) + ',' + Math.round(90 * m) + ')' : '#f6cf5a'; g.fillText(nm, bx + bw / 2, by + bh / 2 + 1);
    g.restore();
  }
  function wallName(k) {
    if (!V || !V.places) return null;
    for (var i = 0; i < V.places.length; i++) { var p = V.places[i]; if (WALL[p.type] === k) return (S && S.set && S.set.lang === 'en' ? p.name_en : p.name) || p.name; }
    return null;
  }
  /* pemain di dalam kandang atau di depan pintunya (satuan tile, float) */
  function nearPen(tx, ty) {
    if (!V || !V.pens) return null;
    for (var i = 0; i < V.pens.length; i++) {
      var p = V.pens[i], gx = (p.gateCols[0] + p.gateCols[1] + 1) / 2, gy = p.gateRow + 1;
      if ((tx >= p.x && tx < p.x + p.w && ty >= p.y && ty < p.y + p.h) || Math.hypot(tx - gx, ty - gy) <= 2.3) return p;
    }
    return null;
  }
  function penGround(g, cx, cy, OX, VW, snow) {
    if (!V || !V.pens) return;
    V.pens.forEach(function (p) {
      var x = (p.x + 1) * 32 - cx - OX, y = (p.y + 1) * 32 - cy, w = (p.w - 2) * 32, h = (p.h - 2) * 32;
      if (x > VW || x + w < 0 || y > 360 || y + h < 0) return;
      g.fillStyle = snow ? 'rgba(214,206,190,.55)' : 'rgba(150,110,62,.5)'; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(96,64,32,.28)';
      for (var i = 0; i < 26; i++) { var hx = x + ((i * 53) % (w - 6)), hy = y + ((i * 37) % (h - 4)); g.fillRect(hx, hy, 6 + (i % 3) * 2, 2); }
      g.fillStyle = 'rgba(224,196,108,.55)';
      for (var j = 0; j < 14; j++) { var jx = x + ((j * 71 + 11) % (w - 8)), jy = y + ((j * 43 + 5) % (h - 4)); g.fillRect(jx, jy, 5, 2); g.fillRect(jx + 2, jy - 1, 2, 1); }
    });
  }
  function fRail(g, x, y, w) { if (w <= 0) return; g.fillStyle = '#3f2815'; g.fillRect(x, y - 1, w, 6); g.fillStyle = '#b9824c'; g.fillRect(x, y, w, 4); g.fillStyle = '#e0ad72'; g.fillRect(x, y, w, 1); g.fillStyle = '#7a4d2a'; g.fillRect(x, y + 3, w, 1); }
  function fPost(g, cx, by, h, cap) {
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(cx - 7, by - 2, 14, 4);
    g.fillStyle = '#3f2815'; g.fillRect(cx - 4, by - h, 8, h); g.fillStyle = '#a8703c'; g.fillRect(cx - 3, by - h + 1, 6, h - 1); g.fillStyle = '#d19a5f'; g.fillRect(cx - 3, by - h + 1, 2, h - 1);
    g.fillStyle = '#3f2815'; g.fillRect(cx - 5, by - h - 2, 10, 4); g.fillStyle = cap || '#e3b87f'; g.fillRect(cx - 4, by - h - 1, 8, 2);
  }
  /* satu tile pagar; (sx,sb) = tengah-bawah tile di layar (2x) */
  function drawFence(g, p, tx, ty, sx, sb) {
    var x0 = p.x, y0 = p.y, x1 = p.x + p.w - 1, y1 = p.y + p.h - 1, G0 = p.gateCols[0], G1 = p.gateCols[1];
    var horiz = (ty === y0 || ty === y1), L = sx - 16, R = sx + 16;
    if (!horiz) { /* kolom kiri/kanan: balok vertikal menyambung penuh antar baris */
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(sx - 6, sb - 2, 12, 4);
      g.fillStyle = '#3f2815'; g.fillRect(sx - 4, sb - 33, 8, 33); g.fillStyle = '#b9824c'; g.fillRect(sx - 3, sb - 33, 6, 33); g.fillStyle = '#e0ad72'; g.fillRect(sx - 3, sb - 33, 2, 33); g.fillStyle = '#7a4d2a'; g.fillRect(sx + 1, sb - 33, 2, 33);
      g.fillStyle = '#3f2815'; g.fillRect(sx - 5, sb - 20, 10, 5); g.fillStyle = '#d19a5f'; g.fillRect(sx - 4, sb - 19, 8, 3);
      return;
    }
    var ls = L, re = R, postX = sx, ph = 24;
    if (tx === x0) { ls = sx; ph = 30; } if (tx === x1) { re = sx; ph = 30; }
    var gy = p.gateSide === 'N' ? y0 : y1;
    if (ty === gy && tx === G0 - 1) { re = R - 2; postX = R - 2; ph = 32; }
    if (ty === gy && tx === G1 + 1) { ls = L + 2; postX = L + 2; ph = 32; }
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(ls, sb - 3, re - ls, 4);
    fRail(g, ls, sb - 20, re - ls); fRail(g, ls, sb - 10, re - ls);
    fPost(g, postX, sb, ph, ph > 24 ? '#f0cf92' : null);
    if (ty === gy && (tx === G0 - 1 || tx === G1 + 1)) { g.fillStyle = '#f0cf92'; g.fillRect(postX - 3, sb - ph - 5, 6, 3); }
  }
  /* pagar ladang: tiang sudut + balok menyambung, gaya sama dengan kandang (drawFence), tanpa celah di sudut */
  function farmRect() { var b = V && V.bld && V.bld.F, gt = V && V.farmGate; return b ? { x: b[0], y: b[1], w: b[2] - b[0] + 1, h: b[3] - b[1] + 1, gateCols: gt ? gt.cols : [-99, -99], gateSide: gt ? gt.side : 'S' } : null; }
  function farmFence(add, g) {
    var p = farmRect(); if (!p) return;
    for (var ty = p.y; ty < p.y + p.h; ty++) for (var tx = p.x; tx < p.x + p.w; tx++) {
      if (!(tx === p.x || tx === p.x + p.w - 1 || ty === p.y || ty === p.y + p.h - 1)) continue;
      if (p.gateSide === 'N' && ty === p.y && tx >= p.gateCols[0] && tx <= p.gateCols[1]) continue;   /* celah gerbang ladang (sisi utara) */
      (function (tx, ty) { add(tx * 32 + 16, (ty + 1) * 32, 40, function (sx, sb) { drawFence(g, p, tx, ty, sx, sb); }); })(tx, ty);
    }
    if (p.gateSide === 'N') {   /* gerbang dua daun, membuka saat pemain dekat; nama ladang memudar mengikuti jarak */
      add((p.gateCols[0] + p.gateCols[1] + 1) * 16, (p.y + 1) * 32, 40, function (sx, sb) {
        drawPenGate(g, sx, sb, GO.farm || 0);
        var wp = S && S.world, gt = V.farmGate, d = wp ? Math.hypot(wp.x / 32 - (p.gateCols[0] + p.gateCols[1] + 1) / 2, wp.y / 32 - p.y) : 99, a = d <= 3 ? 1 : Math.max(0, Math.min(1, (8 - d) / 5));
        if (a > .01) LBL.push({ k: 'label', text: (S && S.set && S.set.lang === 'en' ? gt.name_en : gt.name) || gt.name || '', x: Math.round(sx), y: Math.round(sb - 40), a: a });
      });
    }
  }
  function penObjects(add, g) {
    if (!V || !V.pens) return;
    V.pens.forEach(function (p) {
      for (var ty = p.y; ty < p.y + p.h; ty++) for (var tx = p.x; tx < p.x + p.w; tx++) {
        var edge = tx === p.x || tx === p.x + p.w - 1 || ty === p.y || ty === p.y + p.h - 1; if (!edge) continue;
        if (ty === p.gateRow && tx >= p.gateCols[0] && tx <= p.gateCols[1]) continue;
        (function (tx, ty) { add(tx * 32 + 16, (ty + 1) * 32, 40, function (sx, sb) { drawFence(g, p, tx, ty, sx, sb); }); })(tx, ty);
      }
      add((p.x + p.w - 3) * 32, (p.y + 2) * 32, 20, function (sx, sb) { drawFeedTrough(g, sx, sb); });
      add((p.gateCols[0] + p.gateCols[1] + 1) * 16, (p.gateRow + 1) * 32, 40, function (sx, sb) { drawPenGate(g, sx, sb, GO[p.id] || 0); });
    });
  }
  /* plat nama: tiang ikut urutan kedalaman, papan + teks digambar di lapisan atas agar tidak tertutup pohon */
  function drawPlate(g, sx, sb, text, fill) {
    var fs = LF; g.save(); g.font = 'bold ' + fs + 'px system-ui'; var tw = Math.ceil(g.measureText(text).width); g.restore();
    var w = Math.max(30, tw + 12), h = fs + 8;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(sx - 6, sb - 1, 12, 3);
    g.fillStyle = '#3f2815'; g.fillRect(sx - 3, sb - 22, 6, 22); g.fillStyle = '#8a5a33'; g.fillRect(sx - 2, sb - 21, 4, 21);
    LBL.push({ k: 'plate', x: Math.round(sx - w / 2), y: Math.round(sb - 20 - h), w: w, h: h, fill: fill, text: text, cx: Math.round(sx), fs: fs });
  }
  /* lapisan atas: plat dulu, lalu label melayang. Label yang bertabrakan dengan plat/label lain digeser ke atas (maks 4x) */
  function overlay(g) {
    if (!LBL.length) return;
    var P = [], i, j, k, l, w, h, y, hit, fs = LF;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    for (i = 0; i < LBL.length; i++) { l = LBL[i]; if (l.k !== 'sign') continue; if (l.s) roofSign(g, l.r, l.o, l.x, l.y); else wallSign(g, l.r, l.x, l.y, l.nm); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (i = 0; i < LBL.length; i++) {
      l = LBL[i]; if (l.k !== 'plate') continue;
      g.fillStyle = '#2a1c12'; g.fillRect(l.x - 1, l.y - 1, l.w + 2, l.h + 2); g.fillStyle = l.fill; g.fillRect(l.x, l.y, l.w, l.h);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(l.x, l.y, l.w, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(l.x, l.y + l.h - 2, l.w, 2);
      g.font = 'bold ' + (l.fs || 8) + 'px system-ui'; g.fillStyle = '#2a1c12'; g.fillText(l.text, l.cx, l.y + l.h / 2 + 1);
      P.push([l.x - 1, l.y - 1, l.w + 2, l.h + 2]);
    }
    g.textBaseline = 'bottom'; g.font = 'bold ' + (fs + 1) + 'px system-ui'; g.lineWidth = 3; g.strokeStyle = 'rgba(16,24,17,.94)'; g.lineJoin = 'round';
    for (i = 0; i < LBL.length; i++) {
      l = LBL[i]; if (l.k !== 'label') continue;
      w = Math.ceil(g.measureText(l.text).width) + 4; h = fs + 4; y = l.y;
      for (k = 0; k < 4; k++) {
        hit = false;
        for (j = 0; j < P.length; j++) if (l.x - w / 2 < P[j][0] + P[j][2] && l.x + w / 2 > P[j][0] && y - h < P[j][1] + P[j][3] && y > P[j][1]) { hit = true; y = Math.min(y, P[j][1]) - 1; break; }
        if (!hit) break;
      }
      P.push([l.x - w / 2, y - h, w, h]);
      g.globalAlpha = l.a; g.strokeText(l.text, l.x, y); g.fillStyle = '#fff0b0'; g.fillText(l.text, l.x, y);
    }
    g.globalAlpha = 1; g.restore(); LBL.length = 0;
  }
  function requestChunk(cx,cy){
    if(cx<0||cy<0||cx*CHSIZE>=V.w||cy*CHSIZE>=V.h)return;
    var key=chunkKey(cx,cy); if(CH[key]){CH[key].used=++CHSEQ;return;} if(CHREQ[key])return; if(CHFAIL[key]&&Date.now()<CHFAIL[key])return; CHREQ[key]=1;
    var meta=(V.chunks||[]).filter(function(c){return c.x==cx&&c.y==cy;})[0]; if(!meta){delete CHREQ[key];return;}
    fetch(BASE+meta.file).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(d){
      var c=cv(d.w*16,d.h*16),g=c.getContext('2d');g.imageSmoothingEnabled=false;var anim=[];
      ['ground','shadow','decor','over'].forEach(function(L){var a=d.layers[L]||[];for(var i=0;i<a.length;i++){var n=a[i];if(!n)continue;var x=(i%d.w)*16,y=((i/d.w)|0)*16;if(V.anim&&V.anim[n])anim.push({x:d.x*16+x,y:d.y*16+y,f:V.anim[n]});else g.drawImage(ti,(n%V.tcols)*16,((n/V.tcols)|0)*16,16,16,x,y,16,16);}});
      var tags = Object.create(null);
      (d.tags || []).forEach(function(t){ if(!tags[t.i]) tags[t.i]=Object.create(null); tags[t.i][t.tag]=1; });
      CH[key]={x:cx*CHSIZE*16,y:cy*CHSIZE*16,w:d.w*16,h:d.h*16,tw:d.w,th:d.h,canvas:c,anim:anim,snow:null,used:++CHSEQ,collision:d.layers.collision||[],tags:tags};
      delete CHFAIL[key]; CHL.push(key); trimChunks();
    }).catch(function(){ /* Jangan mematikan dunia karena satu chunk gagal; coba ulang setelah jeda singkat. */ CHFAIL[key]=Date.now()+2500; }).then(function(){delete CHREQ[key];});
  }
  function trimChunks(){while(CHL.length>CHMAX){var idx=0,old=Infinity;for(var i=0;i<CHL.length;i++){var c=CH[CHL[i]];if(c&&c.used<old){old=c.used;idx=i;}}var k=CHL.splice(idx,1)[0];delete CH[k];}}
  function snowChunk(ch){if(ch.snow)return ch.snow;var c=cv(ch.w,ch.h),x=c.getContext('2d');x.drawImage(ch.canvas,0,0);var im=x.getImageData(0,0,ch.w,ch.h),d=im.data;for(var i=0;i<d.length;i+=4){if(!d[i+3])continue;var r=d[i],g=d[i+1],b=d[i+2],k=(g>r+6&&g>b)?.74:(r>g&&r>b)?.5:0;if(k){d[i]+=(232-r)*k;d[i+1]+=(241-g)*k;d[i+2]+=(250-b)*k;}}x.putImageData(im,0,0);ch.snow=c;return c;}
  /* kritter berkeliaran di padang */
  function update(dt) {
    if (!okf) return; T += dt; syncPenAnimals(false);
    if (V && V.farmGate && V.bld && V.bld.F && S && S.world) {
      var fb = V.bld.F, fx = S.world.x / 32, fy = S.world.y / 32, fg = (V.farmGate.cols[0] + V.farmGate.cols[1] + 1) / 2;
      var fnear = (fx >= fb[0] && fx < fb[2] + 1 && fy >= fb[1] && fy < fb[3] + 1) || Math.hypot(fx - fg, fy - fb[1]) <= 2.6;
      GO.farm = (GO.farm || 0) + ((fnear ? 1 : 0) - (GO.farm || 0)) * Math.min(1, dt * 9);
    }
    if (V && V.pens && S && S.world) {
      var ptx = S.world.x / 32, pty = S.world.y / 32;
      V.pens.forEach(function (p) {
        var gx = (p.gateCols[0] + p.gateCols[1] + 1) / 2, gy = p.gateRow + 1, near = (ptx >= p.x && ptx < p.x + p.w && pty >= p.y && pty < p.y + p.h) || Math.hypot(ptx - gx, pty - gy) <= 2.6, o = GO[p.id] || 0;
        GO[p.id] = o + ((near ? 1 : 0) - o) * Math.min(1, dt * 9);
      });
    }
    for (var i = 0; i < CR.length; i++) {
      var c = CR[i];
      if (c.w > 0) { c.w -= dt; c.mv = 0; if (c.w <= 0) { c.tx = c.z[0] + Math.random() * (c.z[2] - c.z[0]); c.ty = c.z[1] + Math.random() * (c.z[3] - c.z[1]); } continue; }
      var dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { c.w = 1.5 + Math.random() * 4; c.mv = 0; continue; }
      c.x += dx / d * c.sp * dt; c.y += dy / d * c.sp * dt; c.mv = 1; if (Math.abs(dx) > 1) c.fl = dx > 0;
    }
  }
  function sea_(g, cx, cy, OX, VW, snow) {
    var ox = -(cx + Math.floor(T * 7)) % 128, oy = -(cy + Math.floor(T * 3.5)) % 128;
    g.save(); g.translate(-OX + ox - 128, oy - 128); g.fillStyle = g.createPattern(seaP, 'repeat'); g.fillRect(0, 0, VW + 256, 360 + 256); g.restore();
    if (snow) { g.fillStyle = 'rgba(190,215,240,.18)'; g.fillRect(-OX, 0, VW, 360); }
  }
  /* gambar laut + tanah (+ buih beranimasi); cx,cy = kamera (px layar x2) */
  function draw(g, cx, cy, OX, VW, snow) {
    if (!okf) return; var old = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
    sea_(g, cx, cy, OX, VW, snow);
    var tc=V.tcols, cpx=Math.floor(cx/(CHSIZE*32)), cpy=Math.floor(cy/(CHSIZE*32));
    for(var yy=cpy-2;yy<=cpy+2;yy++)for(var xx=cpx-2;xx<=cpx+2;xx++)requestChunk(xx,yy);
    for(var ci=0;ci<CHL.length;ci++){var ch=CH[CHL[ci]];if(!ch)continue;var dx=ch.x*2-cx-OX,dy=ch.y*2-cy;if(dx>VW||dx+ch.w*2<0||dy>360||dy+ch.h*2<0)continue;ch.used=++CHSEQ;g.drawImage(snow?snowChunk(ch):ch.canvas,0,0,ch.w,ch.h,dx,dy,ch.w*2,ch.h*2);for(var ai=0;ai<ch.anim.length;ai++){var a=ch.anim[ai],px=a.x*2-cx-OX,py=a.y*2-cy;if(px<-32||px>VW||py<-32||py>360)continue;var n=a.f[Math.floor(T*2.2)%a.f.length];g.drawImage(ti,(n%tc)*16,((n/tc)|0)*16,16,16,px,py,32,32);}}
    farmGround(g, cx, cy, OX, VW, snow);
    penGround(g, cx, cy, OX, VW, snow);
    g.imageSmoothingEnabled = old;
  }
  function drawGate(g,sx,sb){
    /* Gapura pixel-art dekoratif; tidak mengubah layer collision jalan. */
    g.save();g.lineWidth=2;g.fillStyle='#2b211b';g.fillRect(Math.round(sx-34),Math.round(sb-58),10,58);g.fillRect(Math.round(sx+24),Math.round(sb-58),10,58);
    g.fillStyle='#77796f';g.fillRect(Math.round(sx-32),Math.round(sb-57),6,54);g.fillRect(Math.round(sx+26),Math.round(sb-57),6,54);
    g.fillStyle='#b2a98b';g.fillRect(Math.round(sx-34),Math.round(sb-60),10,4);g.fillRect(Math.round(sx+24),Math.round(sb-60),10,4);
    g.fillStyle='#4d3826';g.fillRect(Math.round(sx-38),Math.round(sb-68),76,10);g.fillStyle='#8c5d35';g.fillRect(Math.round(sx-36),Math.round(sb-67),72,6);
    g.fillStyle='#c9b78c';g.fillRect(Math.round(sx-38),Math.round(sb-70),76,3);g.fillStyle='#3e2a20';g.fillRect(Math.round(sx-30),Math.round(sb-62),60,2);
    g.fillStyle='#e3c66f';g.fillRect(Math.round(sx-2),Math.round(sb-67),4,4);g.restore();
  }
  function drawFeedTrough(g,sx,sb){
    g.save();g.fillStyle='#30251d';g.fillRect(Math.round(sx-22),Math.round(sb-10),44,10);g.fillStyle='#98613c';g.fillRect(Math.round(sx-20),Math.round(sb-9),40,7);g.fillStyle='#d7aa63';g.fillRect(Math.round(sx-20),Math.round(sb-10),40,2);g.fillStyle='#6b3e25';g.fillRect(Math.round(sx-17),Math.round(sb-6),34,3);g.fillStyle='#d9c875';for(var i=0;i<5;i++)g.fillRect(Math.round(sx-13+i*6),Math.round(sb-7-(i%2)),3,2);g.fillStyle='#4d3222';g.fillRect(Math.round(sx-17),Math.round(sb-2),4,2);g.fillRect(Math.round(sx+13),Math.round(sb-2),4,2);g.restore();
  }
  function variant(k, md) {
    var id = k + md; if (VC[id]) return VC[id]; var r = V.spr[k], c = cv(r.w, r.h), x = c.getContext('2d');
    x.drawImage(si, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h); x.globalCompositeOperation = 'source-atop';
    if (md == 'l') { x.fillStyle = 'rgba(8,10,28,.55)'; x.fillRect(0, 0, r.w, r.h); }
    else { var gr = x.createLinearGradient(0, 0, 0, r.h); gr.addColorStop(0, 'rgba(242,247,252,.85)'); gr.addColorStop(.5, 'rgba(242,247,252,.15)'); gr.addColorStop(1, 'rgba(242,247,252,0)'); x.fillStyle = gr; x.fillRect(0, 0, r.w, r.h); }
    return VC[id] = c;
  }
  /* daftar objek tampak, siap diurutkan oleh world.js: {y,x,b,f} (y = kaki dunia, x/b = posisi layar) */
  function tall(g, cx, cy, OX, VW, snow, lockFn) {
    var out = []; LBL.length = 0; if (!okf) return out; labelFont(g); var tm = T * 1000;
    function add(wx, wy, h, fn, ky) { var sx = wx - cx - OX, sb = wy - cy; if (sx < -150 || sx > VW + 150 || sb < -10 || sb > 360 + h) return; out.push({ y: ky == null ? wy : ky, x: sx, b: sb, f: function () { fn(sx, sb); } }); }
    for (var i = 0; i < OB.length; i++) {
      var o = OB[i], wx = o.x * 2, wy = o.y * 2;
      if (o.a) { (function (o) { var treeState = o.a.indexOf('tree') === 0 && typeof lifeTreeObjectState === 'function' ? lifeTreeObjectState(o) : ''; if (treeState === 'hidden') return; if (o.deco === 'mushroom' && typeof lifeMushState === 'function' && lifeMushState(o) === 'hidden') return; add(wx, wy, 120, function (sx, sb) { if (treeState === 'stump') { g.fillStyle = '#60402a'; g.fillRect(sx-7,sb-8,14,8); g.fillStyle = '#b68b50'; g.fillRect(sx-6,sb-9,12,3); g.fillStyle = '#3c2b1b'; g.fillRect(sx-2,sb-5,4,4); } else { var an = o.a.indexOf('tree') == 0 || o.a.indexOf('mush') == 0; Anim.draw(g, o.a, an ? tm + o.x * 41 : 0, sx, sb, false, 2); } }); })(o); continue; }
      if (o.k == 'gate_arch') { add(wx, wy, 74, function (sx, sb) { drawGate(g, sx, sb); }); continue; }
      if (o.k == 'feed_trough') { add(wx, wy, 14, function (sx, sb) { drawFeedTrough(g, sx, sb); }); continue; }
      if ((o.k == 'fence_h' || o.k == 'fence_v') && farmRect() && o.x >= farmRect().x * 16 && o.x < (farmRect().x + farmRect().w) * 16 && o.y > farmRect().y * 16 && o.y <= (farmRect().y + farmRect().h) * 16) continue;   /* pagar ladang digambar ulang di farmFence() */
      var r = V.spr[o.k]; if (!r) continue;
      (function (o, r) { add(wx, wy, r.h * 2, function (sx, sb) {
        var md = (o.c && o.c != 'f' && 'SR'.indexOf(o.c) >= 0 && lockFn(o.c)) ? 'l' : snow ? 's' : '';
        if (/^(b_|house_|stall|tower|windtower)/.test(o.k)) { Anim.shadow(g, sx + 4, sb - 1, r.w * .96, Math.max(5, r.w * .09), .24); }
        var im = md ? variant(o.k, md) : si, a = md ? 0 : r.x, b = md ? 0 : r.y;
        g.drawImage(im, a, b, r.w, r.h, Math.round(sx - r.w), Math.round(sb - r.h * 2), r.w * 2, r.h * 2);
        if (md != 'l' && (r.door || r.win)) {
          var fx0 = Math.round(sx - r.w), fy0 = Math.round(sb - r.h * 2), dp = o.c ? FX.door[o.c] : 0;
          if (r.door && dp > .02) doorFx(g, r.door, fx0, fy0, dp);
          if (r.win && FX.n > .02) winFx(g, r, o, fx0, fy0);
        }
        if (md != 'l' && r.door) { var wn = wallName(o.k); if (wn) LBL.push({ k: 'sign', s: 0, r: r, x: Math.round(sx - r.w), y: Math.round(sb - r.h * 2), nm: wn }); }
        if (md != 'l' && r.sign) LBL.push({ k: 'sign', s: 1, r: r, o: o.k, x: Math.round(sx - r.w), y: Math.round(sb - r.h * 2) });
        if (o.k == 'lamp' && FX.n > .02) LT.push([sx, Math.round(sb - r.h * 2) + 8, 46, .8]);
        if (o.biomeSign || o.placeSign) {   /* plat biome, atau plat tempat (mis. Hutan Jamur) */
          var wp = S && S.world, d = wp ? Math.hypot(wp.x / 32 - o.x / 16, wp.y / 32 - o.y / 16) : 99;
          var alpha = d <= 2.5 ? 1 : Math.max(0, Math.min(1, (7 - d) / 4.5));
          if (alpha > .01) {
            var label = (S && S.set && S.set.lang === 'en' ? o.signNameEn : o.signName) || o.biomeSign || o.placeSign;
            LBL.push({ k: 'label', text: label, x: Math.round(sx), y: Math.round(sb - r.h * 2 - 2), a: alpha });
          }
        } }); })(o, r);
    }
    (V.labels || []).forEach(function (l) {   /* label melayang tanpa plat (mis. Gerbang) */
      add(l.x * 32, l.y * 32, 36, function (sx, sb) {
        var nm = (S && S.set && S.set.lang === 'en' ? l.name_en : l.name) || l.name, wp = S && S.world, d = wp ? Math.hypot(wp.x / 32 - l.x, wp.y / 32 - l.y) : 99, a = d <= 4 ? 1 : Math.max(0, Math.min(1, (9 - d) / 5));
        if (a > .01) LBL.push({ k: 'label', text: nm, x: Math.round(sx), y: Math.round(sb - 26), a: a });
      });
    });
    (V.places || []).forEach(function (p) {
      if (p.sprite || p.noLabel || p.type === 'animal_pen') return;   /* bangunan: papan di dinding; kandang: tanpa nama; noLabel: sudah punya plat sendiri */
      add(p.x * 32 + 16, p.y * 32, 36, function (sx, sb) {
        var nm = (S && S.set && S.set.lang === 'en' ? p.name_en : p.name) || p.name, wp = S && S.world, d = wp ? Math.hypot(wp.x / 32 - p.x, wp.y / 32 - p.y) : 99, a = d <= 3 ? 1 : Math.max(0, Math.min(1, (8 - d) / 5));
        if (a > .01) LBL.push({ k: 'label', text: nm, x: Math.round(sx), y: Math.round(sb - 26), a: a });
      });
    });
    penObjects(add, g); farmFence(add, g);
    if (typeof lifeMovedTrees === 'function') lifeMovedTrees().forEach(function (t) { add(t.x * 2, t.y * 2, 120, function (sx, sb) { Anim.draw(g, t.a, tm + t.x * 41, sx, sb, false, 2); }); });
    g_ = g; farmCrops(add);
    CR.forEach(function (c) { add(c.x * 2, c.y * 2, 70, function (sx, sb) { Anim.draw(g, c.a, c.mv ? tm + c.x * 13 : 0, sx, sb, c.fl, 2); Anim.shadow(g, sx, sb - 1, 9, 3, .25); }); });
    V.smoke.forEach(function (s, k) { add(s.x * 2, s.y * 2 + 2, 120, function (sx, sb) { Anim.draw(g, s.a, tm + k * 700, sx, sb, false, 2); }); });
    var w = V.windmill, tw = OB.filter(function (o) { return o.k == 'windtower'; })[0];
    add(w.x * 2, w.y * 2, 140, function (sx, sb) { Anim.draw(g, 'windmill', tm, sx, sb, false, 2); }, tw ? tw.y * 2 + 1 : null);
    return out;
  }
  return { init: init, ready: ready, data: data, update: update, draw: draw, tall: tall, fx: fx, lights: lights, farm: farm, explore: explore, hud: hud, collisionAt: collisionAt, railSolid: railSolid, hasTag: hasTag, nearService: nearService, nearPen: nearPen, overlay: overlay, labelFont: labelFont };
})();
try { Tmap.init(); } catch (e) { }
