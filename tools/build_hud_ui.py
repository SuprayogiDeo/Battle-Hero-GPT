#!/usr/bin/env python3
"""Build a small approved Sunnyside World UI atlas for Hero Battle.

Usage: python3 tools/build_hud_ui.py /path/to/Sunnyside_World_ASSET_PACK_V2.1.zip [project-root]
Accepts the original ZIP or an unpacked Sunnyside_World_Assets directory. Only selected
UI sprites are copied into a compact derived atlas; the source pack is never copied.
Requires Pillow.
"""
from pathlib import Path
from zipfile import ZipFile, BadZipFile
from io import BytesIO
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('Sunnyside_World_ASSET_PACK_V2.1.zip')
OUT = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else ROOT
BASE = 'Sunnyside_World_ASSET_PACK_V2.1/Sunnyside_World_Assets/UI/'
PANEL = ('tl', 'tc', 'tr', 'lc', 'c', 'rc', 'bl', 'bc', 'br')


def open_image(name):
    if SOURCE.is_file():
        try:
            with ZipFile(SOURCE) as zf:
                for prefix in (BASE, 'Sunnyside_World_Assets/UI/'):
                    rel = prefix + ('9slice_box_white/' if name.startswith('w_box_9slice_') else '') + name
                    try:
                        return Image.open(BytesIO(zf.read(rel))).convert('RGBA')
                    except KeyError:
                        pass
        except BadZipFile as exc:
            raise SystemExit(f'Bukan ZIP aset yang valid: {SOURCE}') from exc
    else:
        candidates = [SOURCE / 'UI', SOURCE / 'Sunnyside_World_Assets' / 'UI']
        rel = Path('9slice_box_white') / name if name.startswith('w_box_9slice_') else Path(name)
        for folder in candidates:
            path = folder / rel
            if path.is_file():
                return Image.open(path).convert('RGBA')
    raise SystemExit(f'Aset Sunnyside tidak ditemukan: {name} (sumber: {SOURCE})')


# Exact atlas layout also documented in js/settings.js; keep 2 transparent pixels between sprites.
atlas = Image.new('RGBA', (80, 40), (0, 0, 0, 0))
frames = {}
for i, part in enumerate(PANEL):
    name = f'panel_{part}'
    im = open_image(f'w_box_9slice_{part}.png')
    if im.size != (3, 3):
        raise SystemExit(f'Ukuran panel slice tak terduga: {name}={im.size}; expected 3x3')
    x, y = (i % 3) * 5, (i // 3) * 5
    atlas.alpha_composite(im, (x, y))
    frames[name] = (x, y, im.width, im.height)
for name, x, y in (('confirm', 0, 18), ('cancel', 14, 18), ('bar_empty', 27, 18), ('bar_fill', 44, 18), ('cursor', 61, 18)):
    im = open_image({'bar_empty':'greenbar_00.png', 'bar_fill':'greenbar_01.png', 'cursor':'cursor_01.png'}.get(name, name + '.png'))
    atlas.alpha_composite(im, (x, y))
    frames[name] = (x, y, im.width, im.height)

out = OUT / 'assets' / 'world' / 'ui.png'
out.parent.mkdir(parents=True, exist_ok=True)
atlas.save(out, optimize=True)
print(f'Built {out.relative_to(OUT)}: {atlas.width}x{atlas.height}, {len(frames)} curated Sunnyside UI sprites, {out.stat().st_size} bytes')
