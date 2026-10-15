#!/usr/bin/env python3
"""Perbaikan peta 9B (daftar bug foto no. 3 dan 4).

no. 3  Ladang: gerbang dua daun di celah utara (data `farmGate` + label), tanpa sorot/teks "ladang di bawah" (JS).
no. 4  Gerbang petualangan: menara kanan digeser agar simetris terhadap jalan (x=29..32), plat kosong dihapus,
       nama 'Gerbang' menjadi label melayang seperti tempat lain.
Idempoten. Pakai: python3 tools/fix_map_9b.py [--root DIR]
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_map_9a import World, Village

def apply(S, log):
    towers = [o for o in S.objects if o.get('k') == 'tower' and o.get('c') == 'G']
    if not any(o['x'] == 560 for o in towers): log(f'  {S.name}: sudah diterapkan, dilewati'); return False
    W = S.W
    for o in towers:
        if o['x'] == 560: o['x'] = 544
    S.grid[8][35] = '.'; S.L['collision'][8 * W + 35] = 0            # sel menara kanan lama dibebaskan
    S.grid[8][33] = 'G'; S.L['collision'][8 * W + 33] = 1            # menara kanan baru menutup x=33..34
    S.ix['bld']['G'] = [27, 8, 34, 8]
    n0 = len(S.objects)
    S.objects[:] = [o for o in S.objects if not (o.get('k') == 'board' and (o['x'], o['y']) in ((456, 160), (536, 160)))]
    for x in (28, 33): S.grid[9][x] = '.'; S.L['collision'][9 * W + x] = 0
    S.ix['labels'] = [{'id': 'adventure_gate', 'x': 31.0, 'y': 7.2, 'name': 'Gerbang', 'name_en': 'Gate'}]
    S.ix['farmGate'].update(name='Ladang', name_en='Farm')
    log(f'  {S.name}: menara kanan x=560->544, bld.G=[27,8,34,8], -{n0 - len(S.objects)} plat kosong, label Gerbang, farmGate bernama')
    return True

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1])); a = ap.parse_args()
    ch = False
    for cls in (World, Village):
        S = cls(a.root)
        if apply(S, print): S.save(); ch = True
    print('selesai' if ch else 'tidak ada perubahan')
if __name__ == '__main__': main()
