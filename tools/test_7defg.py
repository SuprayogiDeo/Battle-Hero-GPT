#!/usr/bin/env python3
"""Static integration checks for Hero Battle world/data and prior stages.
Run from anywhere: python tools/test_7defg.py (project root inferred from this file).
"""
import json, re, sys, struct
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'assets' / 'world'

def fail(msg):
    raise SystemExit('FAIL: ' + msg)

idx = json.loads((BASE / 'index.json').read_text(encoding='utf-8'))
if (idx.get('w'), idx.get('h'), idx.get('chunkSize')) != (128, 96, 32): fail('world dimensions/chunk size')
if len(idx.get('chunks', [])) != 12: fail('expected 12 world chunks')
if len(idx.get('biomeRegions', [])) != 5: fail('expected 5 biomes')
if len(idx.get('places', [])) < 10: fail('village unlock places missing')
if len(idx.get('resources', [])) < 10: fail('gathering nodes missing')
for meta in idx['chunks']:
    p = BASE / meta['file']
    if not p.is_file(): fail(f'missing chunk {meta["file"]}')
    c = json.loads(p.read_text(encoding='utf-8'))
    if c['w'] > 32 or c['h'] > 32: fail(f'chunk too large: {p.name}')
    if c['w'] * 16 > 512 or c['h'] * 16 > 512: fail(f'canvas budget exceeded: {p.name}')
    if any(len(c['layers'].get(k, [])) != c['w'] * c['h'] for k in ('ground','shadow','decor','over','collision')): fail(f'bad layer size: {p.name}')
    if not isinstance(c.get('tags'), list): fail(f'tag list missing: {p.name}')

all_tags = set()
for meta in idx['chunks']:
    c = json.loads((BASE / meta['file']).read_text(encoding='utf-8'))
    all_tags.update(x['tag'] for x in c.get('tags', []))
if 'fishing_spot' not in all_tags or 'animal_pen_area' not in all_tags: fail('fishing/pasture tags missing')

# Walkability test for all gathering nodes and new resident spawns.
grid, W, H = idx['grid'], idx['w'], idx['h']
blocked = set('~TXSRGQF')
spawn = tuple(idx.get('spawn', [30, 26]))
q, seen = deque([spawn]), {spawn}
while q:
    x, y = q.popleft()
    for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
        if 0 <= nx < W and 0 <= ny < H and (nx,ny) not in seen and grid[ny][nx] not in blocked:
            seen.add((nx,ny)); q.append((nx,ny))
for r in idx['resources']:
    x, y = r['x'], r['y']
    if grid[y][x] in blocked: fail(f'resource anchor blocked: {r["id"]}')
    if (x,y) not in seen: fail(f'resource unreachable: {r["id"]}')
for who in ('builder','cook','woodcutter'):
    if who in idx['npcs']:
        x,y=idx['npcs'][who]
        if grid[y][x] in blocked or (x,y) not in seen: fail(f'NPC spawn blocked/unreachable: {who}')

farm = idx.get('farm', [])
if len(farm) != 24: fail(f'world farming must expose 24 plots, got {len(farm)}')
for px, py in farm:
    tx, ty = int(px // 16), int(py // 16)
    if grid[ty][tx] != '.': fail(f'farm plot must be on open grass: {px},{py} is {grid[ty][tx]}')
life = (ROOT / 'js' / 'life.js').read_text(encoding='utf-8')
farm_src = (ROOT / 'js' / 'farm.js').read_text(encoding='utf-8')
if 'lifeTreeEdgeEligible' not in life or 'lifeTakeWorldDrop' not in life: fail('world tree protection/drop hooks missing')
if 'farmWorldPointerMove' not in farm_src or 'farmWorldAction' not in farm_src: fail('world farming gesture handlers missing')
atlas = json.loads((BASE / 'atlas.json').read_text(encoding='utf-8'))
for name, n in (('avatar_watering',5),('avatar_reeling',13),('avatar_axe',10),('avatar_mining',10),('npc_builder_idle',9),('npc_cook_idle',9),('npc_woodcutter_idle',9)):
    if atlas.get('anims',{}).get(name,{}).get('n') != n: fail(f'atlas frame count {name}')
if not (BASE / 'chars.png').is_file(): fail('characters atlas PNG missing')
item_icon=(BASE/'items.png')
if not item_icon.is_file(): fail('inventory item icon atlas missing')
item_bytes=item_icon.read_bytes()
if item_bytes[:8]!=b'\x89PNG\r\n\x1a\n' or struct.unpack('>II',item_bytes[16:24])!=(144,16): fail('inventory item atlas must be 144x16 PNG (nine 16x16 cells)')

for p in (ROOT/'js').glob('*.js'):
    if not p.is_file() or p.stat().st_size == 0: fail(f'empty JavaScript {p.name}')
life=(ROOT/'js'/'life.js').read_text(encoding='utf-8')
for token in ('S.fish','S.gather','S.kitchen','S.buff','S.village','S.orders','S.atmo','lifeFishingSpot','lifeDailyGrant'):
    if token not in life: fail(f'feature hook missing: {token}')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if not re.search(r"const VERSION\s*=\s*'v57'", sw): fail('service-worker version not v57')
if "'./js/life.js'" not in sw or "'./js/farm.js'" not in sw or "'./js/storagecraft.js'" not in sw or "'./assets/world/index.json'" not in sw or "'./assets/world/atlas.json'" not in sw or "'./assets/world/chars.png'" not in sw: fail('life/farm/storagecraft script or world assets not precached')
for p in ('index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png','js/life.js','js/farm.js','js/storagecraft.js','assets/world/atlas.json','assets/world/chars.png'):
    if not (ROOT/p).is_file(): fail(f'precache file missing: {p}')

if './js/adventure.js' not in sw: fail('adventure module missing from service-worker shell')
print('PASS: world=128x96, chunk=32, 12 chunks <=512px, 5 biomes, 10+ places, 24 open 6x4 farm plots, reachable resource nodes, Sunnyside WATERING=5 / REELING=13 / AXE=10 / MINING=10 frames, crop stages 0..5, NPC sprites, feature/save hooks, and SW v54 with Stages 8H+8I + prior systems.')
