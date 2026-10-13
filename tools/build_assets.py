#!/usr/bin/env python3
"""Hero Battle - build_assets.py (Tahap 5A)
Menggabungkan HANYA aset Sunnyside World yang dipakai menjadi:
  assets/world/avatar.png  (avatar idle/walk/dig, base + 1 rambut [+ tools untuk dig])
  assets/world/props.png   (hewan, pohon, tanaman, asap cerobong, kincir)
  assets/world/atlas.json
Pakai:  python3 tools/build_assets.py [folder Sunnyside_World_Assets] [folder keluaran proyek]
Perlu:  pip install pillow
Semua frame dipotong ke kotak minimum; anchor (ax,ay) = titik kaki/dasar di dalam sel.
"""
import json, os, sys, glob
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else 'Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets'
OUT = sys.argv[2] if len(sys.argv) > 2 else '.'
WORLD = os.path.join(OUT, 'assets', 'world')
HAIR = 'shorthair'          # bowlhair curlyhair longhair mophair shorthair spikeyhair
MS = 75                     # durasi frame sumber (aseprite): 75 ms
CHAR_FRAME = (96, 64)
CHAR_FOOT = (48, 39)        # x tengah frame; y = garis tepat di bawah baris piksel kaki terbawah (38)

def P(*a): return os.path.join(SRC, *a)
def load(p): return Image.open(p).convert('RGBA')
def frames(img, n):
    w = img.width // n
    assert w * n == img.width, (img.size, n)
    return [img.crop((i * w, 0, (i + 1) * w, img.height)) for i in range(n)]

class Sheet:
    """Penata sederhana: tiap animasi = satu baris (strip) bersebelahan."""
    def __init__(s, width): s.W, s.x, s.y, s.rowh, s.items = width, 0, 0, 0, []
    def add(s, frs):
        w, h = frs[0].size; tw = w * len(frs)
        assert tw <= s.W, ('strip terlalu lebar', tw)
        if s.x + tw > s.W: s.x, s.y, s.rowh = 0, s.y + s.rowh, 0
        pos = (s.x, s.y); s.items.append((pos, frs)); s.x += tw; s.rowh = max(s.rowh, h)
        return pos
    def save(s, path):
        im = Image.new('RGBA', (s.W, s.y + s.rowh), (0, 0, 0, 0))
        for (x, y), frs in s.items:
            for i, f in enumerate(frs): im.paste(f, (x + i * f.width, y))
        im.save(path, optimize=True); return im.size

def union_bbox(frs):
    bb = None
    for f in frs:
        b = f.getbbox()
        if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    return bb

def crop_all(frs, bb): return [f.crop(bb) for f in frs]

atlas = {'version': 1, 'src': 'Sunnyside World (Daniel Diggle)', 'sheets': {}, 'anims': {}}

# ---------- AVATAR ----------
av = Sheet(512)
def avatar_anim(name, folder, stem, n, with_tools):
    layers = ['base', HAIR] + (['tools'] if with_tools else [])
    comp = None
    for l in layers:
        fr = frames(load(P('Characters', 'Human', folder, f'{l}_{stem}_strip{n}.png')), n)
        assert fr[0].size == CHAR_FRAME, fr[0].size
        if comp is None: comp = fr
        else:
            for a, b in zip(comp, fr): a.alpha_composite(b)
    bb = union_bbox(comp)
    # sertakan titik kaki di dalam kotak agar anchor valid
    bb = (min(bb[0], CHAR_FOOT[0]), bb[1], max(bb[2], CHAR_FOOT[0] + 1), max(bb[3], CHAR_FOOT[1]))
    cr = crop_all(comp, bb)
    x, y = av.add(cr)
    atlas['anims'][name] = dict(s='avatar', x=x, y=y, w=bb[2]-bb[0], h=bb[3]-bb[1], n=n,
                                ax=CHAR_FOOT[0]-bb[0], ay=CHAR_FOOT[1]-bb[1], d=MS, loop=1)
avatar_anim('avatar_idle', 'IDLE', 'idle', 9, False)
avatar_anim('avatar_walk', 'WALKING', 'walk', 8, False)
avatar_anim('avatar_dig',  'DIG', 'dig', 13, True)
atlas['anims']['avatar_dig']['loop'] = 0
atlas['sheets']['avatar'] = 'avatar.png'
asz = av.save(os.path.join(WORLD, 'avatar.png'))

# ---------- PROPS ----------
pr = Sheet(1024)
def strip(name, path, n, foot_x=None, foot_y=None, d=150, loop=1, trim=False):
    fr = frames(load(path), n); w, h = fr[0].size
    bb = (0, 0, w, h)
    if trim:
        bb = union_bbox(fr); fr = crop_all(fr, bb)
    fx = (w // 2 if foot_x is None else foot_x)
    fy = (union_bbox(frames(load(path), n))[3] if foot_y is None else foot_y)
    x, y = pr.add(fr)
    atlas['anims'][name] = dict(s='props', x=x, y=y, w=bb[2]-bb[0], h=bb[3]-bb[1], n=n,
                                ax=fx-bb[0], ay=fy-bb[1], d=d, loop=loop)
A = P('Elements', 'Animals')
for nm, f in [('chicken', 'spr_deco_chicken_01'), ('cow', 'spr_deco_cow'), ('pig', 'spr_deco_pig_01'), ('sheep', 'spr_deco_sheep_01')]:
    strip('animal_' + nm, os.path.join(A, f + '_strip4.png'), 4, foot_x=16, d=200)   # sel 32x32, kaki = bawah bbox
for nm, f in [('tree1', 'spr_deco_tree_01'), ('tree2', 'spr_deco_tree_02')]:
    strip('tree_' + nm[-1], os.path.join(P('Elements', 'Plants'), f + '_strip4.png'), 4, d=250,
          foot_y=None)                                                                # dasar = baris opak terbawah
# kincir: titik dasar diambil dari versi TANPA bayangan; gambar dipakai versi dengan bayangan
wm = P('Elements', 'Other', 'spr_deco_windmill_strip9.png')
wb = None  # (tidak dipakai; sprite kincir hanya rotor)
strip('windmill', P('Elements', 'Other', 'spr_deco_windmill_withshadow_strip9.png'), 9, foot_x=56, foot_y=56, d=120)  # sprite = ROTOR saja; anchor = poros (56,56)
for i in range(1, 6):
    strip(f'smoke_{i}', P('Elements', 'VFX', 'Chimney Smoke', f'chimneysmoke_0{i}_strip30.png'), 30,
          foot_x=None, foot_y=None, d=100, trim=False)
    a = atlas['anims'][f'smoke_{i}']; a['ay'] = a['h']; a['ax'] = a['w'] // 2   # anchor = bawah-tengah (mulut cerobong)
# tanaman: 11 jenis x 6 tahap (_00.._05) + tanah, sel 16x20, anchor bawah-tengah
CW, CH = 16, 20
crops = sorted({os.path.basename(f).rsplit('_', 1)[0] for f in glob.glob(P('Elements', 'Crops', '*_05.png'))})
def cell_of(im, left=None):
    cell = Image.new('RGBA', (CW, CH)); cell.paste(im, ((CW - im.width) // 2 if left is None else left, CH - im.height)); return cell
def put_cells(names, cells, ax):
    x0, y0 = pr.add(cells)
    for i, nm in enumerate(names):
        atlas['anims'][nm] = dict(s='props', x=x0 + i * CW, y=y0, w=CW, h=CH, n=1, ax=ax, ay=CH, d=1000, loop=0)
for c in crops:   # satu strip 6 tahap per jenis
    put_cells([f'crop_{c}_{st}' for st in range(6)],
              [cell_of(load(P('Elements', 'Crops', f'{c}_0{st}.png'))) for st in range(6)], CW // 2)
soils = ('soil_00', 'soil_01', 'soil_03', 'soil_04')
put_cells(soils, [cell_of(load(P('Elements', 'Crops', n + '.png')), 0) for n in soils], 0)
atlas['crops'] = crops
atlas['sheets']['props'] = 'props.png'
psz = pr.save(os.path.join(WORLD, 'props.png'))

with open(os.path.join(WORLD, 'atlas.json'), 'w') as f: json.dump(atlas, f, separators=(',', ':'))
tot = sum(os.path.getsize(os.path.join(WORLD, n)) for n in ('avatar.png', 'props.png', 'atlas.json'))
print('avatar', asz, 'props', psz, 'anims', len(atlas['anims']), 'total bytes', tot)
assert tot < 1_500_000
