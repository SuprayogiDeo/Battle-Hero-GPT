#!/usr/bin/env python3
"""Perbaikan peta 9F: Pasar besar yang bisa dimasuki menggantikan kios kecil.

- Kios lama (`stall_red`, layanan `market_cashier`) dihapus; kasir pindah ke dalam hall (interior `market`).
- Taman timur (x 36..52, y 25..35) dikosongkan seluruhnya (permintaan: "cukup pasar saja"): objek dibuang, rumput dan jalan digambar ulang.
- Hall `b_market` (208x144 px, 13x9 tile) berdiri di x 39..51, y 25..33; pintu menghadap selatan di (45,34).
  Jalan masuk: jalur barat x 37..38 dari jalan utama (y=25) turun ke halaman depan y 34..35 (x 37..52).
- Tempat `village_market` jadi bangunan bernama "Pasar" (zona depan pintu), layanan `market_cashier` dihapus dari index.
Butuh aset dari tools/build_market_assets.py (spr.b_market). Idempoten. Pakai: python3 tools/fix_map_9f.py [--root DIR]
"""
import argparse, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_map_9a import World, Village, Tiles, Ops, ROAD

REG = (36, 25, 52, 35)                 # taman timur yang dikosongkan (x0, y0, x1, y1)
HALL = (39, 25, 51, 33)                # footprint padat hall
HALL_OBJ = {'k': 'b_market', 'x': 728, 'y': 544, 'c': ''}
PATH_W = (37, 25, 38, 35); YARD = (37, 34, 52, 35)

def apply(S, tiles, log, is_world):
    ops = Ops(S, tiles); W = S.W
    done = any(o.get('k') == 'b_market' for o in S.objects) if is_world else S.grid[25][39] == 'X' and S.grid[30][45] == 'X'
    if done: log(f'  {S.name}: sudah diterapkan, dilewati'); return False
    if is_world and 'b_market' not in S.spr: raise SystemExit('spr.b_market belum ada: jalankan tools/build_market_assets.py dulu')
    # 1. kios lama + blokir 9E
    n_stall = ops.remove_objects(lambda o: o.get('k') == 'stall_red' and (o.get('serviceId') == 'market_cashier' or (o['x'], o['y']) == (552, 416)))
    for y in (24, 25):
        for x in (33, 34, 35):
            i = ops.i(x, y)
            if S.grid[y][x] == 'X': S.grid[y][x] = ',' if S.L['ground'][i] == ROAD else '.'
            S.L['collision'][i] = 0
    # 2. kosongkan taman timur
    x0, y0, x1, y1 = REG
    n_obj = ops.remove_objects(lambda o: x0 <= o['x'] // 16 <= x1 and y0 <= (o['y'] - 1) // 16 <= y1)
    for (x, y) in ops.rect_cells(REG):
        i = ops.i(x, y); S.grid[y][x] = '.'; S.L['collision'][i] = 0; S.L['shadow'][i] = 0
        if S.L['ground'][i] == ROAD: S.L['ground'][i] = ops.grass(x, y)
        if y > 25: S.L['decor'][i] = 0
    # 3. jalan masuk (jalur barat + halaman depan), tepi dan sudut digambar ulang dengan aturan build_village
    R = ops.roads(); CHM = ops.chamfers(R)
    for r in (PATH_W, YARD): R |= ops.rect_cells(r)
    for r in (PATH_W, YARD): CHM.update(ops.chamfer_of(r, R))
    window = ops.rect_cells((x0 - 1, y0 - 1, x1 + 2, y1 + 1)) | {(x, y) for y in (24, 25) for x in range(33, 36)}
    ops.repaint(R, CHM, window, reset=ops.rect_cells(REG) - R)
    # 4. hall padat
    ops.set_cells(ops.rect_cells(HALL), grid='X', collision=1)
    msgs = [f'kios lama -{n_stall}', f'taman timur -{n_obj} objek', 'jalan masuk + hall (footprint x39..51, y25..33)']
    if is_world:
        S.objects.append(dict(HALL_OBJ)); ix = S.ix
        ix['serviceObjects'] = [s for s in ix.get('serviceObjects', []) if s['id'] != 'market_cashier']
        for p in ix['places']:
            if p['id'] == 'village_market':
                p.clear(); p.update(id='village_market', name='Pasar', name_en='Market', type='market', x=44, y=34, sprite='b_market', footprint=[3, 2], signAt=[832, 556])
        msgs.append('place village_market -> bangunan "Pasar", layanan market_cashier dihapus')
    log(f'  {S.name}: ' + '; '.join(msgs)); return True

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1])); a = ap.parse_args()
    tiles = Tiles(a.root); ch = False
    for cls, w in ((World, True), (Village, False)):
        S = cls(a.root)
        if apply(S, tiles, print, w): S.save(); ch = True
    tiles.save(); print('selesai' if ch else 'tidak ada perubahan')
if __name__ == '__main__': main()
