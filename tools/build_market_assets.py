#!/usr/bin/env python3
"""Aset Pasar (polish 9F): hall pasar besar (sprite luar `b_market`) + sprite interior (`vendor`, `scale`, `market_table`).

Digambar prosedural (tanpa aset sumber). Idempoten: bila sprite sudah ada di atlas, petaknya digambar ulang di posisi yang sama.
Menulis: assets/world/sprites.png (+ index.json spr.b_market), assets/world/interior.png (+ interior.json spr & buildingDoors.pasar).
Papan nama di atap sengaja kosong: teksnya ('PASAR'/'MARKET') digambar js/tilemap.js dari meta `sign`, jadi ikut bahasa.
Jalankan SETELAH build_interiors.py / build_lights.py dan SEBELUM fix_map_9f.py.  Pakai: python3 tools/build_market_assets.py [--root DIR]
"""
import argparse, json
from pathlib import Path
from PIL import Image, ImageDraw

def C(h, a=255): h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
OL = C('#2b1a12'); W1, W2, W3, W4 = C('#d79b55'), C('#b87340'), C('#8c5330'), C('#5a331d')
CR1, CR2, CR3 = C('#f3e6c4'), C('#e0cfa3'), C('#bfa97b'); RED1, RED2, RED3 = C('#d4535c'), C('#b03a45'), C('#7d2631')
RT1, RT2, RT3 = C('#c9484f'), C('#a93842'), C('#862b36'); GOLD, GOLD2 = C('#f6cf5a'), C('#c3922c')
GL1, GL2 = C('#a9d7e8'), C('#6fa8c4'); ST1, ST2, ST3 = C('#aeb3bd'), C('#868c99'), C('#5c6270')
HW, HH = 208, 144   # hall: 13 x 9 tile

def hall():
    im = Image.new('RGBA', (HW, HH), (0, 0, 0, 0)); d = ImageDraw.Draw(im); W, H = HW, HH
    def R(x, y, w, h, c): 
        if w > 0 and h > 0: d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
    def box(x, y, w, h, f, o=OL, hl=None, sh=None):
        R(x, y, w, h, o); R(x + 1, y + 1, w - 2, h - 2, f)
        if hl: R(x + 1, y + 1, w - 2, 1, hl)
        if sh: R(x + 1, y + h - 2, w - 2, 1, sh)
    roof_top, roof_bot = 24, 88
    for y in range(roof_top, roof_bot):
        t = (y - roof_top) / (roof_bot - roof_top); inset = int(14 * (1 - t)); x0, x1 = 2 + inset, W - 3 - inset
        d.line([(x0, y), (x1, y)], fill=OL); d.line([(x0 + 1, y), (x1 - 1, y)], fill=RT1 if ((y - roof_top) // 5) % 2 == 0 else RT2)
    for y in range(roof_top + 3, roof_bot - 2, 5):
        t = (y - roof_top) / (roof_bot - roof_top); inset = int(14 * (1 - t)); x0, x1 = 3 + inset, W - 4 - inset
        for x in range(x0, x1, 8):
            xx = x + (4 if ((y - roof_top) // 5) % 2 else 0)
            if x0 < xx < x1: d.line([(xx, y), (xx, y + 3)], fill=RT3)
        d.line([(x0, y + 4), (x1, y + 4)], fill=RT3)
    for y in (roof_top + 1, roof_top + 2): d.line([(18, y), (W - 19, y)], fill=C('#e56b70'))
    for x in (4, W - 10): box(x, roof_bot - 14, 6, 14, W3, hl=W1)
    # cerobong di kanan
    box(W - 52, 10, 14, 30, C('#8d8f9c'), hl=C('#b9bbc7'), sh=ST3); R(W - 54, 8, 18, 4, ST2); R(W - 54, 8, 18, 1, ST1)
    for yy in range(16, 38, 6): R(W - 51, yy, 12, 1, ST3)
    # lukarne (jendela atap)
    for gx in (36, W - 90):
        box(gx, roof_top + 18, 26, 22, W3, hl=W2)
        R(gx + 3, roof_top + 21, 20, 14, GL2); R(gx + 3, roof_top + 21, 20, 6, GL1); R(gx + 12, roof_top + 21, 2, 14, W3)
        for k in range(3): d.line([(gx + 5 + k * 6, roof_top + 33), (gx + 9 + k * 6, roof_top + 22)], fill=C('#e8f5fa'))
        R(gx - 2, roof_top + 40, 30, 3, W2); R(gx - 2, roof_top + 40, 30, 1, W1)
    # papan nama di atap (kosong: teks digambar game)
    sx, sw, sy, sh = (W - 76) // 2, 76, 0, 28
    box(sx, sy, sw, sh, W2, hl=W1, sh=W3); R(sx + 3, sy + 3, sw - 6, sh - 6, OL); R(sx + 4, sy + 4, sw - 8, sh - 8, C('#4a2c1a'))
    for x in (sx + 6, sx + sw - 8): R(x, sy + 7, 2, 2, GOLD2); R(x, sy + sh - 9, 2, 2, GOLD2)
    for bx in (22, W - 30):   # spanduk
        box(bx, roof_top + 8, 8, 24, RED2, hl=RED1)
        d.polygon([(bx, roof_top + 32), (bx + 7, roof_top + 32), (bx + 3, roof_top + 37)], fill=OL); d.polygon([(bx + 1, roof_top + 32), (bx + 6, roof_top + 32), (bx + 3, roof_top + 36)], fill=RED3)
        R(bx + 2, roof_top + 14, 4, 4, GOLD)
    box(0, roof_bot, W, 8, W3, hl=W2, sh=W4)
    for x in range(6, W, 12): R(x, roof_bot + 2, 2, 3, W4)
    wy = roof_bot + 8; wh = H - wy - 4
    box(2, wy, W - 4, wh, CR2, hl=CR1, sh=CR3)
    for x in (2, W - 5, 56, W - 59): R(x, wy, 3, wh, W3)
    ay, ah = wy + 1, 11
    for x in range(4, W - 4):
        s = ((x - 4) // 8) % 2; R(x, ay, 1, ah - 3, RED1 if s == 0 else CR1)
        depth = [2, 3, 3, 3, 3, 3, 3, 2][(x - 4) % 8]; R(x, ay + ah - 3, 1, depth, RED2 if s == 0 else CR2)
    d.line([(4, ay), (W - 5, ay)], fill=OL)
    for x in range(4, W - 4): im.putpixel((x, ay + ah - 3 + [2, 3, 3, 3, 3, 3, 3, 2][(x - 4) % 8]), OL)
    for x in (4, 58, W - 60, W - 6): R(x, ay, 2, ah + 2, OL)
    wins = []
    def window(x, y):
        box(x, y, 18, 14, W3); R(x + 2, y + 2, 14, 10, GL2); R(x + 2, y + 2, 14, 4, GL1); R(x + 8, y + 2, 2, 10, W3); R(x + 2, y + 6, 14, 2, W3)
        for k in range(3): d.line([(x + 3 + k * 4, y + 10), (x + 6 + k * 4, y + 3)], fill=C('#e8f5fa'))
        R(x - 3, y, 3, 14, W2); R(x + 18, y, 3, 14, W2); R(x - 3, y, 1, 14, W1); R(x + 20, y, 1, 14, W1)
        R(x - 1, y + 14, 20, 2, W2); R(x - 1, y + 14, 20, 1, W1); wins.append([x + 2, y + 2, 14, 10])
    wy2 = wy + 14
    for x in (14, 44, W - 32, W - 62): window(x, wy2)
    dw = 36; dx = W // 2 - dw // 2; dy = wy + 14; dh = H - dy - 4
    box(dx - 3, dy - 3, dw + 6, dh + 3, W3, hl=W2); R(dx, dy, dw, dh, OL)
    for xx in (dx + 1, dx + dw // 2 + 1):
        R(xx, dy + 1, dw // 2 - 2, dh - 1, W2); R(xx + 1, dy + 2, dw // 2 - 4, 5, W1)
        for r in range(3): R(xx + 2, dy + 9 + r * 9, dw // 2 - 6, 7, W3); R(xx + 3, dy + 10 + r * 9, dw // 2 - 8, 5, W2)
    R(dx + dw // 2 - 1, dy + 1, 2, dh - 1, OL); R(dx + dw // 2 - 5, dy + dh // 2, 3, 3, GOLD); R(dx + dw // 2 + 2, dy + dh // 2, 3, 3, GOLD)
    for lx in (dx - 9, dx + dw + 6): R(lx, dy + 2, 3, 6, OL); R(lx, dy + 3, 3, 4, GOLD); R(lx + 1, dy + 3, 1, 2, C('#fff3b0'))
    def crate(x, y, fruit, w=26):
        box(x, y, w, 12, W2, hl=W1, sh=W3); R(x + 2, y + 4, w - 4, 1, W4)
        for i in range(3, w - 3, 4): R(x + i, y - 2 + (i // 4) % 2, 3, 3, fruit[(i // 4) % len(fruit)]); R(x + i, y - 2 + (i // 4) % 2, 3, 1, C('#ffffff', 90))
    cy = H - 17
    crate(8, cy, [C('#d94a3a'), C('#e8452f')]); crate(38, cy, [C('#f2a22a'), C('#f6bd4a')])
    crate(W - 64, cy, [C('#78b840'), C('#5ca33a')]); crate(W - 34, cy, [C('#9f4fc2'), C('#b668d4')])
    R(2, H - 5, W - 4, 5, ST2); R(2, H - 5, W - 4, 1, ST1); R(2, H - 1, W - 4, 1, ST3)
    for x in range(8, W - 4, 14): R(x, H - 4, 1, 3, ST3)
    box(dx - 4, H - 6, dw + 8, 5, ST1, hl=C('#ced2da'), sh=ST2)
    meta = dict(w=W, h=H, ax=W // 2, ay=H, door=[dx, dy, dw, dh], win=wins, sign=[sx + 4, sy + 4, sw - 8, sh - 8])
    return im, meta

def vendor():   # pedagang berapron, 12x16
    im = Image.new('RGBA', (12, 16), (0, 0, 0, 0)); p = im.load()
    def px(x, y, c): p[x, y] = c
    def R(x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w): px(xx, yy, c)
    R(3, 0, 6, 1, OL); R(2, 1, 8, 3, OL); R(3, 1, 6, 2, RED1); R(3, 1, 6, 1, CR1); R(3, 3, 6, 1, RED2)      # topi
    R(3, 4, 6, 4, OL); R(4, 4, 4, 3, C('#f1c9a0')); px(5, 5, OL); px(7, 5, OL); px(5, 6, C('#d98f86')); px(6, 6, C('#d98f86'))
    R(2, 8, 8, 6, OL); R(3, 8, 6, 5, C('#5d9a4a')); R(4, 9, 4, 4, CR1); R(4, 9, 4, 1, CR3); px(6, 10, GOLD)  # apron
    R(1, 9, 2, 3, OL); R(2, 9, 1, 2, C('#f1c9a0')); R(9, 9, 2, 3, OL); R(9, 9, 1, 2, C('#f1c9a0'))
    R(3, 14, 3, 2, OL); R(6, 14, 3, 2, OL); R(4, 14, 1, 1, W3); R(7, 14, 1, 1, W3)
    return im

def scale_sprite():   # timbangan 22x20
    im = Image.new('RGBA', (22, 20), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    R = lambda x, y, w, h, c: d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
    R(3, 16, 16, 4, OL); R(4, 17, 14, 2, W2); R(9, 6, 4, 11, OL); R(10, 6, 2, 10, W3); R(2, 5, 18, 2, OL); R(3, 5, 16, 1, GOLD2)
    for cx in (3, 18):
        R(cx, 6, 1, 6, OL); R(cx - 2, 12, 6, 1, OL); R(cx - 3, 13, 8, 2, OL); R(cx - 2, 13, 6, 1, GOLD); R(cx - 2, 14, 6, 1, GOLD2)
    R(9, 3, 4, 3, OL); R(10, 3, 2, 2, GOLD)
    return im

def market_table():   # meja dagang 48x26
    im = Image.new('RGBA', (48, 26), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    R = lambda x, y, w, h, c: d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
    R(0, 10, 48, 16, OL); R(1, 11, 46, 14, W2); R(1, 11, 46, 1, W1); R(1, 23, 46, 2, W3)
    for x in range(4, 46, 11): R(x, 14, 1, 9, W3)
    R(0, 7, 48, 5, OL)
    for x in range(1, 47): R(x, 8, 1, 3, RED1 if ((x - 1) // 5) % 2 == 0 else CR1)
    for i, cols in enumerate(((C('#d94a3a'), C('#e8452f')), (C('#f2a22a'), C('#f6bd4a')), (C('#78b840'), C('#5ca33a')))):
        bx = 3 + i * 15; R(bx, 2, 12, 7, OL); R(bx + 1, 4, 10, 4, W1); R(bx + 1, 4, 10, 1, W2)
        for k in range(3): R(bx + 2 + k * 3, 1 + (k % 2), 3, 3, cols[k % 2]); R(bx + 2 + k * 3, 1 + (k % 2), 3, 1, C('#ffffff', 90))
    return im

def paste_sprite(atlas, meta_spr, key, im, canvas_w, row_pad=2):
    """Taruh `im` di atlas (kunci key). Bila sudah ada -> timpa di petak yang sama; bila belum -> baris baru di bawah, atlas diperpanjang."""
    if key in meta_spr:
        r = meta_spr[key]; x, y = r['x'], r['y']
    else:
        x, y = 0, atlas.height + row_pad
        big = Image.new('RGBA', (atlas.width, y + im.height), (0, 0, 0, 0)); big.paste(atlas, (0, 0)); atlas = big
    atlas.paste(Image.new('RGBA', im.size, (0, 0, 0, 0)), (x, y)); atlas.alpha_composite(im, (x, y))
    return atlas, x, y

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--root', default=str(Path(__file__).resolve().parents[1])); root = Path(ap.parse_args().root)
    wd = root / 'assets/world'
    # --- hall luar
    ixp = wd / 'index.json'; ix = json.loads(ixp.read_text(encoding='utf-8'))
    S = Image.open(wd / 'sprites.png').convert('RGBA'); h, meta = hall()
    S, x, y = paste_sprite(S, ix['spr'], 'b_market', h, 512); meta.update(x=x, y=y); ix['spr']['b_market'] = meta
    S.save(wd / 'sprites.png', optimize=True); ixp.write_text(json.dumps(ix, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    # --- sprite interior
    ijp = wd / 'interior.json'; ij = json.loads(ijp.read_text(encoding='utf-8')); I = Image.open(wd / 'interior.png').convert('RGBA')
    for key, im in (('vendor', vendor()), ('scale', scale_sprite()), ('market_table', market_table())):
        I, x, y = paste_sprite(I, ij['spr'], key, im, 512); ij['spr'][key] = dict(x=x, y=y, w=im.width, h=im.height)
    I.save(wd / 'interior.png', optimize=True)
    doors = ij['buildingDoors']; ent = dict(id='pasar', tpl='market', exterior={'x': 728, 'y': 544}, room={'w': 17, 'h': 10}, entry={'x': 8, 'y': 8}, exit={'x': 8, 'y': 9})
    doors[:] = [d for d in doors if d['id'] != 'pasar'] + [ent]
    ijp.write_text(json.dumps(ij, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    print('aset pasar ditulis: b_market, vendor, scale, market_table')
if __name__ == '__main__': main()
