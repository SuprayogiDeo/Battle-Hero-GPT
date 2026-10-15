#!/usr/bin/env python3
"""Perbaikan peta 9C (daftar bug foto no. 5, 6, 7 — bagian data).

no. 5  Jalan ke pintu Rumah Penduduk timur (b_res2 @808,320) disejajarkan: pintu di tengah tile x=50 -> jalan 3 petak (x 49..51),
       petak nyasar di (50,20) dibuang.
no. 6  Jembatan kayu timur: seluruh dek (y 22..24) bisa dilalui; sebelumnya baris atas/bawah padat sehingga pemain yang
       berdiri di jalur bawah terhalang meski ruang depan kosong.
Idempoten. Pakai: python3 tools/fix_map_9c.py [--root DIR]
"""
import argparse, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_map_9a import World, Village, Tiles, Ops

def apply(S, tiles, log):
    ops = Ops(S, tiles); W = S.W; msgs = []
    # --- no. 6: dek jembatan bebas ---
    n = 0
    for y in range(H := S.H):
        for x in range(W):
            if S.grid[y][x] == '+' and S.L['collision'][y * W + x]: S.L['collision'][y * W + x] = 0; n += 1
    if n: msgs.append(f'{n} sel dek jembatan dibuka')
    # --- no. 5: jalan b_res2 ---
    R = ops.roads(); CHM = ops.chamfers(R)
    old = ops.rect_cells((48, 20, 49, 21)) | {(50, 20)}; new = (49, 20, 51, 21)
    if (49, 20) in R and (51, 20) in R and (48, 20) not in R and (50, 20) in R and S.grid[21][51] == ',':
        pass
    if (48, 20) in R or (50, 20) in R:
        R -= old
        for c in old: CHM.pop(c, None)
        R |= ops.rect_cells(new); CHM.update(ops.chamfer_of(new, R))
        cells = ops.rect_cells(new)
        ops.remove_objects(lambda o: ((o['x'] // 16, (o['y'] - 1) // 16) in cells) and o.get('c') == 'f')
        for (x, y) in cells:       # blokir yatim di sel jalan baru
            if S.grid[y][x] == 'X' and not any(o['x'] // 16 == x and (o['y'] - 1) // 16 == y and (o.get('k') in ('lamp', 'board', 'sign', 'crate', 'barrel') or str(o.get('a', '')).startswith('tree')) for o in S.objects):
                S.grid[y][x] = '.'; S.L['collision'][y * W + x] = 0
        win = {(x, y) for y in range(18, 23) for x in range(46, 55)}
        ops.repaint(R, CHM, win, reset=old - cells)
        msgs.append('jalan b_res2 -> x=49..51')
    if not msgs: log(f'  {S.name}: sudah diterapkan, dilewati'); return False
    log(f'  {S.name}: ' + ', '.join(msgs)); return True

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1])); a = ap.parse_args()
    tiles = Tiles(a.root); ch = False
    for cls in (World, Village):
        S = cls(a.root)
        if apply(S, tiles, print): S.save(); ch = True
    tiles.save(); print('selesai' if ch else 'tidak ada perubahan')
if __name__ == '__main__': main()
