#!/usr/bin/env python3
"""Tahap 8F: metadata jendela/pintu untuk atlas rumah baru.

Jalankan setelah build_interiors.py dan build_world.py. Koordinat jendela relatif
ke sprite b_* pada assets/world/sprites.png; data disimpan di index.json sehingga
Tmap.tall()/lights() menggambar cahaya hangat pada malam hari tanpa mengubah pintu.
Idempoten dan tidak menyentuh aset sumber/pack. Pakai: python3 tools/build_lights.py [--root PATH].
"""
import argparse, json
from pathlib import Path

# Kotak kaca terpilih, dalam koordinat piksel sprite (x, y, w, h).
# Nilai sengaja eksplisit agar rebuild menghasilkan jendela yang sama, bukan deteksi warna rapuh.
HOUSE_WINDOWS = {
    'b_toko': [[7, 48, 8, 8], [47, 48, 8, 8]],
    'b_barak': [[22, 43, 12, 11], [63, 43, 12, 11], [8, 44, 5, 7], [84, 44, 5, 7]],
    'b_hall': [[6, 68, 9, 11], [41, 68, 9, 11]],
    'b_workshop': [[8, 39, 9, 8], [39, 39, 9, 8]],
    'b_kitchen': [[7, 22, 8, 11], [41, 22, 8, 11]],
    'b_woodcutter': [[8, 57, 10, 8], [40, 57, 10, 8]],
    'b_fisher': [[7, 36, 14, 9], [51, 36, 14, 9]],
    'b_home': [[7, 33, 14, 11], [45, 33, 14, 11], [7, 60, 14, 10], [45, 60, 14, 10]],
    'b_res1': [[5, 39, 9, 10], [72, 39, 9, 10]],
    'b_res2': [[13, 45, 14, 10], [74, 45, 12, 10]],
    'b_res3': [[5, 51, 11, 9], [58, 51, 11, 9]],
    'b_res4': [[7, 29, 10, 10], [39, 29, 10, 10]],
    'b_res5': [[8, 32, 12, 10], [59, 32, 12, 10]],
    'b_res6': [[7, 59, 10, 9], [77, 59, 10, 9]],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default='.', help='root proyek Hero Battle')
    root = Path(ap.parse_args().root).resolve()
    idx_path = root / 'assets/world/index.json'
    idx = json.loads(idx_path.read_text(encoding='utf-8'))
    missing = sorted(set(HOUSE_WINDOWS) - set(idx.get('spr', {})))
    if missing:
        raise SystemExit('Atlas rumah belum tersedia, jalankan build_interiors.py dahulu: ' + ', '.join(missing))
    for name, wins in HOUSE_WINDOWS.items():
        r = idx['spr'][name]
        valid = []
        for x, y, w, h in wins:
            if x < 0 or y < 0 or w < 1 or h < 1 or x + w > r['w'] or y + h > r['h']:
                raise SystemExit(f'Koordinat jendela di luar sprite {name}: {(x, y, w, h)} / {r["w"]}x{r["h"]}')
            dx, dy, dw, dh = r.get('door', [0, 0, 0, 0])
            if x < dx + dw and x + w > dx and y < dy + dh and y + h > dy:
                raise SystemExit(f'Jendela menimpa area pintu {name}: {([x, y, w, h])} vs {r.get("door")}')
            valid.append([x, y, w, h])
        # `door` berasal dari Houses Sprite Sheet dan sengaja tidak ditimpa.
        r['win'] = valid
    idx['lightingMetadata'] = {'source': 'tools/build_lights.py', 'windowSprites': len(HOUSE_WINDOWS), 'note': 'PLACEHOLDER: kotak kaca ditinjau dari atlas; tuning visual malam bisa disesuaikan.'}
    idx_path.write_text(json.dumps(idx, separators=(',', ':')), encoding='utf-8')
    print(f'PASS: metadata lampu malam diterapkan pada {len(HOUSE_WINDOWS)} sprite rumah; pintu dipertahankan.')


if __name__ == '__main__':
    main()
