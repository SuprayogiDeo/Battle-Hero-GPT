/* Hero Battle - tilemap.js (Tahap 5B)
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
  var ZONE = '', ZT = 0, DISC_W = 128;
  var FX = { n: 0, door: {} }, LT = [], GL = null, g_ = null;   /* Tahap 6C: n = tingkat malam 0..1, door = {huruf: 0..1}, LT = cahaya tampak frame ini */
  function glow() { if (GL) return GL; GL = cv(64, 64); var x = GL.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,214,120,.85)'); q.addColorStop(.35, 'rgba(255,180,80,.35)'); q.addColorStop(1, 'rgba(255,150,50,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64); return GL; }
  /* Tahap 6D: ladang hidup. farm(p, now, nm, FC): p = S.farm.p (12 petak, urutan = V.farm), nm = nama tanaman atlas per jenis, FC = daftar jenis (ms). Hanya MEMBACA. */
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
      OB = V.objects || []; ANT=[]; CR=[];
      (V.animals || []).forEach(function(a){ for(var i=0;i<a.n;i++){var z=a.z,ox=z[0]+Math.random()*(z[2]-z[0]),oy=z[1]+Math.random()*(z[3]-z[1]);CR.push({a:a.a,x:ox,y:oy,tx:ox,ty:oy,w:Math.random()*3,fl:Math.random()<.5,mv:0,z:z,sp:a.a=='animal_chicken'?11:a.a=='animal_cow'?6:8});}});
      okf = true;
    } catch(e) { bad=true; }
  }
  function biomeAt(tx, ty) {
    if (!V || !V.biomeRegions) return null;
    for (var i=0;i<V.biomeRegions.length;i++){var b=V.biomeRegions[i];if(tx>=b.x&&ty>=b.y&&tx<b.x+b.w&&ty<b.y+b.h)return b;}
    return null;
  }
  function explore(px, py, disc) {
    if (!V) return disc || ''; var tx=Math.floor(px),ty=Math.floor(py),b=biomeAt(tx,ty);
    /* '*' = seluruh peta sudah dibuka; status ini hanya satu karakter di save lama hb_s4. */
    if(disc==='*'){if(b&&b.id!==ZONE){ZONE=b.id;ZT=3.2;}return '*';}
    var total=V.w*V.h, s=(typeof disc==='string'?disc:'');
    if(s.length!==total)s=s.slice(0,total).padEnd(total,'0');
    var changed=false;
    for(var y=Math.max(0,ty-4);y<=Math.min(V.h-1,ty+4);y++)for(var x=Math.max(0,tx-4);x<=Math.min(V.w-1,tx+4);x++){
      if(Math.hypot(x-tx,y-ty)>4.5)continue;var i=y*V.w+x;if(s.charAt(i)!=='1'){s=s.substring(0,i)+'1'+s.substring(i+1);changed=true;}
    }
    if(b&&b.id!==ZONE){ZONE=b.id;ZT=3.2;}
    return changed?s:(disc||s);
  }
  function hud(g, disc, px, py, OX, VW, dt) {
    if(!V)return;ZT=Math.max(0,ZT-(dt||0));var uiScale=[.9,1,1.1][Math.max(0,Math.min(2,Math.round(Number(S&&S.set&&S.set.ui)||0))) ]||1,x0=4,y0=4,w=100*uiScale,h=76*uiScale,size=V.w+'x'+V.h,discKey=disc||'';
    /* Main biome silhouettes are visible from the start, but undiscovered tile detail stays muted.
       Cache the raster so the phone HUD does not redraw 12k map tiles every animation frame. */
    if(!MAPC||MAPD!==discKey||MAPSIZE!==size){
      MAPC=cv(V.w,V.h);var mg=MAPC.getContext('2d');mg.imageSmoothingEnabled=false;
      for(var ty=0;ty<V.h;ty++)for(var tx=0;tx<V.w;tx++){
        var b=biomeAt(tx,ty),col=b&&b.color||'#6f9b58',ch=V.grid&&V.grid[ty]?V.grid[ty].charAt(tx):'.',seen=discKey==='*'||discKey.charAt(ty*V.w+tx)==='1';
        if(seen){if(ch==='~')col='#398ec0';else if(ch===',')col='#b7a071';else if(ch==='X'||ch==='T')col='#3c4c36';else if(ch==='S'||ch==='R'||ch==='G'||ch==='Q'||ch==='F'||ch==='p'||ch==='f')col='#d4bf7b';}
        mg.fillStyle=col;mg.fillRect(tx,ty,1,1);if(!seen){mg.fillStyle='rgba(18,26,29,.58)';mg.fillRect(tx,ty,1,1);}
      }
      MAPD=discKey;MAPSIZE=size;
    }
    g.save();g.globalAlpha=.94;g.fillStyle='#17251d';g.fillRect(x0-3,y0-3,w+6,h+6);g.fillStyle='#304c37';g.fillRect(x0,y0,w,h);g.drawImage(MAPC,x0,y0,w,h);
    g.fillStyle='#f7f0d0';g.fillRect(x0+px/V.w*w-1.5,y0+py/V.h*h-1.5,4,4);g.strokeStyle='#d8e8d5';g.lineWidth=1;g.strokeRect(x0+.5,y0+.5,w-1,h-1);g.restore();
  }
  function chunkKey(x,y){return x+'_'+y;}
  function collisionAt(tx,ty){
    if(!V||tx<0||ty<0||tx>=V.w||ty>=V.h)return true;
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
    if (!okf) return; T += dt;
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
    var out = []; if (!okf) return out; var tm = T * 1000;
    function add(wx, wy, h, fn, ky) { var sx = wx - cx - OX, sb = wy - cy; if (sx < -150 || sx > VW + 150 || sb < -10 || sb > 360 + h) return; out.push({ y: ky == null ? wy : ky, x: sx, b: sb, f: function () { fn(sx, sb); } }); }
    for (var i = 0; i < OB.length; i++) {
      var o = OB[i], wx = o.x * 2, wy = o.y * 2;
      if (o.a) { (function (o) { var treeState = o.a.indexOf('tree') === 0 && typeof lifeTreeObjectState === 'function' ? lifeTreeObjectState(o) : ''; if (treeState === 'hidden') return; add(wx, wy, 120, function (sx, sb) { if (treeState === 'stump') { g.fillStyle = '#60402a'; g.fillRect(sx-7,sb-8,14,8); g.fillStyle = '#b68b50'; g.fillRect(sx-6,sb-9,12,3); g.fillStyle = '#3c2b1b'; g.fillRect(sx-2,sb-5,4,4); } else { var an = o.a.indexOf('tree') == 0; Anim.draw(g, o.a, an ? tm + o.x * 41 : 0, sx, sb, false, 2); } }); })(o); continue; }
      if (o.k == 'gate_arch') { add(wx, wy, 74, function (sx, sb) { drawGate(g, sx, sb); }); continue; }
      if (o.k == 'feed_trough') { add(wx, wy, 14, function (sx, sb) { drawFeedTrough(g, sx, sb); }); continue; }
      var r = V.spr[o.k]; if (!r) continue;
      (function (o, r) { add(wx, wy, r.h * 2, function (sx, sb) {
        var md = (o.c && o.c != 'f' && 'SR'.indexOf(o.c) >= 0 && lockFn(o.c)) ? 'l' : snow ? 's' : '';
        var im = md ? variant(o.k, md) : si, a = md ? 0 : r.x, b = md ? 0 : r.y;
        g.drawImage(im, a, b, r.w, r.h, Math.round(sx - r.w), Math.round(sb - r.h * 2), r.w * 2, r.h * 2);
        if (md != 'l' && (r.door || r.win)) {
          var fx0 = Math.round(sx - r.w), fy0 = Math.round(sb - r.h * 2), dp = o.c ? FX.door[o.c] : 0;
          if (r.door && dp > .02) doorFx(g, r.door, fx0, fy0, dp);
          if (r.win && FX.n > .02) winFx(g, r, o, fx0, fy0);
        }
        if (o.k == 'lamp' && FX.n > .02) LT.push([sx, Math.round(sb - r.h * 2) + 8, 46, .8]);
        if (o.biomeSign) {
          var wp = S && S.world, d = wp ? Math.hypot(wp.x / 32 - o.x / 16, wp.y / 32 - o.y / 16) : 99;
          var alpha = d <= 2.5 ? 1 : Math.max(0, Math.min(1, (7 - d) / 4.5));
          if (alpha > .01) {
            var label = (S && S.set && S.set.lang === 'en' ? o.signNameEn : o.signName) || o.biomeSign;
            g.save();g.globalAlpha = alpha;g.font = 'bold 9px system-ui';g.textAlign = 'center';g.textBaseline = 'bottom';
            g.lineWidth = 3;g.strokeStyle = 'rgba(16,24,17,.94)';g.strokeText(label, sx, Math.round(sb - r.h * 2 - 2));
            g.fillStyle = '#fff0b0';g.fillText(label, sx, Math.round(sb - r.h * 2 - 2));g.restore();
          }
        } }); })(o, r);
    }
    (V.places || []).forEach(function (p) { add(p.x * 32, p.y * 32, 36, function (sx, sb) {
      if(p.type==='mushroom_grove'){
        function mush(mx,my,sc,cap){g.fillStyle='#382b3b';g.fillRect(mx-4*sc,my-11*sc,8*sc,6*sc);g.fillRect(mx-2*sc,my-5*sc,4*sc,5*sc);g.fillStyle=cap;g.fillRect(mx-6*sc,my-12*sc,12*sc,4*sc);g.fillRect(mx-4*sc,my-15*sc,8*sc,4*sc);g.fillStyle='#fff0c7';g.fillRect(mx-2*sc,my-10*sc,2*sc,2*sc);}
        mush(sx-10,sb-2,1,'#bf5366');mush(sx+1,sb-1,.8,'#e2be79');mush(sx+12,sb-2,1,'#8b6bc0');
      }
      g.fillStyle = '#5b3822'; g.fillRect(sx - 2, sb - 20, 4, 20); g.fillStyle = p.type === 'pier' ? '#4b91b7' : p.type === 'orchard' ? '#6aaf55' : p.type === 'mushroom_grove' ? '#b27abf' : '#d9b45d'; g.fillRect(sx - 12, sb - 34, 24, 15); g.strokeStyle = '#382c24'; g.lineWidth = 1; g.strokeRect(sx - 12.5, sb - 34.5, 25, 16); g.fillStyle = '#201d18'; g.font = 'bold 7px system-ui'; g.textAlign = 'center'; g.fillText((S && S.set && S.set.lang === 'en' ? p.name_en : p.name) || p.name, sx, sb - 24); }); });
    g_ = g; farmCrops(add);
    CR.forEach(function (c) { add(c.x * 2, c.y * 2, 70, function (sx, sb) { Anim.draw(g, c.a, c.mv ? tm + c.x * 13 : 0, sx, sb, c.fl, 2); Anim.shadow(g, sx, sb - 1, 9, 3, .25); }); });
    V.smoke.forEach(function (s, k) { add(s.x * 2, s.y * 2 + 2, 120, function (sx, sb) { Anim.draw(g, s.a, tm + k * 700, sx, sb, false, 2); }); });
    var w = V.windmill, tw = OB.filter(function (o) { return o.k == 'windtower'; })[0];
    add(w.x * 2, w.y * 2, 140, function (sx, sb) { Anim.draw(g, 'windmill', tm, sx, sb, false, 2); }, tw ? tw.y * 2 + 1 : null);
    return out;
  }
  return { init: init, ready: ready, data: data, update: update, draw: draw, tall: tall, fx: fx, lights: lights, farm: farm, explore: explore, hud: hud, collisionAt: collisionAt, hasTag: hasTag, nearService: nearService };
})();
try { Tmap.init(); } catch (e) { }
