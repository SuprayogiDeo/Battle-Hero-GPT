#!/usr/bin/env python3
"""Build a data-driven, chunked peaceful world while preserving the original village coordinates."""
import argparse, json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets/world'
DESIGN = ROOT / 'tools/world_design.json'
LAYERS = ('ground', 'shadow', 'decor', 'over', 'collision')


def bridge_tile(bridge, ids, xx, yy):
    """Pilih tile jembatan kayu: baris (atas/tengah/bawah) x kolom (ujung kiri/kanan, papan a/b, tiang)."""
    xs = [p[0] for p in bridge['points']]; x0, x1 = min(xs), max(xs); w = max(1, int(bridge.get('width', 1))); yc = bridge['points'][0][1]
    top = yc - w // 2; r = yy - top; row = 'top' if r == 0 else 'bot' if r == w - 1 else 'mid'
    mid = (x0 + x1) // 2
    # Tiang simetris: ujung dan dua titik di dalam; hindari menumpuk pada jembatan pendek.
    post_x = {x0, x0 + 2, x1 - 2, x1}
    col = 'L' if xx == x0 else 'R' if xx == x1 else 'post' if (xx in post_x and row != 'mid') else ('a' if (xx & 1) == 0 else 'b')
    return ids[row + '_' + col]


def line_points(x0, y0, x1, y1):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    return [(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n)) for i in range(n + 1)]


def hash01(x, y, salt=0):
    n = (x * 374761393 + y * 668265263 + salt * 1442695041) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    n ^= n >> 16
    return n / 4294967295


def in_rect(x, y, r):
    return r['x'] <= x < r['x'] + r['w'] and r['y'] <= y < r['y'] + r['h']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--width', type=int)
    ap.add_argument('--height', type=int)
    ap.add_argument('--chunk', type=int)
    args = ap.parse_args()
    design = json.loads(DESIGN.read_text(encoding='utf-8'))
    BT = json.loads((BASE / 'bridge_tiles.json').read_text(encoding='utf-8'))['ids']
    src = json.loads((BASE / 'village.json').read_text(encoding='utf-8'))
    # Preserve generated interior-house sprites/door metadata when the world is rebuilt.
    prior_path = BASE / 'index.json'
    prior = json.loads(prior_path.read_text(encoding='utf-8')) if prior_path.exists() else {}
    prior_objects = {(o.get('x'), o.get('y')): o for o in prior.get('objects', [])}
    W = args.width or design['world']['width']
    H = args.height or design['world']['height']
    C = args.chunk or design['world']['chunkSize']
    if min(W, H, C) < 1 or C > 64:
        ap.error('width/height/chunk must be positive; chunk cannot exceed 64 tiles')
    old_w, old_h = src['w'], src['h']
    if W < old_w or H < old_h:
        ap.error(f'world must be at least {old_w}x{old_h} to preserve the existing village')
    total = W * H
    grid = [list((src['grid'][y] if y < old_h else '')[:min(W, old_w)].ljust(min(W, old_w), '.')) + ['.'] * max(0, W - old_w) for y in range(H)]
    grid = [row[:W] for row in grid]
    layers = {name: [0] * total for name in LAYERS}
    for name in LAYERS:
        old = src.get('layers', {}).get(name, [])
        for y in range(old_h):
            for x in range(old_w):
                i = y * W + x
                oi = y * old_w + x
                if oi < len(old): layers[name][i] = old[oi]

    def biome_at(x, y):
        return next((b for b in design['biomes'] if in_rect(x, y, b)), design['biomes'][0])

    # Explicitly paint the expanded land first; source village tiles remain byte-for-byte positioned.
    for y in range(H):
        for x in range(W):
            if x < old_w and y < old_h:
                continue
            biome = biome_at(x, y)
            choices = biome.get('groundTiles', [5, 6, 7, 8])
            layers['ground'][y * W + x] = choices[int(hash01(x, y, 11) * len(choices)) % len(choices)]

    def set_tile(x, y, tile, ch=None, layer='ground'):
        if not (0 <= x < W and 0 <= y < H): return
        i = y * W + x
        # Avoid rewriting the existing village art; new paths/terrain can continue from its edge.
        if x < old_w and y < old_h: return
        layers[layer][i] = tile
        if ch is not None: grid[y][x] = ch

    def paint_water_cell(x, y, feature):
        tile_choices = feature.get('tileTiles', [82, 83, 84, 85])
        set_tile(x, y, tile_choices[int(hash01(x, y, 17) * len(tile_choices)) % len(tile_choices)], feature.get('grid', '~'))

    # Shape-based water is part of the design file, not baked into JavaScript coordinates.
    for f in design.get('waterFeatures', []):
        typ = f.get('type')
        cells = set()
        if typ == 'rect':
            for y in range(f['y'], min(H, f['y'] + f['h'])):
                for x in range(f['x'], min(W, f['x'] + f['w'])): cells.add((x, y))
        elif typ == 'ellipse':
            cx, cy = f['x'] + f['w'] / 2, f['y'] + f['h'] / 2
            rx, ry = max(.5, f['w'] / 2), max(.5, f['h'] / 2)
            for y in range(max(0, f['y'] - 1), min(H, f['y'] + f['h'] + 1)):
                for x in range(max(0, f['x'] - 1), min(W, f['x'] + f['w'] + 1)):
                    if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1: cells.add((x, y))
        elif typ == 'river':
            radius = max(.5, f.get('width', 2) / 2)
            pts = f['points']
            for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                for x, y in line_points(x0, y0, x1, y1):
                    rr = math.ceil(radius)
                    for yy in range(y - rr, y + rr + 1):
                        for xx in range(x - rr, x + rr + 1):
                            if (xx - x) ** 2 + (yy - y) ** 2 <= radius ** 2 + .25 and 0 <= xx < W and 0 <= yy < H: cells.add((xx, yy))
        if f.get('shoreTile') is not None:
            halo = set()
            for x, y in cells:
                for yy in range(y - 1, y + 2):
                    for xx in range(x - 1, x + 2):
                        if (xx, yy) not in cells and 0 <= xx < W and 0 <= yy < H: halo.add((xx, yy))
            for x, y in halo: set_tile(x, y, int(f['shoreTile']), '.')
        for x, y in cells: paint_water_cell(x, y, f)

    # Explicit bridges can overlay the legacy shoreline while leaving every other village tile in place.
    for bridge in design.get('bridges', []):
        pts = bridge.get('points', [])
        width = max(1, int(bridge.get('width', 1)))
        off = range(-(width // 2), width - width // 2)
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            horizontal = abs(x1 - x0) >= abs(y1 - y0)
            for x, y in line_points(x0, y0, x1, y1):
                for side in off:
                    xx, yy = (x, y + side) if horizontal else (x + side, y)
                    if not (0 <= xx < W and 0 <= yy < H): continue
                    i = yy * W + xx
                    layers['ground'][i] = bridge_tile(bridge, BT, xx, yy) if bridge.get('style') == 'plank' else int(bridge.get('tile', 50))
                    grid[yy][xx] = '+'
                    layers['collision'][i] = 0

    # Jembatan kayu: tiang pada layer decor (di atas air sisi utara) dan bayangan di air sisi selatan.
    for bridge in design.get('bridges', []):
        if bridge.get('style') != 'plank': continue
        xs = [p[0] for p in bridge['points']]; x0, x1 = min(xs), max(xs); w = max(1, int(bridge.get('width', 1))); yc = bridge['points'][0][1]
        top, bot = yc - w // 2, yc - w // 2 + w - 1
        for xx in range(x0, x1 + 1):
            if grid[top - 1][xx] == '~' and xx in (x0, x1, x0 + 3, (x0 + x1) // 2, x1 - 3): layers['decor'][(top - 1) * W + xx] = BT['post_cap']
            if grid[bot + 1][xx] == '~': layers['shadow'][(bot + 1) * W + xx] = BT['water_shadow']

    # Roads join the legacy village to every new region without destroying old village art.
    road_cells = set()
    for a, b, c, d in design.get('roads', []):
        road_cells.update(line_points(a, b, c, d))
    for x, y in sorted(road_cells, key=lambda p: (p[1], p[0])):
        if not (0 <= x < W and 0 <= y < H): continue
        if x < old_w and y < old_h: continue
        if grid[y][x] in ('~', '+'): continue
        set_tile(x, y, 34, ',')

    objects = list(src.get('objects', []))
    # Restore the new house sprite ids on legacy village objects at the same coordinates.
    for obj in objects:
        old = prior_objects.get((obj.get('x'), obj.get('y')))
        if old and str(old.get('k', '')).startswith('b_'):
            obj['k'] = old['k']
    places = design.get('places', [])
    occupied = set()
    # Metadata ukuran sprite (atlas lama + bangunan b_*), dipakai untuk menurunkan footprint collision dari sprite.
    sprite_meta = dict(src.get('spr', {}))
    for name, meta in prior.get('spr', {}).items():
        if name.startswith('b_'): sprite_meta[name] = meta

    def in_bounds(x, y): return 0 <= x < W and 0 <= y < H

    def block(x, y):
        if in_bounds(x, y):
            grid[y][x] = 'X'; layers['collision'][y * W + x] = 1; occupied.add((x, y))

    def clear_zone(cx, cy, r):
        for yy in range(cy - r, cy + r + 1):
            for xx in range(cx - r, cx + r + 1): occupied.add((xx, yy))

    def add_sprite(key, tx, ty, c='', offset=1):
        # Tree animations use the 'a' field; static atlas sprites use 'k'.
        obj = {'x': int(tx * 16 + 8), 'y': int((ty + offset) * 16), 'c': c}
        if key.startswith('tree_'):
            obj['a'] = key
        else:
            obj['k'] = key
        # Keep upgraded house sprite ids/metadata from the previous generated index.
        old = prior_objects.get((obj['x'], obj['y']))
        if old and str(old.get('k', '')).startswith('b_'):
            obj.update({k: v for k, v in old.items() if k not in ('x', 'y', 'a')})
        objects.append(obj)
        return obj

    # Place structures and footprints are declared in world_design.json.
    for p in places:
        x, y = int(p['x']), int(p['y'])
        if 'platform' in p:
            plat = p['platform']; left = x - plat['w'] // 2
            for yy in range(y - 1, min(H, y - 1 + plat['h'])):
                for xx in range(max(0, left), min(W, left + plat['w'])):
                    # The dock runs over water but its walking surface is solid wood.
                    layers['ground'][yy * W + xx] = plat.get('tile', 50)
                    grid[yy][xx] = '+'
                    layers['collision'][yy * W + xx] = 0
                    occupied.add((xx, yy))
        if 'sprite' in p:
            obj = add_sprite(p['sprite'], x, y, offset=0)
            meta = sprite_meta.get(obj.get('k'))
            if meta:
                # Footprint = tile yang benar-benar tertutup sprite (tumpang tindih >= 6 px). Baris tepat di depan
                # bangunan (baris y) selalu bebas sehingga pemain bisa berjalan di depan pintu tanpa dinding tak terlihat.
                left = obj['x'] - meta['ax']; top_px = obj['y'] - meta['h']
                for yy in range(top_px // 16, (obj['y'] - 1) // 16 + 1):
                    if min(obj['y'], (yy + 1) * 16) - max(top_px, yy * 16) < 6: continue
                    for xx in range(left // 16, (left + meta['w'] - 1) // 16 + 1):
                        if min(left + meta['w'], (xx + 1) * 16) - max(left, xx * 16) < 6: continue
                        block(xx, yy)
                # Plat nama berdiri di sisi kanan-depan bangunan, bukan menimpa pintu.
                # Dua baris di depan bangunan bebas vegetasi acak (tidak ada pohon tepat di depan pintu).
                for yy in (y, y + 1):
                    for xx in range(left // 16 - 1, (left + meta['w'] - 1) // 16 + 2): occupied.add((xx, yy))
                p['signAt'] = [left + meta['w'] + 10, obj['y'] + 13]
                clear_zone((left + meta['w'] + 10) // 16, y, 1)
            else:
                fw, fh = p.get('footprint', [2, 2])
                for yy in range(max(0, y - fh + 1), min(H, y)):
                    for xx in range(max(0, x - fw // 2), min(W, x - fw // 2 + fw)): block(xx, yy)
        if p.get('clearRadius'): clear_zone(x, y, int(p['clearRadius']))
        if 'fence' in p:
            fw, fh = p['fence']['w'], p['fence']['h']; left, top = x - fw // 2, y - fh + 1
            for xx in range(left, left + fw):
                for yy, key in ((top, 'fence_h'), (top + fh - 1, 'fence_h')):
                    if 0 <= xx < W and 0 <= yy < H:
                        add_sprite(key, xx, yy); grid[yy][xx] = 'X'; layers['collision'][yy * W + xx] = 1; occupied.add((xx, yy))
            for yy in range(top + 1, top + fh - 1):
                for xx, key in ((left, 'fence_v'), (left + fw - 1, 'fence_v')):
                    if 0 <= xx < W and 0 <= yy < H:
                        add_sprite(key, xx, yy); grid[yy][xx] = 'X'; layers['collision'][yy * W + xx] = 1; occupied.add((xx, yy))
        if 'cluster' in p:
            cl = p['cluster']; made = 0
            for yy in range(y - cl['h'] // 2, y + cl['h'] // 2 + 1):
                for xx in range(x - cl['w'] // 2, x + cl['w'] // 2 + 1):
                    if (xx, yy) in occupied or not (0 <= xx < W and 0 <= yy < H): continue
                    if xx < old_w and yy < old_h: continue
                    if hash01(xx, yy, 83) < .28:
                        key = cl['sprites'][int(hash01(xx, yy, 84) * len(cl['sprites'])) % len(cl['sprites'])]
                        add_sprite(key, xx, yy); made += 1
                        if key.startswith(('tree_', 'pine_')): grid[yy][xx] = 'X'; layers['collision'][yy * W + xx] = 1
                        occupied.add((xx, yy))
        if 'mushrooms' in p:
            m = p['mushrooms']
            for yy in range(y - m['h'] // 2, y + m['h'] // 2 + 1):
                for xx in range(x - m['w'] // 2, x + m['w'] // 2 + 1):
                    if not in_bounds(xx, yy) or (xx, yy) in occupied or grid[yy][xx] in ('~', ',', '+', 'X'): continue
                    if hash01(xx, yy, 93) >= m.get('density', .4): continue
                    an = m['anims'][int(hash01(xx, yy, 94) * len(m['anims'])) % len(m['anims'])]
                    objects.append({'x': xx * 16 + 8 + int((hash01(xx, yy, 95) - .5) * 8), 'y': (yy + 1) * 16 - int(hash01(xx, yy, 96) * 4), 'c': '', 'a': an, 'deco': 'mushroom'})
                    occupied.add((xx, yy))
        for deco in p.get('decor', []):
            add_sprite(deco['sprite'], x + deco.get('dx', 0), y + deco.get('dy', 0))

    # Kandang per spesies: pagar tertutup rapat (collision), pintu terbuka di sisi selatan, interior tetap bisa dimasuki.
    pens_out = []
    for pen in design.get('pens', []):
        x0, y0, pw, ph = int(pen['x']), int(pen['y']), int(pen['w']), int(pen['h'])
        gate = pen.get('gate', {'at': pw // 2 - 1, 'width': 2})
        gcols = list(range(x0 + int(gate['at']), x0 + int(gate['at']) + int(gate['width'])))
        for yy in range(y0 - 1, y0 + ph + 2):
            for xx in range(x0 - 1, x0 + pw + 1): occupied.add((xx, yy))
        for yy in range(y0, y0 + ph):
            for xx in range(x0, x0 + pw):
                if not (xx in (x0, x0 + pw - 1) or yy in (y0, y0 + ph - 1)): continue
                if yy == y0 + ph - 1 and xx in gcols: continue
                block(xx, yy)
        pens_out.append(dict(pen, gateCols=[gcols[0], gcols[-1]], gateRow=y0 + ph - 1,
                             interior=[(x0 + 1) * 16, (y0 + 1) * 16, (x0 + pw - 1) * 16, (y0 + ph - 1) * 16],
                             signAt=[(x0 + 1) * 16 + 8, (y0 + ph) * 16 + 14]))

    # Physical biome signs: labels are attached to the sign objects and rendered with distance fade.
    for sign in design.get('biomeSigns', []):
        x, y = int(sign['x']), int(sign['y'])
        obj = add_sprite(sign.get('sprite', 'sign'), x, y, offset=1)
        obj.update(biomeSign=sign['id'], signName=sign['name'], signNameEn=sign['name_en'])
        occupied.add((x, y)); clear_zone(x, y, 2)   # papan tidak boleh tertutup pohon

    # Major transitions get decorative arches; these are visual props and deliberately add no collision.
    for gate in design.get('biomeGates', []):
        x, y = int(gate['x']), int(gate['y'])
        objects.append({'k': 'gate_arch', 'x': int(x * 16 + 8), 'y': int((y + 1) * 16),
                        'c': '', 'gateId': gate['id'], 'fromBiome': gate['from'], 'toBiome': gate['to']})
        occupied.add((x, y))

    # Services stay outside but activate only from an explicit action near the physical object.
    service_objects = []
    for service in design.get('serviceObjects', []):
        x, y = int(service['x']), int(service['y'])
        sprite = service.get('sprite', 'board')
        obj = add_sprite(sprite, x, y, offset=1)
        obj.update(serviceId=service['id'], serviceType=service['type'])
        occupied.add((x, y))
        service_objects.append({k: service[k] for k in ('id', 'type', 'x', 'y', 'rangeTiles', 'name', 'name_en') if k in service})

    # Deterministic vegetation/rocks are seeded from biome rules and never placed on roads, water, or buildings.
    for y in range(H):
        for x in range(W):
            if x < old_w and y < old_h: continue
            if (x, y) in occupied or grid[y][x] in (',', '~', '+', 'X'): continue
            biome = biome_at(x, y); kind = biome.get('vegetation'); density = biome.get('density', 0)
            if hash01(x, y, 31) >= density: continue
            if kind == 'forest': key = ('tree_1', 'tree_2', 'pine_a', 'pine_b')[int(hash01(x, y, 32) * 4) % 4]
            elif kind == 'mountain': key = ('rock_a', 'rock_b', 'pine_a', 'pine_b')[int(hash01(x, y, 33) * 4) % 4]
            elif kind == 'shore': key = ('bush_a', 'bush_c', 'flower_2', 'flower_7')[int(hash01(x, y, 34) * 4) % 4]
            elif kind == 'coast': key = ('bush_a', 'flower_2', 'flower_7')[int(hash01(x, y, 35) * 3) % 3]
            else: key = ('flower_0', 'flower_2', 'flower_5', 'flower_7', 'bush_a')[int(hash01(x, y, 36) * 5) % 5]
            add_sprite(key, x, y)
            if key.startswith(('tree_', 'pine_', 'rock_')):
                grid[y][x] = 'X'; layers['collision'][y * W + x] = 1

    # Additional design-file scatter (for example rocky foothills) is separate from generic biome vegetation.
    biome_by_id = {b['id']: b for b in design.get('biomes', [])}
    for landmark in design.get('landmarks', []):
        if landmark.get('type') != 'scatter' or landmark.get('biome') not in biome_by_id: continue
        region = biome_by_id[landmark['biome']]; sprites = landmark.get('sprites', [])
        if not sprites: continue
        for yy in range(max(0, region['y']), min(H, region['y'] + region['h'])):
            for xx in range(max(0, region['x']), min(W, region['x'] + region['w'])):
                if xx < old_w and yy < old_h: continue
                if (xx, yy) in occupied or grid[yy][xx] in (',', '~', '+', 'X'): continue
                if hash01(xx, yy, 91) >= landmark.get('density', 0): continue
                key = sprites[int(hash01(xx, yy, 92) * len(sprites)) % len(sprites)]
                add_sprite(key, xx, yy); occupied.add((xx, yy))
                if key.startswith(('tree_', 'pine_', 'rock_')):
                    grid[yy][xx] = 'X'; layers['collision'][yy * W + xx] = 1

    # Collision layer follows the authoritative grid. Water and props remain blocked; roads, sand and dock are walkable.
    blocked = set('~TXSRGQF')
    for y in range(H):
        for x in range(W):
            i = y * W + x
            if x < old_w and y < old_h:
                # Source collision is retained unless new place/decor explicitly changed this tile.
                if grid[y][x] in blocked: layers['collision'][i] = 1
            else:
                layers['collision'][i] = 1 if grid[y][x] in blocked else 0

    idx = {k: v for k, v in src.items() if k not in ('layers', 'grid')}
    sprites = dict(src.get('spr', {}))
    for name, meta in prior.get('spr', {}).items():
        if name.startswith('b_'):
            sprites[name] = meta
    idx.update(v=5, w=W, h=H, tile=16, chunkSize=C, chunkPixel=C * 16,
               chunks=[], source='village.json', grid=[''.join(r) for r in grid],
               spr=sprites, biomeRegions=design['biomes'], places=places, tags=design.get('tags', {}),
               resources=design.get('resources', []), npcs={**src.get('npcs', {}), **design.get('npcs', {})},
               biomeSigns=design.get('biomeSigns', []), biomeGates=design.get('biomeGates', []),
               serviceObjects=service_objects, pens=pens_out, animals=([] if pens_out else src.get('animals', [])), design='tools/world_design.json', objects=objects, anim=src.get('anim', {}))
    out = BASE / 'chunks'; out.mkdir(exist_ok=True)
    for old in out.glob('c*_*.json'): old.unlink()
    for cy in range((H + C - 1) // C):
        for cx in range((W + C - 1) // C):
            x0, y0 = cx * C, cy * C; cw, ch = min(C, W - x0), min(C, H - y0)
            cut = {}
            for name in LAYERS:
                cut[name] = [layers[name][(y0 + yy) * W + x0 + xx] for yy in range(ch) for xx in range(cw)]
            tags = []
            for yy in range(ch):
                for xx in range(cw):
                    gx, gy = x0 + xx, y0 + yy; ch0 = grid[gy][gx]; bi = biome_at(gx, gy)
                    if ch0 == '~': tags.append({'i': yy * cw + xx, 'tag': design.get('tags', {}).get('water', 'fishing_spot')})
                    if bi['id'] == 'meadow': tags.append({'i': yy * cw + xx, 'tag': design.get('tags', {}).get('meadow', 'animal_pen_area')})
            biome = biome_at(x0, y0)['id']
            name = f'c{cx}_{cy}.json'
            chunk_objects = [o for o in objects if x0 <= o.get('x', -1) / 16 < x0 + cw and y0 <= o.get('y', -1) / 16 < y0 + ch]
            (out / name).write_text(json.dumps({'v': 3, 'x': x0, 'y': y0, 'w': cw, 'h': ch, 'layers': cut,
                'objects': chunk_objects, 'biome': biome, 'tags': tags}, separators=(',', ':')), encoding='utf-8')
            idx['chunks'].append({'x': cx, 'y': cy, 'file': 'chunks/' + name, 'biome': biome})
    (BASE / 'index.json').write_text(json.dumps(idx, separators=(',', ':')), encoding='utf-8')
    print(f'Built {len(idx["chunks"])} chunks for {W}x{H}; {len(design["biomes"])} biomes, {len(places)} places, {len(objects)} objects')

if __name__ == '__main__': main()
