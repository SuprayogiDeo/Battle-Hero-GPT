#!/usr/bin/env python3
"""Perbaikan peta 10A (data saja): jalan Balai Desa, jalan timur jembatan, semak b_res5.

1. Balai Desa: tangga diagonal 1 petak (77,44) -> (66,50) diganti jalur L lebar 1 petak:
   dari depan pintu (77,44) lurus ke selatan sampai y=47, lalu lurus ke barat sampai jalan utara-selatan x=65.
   Petak tangga yang tidak terpakai dikembalikan ke rumput (ground, decor, collision, grid).
   Tile jalan di luar desa lama (x > 60) memang polos: ground ROAD=34, decor 0, tanpa tepi. Jalur baru mengikuti itu.
2. Timur jembatan: jalan 1 petak (y=23) dilebarkan menjadi 3 petak (y 22..24) di x 61..62, 2 petak (y 23..24) di x=63,
   lalu 1 petak. Tepi (rim) di sisi rumput memakai tile yang sama dengan jalan barat jembatan (cermin): S/N/SE/NE/SW dari
   tabel RIM di fix_map_9a.py; komposit dicari dulu di tiles.png (pencocokan piksel), tile baru hanya bila belum ada.
3. Semak bush_c di (50.5,15) dipindah ke rumput bebas >= 3 petak dari pintu b_res5, >= 3 petak (Chebyshev) dari jalan, tanpa objek lain
   dalam radius 2 petak. Sel padat lama dibuka, sel padat baru ditutup (bush_c memblokir selnya).

Idempoten: tiap tugas dicek terhadap keadaan 'lama' yang diharapkan; bila sudah 'baru' dilewati, bila selain itu
dilewati dengan peringatan. Tulis ke disk hanya setelah semua pemeriksaan selesai. Tugas gagal tidak membatalkan yang lain.
Pakai: python3 tools/fix_map_10a.py [--root DIR] [--dry-run]
"""
import argparse, math, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_map_9a import World, Tiles, Ops, ROAD, GRASS_SET, RIM, RIM_ORDER

GRASSY = GRASS_SET | {11}      # 11 = varian rumput (rata-rata warna 97,196,79) yang juga dipakai peta, tidak ada di GRASS_SET milik 9a
# ---- Tugas 1
STAIR = [(77, 44), (76, 45), (77, 45), (74, 46), (75, 46), (72, 47), (73, 47), (69, 48), (70, 48), (71, 48), (67, 49), (68, 49), (66, 50)]
JOIN_Y, ROAD_X, DOOR = 47, 65, (77, 44)
PATH = [(77, y) for y in range(44, JOIN_Y + 1)] + [(x, JOIN_Y) for x in range(76, ROAD_X, -1)]
# ---- Tugas 2
EAST_NEW = [(61, 22), (62, 22), (61, 24), (62, 24), (63, 24)]
EAST_ROAD_OLD = [(61, 23), (62, 23), (63, 23)]
EAST_WINDOW = [(x, y) for y in range(21, 26) for x in range(60, 64)]       # sel yang mungkin mendapat tepi
# ---- Tugas 3
BUSH = {'k': 'bush_c', 'x': 808, 'y': 240}; B_RES5 = 'b_res5'


def foot(o): return (int(o['x']) // 16, (int(o['y']) - 1) // 16)


class Ctx:
    def __init__(self, S, ops, tiles, log):
        self.S, self.ops, self.tiles, self.log = S, ops, tiles, log; self.W = S.W
    def g(self, x, y): return self.S.L['ground'][y * self.W + x]
    def d(self, x, y): return self.S.L['decor'][y * self.W + x]
    def c(self, x, y): return self.S.L['collision'][y * self.W + x]
    def ch(self, x, y): return self.S.grid[y][x]
    def obj_at(self, x, y, skip=None): return [o for o in self.S.objects if 'k' in o and o is not skip and foot(o) == (x, y)]
    def clean_grass(self, x, y):
        return self.ch(x, y) == '.' and self.g(x, y) in GRASSY and self.d(x, y) == 0 and self.c(x, y) == 0 and not self.obj_at(x, y)


def road_table(cx):
    """Cetak tabel id tile jalan -> peran, dibaca dari peta (bukan ditebak)."""
    print('Tabel tile jalan (dari tiles.png + peta):')
    print(f'  ground {ROAD}  = tengah jalan (dipakai di semua jalan, juga jalan polos x>60)')
    for k in RIM_ORDER: print(f'  decor  {RIM[k]:>3}  = tepi/sudut rumput "{k}" (jalan ada di arah {k})')
    print('  decor  komposit (mis. S+W, N+E) = tumpukan dua tile tepi; dicari dulu di tiles.png, dibuat hanya bila belum ada')
    ex = [(x, y) for y in (21, 25) for x in range(46, 54) if cx.d(x, y)]
    print('  contoh jalan barat jembatan (rim di rumput): ' + ', '.join(f'({x},{y})={cx.d(x, y)}' for x, y in ex[:8]))
    print('  contoh belokan polos (x>60): (64,23)->(64,24) ground', cx.g(64, 23), cx.g(64, 24), 'decor', cx.d(64, 23), cx.d(64, 24), '; T (65,46): decor', cx.d(65, 46))


# ---------------------------------------------------------------- tugas 1
def plan_hall(cx):
    revert = [c for c in STAIR if c not in PATH]; new = [c for c in PATH if c not in STAIR]
    anchors = [(65, JOIN_Y), DOOR]
    if not all(cx.g(*a) == ROAD and cx.ch(*a) == ',' for a in anchors): return None, 'jangkar jalan (pintu / x=65) bukan jalan seperti diharapkan'
    if all(cx.g(*c) == ROAD and cx.ch(*c) == ',' for c in new) and not any(cx.g(*c) == ROAD for c in revert):
        return None, 'sudah diterapkan'
    if not all(cx.g(*c) == ROAD and cx.ch(*c) == ',' for c in revert): return None, 'petak tangga lama tidak seperti diharapkan'
    bad = [c for c in new if not cx.clean_grass(*c)]
    if bad: return None, f'petak jalur baru tidak bersih: {bad}'
    def apply():
        for (x, y) in new:
            i = y * cx.W + x; cx.S.L['ground'][i] = ROAD; cx.S.L['decor'][i] = 0; cx.S.L['collision'][i] = 0; cx.S.grid[y][x] = ','
        for (x, y) in revert:
            i = y * cx.W + x; cx.S.L['ground'][i] = cx.ops.grass(x, y); cx.S.L['decor'][i] = 0; cx.S.L['collision'][i] = 0; cx.S.grid[y][x] = '.'
    return apply, f'jalur L: {len(new)} petak jalan baru, {len(revert)} petak tangga -> rumput'


# ---------------------------------------------------------------- tugas 2
def plan_east(cx):
    S = cx.S
    if not all(cx.g(*c) == ROAD and cx.ch(*c) == ',' for c in EAST_ROAD_OLD): return None, 'jalan timur 1 petak (y=23, x 61..63) tidak ada'
    if all(cx.g(*c) == ROAD and cx.ch(*c) == ',' for c in EAST_NEW): return None, 'sudah diterapkan'
    bad = [c for c in EAST_NEW if not cx.clean_grass(*c)]
    if bad: return None, f'petak pelebaran tidak bersih/ada objek: {bad}'
    if any(cx.ch(x, y) == '~' for x in (61, 62, 63) for y in (21, 22, 23, 24, 25)): return None, 'ada air di zona pelebaran'
    R = set(EAST_NEW) | set(EAST_ROAD_OLD)             # tepi dihitung seolah jalan berhenti di x=63 (tepi rapi, tanpa pinggiran sepotong di jalan polos)
    rims = {}
    for (x, y) in EAST_WINDOW:
        if (x, y) in R or S.grid[y][x] != '.': continue
        parts = cx.ops.parts(x, y, R)
        if not parts: continue
        if cx.d(x, y) != 0: print(f'  PERINGATAN: decor ({x},{y})={cx.d(x, y)} bukan 0, tepi dilewati'); continue
        rims[(x, y)] = parts
    def apply():
        for (x, y) in EAST_NEW:
            i = y * cx.W + x; S.L['ground'][i] = ROAD; S.L['decor'][i] = 0; S.L['collision'][i] = 0; S.grid[y][x] = ','
        for (x, y), parts in rims.items():
            S.L['decor'][y * cx.W + x] = cx.tiles.rim(parts); S.grid[y][x] = '.'
        for (x, y), parts in sorted(rims.items()): cx.log(f'    tepi ({x},{y}) {"+".join(p for p in RIM_ORDER if p in parts)} -> {S.L["decor"][y * cx.W + x]}')
    return apply, f'{len(EAST_NEW)} petak jalan baru + {len(rims)} petak tepi rumput'


# ---------------------------------------------------------------- tugas 3
def plan_bush(cx):
    S = cx.S; ops = cx.ops
    res = next((o for o in S.objects if o.get('k') == B_RES5), None)
    if not res: return None, 'b_res5 tidak ada'
    door_t = (int((res['x'] - S.spr[B_RES5]['ax'] + S.spr[B_RES5]['door'][0] + S.spr[B_RES5]['door'][2] / 2) // 16), int(res['y']) // 16)
    bush = next((o for o in S.objects if o.get('k') == BUSH['k'] and o['x'] == BUSH['x'] and o['y'] == BUSH['y']), None)
    if not bush: return None, 'sudah diterapkan (atau semak tidak di (50.5,15))'
    old = foot(bush)
    if not (cx.ch(*old) == 'X' and cx.c(*old) == 1): return None, f'sel padat semak lama {old} tidak seperti diharapkan'
    roads = [(x, y) for y in range(S.H) for x in range(S.W) if S.grid[y][x] == ',']
    others = [o for o in S.objects if 'k' in o and o is not bush]
    best = None
    for y in range(old[1] - 8, old[1] + 9):
        for x in range(old[0] - 8, old[0] + 9):
            if not (0 <= x < S.W and 0 <= y < S.H) or (x, y) == old or not cx.clean_grass(x, y): continue
            if math.hypot(x - door_t[0], y - door_t[1]) < 3.0: continue
            if min(max(abs(x - rx), abs(y - ry)) for rx, ry in roads) < 3: continue
            if any(math.hypot(foot(o)[0] - x, foot(o)[1] - y) <= 2.0 for o in others): continue
            if any(S.grid[yy][xx] not in '.' or cx.c(xx, yy) for yy in range(y - 1, y + 2) for xx in range(x - 1, x + 2) if (xx, yy) != (x, y) and 0 <= xx < S.W and 0 <= yy < S.H and (xx, yy) != old): continue
            d = math.hypot(x - old[0], y - old[1])
            if best is None or (d, y, x) < best[0]: best = ((d, y, x), (x, y))
    if not best: return None, 'tidak ada petak rumput bebas yang memenuhi syarat'
    nx, ny = best[1]
    def apply():
        S.grid[old[1]][old[0]] = '.'; S.L['collision'][old[1] * cx.W + old[0]] = 0
        bush['x'] = nx * 16 + 8; bush['y'] = (ny + 1) * 16
        S.grid[ny][nx] = 'X'; S.L['collision'][ny * cx.W + nx] = 1
    return apply, f'bush_c {old} -> ({nx},{ny}); pintu b_res5 ~{door_t}; jarak {math.hypot(nx - door_t[0], ny - door_t[1]):.1f} petak'


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent)); ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args(); root = Path(a.root)
    log = print
    S = World(root); tiles = Tiles(root); ops = Ops(S, tiles); cx = Ctx(S, ops, tiles, log)
    road_table(cx)
    jobs = []
    for name, fn in (('1 Jalan Balai Desa', plan_hall), ('2 Jalan timur jembatan', plan_east), ('3 Semak b_res5', plan_bush)):
        try: apply, msg = fn(cx)
        except Exception as e: apply, msg = None, f'galat: {e!r}'
        print(f'[{name}] {msg}' + ('' if apply else '  -> dilewati'))
        if apply: jobs.append((name, apply))
    if not jobs: print('Tidak ada perubahan.'); return 0
    if a.dry_run: print('--dry-run: tidak menulis.'); return 0
    for name, apply in jobs: apply()
    S.save(); tiles.save()
    if tiles.added: print('Tile baru di tiles.png:', tiles.added)
    if root.resolve() == Path(__file__).resolve().parent.parent:
        subprocess.check_call([sys.executable, str(Path(__file__).resolve().parent / 'build_minimap_roads.py')])
    print('Selesai:', ', '.join(n for n, _ in jobs)); return 0


if __name__ == '__main__': sys.exit(main())
