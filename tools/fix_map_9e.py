#!/usr/bin/env python3
"""Perbaikan peta 9E (polish visual, Step 1).

a. Papan merah kosong (`board` @600,384 -> tile 37,23) dekat Pasar dibuang: bukan papan misi/layanan, tanpa teks.
b. Kios Pasar (`stall_red` @552,416 = Kasir Pasar) jadi padat: footprint sprite (tumpang tindih >= 6 px) memblokir
   x=33..35, y=24..25. Baris depan kios (y=26) tetap bebas, jadi kasir tetap terjangkau.
c. Jembatan timur: hanya pagar (tepi) yang padat, lantai papan tetap bisa dilalui. Collision per pita piksel lewat
   `bridgeRails` di index.json + `Tmap.railSolid` (dipakai `wSolid`). Lantai yang tampak: dari 8 px di baris y=22 sampai 9 px di baris y=24.
Idempoten. Pakai: python3 tools/fix_map_9e.py [--root DIR]
"""
import argparse, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_map_9a import World, Village, Tiles, Ops

BRIDGE_X = range(53, 61); RAIL_ROWS = (22, 24)
# Pita padat dalam piksel dunia di dalam baris: baris atas y<16 (pagar piksel-tile 0..7), baris bawah y>=18 (pagar piksel-tile 9..15).
RAILS = [{'x0': 53, 'x1': 60, 'top': 22, 'bot': 24, 'topSolid': 16, 'botSolid': 18}]

def apply(S, tiles, log):
    ops = Ops(S, tiles); W = S.W; msgs = []
    # a. papan kosong
    n = ops.remove_objects(lambda o: o.get('k') == 'board' and (o['x'], o['y']) == (600, 384) and not o.get('serviceId'))
    if n:
        if S.grid[23][37] == 'X': S.grid[23][37] = '.'; S.L['collision'][23 * W + 37] = 0
        msgs.append('papan kosong dibuang')
    # b. kios pasar padat (footprint sprite stall_red @552,416 = x 33..35, y 24..25; village.json tidak punya objek kios, jadi petaknya tetap)
    fresh = {(x, y) for y in (24, 25) for x in (33, 34, 35) if S.grid[y][x] != 'X'}
    if fresh:
        ops.set_cells(fresh, grid='X', collision=1); msgs.append(f'kios pasar padat ({len(fresh)} petak)')
    # c. pagar jembatan: collision per pita piksel (js/tilemap.js railSolid), BUKAN per tile penuh. Satu tile baris pagar berisi pagar
    #    di sisi luar dan papan lantai di sisi dalam; memadatkan seluruh tile membuat lantai yang tampak datar tidak bisa dilalui.
    m = 0
    for y in RAIL_ROWS:
        for x in BRIDGE_X:
            if x < W and S.grid[y][x] == 'X' and S.grid[23][x] == '+': S.grid[y][x] = '+'; S.L['collision'][y * W + x] = 0; m += 1
    if m: msgs.append(f'{m} sel jembatan dikembalikan terbuka di level tile')
    if hasattr(S, 'ix') and S.name == 'index+chunks' and S.ix.get('bridgeRails') != RAILS:
        S.ix['bridgeRails'] = RAILS; msgs.append('metadata bridgeRails')
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
