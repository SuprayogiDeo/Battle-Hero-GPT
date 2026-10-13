#!/usr/bin/env python3
"""Hero Battle - build_chars.py (Tahap 6A)
Membuat assets/world/chars.png (avatar pemain + 4 NPC, tiap karakter = base + 1 rambut + tools) dan
MENGGABUNGKAN entri-nya ke assets/world/atlas.json. Jalankan SETELAH build_assets.py (skrip itu menulis ulang atlas.json).
Pakai:  python3 tools/build_chars.py <Sunnyside_World_Assets> <file .aseprite> [folder proyek]
Isi per prefix: <p>_idle, <p>_walk (samping, menghadap kanan; strip PNG paket) dan
<p>_idle_{s,se,ne,n}, <p>_walk_{s,se,ne,n} (pose arah dari .aseprite; kiri = flip di kode).
Catatan: tag walk-* di .aseprite hanya punya `bowl hair`; rambut lain dipetakan dari pose idle-* arah yang sama
(posisi = posisi bowl hair di frame jalan + selisih posisi rambut itu terhadap bowl hair di idle) -> kepala ikut bob.
avatar_dig tetap dari build_assets.py. avatar_watering dirakit dari strip WATERING 5 frame. avatar_idle/avatar_walk DITIMPA di sini (kini dengan tangan jauh/tools)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import aseprite_lite as A

SRC, ASE = sys.argv[1], sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else '.'
WORLD = os.path.join(OUT, 'assets', 'world')
FOOT = (48, 39)
CHARS = {'avatar': 'short', 'npc_guard': 'spikey', 'npc_merchant': 'curly', 'npc_farmer': 'mop', 'npc_elder': 'long', 'npc_builder': 'short', 'npc_cook': 'curly', 'npc_woodcutter': 'mop'}
FILE = {'bowl': 'bowlhair', 'short': 'shorthair', 'mop': 'mophair', 'spikey': 'spikeyhair', 'curly': 'curlyhair', 'long': 'longhair'}
w, h, L, T, F = A.parse(ASE)
N2I = {l['name']: i for i, l in enumerate(L)}
NAME = {'bowl': 'bowl hair', 'short': 'short hair', 'mop': 'mop hair', 'spikey': 'spikey hair', 'curly': 'curly hair', 'long': 'long hair'}
tag = {t[0]: t for t in T}
def cel(fi, ln):
    for li, x, y, op, im in F[fi][1]:
        if li == N2I[ln]: return cel(im[1], ln) if isinstance(im, tuple) else (x, y, im)
def put(im, c):
    if c: im.alpha_composite(c[2], (c[0], c[1]))
def dir_idle(d, k, hair):
    fi = tag['idle-' + d][1] + k; im = Image.new('RGBA', (96, 64))
    put(im, cel(fi, 'base')); put(im, cel(fi, 'tools rear')); put(im, cel(fi, NAME[hair])); put(im, cel(fi, 'tools')); return im
def dir_walk(d, k, hair):
    fi = tag['walk-' + d][1] + k; i0 = tag['idle-' + d][1]; im = Image.new('RGBA', (96, 64)); put(im, cel(fi, 'base'))
    bw = cel(fi, 'bowl hair')
    if hair == 'bowl': put(im, bw)
    else:
        hb, hh = cel(i0, 'bowl hair'), cel(i0, NAME[hair])
        im.alpha_composite(hh[2], (bw[0] + hh[0] - hb[0], bw[1] + hh[1] - hb[1]))
    put(im, cel(fi, 'tools')); return im
def side(folder, stem, n, hair):
    base = os.path.join(SRC, 'Characters', 'Human', folder)
    out = None
    for l in ('base', FILE[hair], 'tools'):
        im = Image.open(os.path.join(base, f'{l}_{stem}_strip{n}.png')).convert('RGBA'); fw = im.width // n
        fr = [im.crop((i * fw, 0, (i + 1) * fw, im.height)) for i in range(n)]
        if out is None: out = fr
        else:
            for a, b in zip(out, fr): a.alpha_composite(b)
    return out

class Sheet:
    def __init__(s, W): s.W, s.x, s.y, s.rowh, s.items = W, 0, 0, 0, []
    def add(s, frs):
        fw, fh = frs[0].size; tw = fw * len(frs); assert tw <= s.W
        if s.x + tw > s.W: s.x, s.y, s.rowh = 0, s.y + s.rowh, 0
        p = (s.x, s.y); s.items.append((p, frs)); s.x += tw; s.rowh = max(s.rowh, fh); return p
    def save(s, path):
        im = Image.new('RGBA', (s.W, s.y + s.rowh), (0, 0, 0, 0))
        for (x, y), frs in s.items:
            for i, f in enumerate(frs): im.paste(f, (x + i * f.width, y))
        im.save(path, optimize=True); return im.size

sh = Sheet(1024); new = {}
def reg(name, frs, d, loop=1):
    # kotak = gabungan bbox semua frame + titik kaki, supaya anchor sama di semua frame
    bb = None
    for f in frs:
        b = f.getbbox()
        if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    bb = (min(bb[0], FOOT[0]), bb[1], max(bb[2], FOOT[0] + 1), max(bb[3], FOOT[1]))
    x, y = sh.add([f.crop(bb) for f in frs])
    new[name] = dict(s='chars', x=x, y=y, w=bb[2] - bb[0], h=bb[3] - bb[1], n=len(frs), ax=FOOT[0] - bb[0], ay=FOOT[1] - bb[1], d=d, loop=loop)
for p, hair in CHARS.items():
    reg(p + '_idle', side('IDLE', 'idle', 9, hair), 75)
    reg(p + '_walk', side('WALKING', 'walk', 8, hair), 75)
    for d in ('s', 'se', 'ne', 'n'):
        reg(f'{p}_idle_{d}', [dir_idle(d, k, hair) for k in range(4)], 200)
        reg(f'{p}_walk_{d}', [dir_walk(d, k, hair) for k in range(8)], 100)

def action_frames(action, hair='short'):
    # Compose action frames from the actual layer data; frame count comes from the Aseprite tag.
    if action not in tag: raise ValueError('Missing Aseprite action tag: ' + action)
    out=[]
    for fi in range(tag[action][1], tag[action][2] + 1):
        im=Image.new('RGBA',(96,64))
        put(im,cel(fi,'base')); put(im,cel(fi,'tools rear')); put(im,cel(fi,NAME[hair])); put(im,cel(fi,'tools'))
        out.append(im)
    return out

# Aseprite v1.0 tags: reeling=274..286 (13 frames), axe=185..194 (10), mining=195..204 (10).
reg('avatar_watering', side('WATERING', 'watering', 5, 'short'), 85, 0)
reg('avatar_reeling', action_frames('reeling','short'), 85, 1)
reg('avatar_axe', action_frames('axe','short'), 85, 0)
reg('avatar_mining', action_frames('mining','short'), 85, 0)
size = sh.save(os.path.join(WORLD, 'chars.png'))
ap = os.path.join(WORLD, 'atlas.json'); at = json.load(open(ap))
at['anims'].update(new); at['sheets']['chars'] = 'chars.png'
json.dump(at, open(ap, 'w'), separators=(',', ':'))
print('chars.png', size, os.path.getsize(os.path.join(WORLD, 'chars.png')), 'bytes; anims baru', len(new))
