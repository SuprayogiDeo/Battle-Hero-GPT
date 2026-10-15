#!/usr/bin/env python3
"""Perbaikan peta 9A (daftar bug foto no. 1 dan 2).

no. 1  Hapus 'Rumah Kamu' (b_home) + rumah penduduk selatan (b_res6 @560,512), padang berpagar timur
       (pagar, tebing bertingkat, tangga) lalu isi dengan Taman Desa. Petak tanam 6x4 dipindah ke ladang
       barat berpagar; pagar utara ladang diberi celah tepat di ujung jalan setapak (x=13..14).
no. 2  Jalan setapak ke pintu Toko dan Rumah Penduduk barat (b_res1) disejajarkan dengan pintunya.

Skrip bekerja langsung pada data yang dikirim (index.json + chunks + village.json) karena
tools/build_world.py belum bisa dijalankan ulang. Idempoten: bila sudah diterapkan, keluar tanpa mengubah apa pun.
Pakai: python3 tools/fix_map_9a.py [--root DIR]
"""
import argparse, json, sys
from pathlib import Path
from PIL import Image
import numpy as np

LAYERS = ('ground', 'shadow', 'decor', 'over', 'collision')
def dumps(o): return json.dumps(o, separators=(',', ':'), ensure_ascii=False)


class World:
    """Dunia 128x96: index.json + chunks/cX_Y.json."""
    name = 'index+chunks'
    def __init__(self, root):
        self.base = Path(root) / 'assets/world'
        self.ix = json.loads((self.base / 'index.json').read_text(encoding='utf-8'))
        ix = self.ix; self.W, self.H = ix['w'], ix['h']
        self.L = {n: [0] * (self.W * self.H) for n in LAYERS}; self.chunks = {}
        for c in ix['chunks']:
            d = json.loads((self.base / c['file']).read_text(encoding='utf-8')); self.chunks[c['file']] = d
            for n in LAYERS:
                for yy in range(d['h']):
                    for xx in range(d['w']): self.L[n][(d['y'] + yy) * self.W + d['x'] + xx] = d['layers'][n][yy * d['w'] + xx]
        self.grid = [list(r) for r in ix['grid']]; self.objects = ix['objects']; self.spr = ix['spr']
    def meta(self): return self.ix
    def save(self):
        ix = self.ix; ix['grid'] = [''.join(r) for r in self.grid]; ix['objects'] = self.objects
        for f, d in self.chunks.items():
            x0, y0, cw, ch = d['x'], d['y'], d['w'], d['h']
            d['layers'] = {n: [self.L[n][(y0 + yy) * self.W + x0 + xx] for yy in range(ch) for xx in range(cw)] for n in LAYERS}
            d['objects'] = [o for o in self.objects if x0 <= o.get('x', -1) / 16 < x0 + cw and y0 <= o.get('y', -1) / 16 < y0 + ch]
            (self.base / f).write_text(dumps(d), encoding='utf-8')
        (self.base / 'index.json').write_text(dumps(ix), encoding='utf-8')


class Village(World):
    """village.json 60x45 (sumber build_world.py), kunci sprite lama (house_*)."""
    name = 'village.json'
    def __init__(self, root):
        self.base = Path(root) / 'assets/world'
        self.ix = json.loads((self.base / 'village.json').read_text(encoding='utf-8'))
        v = self.ix; self.W, self.H = v['w'], v['h']
        self.L = {n: list(v['layers'][n]) for n in LAYERS}; self.grid = [list(r) for r in v['grid']]
        self.objects = v['objects']; self.spr = v['spr']
    def save(self):
        v = self.ix; v['grid'] = [''.join(r) for r in self.grid]; v['objects'] = self.objects
        for n in LAYERS: v['layers'][n] = self.L[n]
        (self.base / 'village.json').write_text(dumps(v), encoding='utf-8')


def hash01(x, y, salt=0):
    n = (x * 374761393 + y * 668265263 + salt * 1442695041) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    n ^= n >> 16
    return n / 4294967295


# ---------- kamus tile (diturunkan dari data yang ada; lihat build_village.autopath) ----------
ROAD = 34
GRASS = [5] * 16 + [6, 7, 8, 9, 10, 12]
GRASS_SET = set(GRASS) | {65, 68, 88}
CHAMFER = {1: 59, 2: 60, 4: 61, 8: 62}          # sudut jalan terpotong: TL, TR, BL, BR
CH_ID = {v: k for k, v in CHAMFER.items()}
RIM = {'S': 35, 'N': 40, 'E': 39, 'W': 37, 'SE': 49, 'SW': 42, 'NE': 48, 'NW': 43}
RIM_ORDER = ['S', 'N', 'E', 'W', 'SE', 'SW', 'NE', 'NW']


class Tiles:
    """Mencari/membuat tile tepi jalan gabungan di tiles.png (komposit tile tunggal, urutan tetap)."""
    def __init__(self, root):
        self.path = Path(root) / 'assets/world/tiles.png'; self.im = Image.open(self.path).convert('RGBA')
        self.cache = {}; self.added = []; self.used = set()
    def count(self): return (self.im.size[1] // 16) * 32
    def tile(self, i): return self.im.crop(((i % 32) * 16, (i // 32) * 16, (i % 32) * 16 + 16, (i // 32) * 16 + 16))
    def rim(self, parts):
        key = tuple(p for p in RIM_ORDER if p in parts)
        if not key: return 0
        if key in self.cache: return self.cache[key]
        comp = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
        for p in key: comp.alpha_composite(self.tile(RIM[p]))
        a = np.array(comp)
        for i in range(self.count()):
            if np.array_equal(np.array(self.tile(i)), a): self.cache[key] = i; return i
        i = next(j for j in range(144, self.count()) if j not in self.used and not np.array(self.tile(j))[:, :, 3].any())   # slot kosong
        self.used.add(i); self.im.paste(comp, ((i % 32) * 16, (i // 32) * 16))
        self.cache[key] = i; self.added.append((key, i)); return i
    def save(self):
        if self.added: self.im.save(self.path, optimize=True)


# ---------- operasi peta ----------
class Ops:
    def __init__(self, S, tiles):
        self.S, self.T = S, tiles
        self.W = S.W
    def i(self, x, y): return y * self.W + x
    def grass(self, x, y, salt=11): return GRASS[int(hash01(x, y, salt) * len(GRASS)) % len(GRASS)]
    def roads(self, xmax=60, ymax=45):
        return {(x, y) for y in range(ymax) for x in range(xmax) if self.S.grid[y][x] == ','}
    def chamfers(self, R):
        out = {}
        for (x, y) in R:
            k = CH_ID.get(self.S.L['decor'][self.i(x, y)])
            if k and self.S.L['ground'][self.i(x, y)] != ROAD: out[(x, y)] = k
        return out
    def parts(self, x, y, R):
        p = []
        if (x, y + 1) in R: p.append('S')
        if (x, y - 1) in R: p.append('N')
        if (x + 1, y) in R: p.append('E')
        if (x - 1, y) in R: p.append('W')
        if (x + 1, y + 1) in R and (x + 1, y) not in R and (x, y + 1) not in R: p.append('SE')
        if (x - 1, y + 1) in R and (x - 1, y) not in R and (x, y + 1) not in R: p.append('SW')
        if (x + 1, y - 1) in R and (x + 1, y) not in R and (x, y - 1) not in R: p.append('NE')
        if (x - 1, y - 1) in R and (x - 1, y) not in R and (x, y - 1) not in R: p.append('NW')
        return p
    def rect_cells(self, r): return {(x, y) for y in range(r[1], r[3] + 1) for x in range(r[0], r[2] + 1)}
    def chamfer_of(self, rect, R):
        out = {}
        a, b, c, d = rect
        for (x, y, k, dx, dy) in ((a, b, 1, -1, -1), (c, b, 2, 1, -1), (a, d, 4, -1, 1), (c, d, 8, 1, 1)):
            if (x, y) in R and (x + dx, y) not in R and (x, y + dy) not in R: out[(x, y)] = k
        return out
    def repaint(self, R, CHM, window, reset=()):
        """Gambar ulang sel jendela dari himpunan jalan R (+ sudut terpotong CHM) dengan aturan build_village."""
        S = self.S; L = S.L; W = self.W
        for (x, y) in window:
            ch = S.grid[y][x]
            if ch not in '.,': continue                    # jangan sentuh bangunan, pagar, air, dll.
            i = y * W + x
            if (x, y) in R and (x, y) not in CHM:
                L['ground'][i] = ROAD; L['decor'][i] = 0; S.grid[y][x] = ','
            elif (x, y) in CHM:
                if L['ground'][i] not in GRASS_SET: L['ground'][i] = self.grass(x, y)
                L['decor'][i] = CHAMFER[CHM[(x, y)]]; S.grid[y][x] = ','
            else:
                if (x, y) in reset: L['ground'][i] = self.grass(x, y)
                L['decor'][i] = self.T.rim(self.parts(x, y, R)); S.grid[y][x] = '.'
        for (x, y), k in CHM.items():                      # serpihan sudut lama di diagonal luar dihapus
            dx = -1 if k in (1, 4) else 1; dy = -1 if k in (1, 2) else 1; cx, cy = x + dx, y + dy
            if (cx, cy) in window and (cx, cy) not in R and S.grid[cy][cx] in '.,': L['decor'][cy * W + cx] = 0
    def remove_objects(self, pred):
        n0 = len(self.S.objects); self.S.objects[:] = [o for o in self.S.objects if not pred(o)]; return n0 - len(self.S.objects)
    def set_cells(self, cells, grid=None, collision=None, **layers):
        for (x, y) in cells:
            i = y * self.W + x
            if grid is not None: self.S.grid[y][x] = grid
            if collision is not None: self.S.L['collision'][i] = collision
            for n, v in layers.items(): self.S.L[n][i] = v
    def sprite_cells(self, o):
        """Tile yang tertutup sprite (tumpang tindih >= 6 px), sama dengan build_world."""
        m = self.S.spr.get(o.get('k'))
        if not m: return set()
        out = set(); left = o['x'] - m['ax']; top = o['y'] - m['h']
        for yy in range(top // 16, (o['y'] - 1) // 16 + 1):
            if min(o['y'], (yy + 1) * 16) - max(top, yy * 16) < 6: continue
            for xx in range(left // 16, (left + m['w'] - 1) // 16 + 1):
                if min(left + m['w'], (xx + 1) * 16) - max(left, xx * 16) < 6: continue
                out.add((xx, yy))
        return out


# ---------- isi taman ----------
FLOWERS = ['flower_0', 'flower_2', 'flower_3', 'flower_4', 'flower_5', 'flower_6', 'flower_8', 'flower_9']

def add_obj(S, **o):
    o.setdefault('c', ''); S.objects.append(o); return o

def flower_bed(ops, x0, y0, x1, y1, salt, per_tile=2):
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            for n in range(per_tile):
                k = FLOWERS[int(hash01(tx, ty, salt + n) * len(FLOWERS)) % len(FLOWERS)]
                px = tx * 16 + 3 + int(hash01(tx, ty, salt + 10 + n) * 10); py = (ty + 1) * 16 - 1 - int(hash01(tx, ty, salt + 20 + n) * 5)
                add_obj(ops.S, k=k, x=px, y=py, c='f')

def block(ops, tx, ty):
    ops.S.grid[ty][tx] = 'X'; ops.S.L['collision'][ops.i(tx, ty)] = 1

def tree(ops, tx, ty, kind):
    if kind.startswith('tree_'): add_obj(ops.S, a=kind, x=tx * 16 + 8, y=(ty + 1) * 16)
    else: add_obj(ops.S, k=kind, x=tx * 16 + 8, y=(ty + 1) * 16)
    block(ops, tx, ty)

def lamp(ops, tx, ty): add_obj(ops.S, k='lamp', x=tx * 16 + 8, y=(ty + 1) * 16); block(ops, tx, ty)

def bench(ops, tx0, ty):          # bangku 2 tile lebar, tx0 = tile kiri
    add_obj(ops.S, k='bench', x=(tx0 + 1) * 16, y=(ty + 1) * 16); block(ops, tx0, ty); block(ops, tx0 + 1, ty)

def bush(ops, tx, ty, kind='bush_a'): add_obj(ops.S, k=kind, x=tx * 16 + 8, y=(ty + 1) * 16)


def apply(S, tiles, log):
    ops = Ops(S, tiles); W = S.W
    already = not any((o.get('x'), o.get('y')) == (448, 512) and str(o.get('k', '')).startswith(('b_', 'house')) for o in S.objects)
    if already: log(f'  {S.name}: sudah diterapkan, dilewati'); return False

    R = ops.roads(); CHM = ops.chamfers(R)

    # ================= no. 1 : hapus rumah, bangunan, padang timur =================
    gone = [o for o in S.objects if (o.get('x'), o.get('y')) in ((448, 512), (560, 512)) and str(o.get('k', '')).startswith(('b_', 'house'))]
    foot = set()
    for o in gone: foot |= ops.sprite_cells(o)
    ops.remove_objects(lambda o: o in gone)
    # pagar/tangga/tanah padang timur (x 38..52, y 28..35) dan semua objek polos di dalamnya
    def in_pasture(o):
        tx, ty = o['x'] // 16, (o['y'] - 1) // 16
        return 38 <= tx <= 52 and 25 <= ty <= 35 and (o.get('k') in ('fence_h', 'fence_v', 'ladder', 'bush_a', 'bush_b', 'bush_c') or o.get('c') == 'f')
    n_p = ops.remove_objects(in_pasture)
    # tebing bertingkat (y 25..27) menjadi rumput; bayangan tebing di y=28 dihapus
    pasture = {(x, y) for y in range(25, 35) for x in range(38, 53)}
    for (x, y) in pasture:
        i = ops.i(x, y)
        S.L['ground'][i] = ops.grass(x, y); S.L['shadow'][i] = 0; S.L['collision'][i] = 0
        if y > 25: S.L['decor'][i] = 0
        S.grid[y][x] = '.'
    for (x, y) in foot:
        i = ops.i(x, y); S.L['collision'][i] = 0
        if S.grid[y][x] in 'XS': S.grid[y][x] = '.'
    # jalan penghubung pintu lama (baris y=32, x 28..35) dilepas; jalan utama x 29..32 tetap
    stub_old = {(x, 32) for x in range(28, 36) if not (29 <= x <= 32)}
    R -= stub_old
    win_s = {(x, y) for y in range(25, 36) for x in range(26, 39)}
    ops.repaint(R, CHM, win_s | pasture, reset=stub_old)
    # blokir yatim di area yang dikosongkan (bukan lampu/bangku/papan/kios yang dipertahankan)
    keep = set()
    for o in S.objects:
        if o.get('k') in ('lamp', 'board', 'bench', 'crate', 'crates', 'barrel', 'barrel2', 'pot', 'sack', 'sack2') or str(o.get('a', '')).startswith('tree_') or str(o.get('k', '')).startswith(('pine_', 'rock_')):
            tx, ty = o['x'] // 16, (o['y'] - 1) // 16; keep.add((tx, ty))
            if o.get('k') == 'bench': keep.add(((o['x'] - 1) // 16, ty))
    orphans = [(x, y) for y in range(26, 36) for x in range(26, 54) if S.grid[y][x] == 'X' and (x, y) not in keep]
    for (x, y) in orphans: S.grid[y][x] = '.'; S.L['collision'][ops.i(x, y)] = 0
    if orphans: log(f'    blokir yatim dibersihkan: {orphans}')
    # sel pagar timur terakhir (x=53) dan (37,34) mungkin menyisakan blokir

    # ---- petak tanam 6x4 pindah ke ladang barat (interior x 9..18, y 29..33), baris 29 = lorong masuk ----
    meta = S.ix
    slots = [[x * 16 + 8, y * 16 + 8] for y in range(30, 34) for x in range(11, 17)]
    meta['farm'] = slots
    for y in range(29, 34):
        for x in range(9, 19): S.grid[y][x] = '.'
    # pagar utara ladang: celah di ujung jalan setapak (x 13..14)
    for x in (13, 14):
        i = ops.i(x, 28); S.grid[28][x] = ','; S.L['collision'][i] = 0; S.L['ground'][i] = ROAD; S.L['decor'][i] = 0
    ops.remove_objects(lambda o: o.get('k') == 'fence_h' and o['y'] == 464 and o['x'] in (216, 232))
    meta['farmGate'] = {'side': 'N', 'cols': [13, 14]}

    # ---- Taman Desa: isi ruang yang dikosongkan ----
    # sisi jalan utama (simetris terhadap sumbu x=31): petak bunga + bangku + lampu
    for (bx0, bx1) in ((26, 27), (34, 35)):
        flower_bed(ops, bx0, 29, bx1, 30, 100); flower_bed(ops, bx0, 32, bx1, 33, 140)
    bench(ops, 26, 31); bench(ops, 34, 31)
    lamp(ops, 28, 33); lamp(ops, 33, 33)
    for tx, kind in ((26, 'bush_a'), (28, 'bush_c'), (33, 'bush_c'), (35, 'bush_a')): bush(ops, tx, 35, kind)
    # padang timur: pepohonan teratur di tepi selatan dan timur, ruang tengah dibiarkan lapang
    for n, tx in enumerate(range(38, 52, 3)): tree(ops, tx, 34, ('tree_1', 'tree_2')[n % 2])
    for n, ty in enumerate(range(28, 34, 2)): tree(ops, 52, ty, ('pine_a', 'pine_b')[n % 2])
    flower_bed(ops, 41, 29, 43, 30, 200, 2); flower_bed(ops, 47, 29, 49, 30, 240, 2)   # dua petak simetris terhadap x=45
    lamp(ops, 45, 29); bench(ops, 43, 31); bench(ops, 46, 31)
    for tx, ty, kind in ((39, 28, 'bush_b'), (51, 28, 'bush_b'), (39, 32, 'bush_a'), (50, 33, 'bush_c')): bush(ops, tx, ty, kind)
    for n in range(26):             # bunga liar tersebar di rumput lapang
        tx = 37 + int(hash01(n, 7, 301) * 15); ty = 28 + int(hash01(n, 9, 302) * 6)
        if S.grid[ty][tx] != '.' or (40 <= tx <= 50 and 29 <= ty <= 31): continue
        add_obj(S, k=FLOWERS[int(hash01(n, 3, 303) * len(FLOWERS)) % len(FLOWERS)], x=tx * 16 + 3 + int(hash01(n, 4, 304) * 10), y=(ty + 1) * 16 - 2, c='f')

    # ================= no. 2 : jalan setapak sejajar pintu =================
    # b_res1 (@200,320): pintu berpusat di tengah tile x=12 -> jalan 3 petak lebar (x 11..13)
    # b_toko (@320,320): pintu berpusat di batas tile x=19|20 -> jalan 2 petak lebar (x 19..20)
    old1, new1 = (12, 20, 13, 21), (11, 20, 13, 21)
    old2, new2 = (18, 20, 20, 21), (19, 20, 20, 21)
    for r in (old1, old2):
        R -= ops.rect_cells(r)
        for c in ops.rect_cells(r): CHM.pop(c, None)
    for r in (new1, new2):
        R |= ops.rect_cells(r)
    for r in (new1, new2): CHM.update(ops.chamfer_of(r, R))
    win_d = {(x, y) for y in range(18, 23) for x in range(9, 23)}
    # objek polos yang menutup sel jalan baru dibuang
    cells_new = ops.rect_cells(new1) | ops.rect_cells(new2)
    ops.remove_objects(lambda o: ((o['x'] // 16, (o['y'] - 1) // 16) in cells_new) and o.get('c') == 'f')
    ops.repaint(R, CHM, win_d, reset=(ops.rect_cells(old1) | ops.rect_cells(old2)) - cells_new)
    log(f'  {S.name}: -{len(gone)} bangunan, -{n_p} objek padang, petak tanam dipindah, taman terisi, jalan Toko/Rumah barat disejajarkan')
    return True


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1])); a = ap.parse_args()
    log = print; changed = False
    tiles = Tiles(a.root)
    for cls in (World, Village):
        S = cls(a.root)
        if apply(S, tiles, log): S.save(); changed = True
    tiles.save()
    if tiles.added: log(f'  tile baru di tiles.png: {tiles.added}')
    # interior.json: hapus pintu bangunan yang dihapus
    ip = Path(a.root) / 'assets/world/interior.json'
    it = json.loads(ip.read_text(encoding='utf-8')); n0 = len(it['buildingDoors'])
    it['buildingDoors'] = [b for b in it['buildingDoors'] if not (b['id'] in ('home', 'res7'))]
    if len(it['buildingDoors']) != n0: ip.write_text(json.dumps(it, ensure_ascii=False), encoding='utf-8'); log(f'  interior.json: -{n0 - len(it["buildingDoors"])} pintu')
    print('selesai' if changed else 'tidak ada perubahan')

if __name__ == '__main__': main()
