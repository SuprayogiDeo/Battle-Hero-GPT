# Development tools

## Tests

Run the full automated suite from the repository root:

```bash
npm test
```

Individual regression files:

- `test_browser_smoke.js` — script order, checkpoint/save, inventory capacity, storage/workshop, combat and boss rewards.
- `test_stage2_batch.js` — inventory overflow, watering/rain, ranch feeding/offline catch-up.
- `test_save_recovery.js` — valid backup, corrupted save, failed write and wipe behavior.
- `test_life_logic.js` — fishing/gathering/recipes/buffs/economy/NPC order checks.
- `test_7defg.py` — world dimensions/chunks/biomes/resources/animations and service-worker checks.

`check_static_paths.js` verifies the HTML references, mandatory service-worker files, art precache list, and world chunks. `check_syntax.js` verifies JavaScript parsing.

## Asset/world generators

Some `build_*.py` scripts use Pillow; install optional development dependencies with:

```bash
python -m pip install -r requirements-dev.txt
```

`build_assets.py` and related asset generators require a separately acquired source asset pack arranged at the documented path. That original pack is intentionally not included here. See `CREDITS` and `docs/LICENSE_AND_ASSETS.md` before copying generated assets into a public repository.

Scripts under `tools/archive/patches/` are historical migration/patch scripts. They are preserved for provenance, are **not** part of the normal run or test flow, and should not be run against current code without reviewing them first.
