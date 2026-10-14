#!/usr/bin/env python3
"""Tambahkan animasi jamur Sunnyside (4 frame 16x16) ke assets/world/props.png + atlas.json.
Idempoten: jika anim 'mush_*' sudah ada, tidak melakukan apa pun.
Pakai: python3 tools/add_mushrooms.py <folder Sunnyside_World_Assets>  (default: ./Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets)"""
import json, sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets') / 'Elements' / 'Plants'
WD = ROOT / 'assets/world'
atlas = json.loads((WD / 'atlas.json').read_text(encoding='utf-8'))
NAMES = {'mush_red_1': 'spr_deco_mushroom_red_01_strip4.png', 'mush_blue_1': 'spr_deco_mushroom_blue_01_strip4.png',
         'mush_blue_2': 'spr_deco_mushroom_blue_02_strip4.png', 'mush_blue_3': 'spr_deco_mushroom_blue_03_strip4.png'}
if all(k in atlas['anims'] for k in NAMES):
    print('mushroom anims already present'); sys.exit(0)
props = Image.open(WD / 'props.png').convert('RGBA')
y0 = max(v['y'] + v['h'] for v in atlas['anims'].values() if v['s'] == 'props')
sheet = Image.new('RGBA', (props.width, y0 + 16), (0, 0, 0, 0)); sheet.paste(props, (0, 0))
x = 0
for name, fn in NAMES.items():
    strip = Image.open(SRC / fn).convert('RGBA'); w = strip.width // 4
    bb = None
    for i in range(4):
        b = strip.crop((i * w, 0, (i + 1) * w, strip.height)).getbbox()
        if b: bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    cw, ch = bb[2] - bb[0], bb[3] - bb[1]
    for i in range(4):
        sheet.paste(strip.crop((i * w + bb[0], bb[1], i * w + bb[2], bb[3])), (x + i * cw, y0))
    atlas['anims'][name] = dict(s='props', x=x, y=y0, w=cw, h=ch, n=4, ax=cw // 2, ay=ch, d=260, loop=1)
    x += cw * 4 + 2
sheet = sheet.crop((0, 0, props.width, y0 + 16)); sheet.save(WD / 'props.png', optimize=True)
(WD / 'atlas.json').write_text(json.dumps(atlas, separators=(',', ':')), encoding='utf-8')
print('added', list(NAMES), 'at y', y0)
