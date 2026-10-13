#!/usr/bin/env python3
"""Tahap 8D: tetapkan ladang dunia 6x4 pada petak rumput terbuka.
Koordinat slot adalah titik kaki dalam pixel sumber 16 px; tilemap menggandakan ke skala dunia.
Aman diulang dan mempertahankan objek/data lain. Jalankan setelah build_village.py dan build_lights.py."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
VILLAGE=ROOT/'assets/world/village.json'
INDEX=ROOT/'assets/world/index.json'
# Patch 6x4 di padang rumput (grid x=39..44, y=13..16); setiap pusat = tengah tile 32 px dunia.
FARM=[[16*x+8,16*y+8] for y in range(13,17) for x in range(39,45)]
for path in (VILLAGE,INDEX):
    d=json.loads(path.read_text(encoding='utf-8'))
    if path==INDEX:
        assert all(d['grid'][y][x]=='.' for y in range(13,17) for x in range(39,45)), 'farm patch must stay on clear grass'
    crops=[o for o in d.get('objects',[]) if (o.get('a') or '').startswith('crop_')]
    if crops:d['objects']=[o for o in d['objects'] if o not in crops]
    d['farm']=FARM
    path.write_text(json.dumps(d,separators=(',',':')),encoding='utf-8')
print('farm slots (6x4):',len(FARM),'clear grass patch x=39..44 y=13..16')
