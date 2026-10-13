#!/usr/bin/env python3
"""Build a 9-item 16x16 runtime icon strip without copying the source asset pack.
Usage: python3 tools/build_inventory_icons.py --ingr /path/to/ingredients_png [--root .]
99 Ingredients artwork is used only for applicable ingredient icons; basic resource icons are hand-drawn.
"""
from argparse import ArgumentParser
from pathlib import Path
from PIL import Image, ImageDraw

p = ArgumentParser()
p.add_argument('--ingr', required=True, help='Path to 99_ingredients/ingredients_png (source pack stays outside the repo)')
p.add_argument('--root', default='.', help='Hero Battle repository root')
a = p.parse_args()
ingr, root = Path(a.ingr), Path(a.root)
out = Image.new('RGBA', (16 * 9, 16), (0, 0, 0, 0))

def canvas():
    return Image.new('RGBA', (16, 16), (0, 0, 0, 0))
def source(rel):
    src = ingr / rel
    if not src.is_file():
        raise SystemExit(f'Missing 99 Ingredients source icon: {src}')
    im = Image.open(src).convert('RGBA')
    if im.size != (16, 16):
        im = im.resize((16, 16), Image.Resampling.NEAREST)
    return im

def wood():
    im=canvas(); d=ImageDraw.Draw(im)
    d.rounded_rectangle((1,4,14,11),radius=2,fill='#6f4028',outline='#291d18')
    d.rectangle((2,5,13,6),fill='#b87944');d.rectangle((2,9,13,10),fill='#4c3025')
    d.ellipse((10,5,14,10),fill='#d29b61',outline='#291d18');d.ellipse((11,6,13,9),fill='#8c5a36',outline='#5a3925')
    return im

def stone():
    im=canvas(); d=ImageDraw.Draw(im)
    d.polygon([(2,6),(5,2),(11,3),(14,7),(12,12),(5,14),(1,10)],fill='#8e9aa4',outline='#252d36')
    d.line((4,6,8,4,11,5),fill='#d8e0e4',width=1);d.line((4,10,8,11,11,9),fill='#596571',width=1)
    return im

def fruit():
    im=canvas(); d=ImageDraw.Draw(im)
    d.ellipse((2,4,13,14),fill='#c83f50',outline='#351b23');d.ellipse((4,5,8,10),fill='#ec6a65')
    d.line((8,5,9,1),fill='#5b3924',width=2);d.ellipse((9,1,14,4),fill='#5d9b4b',outline='#27462f')
    return im

def plank():
    im=canvas(); d=ImageDraw.Draw(im)
    for y in (2,7,12):
        d.rectangle((1,y,14,y+2),fill='#b7804b',outline='#37271d')
        d.line((3,y+1,7,y+1),fill='#e0b477');d.point((12,y+1),fill='#6b452e')
    return im

def brick():
    im=canvas(); d=ImageDraw.Draw(im)
    d.rectangle((1,2,14,13),fill='#9ca6ac',outline='#29323a')
    d.line((1,6,14,6),fill='#47545d');d.line((1,10,14,10),fill='#47545d')
    d.line((6,2,6,6),fill='#47545d');d.line((10,6,10,10),fill='#47545d');d.line((5,10,5,13),fill='#47545d')
    d.line((2,3,5,3),fill='#d7e0e3');return im

def rope():
    im=canvas(); d=ImageDraw.Draw(im)
    d.arc((2,1,13,13),35,325,fill='#d5b06b',width=4)
    d.arc((4,3,11,11),35,325,fill='#78522c',width=1)
    d.line((3,10,1,14),fill='#d5b06b',width=3);d.line((12,4,15,1),fill='#d5b06b',width=3)
    return im

icons = [
    wood(), stone(), source('seaweeds_png/kelp.png'),
    source('mushrooms_png/button_mushroom_brown.png'), fruit(), plank(), brick(), rope(),
    source('water_png/water_bottled.png'),
]
for i, im in enumerate(icons): out.alpha_composite(im, (i * 16, 0))
target = root / 'assets/world/items.png'
target.parent.mkdir(parents=True, exist_ok=True)
out.save(target, optimize=True)
print(f'Built {target} ({out.width}x{out.height}) from 99 Ingredients selected icons + generated resource icons.')
