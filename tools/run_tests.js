#!/usr/bin/env node
'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function run(label, command, args) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`${label} could not run: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
run('JavaScript syntax', process.execPath, ['tools/check_syntax.js']);
run('Static asset paths', process.execPath, ['tools/check_static_paths.js']);
run('Browser/script smoke tests', process.execPath, ['tools/test_browser_smoke.js']);
run('Stage 2 regression tests', process.execPath, ['tools/test_stage2_batch.js']);
run('Save recovery tests', process.execPath, ['tools/test_save_recovery.js']);
run('Life-system tests', process.execPath, ['tools/test_life_logic.js']);
run('Interior + HUD tests', process.execPath, ['tools/test_interior_hud.js']);
run('Interior room-name box (Batch 9B-15)', process.execPath, ['tools/test_interior_name_box.js']);
run('Inventory + storage tests (Stage 8C)', process.execPath, ['tools/test_inventory_storage.js']);
run('World farming + fishing + gathering tests (Stages 8D–8E)', process.execPath, ['tools/test_stage_8de.js']);
run('Interiors, physical services, signage and safe waypoint routes (Stages 8F–8G)', process.execPath, ['tools/test_stage_8fg.js']);
run('Persistent milestone tutorials and opt-in performance monitor (Stages 8H–8I)', process.execPath, ['tools/test_tutorial_progress.js']);
run('Stage 9A: bridge, overlaps, focus panel, minimap', process.execPath, ['tools/test_stage_9a.js']);
run('Stage 10A: polish (bridge, footprints, pens, mushrooms, resource respawn, fishing)', process.execPath, ['tools/test_polish_10a.js']);
run('Fixes 9A-9D: park, farm gate, symmetric gate, door paths, bridge deck, mushrooms, building spacing, grove sign', process.execPath, ['tools/test_stage_9c.js']);
run('Map data 10A: Village Hall path, east bridge road, b_res5 bush', process.execPath, ['tools/test_map_10a.js']);
run('HUD regression (landscape): no visual overlaps, tap targets >= 44 px, text fits', process.execPath, ['tools/test_hud_regression.js']);
run('World zoom (opt-in ?zoom=): camera, culling, restore-on-error, screen<->world conversion', process.execPath, ['tools/test_world_zoom.js']);
run('Release integrity checks', process.execPath, ['tools/test_release_integrity.js']);
const isWin = process.platform === 'win32';
run('World/data regression tests', isWin ? 'py' : 'python3', isWin ? ['-3', 'tools/test_7defg.py'] : ['tools/test_7defg.py']);
console.log('\nPASS: all Hero Battle automated test suites completed.');
