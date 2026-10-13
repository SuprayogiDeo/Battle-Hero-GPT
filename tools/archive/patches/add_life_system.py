import json
from pathlib import Path
p=Path(__file__).resolve().parents[1]
# Extend design-driven world nodes and NPC spawn points.
df=p/'tools/world_design.json'; d=json.loads(df.read_text())
d['version']=3
d['npcs']={
  'builder':[43,26], 'cook':[62,59], 'woodcutter':[89,20]
}
d['resources']=[
 {'id':'wood_meadow_1','kind':'tree','x':67,'y':16,'biome':'forest','respawnMs':420000,'amount':2},
 {'id':'wood_forest_2','kind':'tree','x':86,'y':34,'biome':'forest','respawnMs':420000,'amount':2},
 {'id':'wood_foothill_3','kind':'tree','x':73,'y':53,'biome':'forest','respawnMs':420000,'amount':2},
 {'id':'stone_mountain_1','kind':'stone','x':101,'y':77,'biome':'mountain','respawnMs':540000,'amount':2},
 {'id':'stone_mountain_2','kind':'stone','x':116,'y':71,'biome':'mountain','respawnMs':540000,'amount':2},
 {'id':'mushroom_forest_1','kind':'mushroom','x':105,'y':30,'biome':'forest','respawnMs':360000,'amount':1},
 {'id':'mushroom_forest_2','kind':'mushroom','x':111,'y':35,'biome':'forest','respawnMs':360000,'amount':1},
 {'id':'herb_meadow_1','kind':'herb','x':38,'y':38,'biome':'meadow','respawnMs':300000,'amount':1},
 {'id':'herb_lakeside_2','kind':'herb','x':26,'y':76,'biome':'lake','respawnMs':300000,'amount':1},
 {'id':'fruit_orchard_1','kind':'fruit','x':80,'y':22,'biome':'forest','respawnMs':480000,'amount':1},
 {'id':'fruit_orchard_2','kind':'fruit','x':83,'y':25,'biome':'forest','respawnMs':480000,'amount':1}
]
# Additional buildings unlock progressively by village level. Coordinates are design data, not JS constants.
d['places'].extend([
 {'id':'village_workshop','name':'Bengkel Desa','name_en':'Village Workshop','type':'workshop','x':43,'y':28,'sprite':'house_hut','footprint':[3,3],'unlockLevel':2},
 {'id':'village_kitchen','name':'Dapur Desa','name_en':'Village Kitchen','type':'kitchen','x':62,'y':61,'sprite':'house_hut','footprint':[3,3],'unlockLevel':3},
 {'id':'woodcutter_hut','name':'Pondok Penebang','name_en':"Woodcutter's Hut",'type':'woodcutter_hut','x':90,'y':21,'sprite':'house_hut','footprint':[3,3],'unlockLevel':4}
])
df.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
# generator includes new design-defined world metadata
bp=p/'tools/build_world.py'; s=bp.read_text()
old="biomeRegions=design['biomes'], places=places, tags=design.get('tags', {}),\n               design='tools/world_design.json', objects=objects, anim=src.get('anim', {}))"
new="biomeRegions=design['biomes'], places=places, tags=design.get('tags', {}),\n               resources=design.get('resources', []), npcs={**src.get('npcs', {}), **design.get('npcs', {})},\n               design='tools/world_design.json', objects=objects, anim=src.get('anim', {}))"
if s.count(old)!=1: raise SystemExit(f'build_world replacement count {s.count(old)}')
bp.write_text(s.replace(old,new))
# Character builder: new villagers and Sunnyside action animations verified from Aseprite tags.
cp=p/'tools/build_chars.py'; s=cp.read_text()
s=s.replace("CHARS = {'avatar': 'short', 'npc_guard': 'spikey', 'npc_merchant': 'curly', 'npc_farmer': 'mop', 'npc_elder': 'long'}", "CHARS = {'avatar': 'short', 'npc_guard': 'spikey', 'npc_merchant': 'curly', 'npc_farmer': 'mop', 'npc_elder': 'long', 'npc_builder': 'short', 'npc_cook': 'curly', 'npc_woodcutter': 'mop'}")
old="for p, hair in CHARS.items():\n    reg(p + '_idle', side('IDLE', 'idle', 9, hair), 75)\n    reg(p + '_walk', side('WALKING', 'walk', 8, hair), 75)\n    for d in ('s', 'se', 'ne', 'n'):\n        reg(f'{p}_idle_{d}', [dir_idle(d, k, hair) for k in range(4)], 200)\n        reg(f'{p}_walk_{d}', [dir_walk(d, k, hair) for k in range(8)], 100)\nsize = sh.save(os.path.join(WORLD, 'chars.png'))"
new="for p, hair in CHARS.items():\n    reg(p + '_idle', side('IDLE', 'idle', 9, hair), 75)\n    reg(p + '_walk', side('WALKING', 'walk', 8, hair), 75)\n    for d in ('s', 'se', 'ne', 'n'):\n        reg(f'{p}_idle_{d}', [dir_idle(d, k, hair) for k in range(4)], 200)\n        reg(f'{p}_walk_{d}', [dir_walk(d, k, hair) for k in range(8)], 100)\n\ndef action_frames(action, hair='short'):\n    # Compose action frames from the actual layer data; frame count comes from the Aseprite tag.\n    if action not in tag: raise ValueError('Missing Aseprite action tag: ' + action)\n    out=[]\n    for fi in range(tag[action][1], tag[action][2] + 1):\n        im=Image.new('RGBA',(96,64))\n        put(im,cel(fi,'base')); put(im,cel(fi,'tools rear')); put(im,cel(fi,NAME[hair])); put(im,cel(fi,'tools'))\n        out.append(im)\n    return out\n\n# Aseprite v1.0 tags: reeling=274..286 (13 frames), axe=185..194 (10), mining=195..204 (10).\nreg('avatar_reeling', action_frames('reeling','short'), 85, 1)\nreg('avatar_axe', action_frames('axe','short'), 85, 0)\nreg('avatar_mining', action_frames('mining','short'), 85, 0)\nsize = sh.save(os.path.join(WORLD, 'chars.png'))"
if s.count(old)!=1: raise SystemExit(f'build_chars replacement count {s.count(old)}')
cp.write_text(s.replace(old,new))
print('design and builder patched')
