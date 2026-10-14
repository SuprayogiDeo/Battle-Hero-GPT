#!/usr/bin/env python3
"""Tahap 9A: menambahkan tile jembatan kayu ke assets/world/tiles.png (slot id 128-143) dan menulis assets/world/bridge_tiles.json.
Idempoten; jalankan SEBELUM build_world.py. Gambar prosedural (palet kayu yang sama dengan interior). Tidak memakai aset pihak ketiga."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]; WD = ROOT / 'assets/world'
BASE_ID = 128   # slot 94-127 dipakai frame animasi; sheet diperpanjang satu baris (id 128-159)
def C(h, a=255): h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
OL, P1, P2, P3, SEAM, HI = C('#2b1a12'), C('#c98f55'), C('#b07844'), C('#8c5330'), C('#5a331d'), C('#e3ae6a')
def R(d, x, y, w, h, c): d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
def planks(parity, y0=0, y1=16):
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for y in range(y0, y1):
        R(d, 0, y, 16, 1, P1 if (y % 5) in (0, 1, 2) else P2)
    for y in range(y0 + 4, y1, 5): R(d, 0, y, 16, 1, SEAM)
    for k, y in enumerate(range(y0, y1, 5)):
        x = (5 + 8 * ((k + parity) % 2)) % 16; R(d, x, y, 1, min(4, y1 - y), SEAM); R(d, x + 1, y, 1, 1, HI)
        R(d, (x + 3) % 16, y + 2, 1, 1, P3); R(d, (x + 11) % 16, y + 2, 1, 1, P3)
    return im
def rail_top(im, post=False):
    d = ImageDraw.Draw(im); R(d, 0, 0, 16, 1, OL); R(d, 0, 1, 16, 2, HI); R(d, 0, 3, 16, 2, P3); R(d, 0, 5, 16, 1, OL); R(d, 0, 6, 16, 2, C('#000000', 70))
    if post: R(d, 5, 0, 6, 9, OL); R(d, 6, 1, 4, 7, P2); R(d, 6, 1, 4, 1, HI); R(d, 6, 6, 4, 2, P3)
def rail_bot(im, post=False):
    d = ImageDraw.Draw(im); R(d, 0, 9, 16, 2, C('#000000', 70)); R(d, 0, 11, 16, 1, OL); R(d, 0, 12, 16, 1, HI); R(d, 0, 13, 16, 2, P3); R(d, 0, 15, 16, 1, OL)
    if post: R(d, 5, 7, 6, 9, OL); R(d, 6, 8, 4, 7, P2); R(d, 6, 8, 4, 1, HI); R(d, 6, 13, 4, 2, P3)
def end(im, left):
    d = ImageDraw.Draw(im); x = 0 if left else 12; R(d, x, 0, 4, 16, OL); R(d, x + 1, 0, 2, 16, P3); R(d, x + 1 if left else x + 2, 0, 1, 16, HI)
tiles = {}
for row in ('top', 'mid', 'bot'):
    for col in ('L', 'a', 'b', 'R', 'post'):
        if row == 'mid' and col == 'post': continue
        im = planks(1 if col == 'b' else 0)
        if row == 'top': rail_top(im, post=col in ('L', 'R', 'post'))
        if row == 'bot': rail_bot(im, post=col in ('L', 'R', 'post'))
        if col in ('L', 'R'): end(im, col == 'L')
        tiles[row + '_' + col] = im
im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im); R(d, 5, 10, 6, 6, OL); R(d, 6, 11, 4, 5, P2); R(d, 6, 11, 4, 1, HI); R(d, 5, 9, 6, 2, P3); R(d, 6, 9, 4, 1, HI); tiles['post_cap'] = im
im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
for y, a in enumerate((96, 84, 70, 56, 42, 30, 18, 8)): R(d, 0, y, 16, 1, (6, 30, 60, a))
tiles['water_shadow'] = im
names = list(tiles); ids = {n: BASE_ID + i for i, n in enumerate(names)}
sheet = Image.open(WD / 'tiles.png').convert('RGBA'); tc = 32
if sheet.height < 80:
    big = Image.new('RGBA', (sheet.width, 80), (0, 0, 0, 0)); big.paste(sheet, (0, 0)); sheet = big
for n, i in ids.items():
    x, y = (i % tc) * 16, (i // tc) * 16
    if sheet.crop((x, y, x + 16, y + 16)).getbbox() and not (WD / 'bridge_tiles.json').exists(): sys.exit('slot %d sudah terpakai' % i)
    blank = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); sheet.paste(blank, (x, y)); sheet.alpha_composite(tiles[n], (x, y))
sheet.save(WD / 'tiles.png', optimize=True); (WD / 'bridge_tiles.json').write_text(json.dumps(dict(base=BASE_ID, ids=ids), indent=1))
print('tile jembatan:', len(ids), 'id', BASE_ID, '-', BASE_ID + len(ids) - 1)
