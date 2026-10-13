#!/usr/bin/env python3
"""Tahap 6D: tiap penggantian harus tepat 1 kecocokan, kalau tidak berhenti tanpa menulis apa pun."""
import sys
def patch(path, reps):
    s = open(path, encoding='utf-8').read()
    for old, new in reps:
        c = s.count(old)
        if c != 1: sys.exit(f'GAGAL {path}: {c} kecocokan untuk: {old[:80]!r}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s); print('ok', path)

patch('js/tilemap.js', [
 # fungsi baru: state ladang, tanah petak, tanaman
 ("  function fx(n, door) {",
  "  /* Tahap 6D: ladang hidup. farm(p, now, nm, FC): p = S.farm.p (12 petak, urutan = V.farm), nm = nama tanaman atlas per jenis, FC = daftar jenis (ms). Hanya MEMBACA. */\n"
  "  var FM = null;\n"
  "  function farm(p, now, nm, fc) { FM = (V && V.farm && p) ? { p: p, now: now, nm: nm, fc: fc } : null; }\n"
  "  var TUF = [[-18, -14], [-8, -8], [4, -16], [14, -10], [-12, -3], [10, -2]];\n"
  "  function farmGround(g, cx, cy, OX, VW, snow) {\n"
  "    if (!FM) return; var F = V.farm, i, k, p, px, py;\n"
  "    for (i = 0; i < F.length && i < FM.p.length; i++) {\n"
  "      p = FM.p[i]; if (!p) continue; px = F[i][0] * 2 - cx - OX; py = F[i][1] * 2 - cy; if (px < -40 || px > VW + 40 || py < -10 || py > 400) continue;\n"
  "      if (p.s == 0) { g.fillStyle = '#3f7d3a'; g.fillRect(px - 26, py - 20, 52, 22); g.fillStyle = '#5fae4c'; for (k = 0; k < 6; k++) { g.fillRect(px + TUF[k][0], py + TUF[k][1], 2, 4); g.fillRect(px + TUF[k][0] + 2, py + TUF[k][1] + 2, 2, 2); } }\n"
  "      else { g.fillStyle = '#5a3a20'; g.fillRect(px - 26, py - 20, 52, 22); g.fillStyle = '#3d2615'; g.fillRect(px - 22, py - 15, 44, 3); g.fillRect(px - 22, py - 8, 44, 3); g.fillRect(px - 22, py - 1, 44, 3); }\n"
  "      if (snow) { g.fillStyle = 'rgba(236,243,250,.4)'; g.fillRect(px - 26, py - 20, 52, 22); }\n"
  "    }\n"
  "  }\n"
  "  function farmCrops(add) {\n"
  "    if (!FM) return; var F = V.farm;\n"
  "    F.forEach(function (s, i) {\n"
  "      var p = FM.p[i], nm, q, ripe, st; if (!p || p.s != 2) return; nm = FM.nm[p.c]; if (!nm || !FM.fc[p.c]) return;\n"
  "      q = Math.max(0, Math.min(1, (FM.now - p.t) / FM.fc[p.c].ms)); ripe = q >= 1; st = ripe ? 4 : 1 + Math.min(3, Math.floor(q * 4));   /* frame atlas 1..4 (0 = ikon benih, 5 = ikon hasil) */\n"
  "      add(s[0] * 2, s[1] * 2, 60, function (sx, sb) {\n"
  "        Anim.draw(g_, 'crop_' + nm + '_' + st, 0, sx, sb - 4, false, 2);\n"
  "        if (ripe) { var ph = (T * 2.2 + i * .37) % 1; if (ph < .5) { var ox = sx + (i % 3 - 1) * 9, oy = sb - 46; g_.fillStyle = 'rgba(255,246,176,' + Math.sin(ph * 6.2832).toFixed(2) + ')'; g_.fillRect(ox - 1, oy - 3, 2, 7); g_.fillRect(ox - 3, oy - 1, 7, 2); } }\n"
  "      });\n"
  "    });\n"
  "  }\n"
  "  function fx(n, door) {"),
 # tanah petak di lapisan tanah (setelah buih)
 ("    g.imageSmoothingEnabled = old;\n  }\n  function variant",
  "    farmGround(g, cx, cy, OX, VW, snow);\n    g.imageSmoothingEnabled = old;\n  }\n  function variant"),
 # tanaman ikut urutan objek
 ("    CR.forEach(function (c) { add(",
  "    g_ = g; farmCrops(add);\n    CR.forEach(function (c) { add("),
 ("var FX = { n: 0, door: {} }, LT = [], GL = null;", "var FX = { n: 0, door: {} }, LT = [], GL = null, g_ = null;"),
 ("tall: tall, fx: fx, lights: lights };", "tall: tall, fx: fx, lights: lights, farm: farm };"),
])

patch('js/world.js', [
 ("if(wVon){Tmap.draw(g,cx,cy,OX,VW,wSn);if(Tmap.fx)",
  "if(wVon){if(Tmap.farm&&typeof farmGet!='undefined')Tmap.farm(farmGet().p,Date.now(),WCROP,FC);Tmap.draw(g,cx,cy,OX,VW,wSn);if(Tmap.fx)"),
 ("let wHr=9,wTn=[0,0,0,0,0];",
  "const WCROP=['carrot','pumpkin','cauliflower']; /* Tahap 6D: jenis farm.js (Wortel, Labu, Bunga Bulan) -> nama tanaman atlas */\nlet wHr=9,wTn=[0,0,0,0,0];"),
])

patch('sw.js', [("const VERSION = 'v30';", "const VERSION = 'v31';")])
patch('CREDITS', [("Tahap 6C:", "Tahap 6D: tanaman ladang di dunia memakai frame crop_* yang sudah ada di assets/world/atlas.json/props.png (tanpa aset baru);\nslot petak (village.json: farm) dibuat tools/build_farm.py dari 12 tanaman dekor lama.\n\nTahap 6C:")])
patch('TILESET-NOTES.md', [("## Tahap 6C: bangunan hidup + siang-malam",
 "## Tahap 6D: ladang hidup di dunia\n"
 "- `tools/build_farm.py` (idempoten) memindahkan 12 objek `crop_*` dekor menjadi `farm` = 12 slot [x,y] (urutan = indeks petak farm.js). Bila `farm` tidak ada, dekor lama tampil seperti dulu.\n"
 "- tilemap.js `Tmap.farm(S.farm.p, Date.now(), WCROP, FC)` hanya MEMBACA state; logika farm.js tidak diubah. Petak: rumput (s=0) = tanah hijau + rumput, tanah (s=1) = alur cangkul, tanaman (s=2) = frame atlas 1..4 menurut q=(now-t)/ms (4 = matang, berkilau). Wortel=carrot, Labu=pumpkin, Bunga Bulan=cauliflower (WCROP di world.js).\n\n"
 "## Tahap 6C: bangunan hidup + siang-malam")])
