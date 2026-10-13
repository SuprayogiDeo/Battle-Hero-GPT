#!/usr/bin/env python3
"""Hero Battle - build_village.py (Tahap 5B)
Membuat assets/world/village.json + tiles.png + sprites.png dari desain teks tools/village_design.txt
memakai Sunnyside World (tileset + Room1 contoh dari folder Gamemaker). Perlu: pillow numpy scipy.
Pakai: python3 tools/build_village.py <folder Sunnyside_World_ASSET_PACK_V2.1> [proyek=.] [--preview file.png]
Aturan autotile (diturunkan dari Room1 / definisi tileset .yy, lihat TILESET-NOTES.md):
 - pulau: templat 'Land' (rim 196/198/259/261, sudut 200/260/262/263, tebing 266/267/203/147/148/403, bayangan 76/77)
 - jalan/tanah: set 'Path 01/02' = tile penuh + rim pada sel rumput bersebelahan + serpihan sudut pada sel diagonal.
"""
import sys, os, re, json, random, math
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
args = [a for a in sys.argv[1:] if not a.startswith('--')]
PACK = args[0]; OUT = args[1] if len(args) > 1 else '.'
PREV = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
GM = os.path.join(PACK, 'Sunnyside_World_Assets', '..', 'Sunnyside_World_Gamemaker') if not os.path.isdir(os.path.join(PACK,'Sunnyside_World_Gamemaker')) else os.path.join(PACK,'Sunnyside_World_Gamemaker')
ASSETS = os.path.join(PACK, 'Sunnyside_World_Assets') if os.path.isdir(os.path.join(PACK,'Sunnyside_World_Assets')) else PACK
DESIGN = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'village_design.txt')
EMPTY = -2147483648

def lj(p):
    return json.loads(re.sub(r',(\s*[}\]])', r'\1', open(p).read()))
def rle(d):
    o = []; i = 0
    while i < len(d):
        n = d[i]; i += 1
        if n < 0: o += [d[i]] * (-n); i += 1
        else: o += d[i:i + n]; i += n
    return o
room = lj(os.path.join(GM, 'rooms', 'Room1', 'Room1.yy'))
LAY = {}
for l in room['layers']:
    if l['resourceType'] == 'GMRTileLayer':
        t = l['tiles']; d = t.get('TileCompressedData'); d = rle(d) if d else t['TileSerialiseData']
        LAY[l['name']] = (t['SerialiseWidth'], t['SerialiseHeight'], d)
tsy = lj(os.path.join(GM, 'tilesets', 'tileset_sunnysideworld', 'tileset_sunnysideworld.yy'))
SETS = {a['name']: a['tiles'] for a in tsy['autoTileSets']}
TS = Image.open(os.path.join(ASSETS, 'Tileset', 'spr_tileset_sunnysideworld_16px.png')).convert('RGBA')

def raw(idx, f=0):
    x, y = idx % 64, idx // 64
    t = TS.crop((x * 16, y * 16, x * 16 + 16, y * 16 + 16))
    if f & 1: t = t.transpose(Image.FLIP_LEFT_RIGHT)
    if f & 2: t = t.transpose(Image.FLIP_TOP_BOTTOM)
    if f & 4: t = t.transpose(Image.ROTATE_270)
    return t
def render(names):
    W, H, _ = LAY['land']; im = Image.new('RGBA', (W * 16, H * 16), (0, 0, 0, 0))
    for n in names:
        w, h, d = LAY[n]
        for j in range(h):
            for i in range(w):
                v = d[j * w + i]
                if v == EMPTY or (v & 0x7FFFF) == 0: continue
                im.alpha_composite(raw(v & 0x7FFFF, (v >> 28) & 7), (i * 16, j * 16))
    return im

# ---------- registri tile ----------
TILES = [None]            # 0 = kosong
KEY = {}
def reg(parts):
    """parts = [(idx,flag),...] (digabung berurutan) -> indeks di tiles.png"""
    key = tuple(parts)
    if key in KEY: return KEY[key]
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for (i, f) in parts: im.alpha_composite(raw(i, f))
    TILES.append(im); KEY[key] = len(TILES) - 1; return KEY[key]

# ---------- desain ----------
D = {'road': [], 'plot': [], 'obj': [], 'fence': [], 'animals': [], 'smoke': [], 'scatter': [], 'npc': [],
     'river': [], 'bridge': [], 'ledge': [], 'sand': [], 'prop': []}
CHR = []   # persegi jalan yang sudut cembungnya dipotong (chamfer, flag 'c')
for ln in open(DESIGN, encoding='utf-8'):
    ln = ln.split('#')[0].strip()
    if not ln: continue
    p = ln.split(); c = p[0]
    if c == 'size': W, H = int(p[1]), int(p[2])
    elif c == 'island': ISL = tuple(map(int, p[1:5]))
    elif c == 'spawn': SPAWN = (int(p[1]), int(p[2]))
    elif c in ('road', 'plot'):
        D[c].append(tuple(map(int, p[1:5])))
        if len(p) > 5 and p[5] == 'c': CHR.append(tuple(map(int, p[1:5])))
    elif c == 'windmill': D['windmill'] = tuple(map(int, p[1:4]))
    elif c in D: D[c].append(p[1:])
X0, Y0, IW, IH = ISL
R = lambda x, y: y * W + x
ground = [0] * (W * H); decor = [0] * (W * H); shadow = [0] * (W * H); over = [0] * (W * H)
grid = [['~'] * W for _ in range(H)]
rnd = random.Random(7)

# ---------- pulau (templat Room1: pulau kecil kiri-atas) ----------
def put(layer, x, y, idx, f=0):
    if 0 <= x < W and 0 <= y < H: layer[R(x, y)] = reg([(idx, f)])
GV = [193] * 16 + [194, 195, 197, 199, 257, 258]
for y in range(Y0, Y0 + IH):
    for x in range(X0, X0 + IW):
        top, bot, lf, rt = y == Y0, y == Y0 + IH - 1, x == X0, x == X0 + IW - 1
        if top: idx, f = (200, 0) if lf else (260, 0) if rt else (196, 0)
        elif bot: idx, f = (262, 0) if lf else (263, 0) if rt else (261, 0)
        else: idx, f = (198, 0) if lf else (259, 0) if rt else (rnd.choice(GV), 0)
        put(ground, x, y, idx, f)
        if not (top or bot or lf or rt): grid[y][x] = '.'
B = Y0 + IH - 1
put(ground, X0 - 1, B, 403, 3); put(ground, X0 + IW, B, 403, 2)
put(ground, X0 - 1, B + 1, 148, 4); put(ground, X0 + IW, B + 1, 148, 6)
put(ground, X0 - 1, B + 2, 403, 1); put(ground, X0 + IW, B + 2, 403, 0)
put(ground, X0, B + 1, 266, 0); put(ground, X0 + IW - 1, B + 1, 266, 1)
put(ground, X0, B + 2, 147, 1); put(ground, X0 + IW - 1, B + 2, 147, 0)
put(ground, X0, B + 3, 403, 1); put(ground, X0 + IW - 1, B + 3, 403, 0)
for k, x in enumerate(range(X0 + 1, X0 + IW - 1)):
    put(ground, x, B + 1, 267 if k % 2 == 0 else 203, 4 if k % 2 == 0 else 0)
    put(ground, x, B + 2, 203 if k % 2 == 0 else 267, 0 if k % 2 == 0 else 4)
    put(ground, x, B + 3, 148, 0)
put(shadow, X0, B + 2, 77, 3); put(shadow, X0 + IW - 1, B + 2, 77, 2)
for x in range(X0, X0 + IW): put(shadow, x, B + 3, 76)
put(shadow, X0, B + 4, 77); put(shadow, X0 + IW - 1, B + 4, 77, 7)
for x in range(X0 + 1, X0 + IW - 1): put(shadow, x, B + 4, 76)
for y in range(Y0 + IH, B + 4 + 1):   # sel tebing = padat
    for x in range(X0 - 1, X0 + IW + 1): grid[y][x] = '~'

# ---------- jalan & tanah (Path 01 / Path 02) ----------
def cellsOf(rects):
    s = set()
    for (a, b, c, d) in rects:
        for y in range(b, d + 1):
            for x in range(a, c + 1): s.add((x, y))
    return s
def autopath(cells, setname):
    S = SETS[setname]
    for (x, y) in cells: ground[R(x, y)] = reg([(S[0], 0)])
    # rim pada sel rumput orthogonal + serpihan di diagonal
    cand = set()
    for (x, y) in cells:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                n = (x + dx, y + dy)
                if n not in cells and X0 + 1 <= n[0] <= X0 + IW - 2 and Y0 + 1 <= n[1] <= Y0 + IH - 2: cand.add(n)
    for (x, y) in cand:
        parts = []
        if (x, y + 1) in cells: parts.append(S[3])      # jalan di selatan -> rim bawah
        if (x, y - 1) in cells: parts.append(S[12])
        if (x + 1, y) in cells: parts.append(S[5])
        if (x - 1, y) in cells: parts.append(S[10])
        if (x + 1, y + 1) in cells and (x + 1, y) not in cells and (x, y + 1) not in cells: parts.append(S[7])
        if (x - 1, y + 1) in cells and (x - 1, y) not in cells and (x, y + 1) not in cells: parts.append(S[11])
        if (x + 1, y - 1) in cells and (x + 1, y) not in cells and (x, y - 1) not in cells: parts.append(S[13])
        if (x - 1, y - 1) in cells and (x - 1, y) not in cells and (x, y - 1) not in cells: parts.append(S[14])
        if parts: decor[R(x, y)] = reg([(p, 0) for p in parts])
roads = cellsOf(D['road']); plots = cellsOf(D['plot'])
autopath(roads, 'Path 01'); autopath(plots, 'Path 02')
for (x, y) in roads: grid[y][x] = ','
for (x, y) in plots: grid[y][x] = 'p'


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

# ---------- sprite ----------
bld = render(['walls', 'building', 'decoration_02', 'decoration_03']); dec = render(['decoration_01'])
def comps(im):
    a = np.array(im)[:, :, 3] > 0
    lab, n = ndi.label(ndi.binary_dilation(a, iterations=1), structure=np.ones((3, 3)))
    items = []
    for i, s in enumerate(ndi.find_objects(lab)):
        y0, y1, x0, x1 = s[0].start, s[0].stop, s[1].start, s[1].stop
        if (x1 - x0) * (y1 - y0) >= 40: items.append((i + 1, x0, y0, x1, y1))
    return a, lab, items
CB = comps(bld); CD = comps(dec)
def cut(src, k):
    (a, lab, items), im = (CB, bld) if src == 'b' else (CD, dec)
    i, x0, y0, x1, y1 = items[k]
    m = (lab[y0:y1, x0:x1] == i) & a[y0:y1, x0:x1]
    c = im.crop((x0, y0, x1, y1)); arr = np.array(c); arr[~m] = 0
    c = Image.fromarray(arr); return c.crop(c.getbbox())
SPR = {}
for name, (src, k) in {'house_toko': ('b', 72), 'house_barak': ('b', 87), 'stall_red': ('b', 100), 'tower': ('b', 57),
    'house_purple': ('b', 97), 'house_orange': ('b', 89), 'house_green': ('b', 53), 'house_orange2': ('b', 73),
    'house_redtall': ('b', 122), 'house_hut': ('b', 66), 'house_blue': ('b', 77), 'windtower': ('b', 1), 'sign': ('b', 45),
    'pine_a': ('d', 23), 'pine_b': ('d', 5), 'pine_c': ('d', 49), 'bush_a': ('d', 17), 'bush_b': ('d', 93), 'bush_c': ('d', 156), 'rock_a': ('d', 117), 'rock_b': ('d', 91)}.items():
    SPR[name] = cut(src, k)
# bunga/jamur: komponen dekor kecil berwarna (R>G), maks 10
fl = []
for k, (i, x0, y0, x1, y1) in enumerate(CD[2]):
    w, h = x1 - x0, y1 - y0
    if 7 <= w <= 13 and 7 <= h <= 13:
        c = cut('d', k); arr = np.array(c).reshape(-1, 4); arr = arr[arr[:, 3] > 0]
        if 20 < len(arr) < 0.7 * w * h and arr[:, 0].mean() > arr[:, 1].mean() + 8 and max(c.size) <= 12: fl.append(c)
for n, c in enumerate(fl[:10]): SPR['flower_%d' % n] = c
# pagar: potongan 16 px dari barisan pagar Room1
(ia, ix0, iy0, ix1, iy1) = CD[2][181]
SPR['fence_h'] = dec.crop((ix0 + 16, iy0, ix0 + 32, iy1)); SPR['fence_h'] = SPR['fence_h'].crop(SPR['fence_h'].getbbox())
(ia, vx0, vy0, vx1, vy1) = CD[2][86]
SPR['fence_v'] = dec.crop((vx0, vy0 + 32, vx1, vy0 + 48)); SPR['fence_v'] = SPR['fence_v'].crop(SPR['fence_v'].getbbox())

# ---------- Tahap 6B: sprite properti tambahan (indeks komponen = urutan komponen terhubung Room1, lihat ASSET-NOTES) ----------
for name, (src, k) in {'crate': ('d', 237), 'crates': ('b', 84), 'barrel': ('d', 32), 'barrel2': ('d', 247), 'board': ('d', 313),
                       'sack': ('d', 11), 'sack2': ('d', 12), 'pot': ('d', 122), 'ladder': ('d', 118), 'bench': ('b', 102),
                       'crab': ('d', 13), 'star': ('d', 368), 'star2': ('d', 7)}.items():
    SPR[name] = cut(src, k)
_pole, _lant = cut('d', 265), cut('b', 62)          # lentera = tiang + lampu menyala
_lamp = Image.new('RGBA', (12, _pole.height + 6), (0, 0, 0, 0)); _lamp.alpha_composite(_pole, (2, 6)); _lamp.alpha_composite(_lant, (1, 0))
SPR['lamp'] = _lamp.crop(_lamp.getbbox())

# ---------- objek ----------
OBJ = []; used = set(); BLD = {}
def free(x, y): return grid[y][x] == '.' and (x, y) not in used
def solid_rect(l, r, rows, cy, letter):
    for yy in range(cy - rows + 1, cy + 1):
        for xx in range(l, r + 1):
            if grid[yy][xx] not in '.,': print('! tumpang tindih', letter, xx, yy, grid[yy][xx])
            grid[yy][xx] = letter; used.add((xx, yy))
for p in D['obj']:
    name, cx, cy = p[0], int(p[1]), int(p[2]); letter = p[3] if len(p) > 3 else 'X'; rows = int(p[4]) if len(p) > 4 else 2
    w, h = SPR[name].size; n = math.ceil(w / 16); l = cx - (n - 1) // 2; r = l + n - 1
    solid_rect(l, r, rows, cy, letter)
    OBJ.append(dict(k=name, x=int((l + n / 2) * 16), y=(cy + 1) * 16, c=letter if letter in 'SRGQ' else ''))
    if letter in 'SRGQ': BLD.setdefault(letter, []).append((l, cy - rows + 1, r, cy))
for p in D['fence']:
    letter, a, b, c, d = p[0], *map(int, p[1:5]); gap = set()
    if 'gap' in p: g0 = p.index('gap'); gap = {int(p[g0 + 1]), int(p[g0 + 2])}
    for x in range(a, c + 1):
        for y in (b, d):
            if y == b and x in gap: continue
            if free(x, y) or grid[y][x] == 'p': grid[y][x] = letter; used.add((x, y)); OBJ.append(dict(k='fence_h', x=x * 16 + 8, y=y * 16 + 16, c=''))
    for y in range(b + 1, d):
        for x in (a, c):
            if free(x, y): grid[y][x] = letter; used.add((x, y)); OBJ.append(dict(k='fence_v', x=x * 16 + 8, y=y * 16 + 16, c=''))
    if letter == 'F': BLD['F'] = [(a, b, c, d)]

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
# scatter
def ok(x, y, rng=1):
    for dx in range(-rng, rng + 1):
        for dy in range(-rng, rng + 1):
            xx, yy = x + dx, y + dy
            if not (X0 + 1 <= xx < X0 + IW - 1 and Y0 + 1 <= yy < Y0 + IH - 1): return False
            if grid[yy][xx] != '.' or (xx, yy) in used or (xx, yy) in roads or (xx, yy) in EXTRA or decor[R(xx, yy)]: return False
    return True
npcs = {p[0]: (int(p[1]), int(p[2])) for p in D['npc']}
keep = set()
for nm, (x, y) in npcs.items():
    for dx in range(-1, 2):
        for dy in range(-1, 2): keep.add((x + dx, y + dy))
keep |= {(SPAWN[0] + dx, SPAWN[1] + dy) for dx in range(-2, 3) for dy in range(-2, 3)}
for p in D['scatter']:
    kind, a, b, c, d, n, seed = p[0], *map(int, p[1:7]); rr = random.Random(seed); tries = 0; put_n = 0
    while put_n < n and tries < 3000:
        tries += 1; x, y = rr.randint(a, c), rr.randint(b, d)
        if (x, y) in keep: continue
        if kind in ('tree1', 'tree2', 'pine'):
            if not ok(x, y, 1): continue
            grid[y][x] = 'T'; used.add((x, y))
            if kind == 'pine': OBJ.append(dict(k=rr.choice(['pine_a', 'pine_b', 'pine_c']), x=x * 16 + 8, y=y * 16 + 16, c=''))
            else: OBJ.append(dict(a='tree_' + kind[-1], x=x * 16 + 8, y=y * 16 + 16, c=''))
        elif kind in ('bush', 'rock'):
            if not ok(x, y, 0): continue
            grid[y][x] = 'X'; used.add((x, y)); OBJ.append(dict(k=rr.choice(['bush_a', 'bush_b', 'bush_c'] if kind == 'bush' else ['rock_a', 'rock_b']), x=x * 16 + 8, y=y * 16 + 16, c=''))
        else:
            if not ok(x, y, 0) or not fl: continue
            used.add((x, y)); OBJ.append(dict(k='flower_%d' % rr.randrange(min(10, len(fl))), x=x * 16 + 4 + rr.randint(0, 8), y=y * 16 + 14 + rr.randint(0, 2), c='f'))
        put_n += 1
# tanaman dekoratif di ladang (12 petak)
crops = ['carrot', 'wheat', 'pumpkin', 'sunflower', 'cabbage', 'potato']
for j, y in enumerate((29, 31, 33)):
    for i, x in enumerate((10, 12, 14, 16)):
        OBJ.append(dict(a='crop_%s_%d' % (crops[(i + j) % 6], 3 + (i + j) % 3), x=x * 16 + 8, y=y * 16 + 14, c=''))
# hiasan hidup
ANIMALS = [dict(a='animal_' + p[0], n=int(p[1]), z=[int(v) * 16 for v in p[2:6]]) for p in D['animals']]
tx, ty = D['windmill'][0], D['windmill'][1]; HUB = D['windmill'][2]
wt = SPR['windtower']; wl = tx - (math.ceil(wt.width / 16) - 1) // 2; wr = wl + math.ceil(wt.width / 16) - 1
solid_rect(wl, wr, 2, ty, 'X'); wxp = int((wl + math.ceil(wt.width / 16) / 2) * 16)
OBJ.append(dict(k='windtower', x=wxp, y=(ty + 1) * 16, c=''))
WIND = dict(x=wxp, y=(ty + 1) * 16 - wt.height + 34 + HUB)   # poros baling-baling = 34 px di bawah puncak menara
SMOKE = []
for p in D['smoke']:
    o = next(o for o in OBJ if o.get('k') == p[1]); SMOKE.append(dict(a=p[0], x=o['x'] + int(p[2]), y=o['y'] + int(p[3]) + 66 - 66))

# ---------- tiles.png / sprites.png ----------
cols = 32; rows_t = (len(TILES) + cols - 1) // cols
tim = Image.new('RGBA', (cols * 16, rows_t * 16), (0, 0, 0, 0))
for i, t in enumerate(TILES):
    if t: tim.paste(t, ((i % cols) * 16, (i // cols) * 16))
# animasi tile (foam dll): idx asli -> daftar frame (indeks baru)
ANIM = {}
for a in tsy['tileAnimationFrames']:
    fr = list(dict.fromkeys(a['frames']))
    if len(fr) < 2: continue
    for key, ni in list(KEY.items()):
        if len(key) == 1 and key[0][0] == fr[0]:
            ANIM[ni] = [reg([(f, key[0][1])]) for f in fr]
# tiles.png ditulis ulang setelah reg() frame animasi
rows_t = (len(TILES) + cols - 1) // cols
tim = Image.new('RGBA', (cols * 16, rows_t * 16), (0, 0, 0, 0))
for i, t in enumerate(TILES):
    if t: tim.paste(t, ((i % cols) * 16, (i // cols) * 16))
# sprite sheet
names = [n for n in SPR if n not in ('windtower',) or True]
x = y = rh = 0; SW = 512; table = {}; sheet_items = []
for n in names:
    im = SPR[n]; w, h = im.size
    if x + w > SW: x, y, rh = 0, y + rh + 1, 0
    sheet_items.append((n, im, x, y)); table[n] = dict(x=x, y=y, w=w, h=h, ax=w // 2, ay=h); x += w + 1; rh = max(rh, h)
sim = Image.new('RGBA', (SW, y + rh), (0, 0, 0, 0))
for n, im, sx, sy in sheet_items: sim.paste(im, (sx, sy))
WD = os.path.join(OUT, 'assets', 'world'); os.makedirs(WD, exist_ok=True)
tim.save(os.path.join(WD, 'tiles.png'), optimize=True); sim.save(os.path.join(WD, 'sprites.png'), optimize=True)
OBJ.sort(key=lambda o: o['y'])
out = dict(v=1, w=W, h=H, tile=16, tiles='tiles.png', tcols=cols, sprites='sprites.png', spr=table,
           layers=dict(ground=ground, shadow=shadow, decor=decor, over=over, collision=[0 if c in '.,d' else 1 for r in grid for c in r]),
           anim=ANIM, grid=[''.join(r) for r in grid], objects=OBJ, spawn=list(SPAWN), npcs=npcs,
           bld={k: [min(v[0] for v in L), min(v[1] for v in L), max(v[2] for v in L), max(v[3] for v in L)] for k, L in BLD.items()},
           animals=ANIMALS, smoke=SMOKE, windmill=WIND)
# laut: pola 4x4 ubin (64x64) dari layer 'sea' Room1 (ulang mulus)
sw_, sh_, sd = LAY['sea']; sea = Image.new('RGBA', (64, 64))
for j in range(4):
    for i in range(4): sea.paste(raw(sd[j * sw_ + i] & 0x7FFFF), (i * 16, j * 16))
sea.convert('RGB').save(os.path.join(WD, 'sea.png'), optimize=True); out['sea'] = 'sea.png'

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
json.dump(out, open(os.path.join(WD, 'village.json'), 'w'), separators=(',', ':'))
tot = sum(os.path.getsize(os.path.join(WD, f)) for f in ('village.json', 'tiles.png', 'sprites.png', 'sea.png'))
print('tiles', len(TILES), 'sprites', len(SPR), 'objects', len(OBJ), 'bytes', tot, 'bld', out['bld'])

if PREV:   # pratinjau PIL (statis)
    pv = Image.new('RGBA', (W * 16, H * 16), (0, 158, 224, 255))
    for L in ('ground', 'shadow', 'decor', 'over'):
        for i, v in enumerate(out['layers'][L]):
            if v: pv.alpha_composite(TILES[v], ((i % W) * 16, (i // W) * 16))
    for o in OBJ:
        if 'k' in o: im = SPR[o['k']]; pv.alpha_composite(im, (o['x'] - im.width // 2, o['y'] - im.height))
    pv.convert('RGB').save(PREV)
