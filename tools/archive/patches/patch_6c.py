#!/usr/bin/env python3
"""Tahap 6C: tiap penggantian harus tepat 1 kecocokan, kalau tidak berhenti tanpa menulis apa pun."""
import sys
def patch(path, reps):
    s = open(path, encoding='utf-8').read()
    for old, new in reps:
        c = s.count(old)
        if c != 1: sys.exit(f'GAGAL {path}: {c} kecocokan untuk: {old[:80]!r}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s); print('ok', path)

# ---------------- tilemap.js ----------------
patch('js/tilemap.js', [
 # state + glow sprite
 ("var pend = 0, bad = false, okf = false, ANT = [], OB = [], CR = [], T = 0, VC = {};",
  "var pend = 0, bad = false, okf = false, ANT = [], OB = [], CR = [], T = 0, VC = {};\n"
  "  var FX = { n: 0, door: {} }, LT = [], GL = null;   /* Tahap 6C: n = tingkat malam 0..1, door = {huruf: 0..1}, LT = cahaya tampak frame ini */\n"
  "  function glow() { if (GL) return GL; GL = cv(64, 64); var x = GL.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,214,120,.85)'); q.addColorStop(.35, 'rgba(255,180,80,.35)'); q.addColorStop(1, 'rgba(255,150,50,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64); return GL; }\n"
  "  function fx(n, door) { FX.n = n || 0; FX.door = door || {}; LT.length = 0; }\n"
  "  /* pintu terbuka: celah gelap melebar dari tengah + cahaya hangat dari dalam */\n"
  "  function doorFx(g, d, x, y, p) {\n"
  "    var w = d[2] * 2, h = d[3] * 2, ow = Math.max(2, Math.round(w * p)), dx = Math.round(x + d[0] * 2 + (w - ow) / 2), dy = Math.round(y + d[1] * 2);\n"
  "    g.fillStyle = '#150d1c'; g.fillRect(dx, dy, ow, h);\n"
  "    var q = g.createLinearGradient(0, dy, 0, dy + h); q.addColorStop(0, 'rgba(255,200,110,0)'); q.addColorStop(1, 'rgba(255,200,110,.6)'); g.fillStyle = q; g.fillRect(dx, dy, ow, h);\n"
  "    g.fillStyle = 'rgba(255,225,150,.9)'; g.fillRect(dx, dy + h - 2, ow, 2);\n"
  "  }\n"
  "  /* jendela menyala di malam hari (sebelum tint); 80% jendela menyala, deterministik */\n"
  "  function winFx(g, r, o, x, y) {\n"
  "    var a = FX.n, i, k; g.fillStyle = 'rgba(255,213,120,' + Math.min(1, a * 1.4).toFixed(2) + ')';\n"
  "    for (i = 0; i < r.win.length; i++) {\n"
  "      if ((((o.x * 7 + o.y * 3 + i * 5) % 10) + 10) % 10 > 7) continue; k = r.win[i];\n"
  "      var wx = x + k[0] * 2, wy = y + k[1] * 2; g.fillRect(wx, wy, k[2] * 2, k[3] * 2);\n"
  "      LT.push([wx + k[2], wy + k[3], 20, .55, wx, wy, k[2] * 2, k[3] * 2]);\n"
  "    }\n"
  "  }\n"
  "  /* lapisan cahaya aditif: dipanggil world.js SETELAH tint malam supaya tetap terang */\n"
  "  function lights(g) {\n"
  "    if (FX.n < .02 || !LT.length) return; var old = g.globalCompositeOperation, i, l, im = glow(); g.globalCompositeOperation = 'lighter';\n"
  "    for (i = 0; i < LT.length; i++) {\n"
  "      l = LT[i]; g.globalAlpha = Math.min(1, FX.n * l[3]); g.drawImage(im, l[0] - l[2], l[1] - l[2], l[2] * 2, l[2] * 2);\n"
  "      if (l.length > 4) { g.globalAlpha = FX.n * .35; g.fillStyle = '#a07828'; g.fillRect(l[4], l[5], l[6], l[7]); }\n"
  "    }\n"
  "    g.globalAlpha = 1; g.globalCompositeOperation = old;\n"
  "  }"),
 # sprite draw: pintu + jendela
 ("g.drawImage(im, a, b, r.w, r.h, Math.round(sx - r.w), Math.round(sb - r.h * 2), r.w * 2, r.h * 2); }); })(o, r);",
  "g.drawImage(im, a, b, r.w, r.h, Math.round(sx - r.w), Math.round(sb - r.h * 2), r.w * 2, r.h * 2);\n"
  "        if (md != 'l' && (r.door || r.win)) {\n"
  "          var fx0 = Math.round(sx - r.w), fy0 = Math.round(sb - r.h * 2), dp = o.c ? FX.door[o.c] : 0;\n"
  "          if (r.door && dp > .02) doorFx(g, r.door, fx0, fy0, dp);\n"
  "          if (r.win && FX.n > .02) winFx(g, r, o, fx0, fy0);\n"
  "        }\n"
  "        if (o.k == 'lamp' && FX.n > .02) LT.push([sx, Math.round(sb - r.h * 2) + 8, 46, .8]); }); })(o, r);"),
])
patch('js/tilemap.js', [
 ("return { init: init, ready: ready, data: data, update: update, draw: draw, tall: tall };",
  "return { init: init, ready: ready, data: data, update: update, draw: draw, tall: tall, fx: fx, lights: lights };"),
])

# ---------------- world.js ----------------
patch('js/world.js', [
 ("const WBM={};WBLD.forEach(b=>WBM[b.c]=b);",
  "/* ---- Tahap 6C: siklus siang-malam (tint kanvas), pintu terbuka, jendela & lentera menyala (cahaya digambar di tilemap.js) ----\n"
  "   S.set.dn: 0 = siklus cepat (6 menit/hari, mulai pagi), 1 = jam perangkat, 2 = siang tetap. Jam game tidak disimpan (sengaja, tanpa ubah save). */\n"
  "let wHr=9,wTn=[0,0,0,0,0];const wDoor={S:0,R:0};\n"
  "const WTK=[[0,10,16,64,.6],[5,18,24,70,.54],[6.5,255,140,70,.2],[8,255,205,150,0],[16.5,255,205,150,0],[18,255,120,50,.2],[19.5,60,40,100,.38],[21,10,16,64,.6],[24,10,16,64,.6]];\n"
  "function wTone(h){let i=1;while(i<WTK.length-1&&WTK[i][0]<h)i++;const a=WTK[i-1],b=WTK[i],k=(h-a[0])/(b[0]-a[0]),m=j=>a[j]+(b[j]-a[j])*k,al=m(4);return[m(1)|0,m(2)|0,m(3)|0,al,Math.max(0,Math.min(1,(al-.1)/.25))]}\n"
  "function wFx(dt){const m=S.set.dn|0;let h=-1;if(m==0){wHr=(wHr+dt*24/360)%24;h=wHr}else if(m==1){const d=new Date();h=d.getHours()+d.getMinutes()/60}wTn=h<0?[0,0,0,0,0]:wTone(h);\n"
  "for(const c in wDoor){const tg=(wNear&&wNear.c==c&&!wLock(c)&&!wDlg&&!wTalk)?1:0;wDoor[c]+=(tg-wDoor[c])*Math.min(1,dt*9)}}\n"
  "function wTint(){if(wTn[3]>.01){g.fillStyle='rgba('+wTn[0]+','+wTn[1]+','+wTn[2]+','+wTn[3].toFixed(3)+')';g.fillRect(-OX,0,VW,360)}if(wVon&&self.Tmap&&Tmap.lights)Tmap.lights(g)}\n"
  "const WBM={};WBLD.forEach(b=>WBM[b.c]=b);"),
 ("wNpc=self.npcNear?npcNear(w.x,w.y):null}", "wNpc=self.npcNear?npcNear(w.x,w.y):null;wFx(dt)}"),
 ("if(wVon){Tmap.draw(g,cx,cy,OX,VW,wSn);tall.push(", "if(wVon){Tmap.draw(g,cx,cy,OX,VW,wSn);if(Tmap.fx)Tmap.fx(wTn[4],wDoor);tall.push("),
 ("if(self.npcDraw)npcDraw(cx,cy,w.y,1);dT(tall.filter(o=>o.y>w.y));", "if(self.npcDraw)npcDraw(cx,cy,w.y,1);dT(tall.filter(o=>o.y>w.y));wTint();"),
])

# ---------------- settings.js ----------------
patch('js/settings.js', [
 ("const nx=()=>{const v=y;y+=27;return v};", "const nx=()=>{const v=y;y+=25;return v};"),
 ("q.season|0,i=>q.season=i);",
  "q.season|0,i=>q.season=i);\nseg('Siang-malam (dunia)',['SIKLUS CEPAT','JAM PERANGKAT','SIANG TETAP'],q.dn|0,i=>q.dn=i);"),
])

# ---------------- i18n.js ----------------
patch('js/i18n.js', [
 ("const ENK=Object.keys(EN)",
  "Object.assign(EN,{\"Siang-malam (dunia)\": \"Day/night (world)\", \"SIKLUS CEPAT\": \"FAST CYCLE\", \"JAM PERANGKAT\": \"DEVICE CLOCK\", \"SIANG TETAP\": \"ALWAYS DAY\"});\nconst ENK=Object.keys(EN)"),
])

# ---------------- sw.js ----------------
patch('sw.js', [("const VERSION = 'v29';", "const VERSION = 'v30';")])

# ---------------- CREDITS ----------------
patch('CREDITS', [("Tahap 5B: assets/world/tiles.png",
  "Tahap 6C: jendela/pintu pada assets/world/village.json (spr.*.win/.door) dideteksi dari sprites.png (turunan paket yang sama) oleh tools/build_lights.py;\nefek cahaya/tint digambar lewat kode (tanpa aset baru).\n\nTahap 5B: assets/world/tiles.png")])
