#!/usr/bin/env python3
"""Tambahkan V.roads (96 string '0'/'1') ke assets/world/index.json untuk minimap.
Grid peta tidak memuat jalan tanah; skrip ini mengklasifikasi tile ground berwarna tanah dari chunk.
Idempoten. Jalankan SETELAH build_world.py bila index.json dibangun ulang."""
import json, os
from PIL import Image
B = os.path.join(os.path.dirname(__file__), '..', 'assets', 'world')
p = os.path.join(B, 'index.json'); V = json.load(open(p))
ti = Image.open(os.path.join(B, 'tiles.png')).convert('RGBA'); tc = V['tcols']; cache = {}
def dirt(n):
    if n in cache: return cache[n]
    t = ti.crop(((n % tc) * 16, (n // tc) * 16, (n % tc) * 16 + 16, (n // tc) * 16 + 16)); px = [q for q in t.get_flattened_data() if q[3] > 200]
    if len(px) < 128: cache[n] = False; return False
    r = sum(q[0] for q in px) / len(px); g = sum(q[1] for q in px) / len(px); b = sum(q[2] for q in px) / len(px)
    cache[n] = r > 180 and r > g + 35 and g > b + 20 and b < 150; return cache[n]
W, H = V['w'], V['h']; M = [[0] * W for _ in range(H)]
# jalan hanya di meadow/forest; pantai, danau, dan gunung berwarna serupa pasir sehingga salah terdeteksi
OK = [b for b in V['biomeRegions'] if b['id'] in ('meadow', 'forest')]
def road_zone(x, y): return any(b['x'] <= x < b['x'] + b['w'] and b['y'] <= y < b['y'] + b['h'] for b in OK)
for m in V['chunks']:
    d = json.load(open(os.path.join(B, m['file'])))
    for L in ('ground', 'decor'):
        for i, n in enumerate(d['layers'].get(L, [])):
            yy, xx = d['y'] + i // d['w'], d['x'] + i % d['w']
            if n and road_zone(xx, yy) and V['grid'][yy][xx] != '~' and dirt(n): M[yy][xx] = 1
V['roads'] = [''.join(map(str, r)) for r in M]
json.dump(V, open(p, 'w'), ensure_ascii=False, separators=(',', ':'))
print('road tiles', sum(map(sum, M)))
