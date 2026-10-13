#!/usr/bin/env python3
"""Hero Battle - build_interiors.py (Tahap 8A)
Membuat: assets/world/interior.png + interior.json (atlas properti interior), assets/world/hud.png (ikon alat),
dan MENUKAR sprite eksterior bangunan di sprites.png/index.json/chunks dengan rumah dari Houses_Sprite_Sheet.png.
Pakai: python3 tools/build_interiors.py --houses Houses_Sprite_Sheet.png --tiny <folder 'Tiny Wonder Farm Free'>
         --ingr <folder ingredients_png> --sunny <folder Sunnyside_World_Assets> [--root .]
Idempoten: sprite eksterior asli (house_*) tidak dihapus; objek hanya diarahkan ke sprite baru b_*. Perlu pillow numpy."""
import sys, os, json, glob, random
import numpy as np
from PIL import Image, ImageDraw
A = sys.argv
def opt(n, d=None): return A[A.index(n) + 1] if n in A else d
HOUSES, TINY, INGR, SUNNY, ROOT = opt('--houses'), opt('--tiny'), opt('--ingr'), opt('--sunny'), opt('--root', '.')
WD = os.path.join(ROOT, 'assets', 'world'); rnd = random.Random(11)
def C(h, a=255): h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
OL = C('#2b1a12'); W1, W2, W3, W4 = C('#d79b55'), C('#b87340'), C('#8c5330'), C('#5a331d')
ST1, ST2, ST3 = C('#a9afba'), C('#838a97'), C('#5b616d'); CR1, CR2 = C('#eadcb8'), C('#cdb98f'); GOLD, GOLD2 = C('#f1cb55'), C('#c08f2c'); RED, RED2 = C('#c0404a'), C('#8a2a35')
def new(w, h): return Image.new('RGBA', (w, h), (0, 0, 0, 0))
def R(d, x, y, w, h, c): d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
def box(d, x, y, w, h, f, o=OL, hl=None, sh=None):
    R(d, x, y, w, h, o); R(d, x + 1, y + 1, w - 2, h - 2, f)
    if hl: R(d, x + 1, y + 1, w - 2, 1, hl)
    if sh: R(d, x + 1, y + h - 2, w - 2, 1, sh)
def noise(im, cols, n, seed):
    r = random.Random(seed); d = ImageDraw.Draw(im)
    for _ in range(n): d.point((r.randrange(im.width), r.randrange(im.height)), r.choice(cols))
SP = {}   # nama -> Image
# ---------- lantai ----------
def floor_wood(seed, off):
    im = new(16, 16); d = ImageDraw.Draw(im); R(d, 0, 0, 16, 16, W1)
    for y in (0, 8): R(d, 0, y + 7, 16, 1, W3); R(d, 0, y, 16, 1, C('#e3ae6a'))
    for y, x in ((0, off), (8, (off + 8) % 16)): R(d, x, y, 1, 8, W3)
    noise(im, [W2, C('#c98a4b')], 14, seed); return im
SP['floor_wood_a'] = floor_wood(1, 5); SP['floor_wood_b'] = floor_wood(2, 11)
def floor_stone(seed):
    im = new(16, 16); d = ImageDraw.Draw(im); R(d, 0, 0, 16, 16, ST1)
    for (x, y) in ((0, 0), (8, 0), (0, 8), (8, 8)): R(d, x, y, 8, 1, ST2); R(d, x, y, 1, 8, ST2); R(d, x + 1, y + 1, 6, 1, C('#bfc4cd'))
    noise(im, [ST2, ST3, C('#bfc4cd')], 12, seed); return im
SP['floor_stone_a'] = floor_stone(3); SP['floor_stone_b'] = floor_stone(4)
im = new(16, 16); d = ImageDraw.Draw(im)
for i in range(4):
    for j in range(4): R(d, i * 4, j * 4, 4, 4, CR1 if (i + j) % 2 == 0 else C('#c4623f'))
noise(im, [C('#b05535'), CR2], 8, 5); SP['floor_check'] = im
im = new(16, 16); d = ImageDraw.Draw(im); R(d, 0, 0, 16, 16, W3)
for y in (0, 8): R(d, 0, y + 7, 16, 1, W4); R(d, 0, y, 16, 1, C('#9a5e38'))
R(d, 4, 0, 1, 8, W4); R(d, 12, 8, 1, 8, W4); noise(im, [W2, W4], 14, 6); SP['floor_dark'] = im
# ---------- dinding (16x32: 18 px plaster + 14 px lambris) ----------
def wall(top, top2, low, low2, trim):
    im = new(16, 32); d = ImageDraw.Draw(im); R(d, 0, 0, 16, 32, top); R(d, 0, 0, 16, 2, trim)
    for x in (0, 8): R(d, x, 3, 1, 15, top2)
    R(d, 0, 17, 16, 2, trim); R(d, 0, 19, 16, 13, low)
    for x in (0, 8): R(d, x, 19, 1, 13, low2)
    R(d, 0, 30, 16, 2, low2); R(d, 0, 19, 16, 1, C('#ffffff', 40)); return im
SP['wall_wood'] = wall(CR1, CR2, W2, W3, W4); SP['wall_stone'] = wall(ST1, ST2, ST3, C('#3f434d'), C('#2f323a'))
SP['wall_cream'] = wall(C('#f1e8cf'), CR2, C('#7a9a86'), C('#587566'), C('#4a5d52'))
im = new(16, 32); d = ImageDraw.Draw(im)   # jendela (ditempel di atas dinding)
box(d, 1, 3, 14, 15, C('#8fd0e8'), W4, hl=C('#d4f0fa')); R(d, 7, 4, 2, 13, W4); R(d, 2, 10, 12, 1, W4)
R(d, 2, 4, 3, 13, C('#c0404a')); R(d, 11, 4, 3, 13, C('#c0404a')); R(d, 2, 4, 1, 13, C('#e0626a')); R(d, 11, 4, 1, 13, C('#e0626a')); R(d, 0, 18, 16, 2, W4); R(d, 1, 18, 14, 1, W2); SP['window'] = im
SP['wall_side'] = wall(W3, W4, W4, C('#3b2113'), C('#2b1a12')).crop((0, 0, 16, 16))
im = new(16, 16); d = ImageDraw.Draw(im); R(d, 0, 0, 16, 16, W4); R(d, 0, 0, 16, 3, C('#7b4a2c')); R(d, 0, 12, 16, 4, C('#2b1a12')); noise(im, [W3], 8, 7); SP['wall_bot'] = im
im = new(16, 16); d = ImageDraw.Draw(im); R(d, 0, 0, 16, 16, C('#bfe5c4')); R(d, 0, 0, 16, 5, C('#a2d8e8')); R(d, 2, 8, 12, 8, C('#8a5a38')); R(d, 3, 9, 10, 1, C('#b87340')); R(d, 3, 11, 10, 1, C('#b87340')); SP['door_gap'] = im
# ---------- furnitur buatan ----------
def counter():
    im = new(48, 30); d = ImageDraw.Draw(im); box(d, 0, 10, 48, 20, W2, hl=W1, sh=W4)
    for x in (4, 16, 28, 40): box(d, x, 14, 8, 12, W3, W4, hl=C('#a8693a'))
    R(d, 0, 8, 48, 4, W1); R(d, 0, 8, 48, 1, C('#f0c48a')); R(d, 0, 11, 48, 1, W4)
    box(d, 4, 0, 14, 9, GOLD2, OL, hl=GOLD); R(d, 6, 2, 10, 3, C('#2a3b4a')); R(d, 7, 3, 4, 1, C('#7fe0a0')); R(d, 7, 6, 8, 1, C('#4a2d14'))   # mesin kasir
    box(d, 24, 4, 8, 5, C('#e8e2d0'), OL); R(d, 26, 5, 4, 1, GOLD); R(d, 27, 3, 2, 1, GOLD)                                                    # piring koin
    box(d, 36, 2, 7, 7, RED, OL, hl=C('#e0626a')); R(d, 37, 4, 5, 1, GOLD); return im
SP['counter'] = counter()
def gacha():
    im = new(26, 46); d = ImageDraw.Draw(im); box(d, 3, 28, 20, 18, RED, hl=C('#e0626a'), sh=RED2); R(d, 5, 40, 16, 4, RED2)
    box(d, 8, 31, 10, 6, C('#2a2f3a'), OL); R(d, 10, 33, 6, 1, GOLD); box(d, 17, 38, 5, 5, GOLD, OL)    # lubang koin + knop
    R(d, 1, 26, 24, 3, GOLD2); R(d, 1, 26, 24, 1, GOLD); box(d, 3, 6, 20, 20, C('#bfe5f2', 150), OL, hl=C('#ffffff', 180))
    cols = ['#e0626a', '#f1cb55', '#6bc46d', '#5aa0e0', '#b07be0', '#ff9a4a']
    for i in range(14): x, y = 5 + (i * 7) % 15, 10 + (i * 5) % 14; d.ellipse([x, y, x + 5, y + 5], fill=C(cols[i % 6]), outline=OL)
    box(d, 5, 0, 16, 8, GOLD, OL, hl=C('#ffe27a'), sh=GOLD2); R(d, 8, 3, 10, 2, RED); R(d, 11, 2, 4, 1, C('#ffffff')); return im
SP['gacha'] = gacha()
def ingr_icons():
    out = []
    for cat in ('cheese', 'eggs', 'beans', 'mushrooms', 'grains', 'yogurt_and_milk', 'spices', 'seaweeds', 'water'):
        fs = sorted(glob.glob(os.path.join(INGR, cat + '_png', '*.png')))
        for f in fs[:3]: out.append(Image.open(f).convert('RGBA'))
    return out
ING = ingr_icons()
def shelf(seed, w=34, books=False):
    r = random.Random(seed); im = new(w, 42); d = ImageDraw.Draw(im); box(d, 0, 2, w, 40, W3, OL, hl=W2, sh=W4); R(d, 2, 4, w - 4, 36, C('#3a2314'))
    for k, y in enumerate((17, 30)): R(d, 1, y, w - 2, 3, W2); R(d, 1, y, w - 2, 1, W1); R(d, 1, y + 3, w - 2, 1, W4)
    for k, y in enumerate((5, 18, 31)):
        if books:
            x = 3
            while x < w - 5:
                bw = r.choice((3, 4, 5)); bh = r.choice((8, 9, 10)); R(d, x, y + 12 - bh, bw, bh, C(r.choice(['#c0404a', '#4a7fc0', '#5aa05a', '#e0b040', '#8a5ab0']))); R(d, x, y + 12 - bh, 1, bh, C('#ffffff', 60)); x += bw + 1
        else:
            for i in range(2 if w < 40 else 3):
                ic = r.choice(ING); im.alpha_composite(ic, (3 + i * 15, y - 1))
    return im
SP['shelf_goods'] = shelf(1); SP['shelf_goods2'] = shelf(2); SP['shelf_books'] = shelf(3, 34, True)
def weapon_rack():
    im = new(36, 38); d = ImageDraw.Draw(im); box(d, 0, 24, 36, 14, W3, OL, hl=W2, sh=W4); R(d, 2, 8, 2, 30, W4); R(d, 32, 8, 2, 30, W4); R(d, 0, 6, 36, 4, W2); R(d, 0, 6, 36, 1, W1)
    for x, c in ((8, ST1), (14, ST1), (20, ST2)): R(d, x, 0, 2, 26, c); R(d, x, 0, 1, 26, C('#e8ecf2')); R(d, x - 2, 24, 6, 2, GOLD2); R(d, x, 26, 2, 5, W4)
    box(d, 26, 12, 8, 12, RED, OL, hl=C('#e0626a')); R(d, 29, 14, 2, 8, GOLD); return im
SP['weapon_rack'] = weapon_rack()
def banner(c1, c2):
    im = new(18, 36); d = ImageDraw.Draw(im); R(d, 0, 0, 18, 3, W4); R(d, 0, 0, 18, 1, W2); R(d, 2, 3, 14, 26, c1); R(d, 2, 3, 14, 26, c1)
    d.polygon([(2, 29), (9, 35), (16, 29)], fill=c1); R(d, 2, 3, 2, 26, c2); R(d, 14, 3, 2, 26, c2); d.polygon([(9, 9), (12, 15), (9, 21), (6, 15)], fill=GOLD, outline=OL); return im
SP['banner'] = banner(RED, RED2); SP['banner_blue'] = banner(C('#3b6fb8'), C('#27508a'))
def stove():
    im = new(30, 34); d = ImageDraw.Draw(im); box(d, 2, 12, 26, 22, C('#4a4e58'), OL, hl=C('#6b707c'), sh=C('#2f323a')); R(d, 0, 10, 30, 4, C('#2f323a')); R(d, 0, 10, 30, 1, ST2)
    box(d, 6, 20, 18, 11, C('#1c1620'), OL); R(d, 9, 25, 4, 5, C('#ff9a4a')); R(d, 10, 23, 2, 3, C('#ffe27a')); R(d, 17, 26, 4, 4, C('#e0626a'))
    box(d, 5, 2, 12, 9, C('#5e6470'), OL, hl=C('#8a909c')); R(d, 4, 1, 14, 2, ST3); R(d, 8, 0, 6, 1, C('#e8ecf2', 130)); R(d, 20, 3, 6, 7, C('#2f323a')); R(d, 21, 4, 4, 5, C('#c4623f')); return im
SP['stove'] = stove()
def pantry():
    im = new(26, 44); d = ImageDraw.Draw(im); box(d, 0, 2, 26, 42, W2, OL, hl=W1, sh=W4); box(d, 2, 5, 22, 36, C('#3a2314'), W4)
    for y in (16, 28): R(d, 2, y, 22, 2, W3)
    for k, y in enumerate((6, 18, 30)):
        for i in range(2): ic = ING[(k * 5 + i * 7 + 2) % len(ING)]; im.alpha_composite(ic, (2 + i * 10, y))
    return im
SP['pantry'] = pantry()
def prep_table():
    im = new(36, 22); d = ImageDraw.Draw(im); box(d, 0, 6, 36, 16, W2, OL, hl=W1, sh=W4); R(d, 2, 3, 32, 4, W1); R(d, 2, 3, 32, 1, C('#f0c48a'))
    box(d, 5, 0, 10, 4, C('#e8e2d0'), OL); im.alpha_composite(ING[4], (19, -5 + 5)); R(d, 26, 1, 7, 2, ST1); R(d, 31, 0, 3, 1, W4); return im
SP['prep_table'] = prep_table()
def anvil():
    im = new(26, 24); d = ImageDraw.Draw(im); R(d, 6, 16, 14, 8, W3); box(d, 8, 14, 10, 4, ST3, OL); d.polygon([(0, 8), (22, 8), (24, 11), (22, 14), (4, 14), (3, 11), (6, 10)], fill=ST2, outline=OL); R(d, 3, 9, 18, 2, C('#c4cad4')); R(d, 20, 8, 5, 3, ST2); return im
SP['anvil'] = anvil()
def forge():
    im = new(34, 36); d = ImageDraw.Draw(im); box(d, 2, 10, 30, 26, C('#7a7f8a'), OL, hl=ST1, sh=ST3)
    for x in range(4, 30, 7):
        for y in range(13, 34, 6): R(d, x, y, 6, 1, ST3)
    box(d, 8, 20, 18, 14, C('#1c1620'), OL); R(d, 11, 28, 12, 5, C('#ff7a2a')); R(d, 14, 25, 6, 4, C('#ffd24a')); R(d, 16, 23, 2, 3, C('#ffffff'))
    R(d, 12, 0, 10, 12, ST3); R(d, 13, 0, 8, 12, C('#4a4e58')); R(d, 11, 9, 12, 3, OL); return im
SP['forge'] = forge()
def workbench():
    im = new(40, 26); d = ImageDraw.Draw(im); box(d, 0, 8, 40, 18, W2, OL, hl=W1, sh=W4); R(d, 2, 5, 36, 4, W1); R(d, 2, 5, 36, 1, C('#f0c48a'))
    R(d, 5, 1, 3, 5, ST1); R(d, 4, 0, 5, 2, W4); R(d, 13, 2, 9, 3, ST2); R(d, 23, 3, 2, 2, GOLD2); d.polygon([(28, 5), (31, 0), (34, 5)], fill=ST1, outline=OL); R(d, 5, 16, 30, 7, C('#3a2314')); R(d, 6, 17, 28, 1, W3); return im
SP['workbench'] = workbench()
def chest():
    im = new(22, 18); d = ImageDraw.Draw(im); box(d, 0, 6, 22, 12, W2, OL, hl=W1, sh=W4); box(d, 0, 0, 22, 8, W3, OL, hl=W2); R(d, 0, 6, 22, 2, GOLD2); R(d, 9, 5, 4, 6, GOLD); R(d, 10, 7, 2, 2, OL); R(d, 3, 0, 2, 18, GOLD2); R(d, 17, 0, 2, 18, GOLD2); return im
SP['chest'] = chest()
def rug(w, h, c1, c2, c3):
    im = new(w, h); d = ImageDraw.Draw(im); box(d, 0, 0, w, h, c1, OL); R(d, 2, 2, w - 4, h - 4, c2); R(d, 4, 4, w - 8, h - 8, c3)
    for x in range(3, w - 3, 4): R(d, x, 2, 2, 2, c1); R(d, x, h - 4, 2, 2, c1)
    d.polygon([(w // 2, 6), (w // 2 + 6, h // 2), (w // 2, h - 7), (w // 2 - 6, h // 2)], fill=c2, outline=c1); return im
SP['rug_red'] = rug(52, 34, RED2, RED, C('#e8c070')); SP['rug_blue'] = rug(46, 30, C('#27508a'), C('#3b6fb8'), C('#d8e4f0')); SP['rug_green'] = rug(40, 28, C('#2f6a4a'), C('#4a9a6a'), C('#efe3b5'))
def fireplace():
    im = new(38, 38); d = ImageDraw.Draw(im); box(d, 0, 6, 38, 32, ST2, OL, hl=ST1, sh=ST3); R(d, 0, 2, 38, 6, ST3); R(d, 0, 2, 38, 1, ST1)
    box(d, 8, 16, 22, 22, C('#1c1620'), OL); R(d, 12, 30, 14, 5, W4); R(d, 14, 24, 10, 8, C('#ff7a2a')); R(d, 17, 20, 4, 8, C('#ffd24a')); R(d, 18, 24, 2, 4, C('#ffffff')); return im
SP['fireplace'] = fireplace()
def notice():
    im = new(40, 32); d = ImageDraw.Draw(im); box(d, 0, 0, 40, 28, W2, OL, hl=W1, sh=W4); R(d, 3, 3, 34, 22, C('#c9a46a'))
    for (x, y, w, h, c) in ((5, 5, 9, 11, '#f4efe0'), (16, 6, 8, 9, '#f1e08a'), (26, 5, 9, 13, '#f4efe0'), (8, 17, 8, 7, '#bfe5f2'), (20, 17, 10, 6, '#f4efe0')): R(d, x, y, w, h, C(c)); R(d, x + w // 2, y - 1, 1, 2, RED); R(d, x + 1, y + 3, w - 3, 1, C('#8a7a5a')); R(d, x + 1, y + 6, w - 4, 1, C('#8a7a5a'))
    R(d, 4, 28, 3, 4, W4); R(d, 33, 28, 3, 4, W4); return im
SP['notice'] = notice()
def map_table():
    im = new(50, 30); d = ImageDraw.Draw(im); box(d, 0, 10, 50, 20, W3, OL, hl=W2, sh=W4); box(d, 3, 2, 44, 14, C('#e8d6a0'), OL, hl=C('#f6ecc4'))
    d.line([(8, 12), (16, 6), (24, 11), (34, 5), (42, 10)], fill=C('#4a7fc0')); R(d, 12, 7, 3, 3, RED); R(d, 30, 9, 3, 3, RED); R(d, 20, 5, 8, 1, W3); R(d, 38, 12, 5, 1, W3); return im
SP['map_table'] = map_table()
def cabinet():
    im = new(26, 38); d = ImageDraw.Draw(im); box(d, 0, 2, 26, 36, W2, OL, hl=W1, sh=W4); box(d, 2, 5, 10, 30, W3, W4, hl=W2); box(d, 14, 5, 10, 30, W3, W4, hl=W2); R(d, 10, 18, 2, 4, GOLD); R(d, 14, 18, 2, 4, GOLD); return im
SP['cabinet'] = cabinet()
def hay_bale():
    im = new(30, 20); d = ImageDraw.Draw(im); box(d, 0, 2, 30, 18, C('#e0c060'), OL, hl=C('#f6e090'), sh=C('#b89a3a'))
    for x in (6, 14, 22): R(d, x, 3, 1, 16, C('#b89a3a'))
    R(d, 0, 8, 30, 2, C('#9a7a2a')); R(d, 0, 14, 30, 2, C('#9a7a2a')); return im
SP['hay'] = hay_bale()
def rod_rack():
    im = new(34, 38); d = ImageDraw.Draw(im); R(d, 2, 0, 2, 38, W4); R(d, 30, 0, 2, 38, W4); R(d, 0, 4, 34, 3, W2); R(d, 0, 20, 34, 3, W2)
    for x, c in ((8, '#8a5a38'), (14, '#a8693a'), (20, '#6b4a30')): R(d, x, 2, 2, 34, C(c)); R(d, x + 2, 6, 6, 1, C('#e8e2d0'))
    box(d, 24, 26, 8, 10, C('#4a8a9a'), OL, hl=C('#7ac0d0')); return im
SP['rod_rack'] = rod_rack()
def log_pile():
    im = new(34, 22); d = ImageDraw.Draw(im)
    for (x, y) in ((0, 12), (11, 12), (22, 12), (5, 4), (17, 4)): d.ellipse([x, y, x + 10, y + 9], fill=W2, outline=OL); d.ellipse([x + 2, y + 2, x + 7, y + 6], fill=W1, outline=W3)
    return im
SP['logs'] = log_pile()
# ---------- aset sumber: Tiny Wonder (furnitur), sprites.png (peti, tong, karung, pot) ----------
fur = Image.open(os.path.join(TINY, 'objects&items', 'furniture free.png')).convert('RGBA')
SP['tw_bedset'] = fur.crop((0, 0, 57, 33)); SP['tw_picture'] = fur.crop((16, 31, 32, 48)); SP['tw_lamp'] = fur.crop((32, 31, 47, 48)); SP['tw_stool'] = fur.crop((1, 37, 15, 48))
for k in ('tw_bedset', 'tw_picture', 'tw_lamp', 'tw_stool'): SP[k] = SP[k].crop(SP[k].getbbox())
V = json.load(open(os.path.join(WD, 'index.json'))); SPS = Image.open(os.path.join(WD, 'sprites.png')).convert('RGBA')
for k in ('crate', 'crates', 'barrel', 'barrel2', 'sack', 'sack2', 'pot', 'bench'):
    r = V['spr'][k]; SP['w_' + k] = SPS.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
# ---------- tulis atlas interior ----------
def pack(items, SW=512):
    x = y = rh = 0; tab = {}; place = []
    for n, im in items:
        w, h = im.size
        if x + w > SW: x, y, rh = 0, y + rh + 1, 0
        place.append((im, x, y)); tab[n] = dict(x=x, y=y, w=w, h=h); x += w + 1; rh = max(rh, h)
    sheet = new(SW, y + rh)
    for im, px, py in place: sheet.alpha_composite(im, (px, py))
    return sheet, tab
sheet, tab = pack(list(SP.items())); sheet.save(os.path.join(WD, 'interior.png'), optimize=True)
# Entri/keluar interior dibuat eksplisit agar tes dapat memvalidasi seluruh pintu bangunan.
# Koordinat exterior menggunakan satuan piksel map mentah (16 px per petak).
BUILDING_DOORS = [
    ('toko','shop',320,320,13,9,6), ('barak','barracks',712,320,15,9,7),
    ('home','home',448,512,11,8,5), ('bengkel','workshop',1016,736,11,8,5),
    ('dapur','kitchen',1000,976,11,8,5), ('penebang','woodcutter',1448,336,9,7,4),
    ('balai','hall',1240,704,14,10,7), ('nelayan','fisher',776,1184,9,7,4),
    ('res1','res1',200,320,9,7,4), ('res2','res2',808,320,9,7,4),
    ('res3','res3',192,208,9,7,4), ('res4','res1',328,208,9,7,4),
    ('res5','res2',832,208,9,7,4), ('res6','res3',712,208,9,7,4),
    ('res7','res1',560,512,9,7,4),
]
building_doors = [dict(id=i, tpl=t, exterior={'x':x,'y':y}, room={'w':w,'h':h},
                       entry={'x':dx,'y':h-2}, exit={'x':dx,'y':h-1})
                  for i,t,x,y,w,h,dx in BUILDING_DOORS]
json.dump(dict(v=2, spr=tab, buildingDoors=building_doors), open(os.path.join(WD, 'interior.json'), 'w'), separators=(',', ':'))
# ---------- ikon HUD (Sunnyside UI + rod/plant), sel 16x16 ----------
HI = ['hand_open_01', 'shovel', 'water', 'axe', 'pickaxe', 'rod', 'plant', 'basket', 'sword', 'hammer', 'stopwatch']
hud = new(16 * len(HI), 16)
for i, n in enumerate(HI):
    ic = Image.open(os.path.join(SUNNY, 'UI', n + '.png')).convert('RGBA'); hud.alpha_composite(ic, (i * 16 + (16 - ic.width) // 2, (16 - ic.height) // 2))
hud.save(os.path.join(WD, 'hud.png'), optimize=True); json.dump(HI, open(os.path.join(WD, 'hud.json'), 'w'))
# ---------- eksterior baru dari Houses_Sprite_Sheet (kolom 0 = pintu tertutup; selisih kolom 7 = bukaan pintu) ----------
HS = Image.open(HOUSES).convert('RGBA')
# nama sprite baru: (baris sheet). Pemetaan objek -> sprite ada di EXT di bawah (kunci = (sprite lama, x//16, y//16)).
ROWS = {'b_toko': 2, 'b_barak': 11, 'b_hall': 14, 'b_workshop': 1, 'b_kitchen': 7, 'b_woodcutter': 0, 'b_fisher': 17, 'b_home': 9,
        'b_res1': 5, 'b_res2': 3, 'b_res3': 18, 'b_res4': 19, 'b_res5': 16, 'b_res6': 6}
EXT = {('house_toko', 20, 20): 'b_toko', ('house_barak', 44, 20): 'b_barak', ('house_redtall', 77, 44): 'b_hall', ('house_hut', 63, 46): 'b_workshop',
       ('house_hut', 62, 61): 'b_kitchen', ('house_hut', 90, 21): 'b_woodcutter', ('house_hut', 48, 74): 'b_fisher', ('house_blue', 28, 32): 'b_home',
       ('house_purple', 12, 20): 'b_res1', ('house_orange', 50, 20): 'b_res2', ('house_green', 12, 13): 'b_res3', ('house_orange2', 20, 13): 'b_res4',
       ('house_hut', 52, 13): 'b_res5', ('house_hut', 35, 32): 'b_res6', ('house_redtall', 44, 13): 'b_res6'}
def cell(r, c): return HS.crop((4 + c * 150, r * 151, 4 + c * 150 + 146, r * 151 + 151))
new_spr = {}; ext_imgs = []
for name, row in ROWS.items():
    c0, c7 = cell(row, 0), cell(row, 7); bb = c0.getbbox(); crop = c0.crop(bb)
    diff = (np.array(c0) != np.array(c7)).any(2); ys, xs = np.where(diff)
    door = [int(xs.min() - bb[0]), int(ys.min() - bb[1]), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)]
    ext_imgs.append((name, crop)); new_spr[name] = dict(w=crop.width, h=crop.height, ax=crop.width // 2, ay=crop.height, door=door)
S0 = Image.open(os.path.join(WD, 'sprites.png')).convert('RGBA')
S0 = S0.crop((0, 0, S0.width, max(1, max(v['y'] + v['h'] for k, v in V['spr'].items() if not k.startswith('b_')) + 1)))   # buang tambahan lama (idempoten)
for k in [k for k in V['spr'] if k.startswith('b_')]: del V['spr'][k]
x = 0; y = S0.height + 1; rh = 0; place = []
for name, im in ext_imgs:
    if x + im.width > S0.width: x, y, rh = 0, y + rh + 1, 0
    place.append((im, x, y)); new_spr[name].update(x=x, y=y); x += im.width + 1; rh = max(rh, im.height)
S1 = new(S0.width, y + rh); S1.alpha_composite(S0, (0, 0))
for im, px, py in place: S1.alpha_composite(im, (px, py))
S1.save(os.path.join(WD, 'sprites.png'), optimize=True); V['spr'].update(new_spr)
def swap(lst):
    n = 0
    for o in lst:
        if o.get('k') and (o['k'], o['x'] // 16, o['y'] // 16) in EXT: o['k'] = EXT[(o['k'], o['x'] // 16, o['y'] // 16)]; n += 1
    return n
n = swap(V['objects'])
for p in V.get('places', []):
    for o in V['objects']:
        if o.get('k', '').startswith('b_') and o['x'] // 16 == p['x'] and o['y'] // 16 == p['y'] and p.get('sprite'): p['sprite'] = o['k']
json.dump(V, open(os.path.join(WD, 'index.json'), 'w'), separators=(',', ':'))
m = 0
for f in glob.glob(os.path.join(WD, 'chunks', 'c*.json')):
    c = json.load(open(f)); k = swap(c.get('objects', []))
    if k: m += k; json.dump(c, open(f, 'w'), separators=(',', ':'))
print('atlas interior', sheet.size, len(tab), 'sprite | eksterior baru', len(new_spr), '| objek ditukar index', n, 'chunk', m)
