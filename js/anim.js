/* Hero Battle - anim.js
 Skrip klasik. Pemuat atlas Sunnyside World + penggambar animasi + mesin keadaan idle/walk.
 Tidak bergantung pada berkas js lain; aman dimuat sebelum world.js. */
var Anim = (function () {
  var BASE = 'assets/world/';
  var atlas = null, sheets = {}, pending = 0, failed = false, started = false;

  function ready() { return !!atlas && pending === 0 && !failed; }

  function init(base) {
    if (started) return; started = true;
    if (base) BASE = base;
    try {
      fetch(BASE + 'atlas.json').then(function (r) {
        if (!r.ok) throw new Error('atlas ' + r.status); return r.json();
      }).then(function (a) {
        atlas = a;
        Object.keys(a.sheets).forEach(function (k) {
          pending++;
          var im = new Image();
          im.onload = function () { pending--; };
          im.onerror = function () { pending--; failed = true; };
          im.src = BASE + a.sheets[k];
          sheets[k] = im;
        });
      }).catch(function () { failed = true; });
    } catch (e) { failed = true; }
  }

  function has(name) { return ready() && !!atlas.anims[name]; }
  function info(name) { return atlas && atlas.anims[name] || null; }
  function duration(name) { var a = info(name); return a ? a.n * a.d : 0; }

  /* Indeks frame pada waktu t (ms sejak animasi mulai). */
  function frameAt(a, t) {
    var i = Math.floor(Math.max(0, t) / a.d);
    return a.loop ? i % a.n : Math.min(i, a.n - 1);
  }

  /* Gambar animasi `name` dengan titik jangkar (kaki) di (x,y) pada konteks.
 t = ms sejak mulai, flip = cermin horizontal, sc = skala (bulat, default 1).
 Mengembalikan true bila tergambar; false -> pemanggil pakai sprite lama. */
  function draw(ctx, name, t, x, y, flip, sc) {
    if (!ready()) return false;
    var a = atlas.anims[name]; if (!a) return false;
    var im = sheets[a.s]; if (!im || !im.complete || !im.naturalWidth) return false;
    sc = sc || 1;
    var f = frameAt(a, t);
    var sx = a.x + f * a.w;
    var px = Math.round(x), py = Math.round(y);
    var old = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.save(); ctx.translate(px, py); ctx.scale(-1, 1);
      ctx.drawImage(im, sx, a.y, a.w, a.h, -a.ax * sc, -a.ay * sc, a.w * sc, a.h * sc);
      ctx.restore();
    } else {
      ctx.drawImage(im, sx, a.y, a.w, a.h, px - a.ax * sc, py - a.ay * sc, a.w * sc, a.h * sc);
    }
    ctx.imageSmoothingEnabled = old;
    return true;
  }

  /* Bayangan elips di bawah kaki; (x,y) = titik kaki. rx/ry dalam piksel kanvas. */
  function shadow(ctx, x, y, rx, ry, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.28 : alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Mesin keadaan: idle <-> walk (+ aksi sekali jalan via play()).
 prefix: 'avatar' -> animasi 'avatar_idle', 'avatar_walk', 'avatar_dig'.
 Gambar sprite menghadap KANAN; menghadap kiri = flip. Atas/bawah memakai animasi jalan
 yang sama dan mempertahankan arah kiri/kanan terakhir. */
  /* arah dari vektor gerak. null = samping (animasi kiri/kanan); 's','n','se','ne' = pose arah
 (kiri = flip). Dipakai bila atlas punya <prefix>_idle_<arah>/<prefix>_walk_<arah>; kalau tidak -> samping. */
  function dirOf(dx, dy) {
    var ax = Math.abs(dx), ay = Math.abs(dy);
    if (ay < ax * 0.414) return null;
    if (ax < ay * 0.414) return dy > 0 ? 's' : 'n';
    return dy > 0 ? 'se' : 'ne';
  }
  function Actor(prefix) {
    this.prefix = prefix; this.state = 'idle'; this.t0 = 0;
    this.flip = false; this.dir = null; this.lastMove = -1e9; this.action = null; this.onDone = null;
    this.hold = 90;   // ms tetap 'walk' setelah berhenti, anti-kedip saat joystick goyah
  }
  Actor.prototype._set = function (s, now) { if (this.state !== s) { this.state = s; this.t0 = now; } };
  /* dx,dy = arah gerak frame ini (0 bila diam). now = ms (performance.now()). */
  Actor.prototype.update = function (dx, dy, now) {
    now = now == null ? performance.now() : now;
    if (this.action) {
      if (now - this.t0 >= duration(this.prefix + '_' + this.action) || !has(this.prefix + '_' + this.action)) {
        var cb = this.onDone; this.action = null; this.onDone = null; this._set('idle', now); if (cb) cb();
      } else return;
    }
    var moving = dx !== 0 || dy !== 0;
    if (dx < 0) this.flip = true; else if (dx > 0) this.flip = false;
    if (moving) { this.lastMove = now; this.dir = dirOf(dx, dy); }
    this._set(moving || now - this.lastMove < this.hold ? 'walk' : 'idle', now);
  };
  /* Aksi sekali jalan (mis. 'dig'); onDone dipanggil setelah selesai. */
  Actor.prototype.play = function (action, now, onDone) {
    now = now == null ? performance.now() : now;
    if (!has(this.prefix + '_' + action)) { if (onDone) onDone(); return false; }
    this.action = action; this.state = action; this.t0 = now; this.onDone = onDone || null; return true;
  };
  /* Hadapkan ke vektor (dx,dy) tanpa bergerak (mis. NPC menghadap pemain). */
  Actor.prototype.face = function (dx, dy) {
    this.dir = dirOf(dx, dy);
    if (dx < 0) this.flip = true; else if (dx > 0) this.flip = false;
  };
  /* Nama animasi yang akan digambar (pose arah bila ada, kalau tidak samping). */
  Actor.prototype.name = function () {
    var n = this.prefix + '_' + this.state;
    if (this.dir && (this.state === 'idle' || this.state === 'walk')) { var nd = n + '_' + this.dir; if (has(nd)) return nd; }
    return n;
  };
  /* Gambar di jangkar kaki (x,y). Mengembalikan false bila atlas belum siap (pakai fallback). */
  Actor.prototype.draw = function (ctx, x, y, now, sc) {
    now = now == null ? performance.now() : now;
    return draw(ctx, this.name(), now - this.t0, x, y, this.flip, sc);
  };

  return { init: init, ready: ready, has: has, info: info, duration: duration,
           draw: draw, shadow: shadow, Actor: Actor,
           failed: function () { return failed; } };
})();
try { Anim.init(); } catch (e) { /* fallback: dunia lama tetap jalan */ }
