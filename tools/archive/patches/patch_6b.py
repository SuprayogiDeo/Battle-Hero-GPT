#!/usr/bin/env python3
"""Tahap 6B: memperluas build_village.py + village_design.txt + tilemap.js. Tiap penggantian harus tepat 1 kecocokan."""
import sys
def patch(path, reps):
    s = open(path, encoding='utf-8').read()
    for old, new in reps:
        c = s.count(old)
        if c != 1: sys.exit(f'GAGAL {path}: {c} kecocokan untuk: {old[:80]!r}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s); print('ok', path)

TERRAIN = r'''
# ================= Tahap 6B: chamfer jalan, sungai + jembatan + air terjun, pasir, tebing bertingkat =================
EXTRA = set()      # sel yang tidak boleh ditumbuhi pohon/semak/bunga acak
# -- sudut jalan miring: Path 01 arr 1,2,4,8 = tile jalan dengan satu sudut terpotong (TL,TR,BL,BR); tile transparan -> rumput di bawah
S1 = SETS['Path 01']
for (a, b, c, d) in CHR:
    for (x, y, k, dx, dy) in ((a, b, 1, -1, -1), (c, b, 2, 1, -1), (a, d, 4, -1, 1), (c, d, 8, 1, 1)):
        if (x, y) in roads and (x + dx, y) not in roads and (x, y + dy) not in roads:
            ground[R(x, y)] = reg([(rnd.choice(GV), 0)]); decor[R(x, y)] = reg([(S1[k], 0)])
            decor[R(x + dx, y + dy)] = 0       # serpihan sudut lama (akan menggantung di udara)
# -- sungai (set River; semua tile opak: tepi memakai tile tunggal, tidak digabung)
S_R = SETS['River']; rcells = set(); RIV = []
for p in D['river']:
    rx, ry0, ry1 = map(int, p[:3]); RIV.append((rx, ry0, ry1))
    for y in range(ry0, ry1 + 1): rcells.add((rx, y))
for (x, y) in rcells:
    ground[R(x, y)] = reg([(S_R[0], 0)]); grid[y][x] = '~'; EXTRA.add((x, y))
cand = set()
for (x, y) in rcells:
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            n = (x + dx, y + dy)
            if n not in rcells and X0 + 1 <= n[0] <= X0 + IW - 2 and Y0 + 1 <= n[1] <= Y0 + IH - 2: cand.add(n)
for (x, y) in sorted(cand):
    if (x, y) in roads: continue          # sel jalan di titik jembatan ditimpa lantai jembatan
    parts = []
    if (x, y + 1) in rcells: parts.append(S_R[3])
    if (x, y - 1) in rcells: parts.append(S_R[12])
    if (x + 1, y) in rcells: parts.append(S_R[5])
    if (x - 1, y) in rcells: parts.append(S_R[10])
    if (x + 1, y + 1) in rcells and (x + 1, y) not in rcells and (x, y + 1) not in rcells: parts.append(S_R[7])
    if (x - 1, y + 1) in rcells and (x - 1, y) not in rcells and (x, y + 1) not in rcells: parts.append(S_R[11])
    if (x + 1, y - 1) in rcells and (x + 1, y) not in rcells and (x, y - 1) not in rcells: parts.append(S_R[13])
    if (x - 1, y - 1) in rcells and (x - 1, y) not in rcells and (x, y - 1) not in rcells: parts.append(S_R[14])
    if parts:
        if len(parts) > 1: print('! sungai: sel', x, y, 'butuh', len(parts), 'bagian (River opak, hanya yang pertama dipakai)')
        ground[R(x, y)] = reg([(parts[0], 0)]); EXTRA.add((x, y))
# -- jembatan kayu (templat Room1: lantai 808 3 sel lebar, pagar 980/919/920/400, tiang 398)
for p in D['bridge']:
    rx, y0, y1 = map(int, p[:3])
    for y in range(y0, y1 + 1):
        for x in (rx - 1, rx, rx + 1):
            ground[R(x, y)] = reg([(S_R[0], 0), (808, 0)]); grid[y][x] = ','; EXTRA.add((x, y))
    for k, (i, f) in enumerate([(980, 0), (919, 0), (920, 0), (919, 1), (980, 1)]): put(over, rx - 2 + k, y0 - 1, i, f)
    for k, (i, f) in enumerate([(400, 0), (919, 0), (920, 0), (919, 1), (400, 1)]): put(over, rx - 2 + k, y1, i, f)
    put(over, rx - 2, y0, 398, 4); put(over, rx + 2, y0, 398, 6)
# -- air terjun: sungai yang mencapai dasar pulau menuruni tebing (templat Room1 x37-39,y39-42)
for (rx, ry0, ry1) in RIV:
    if ry1 == Y0 + IH - 2:
        Bw = Y0 + IH - 1
        put(ground, rx - 1, Bw, S_R[5]); put(ground, rx, Bw, 859, 4); put(ground, rx + 1, Bw, S_R[10]); put(over, rx, Bw, 1420)
        put(ground, rx - 1, Bw + 1, 418); put(ground, rx, Bw + 1, 478); put(ground, rx + 1, Bw + 1, 418, 1)
        put(ground, rx - 1, Bw + 2, 418); put(ground, rx, Bw + 2, 414); put(ground, rx + 1, Bw + 2, 418, 1)
        put(over, rx, Bw + 2, 1421); ground[R(rx, Bw + 3)] = 0
        put(over, rx - 1, Bw + 3, 1422); put(over, rx, Bw + 3, 412, 3)
# -- pantai (Path 03 = pasir)
sandc = cellsOf([tuple(map(int, p[:4])) for p in D['sand']])
autopath(sandc, 'Path 03'); EXTRA |= sandc
# -- tebing bertingkat: tepi bawah + muka tebing + bayangan memakai tile sisi pulau Room1 (261/262/263, 266/267/203/147)
LEDGES = []
for p in D['ledge']:
    lx0, lx1, ly = int(p[0]), int(p[1]), int(p[2]); gx = int(p[p.index('gap') + 1]) if 'gap' in p else None
    LEDGES.append((lx0, lx1, ly, gx))
    for x in range(lx0, lx1 + 1):
        lf, rt = x == lx0, x == lx1
        put(ground, x, ly, 261)      # ujung tidak memakai sudut 262/263/266/147 (berisi laut); muka tebing bolak-balik saja
        k = (x - lx0) % 2
        put(ground, x, ly + 1, 267 if k == 0 else 203, 4 if k == 0 else 0); put(ground, x, ly + 2, 203 if k == 0 else 267, 0 if k == 0 else 4)
        put(shadow, x, ly + 3, 76)
        for yy in range(ly, ly + 4): EXTRA.add((x, yy))
        if x != gx: grid[ly + 1][x] = 'X'; grid[ly + 2][x] = 'X'
'''

PROPS = r'''
# ---------- Tahap 6B: properti (peti, tong, papan, lentera, tangga, bangku, karung, hiasan pantai) ----------
LADDERS = [(gx, ly) for (lx0, lx1, ly, gx) in LEDGES if gx is not None]
for (gx, ly) in LADDERS: OBJ.append(dict(k='ladder', x=gx * 16 + 8, y=(ly + 3) * 16, c=''))
for p in D['prop']:
    name, cx, cy = p[0], int(p[1]), int(p[2]); mode = p[3] if len(p) > 3 else 'solid'
    if name not in SPR: print('! prop tidak dikenal', name); continue
    w, h = SPR[name].size; n = math.ceil(w / 16); l = cx - (n - 1) // 2
    if mode == 'flat':
        if grid[cy][cx] in '.,': OBJ.append(dict(k=name, x=cx * 16 + 8, y=cy * 16 + 14, c='f'))
        else: print('! prop flat tidak muat', name, cx, cy, grid[cy][cx])
        continue
    cells = [(xx, cy) for xx in range(l, l + n)]
    if any(grid[yy][xx] not in '.,' or (xx, yy) in used for (xx, yy) in cells): print('! prop bentrok', name, cx, cy); continue
    for (xx, yy) in cells:
        grid[yy][xx] = 'X'; used.add((xx, yy)); EXTRA.add((xx, yy))
    OBJ.append(dict(k=name, x=int((l + n / 2) * 16), y=(cy + 1) * 16, c=''))
'''

SPRITES = r'''
# ---------- Tahap 6B: sprite properti tambahan (indeks komponen = urutan komponen terhubung Room1, lihat ASSET-NOTES) ----------
for name, (src, k) in {'crate': ('d', 237), 'crates': ('b', 84), 'barrel': ('d', 32), 'barrel2': ('d', 247), 'board': ('d', 313),
                       'sack': ('d', 11), 'sack2': ('d', 12), 'pot': ('d', 122), 'ladder': ('d', 118), 'bench': ('b', 102),
                       'crab': ('d', 13), 'star': ('d', 368), 'star2': ('d', 7)}.items():
    SPR[name] = cut(src, k)
_pole, _lant = cut('d', 265), cut('b', 62)          # lentera = tiang + lampu menyala
_lamp = Image.new('RGBA', (12, _pole.height + 6), (0, 0, 0, 0)); _lamp.alpha_composite(_pole, (2, 6)); _lamp.alpha_composite(_lant, (1, 0))
SPR['lamp'] = _lamp.crop(_lamp.getbbox())
'''

REACH = r'''
# ---------- Tahap 6B: uji jangkauan (BFS tingkat sel dari titik spawn) ----------
from collections import deque
_seen = {SPAWN}; _q = deque([SPAWN])
while _q:
    _x, _y = _q.popleft()
    for _dx, _dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        _n = (_x + _dx, _y + _dy)
        if 0 <= _n[0] < W and 0 <= _n[1] < H and _n not in _seen and grid[_n[1]][_n[0]] in '.,p': _seen.add(_n); _q.append(_n)
_bad = [f'npc {k}' for k, v in npcs.items() if v not in _seen]
for _k, _b in BLD.items():
    _acc = [(x, _b[0][3] + 1) for x in range(_b[0][0], _b[0][2] + 1)] if _k != 'F' else [(_b[0][0] + 5, _b[0][1] - 1), (_b[0][0] + 5, _b[0][3] + 1)]
    if not any(c in _seen for c in _acc): _bad.append('akses ' + _k)
for (gx, ly) in LADDERS:
    if (gx, ly) not in _seen or (gx, ly + 3) not in _seen: _bad.append(f'tangga {gx},{ly}')
print('jangkauan dari spawn:', len(_seen), 'sel;', 'MASALAH: ' + ', '.join(_bad) if _bad else 'semua NPC/bangunan/tangga terjangkau')
'''

patch('tools/build_village.py', [
 ("D = {'road': [], 'plot': [], 'obj': [], 'fence': [], 'animals': [], 'smoke': [], 'scatter': [], 'npc': []}",
  "D = {'road': [], 'plot': [], 'obj': [], 'fence': [], 'animals': [], 'smoke': [], 'scatter': [], 'npc': [],\n     'river': [], 'bridge': [], 'ledge': [], 'sand': [], 'prop': []}\nCHR = []   # persegi jalan yang sudut cembungnya dipotong (chamfer, flag 'c')"),
 ("    elif c in ('road', 'plot'): D[c].append(tuple(map(int, p[1:5])))",
  "    elif c in ('road', 'plot'):\n        D[c].append(tuple(map(int, p[1:5])))\n        if len(p) > 5 and p[5] == 'c': CHR.append(tuple(map(int, p[1:5])))"),
 ("ground = [0] * (W * H); decor = [0] * (W * H); shadow = [0] * (W * H)",
  "ground = [0] * (W * H); decor = [0] * (W * H); shadow = [0] * (W * H); over = [0] * (W * H)"),
 ("# ---------- sprite ----------\nbld = render(", TERRAIN + "\n# ---------- sprite ----------\nbld = render("),
 ("# ---------- objek ----------\nOBJ = []",
  "# ---------- objek ----------\nOBJ = []"),
 ("SPR['fence_v'] = dec.crop((vx0, vy0 + 32, vx1, vy0 + 48)); SPR['fence_v'] = SPR['fence_v'].crop(SPR['fence_v'].getbbox())\n",
  "SPR['fence_v'] = dec.crop((vx0, vy0 + 32, vx1, vy0 + 48)); SPR['fence_v'] = SPR['fence_v'].crop(SPR['fence_v'].getbbox())\n" + SPRITES),
 ("# scatter\ndef ok(x, y, rng=1):", PROPS + "# scatter\ndef ok(x, y, rng=1):"),
 ("            if grid[yy][xx] != '.' or (xx, yy) in used or (xx, yy) in roads or decor[R(xx, yy)]: return False",
  "            if grid[yy][xx] != '.' or (xx, yy) in used or (xx, yy) in roads or (xx, yy) in EXTRA or decor[R(xx, yy)]: return False"),
 ("            if not ok(x, y, 0) or not fl: continue\n            used.add((x, y));",
  "            if not ok(x, y, 0) or not fl: continue\n            used.add((x, y));"),
 ("layers=dict(ground=ground, shadow=shadow, decor=decor, collision=",
  "layers=dict(ground=ground, shadow=shadow, decor=decor, over=over, collision="),
 ("    for L in ('ground', 'shadow', 'decor'):\n        for i, v in enumerate(out['layers'][L]):",
  "    for L in ('ground', 'shadow', 'decor', 'over'):\n        for i, v in enumerate(out['layers'][L]):"),
 ("json.dump(out, open(os.path.join(WD, 'village.json'), 'w'), separators=(',', ':'))",
  REACH + "json.dump(out, open(os.path.join(WD, 'village.json'), 'w'), separators=(',', ':'))"),
])

patch('js/tilemap.js', [
 ("      ['ground', 'shadow', 'decor'].forEach(function (L) {\n        var a = V.layers[L];\n",
  "      ['ground', 'shadow', 'decor', 'over'].forEach(function (L) {   /* 'over' (Tahap 6B): pagar jembatan, buih air terjun */\n        var a = V.layers[L]; if (!a) return;\n"),
])

patch('tools/village_design.txt', [
 ("road 29 6 32 35           # jalan utama utara-selatan (lewat gerbang)",
  "road 29 6 32 35           # jalan utama utara-selatan (lewat gerbang)"),
 ("road 27 20 34 26          # plaza tengah", "road 27 20 34 26 c        # plaza tengah (c = sudut cembung dipotong, Path arr 1,2,4,8)"),
 ("road 18 20 20 21          # ke Toko", "road 18 20 20 21 c        # ke Toko"),
 ("road 43 20 45 21          # ke Barak", "road 43 20 45 21 c        # ke Barak"),
 ("road 12 20 13 21          # ke rumah ungu", "road 12 20 13 21 c        # ke rumah ungu"),
 ("road 33 17 37 18          # ke Papan Misi", "road 33 17 37 18 c        # ke Papan Misi"),
 ("road 48 20 49 21          # ke rumah oranye", "road 48 20 49 21 c        # ke rumah oranye"),
 ("plot 9 29 18 33           # petak ladang (tanah)",
  "plot 9 29 18 33           # petak ladang (tanah)\n"
  "# ---- Tahap 6B ----\n"
  "river 24 7 35             # sungai 1 sel x y0 y1 (sampai dasar pulau -> air terjun otomatis)\n"
  "bridge 24 22 24           # jembatan di atas sungai x, baris y0..y1 (menimpa jalan silang)\n"
  "sand 53 18 54 34          # pantai timur (Path 03)\n"
  "ledge 39 52 14 gap 48     # tebing bertingkat x0 x1 y(tepi), celah tangga di x=48\n"
  "prop lamp 28 12\nprop lamp 33 12\nprop lamp 28 28\nprop lamp 33 28\nprop lamp 35 21\nprop lamp 26 25\nprop lamp 21 21\n"
  "prop board 28 9\nprop board 33 9\nprop board 37 23\n"
  "prop crate 16 20\nprop barrel 22 20\nprop barrel2 23 20\nprop crates 40 20\nprop barrel 48 18\nprop sack 38 16\nprop sack2 38 15\n"
  "prop sack 20 29\nprop sack2 20 31\nprop barrel 7 30\nprop crate 7 32\nprop bench 36 25\nprop pot 21 19\n"
  "prop crab 53 22 flat\nprop star 54 26 flat\nprop star2 53 30 flat\nprop crab 54 33 flat\nprop star 54 20 flat"),
 ("npc merchant 22 23", "npc merchant 20 23"),
])
