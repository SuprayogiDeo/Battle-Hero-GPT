#!/usr/bin/env python3
"""Perbaikan peta 9D (daftar bug foto no. 8 dan 9).

no. 8  Bengkel Desa dan Dapur Desa terlalu mepet jalan utama (x=65): digeser ke barat (bengkel 4 petak, dapur 3 petak)
       sehingga sejajar di x=59.5 dengan jarak >= 3 petak dari jalan. Jalan ke pintu mengikuti pintu baru.
no. 9  Hutan Jamur: plat (objek `sign`) ditambahkan di mulut jalan masuk seperti biome lain; label melayang tempatnya dimatikan.
Idempoten. Pakai: python3 tools/fix_map_9d.py [--root DIR]
"""
import argparse, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_map_9a import World, Ops, Tiles, ROAD

def shift_building(S, ops, key, old_x, dx_tiles, rows, cols):
    W = S.W; o = next(o for o in S.objects if o.get('k') == key and o['x'] == old_x)
    o['x'] += dx_tiles * 16
    for y in rows:
        for x in cols:
            S.grid[y][x] = '.'; S.L['collision'][y * W + x] = 0
    for y in rows:
        for x in cols:
            S.grid[y][x + dx_tiles] = 'X'; S.L['collision'][y * W + x + dx_tiles] = 1

def apply(S, tiles, root, log):
    if not any(o.get('k') == 'b_workshop' and o['x'] == 1016 for o in S.objects): log('  sudah diterapkan, dilewati'); return False
    ops = Ops(S, tiles); W = S.W
    # --- no. 8: geser bengkel (-4) dan dapur (-3); x pusat keduanya menjadi 952 (tengah tile 59) ---
    shift_building(S, ops, 'b_workshop', 1016, -4, range(42, 46), range(62, 65))
    shift_building(S, ops, 'b_kitchen', 1000, -3, range(57, 61), range(61, 64))
    for p in S.ix['places']:
        if p['id'] == 'village_workshop': p['x'] = 59; p['signAt'][0] -= 64
        if p['id'] == 'village_kitchen': p['x'] = 59; p['signAt'][0] -= 48
    # jalan bengkel: baris y=46 dari x=58 (undakan 3 petak x=58..60 di bawah pintu) menyambung ke jalan utama x=65
    for x in range(58, 63):
        i = 46 * W + x; S.L['ground'][i] = ROAD; S.L['decor'][i] = 0; S.grid[46][x] = ','
    ops.remove_objects(lambda o: o.get('c') == 'f' and 58 <= o['x'] // 16 <= 62 and (o['y'] - 1) // 16 == 46)
    # dapur: pintu baru (59,61) jatuh di jalan barat-timur y=61 (x 54..60); undakan lama (62,61) dibuang
    i = 61 * W + 62; S.L['ground'][i] = ops.grass(62, 61); S.grid[61][62] = '.'
    # --- no. 9: plat Hutan Jamur di mulut jalan masuk (tile 102,28), diblokir seperti plat meadow ---
    ref = next(o for o in S.objects if o.get('biomeSign') == 'meadow'); rx, ry = ref['x'] // 16, (ref['y'] - 1) // 16
    ops.remove_objects(lambda o: o.get('k') == 'flower_4' and (o['x'], o['y']) == (1640, 464))
    S.objects.append({'k': 'sign', 'x': 1640, 'y': 464, 'c': '', 'placeSign': 'mushroom_wood', 'signName': 'Hutan Jamur', 'signNameEn': 'Mushroom Grove'})
    S.grid[28][102] = S.grid[ry][rx]; S.L['collision'][28 * W + 102] = S.L['collision'][ry * W + rx]
    for p in S.ix['places']:
        if p['id'] == 'mushroom_wood': p['noLabel'] = True
    log('  index+chunks: bengkel x 1016->952, dapur x 1000->952, jalan bengkel y=46 x=58..62, plat Hutan Jamur @ (102,28)')
    return True

def patch_text(root):
    r = Path(root)
    # interior.json + js/interior.js + build_interiors.py
    ip = r / 'assets/world/interior.json'; it = json.loads(ip.read_text(encoding='utf-8'))
    for b in it['buildingDoors']:
        if b['id'] == 'bengkel': b['exterior']['x'] = 952
        if b['id'] == 'dapur': b['exterior']['x'] = 952
    ip.write_text(json.dumps(it, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    jp = r / 'js/interior.js'; s = jp.read_text(encoding='utf-8')
    s = s.replace("{id:'bengkel',tpl:'workshop',x:1016,", "{id:'bengkel',tpl:'workshop',x:952,").replace("{id:'dapur',tpl:'kitchen',x:1000,", "{id:'dapur',tpl:'kitchen',x:952,")
    jp.write_text(s, encoding='utf-8')
    bp = r / 'tools/build_interiors.py'; s = bp.read_text(encoding='utf-8')
    s = s.replace("('home','home',448,512,11,8,5), ('bengkel','workshop',1016,736,11,8,5),", "('bengkel','workshop',952,736,11,8,5),")
    s = s.replace("('dapur','kitchen',1000,976,11,8,5)", "('dapur','kitchen',952,976,11,8,5)")
    s = s.replace("\n    ('res7','res1',560,512,9,7,4),", "")
    bp.write_text(s, encoding='utf-8')
    dp = r / 'tools/world_design.json'; d = json.loads(dp.read_text(encoding='utf-8'))
    for p in d['places']:
        if p['id'] == 'village_workshop': p['x'] = 59
        if p['id'] == 'village_kitchen': p['x'] = 59
        if p['id'] == 'mushroom_wood': p['noLabel'] = True; p['sign'] = {'x': 102, 'y': 28}
    dp.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding='utf-8')

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1])); a = ap.parse_args()
    tiles = Tiles(a.root); S = World(a.root)
    if apply(S, tiles, a.root, print): S.save(); patch_text(a.root); tiles.save(); print('selesai')
    else: print('tidak ada perubahan')
if __name__ == '__main__': main()
