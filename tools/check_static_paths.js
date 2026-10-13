#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function fail(message) { console.error(`FAIL: ${message}`); process.exitCode = 1; }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
for (const ref of refs) {
  if (/^(?:https?:|data:|#|\/\/)/i.test(ref) || ref === './' || ref === '') continue;
  const target = path.resolve(root, ref.replace(/^\.\//, ''));
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) fail(`index.html reference missing: ${ref}`);
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const shellMatch = sw.match(/const SHELL\s*=\s*\[([\s\S]*?)\];/);
if (!shellMatch) fail('could not find service-worker SHELL precache list');
else {
  for (const match of shellMatch[1].matchAll(/['"]\.\/([^'"]+)['"]/g)) {
    const rel = match[1];
    if (rel.endsWith('/')) continue;
    if (!fs.existsSync(path.join(root, rel))) fail(`service-worker shell file missing: ${rel}`);
  }
}
// World chunks referenced in the world index must all exist.
const worldIndexPath = path.join(root, 'assets/world/index.json');
if (!fs.existsSync(worldIndexPath)) fail('assets/world/index.json is missing');
else {
  const worldIndex = JSON.parse(fs.readFileSync(worldIndexPath, 'utf8'));
  for (const chunk of worldIndex.chunks || []) {
    if (!fs.existsSync(path.join(root, 'assets/world', chunk.file))) fail(`world chunk missing: ${chunk.file}`);
  }
  if (!Array.isArray(worldIndex.chunks) || worldIndex.chunks.length === 0) fail('world index has no chunks');
}
// The generated ART array is part of mandatory service-worker precache. Verify every icon/sprite exists.
for (const name of ['tileset', 'kenney', 'adv', 'plants']) {
  const rel = `assets/tiles/${name}.png`;
  if (!fs.existsSync(path.join(root, rel))) fail(`tile art missing: ${rel}`);
}
const spriteArrayStart = sw.indexOf('.concat(["101"');
if (spriteArrayStart < 0) fail('could not find service-worker sprite precache list');
else {
  const listStart = sw.indexOf('[', spriteArrayStart);
  const listEnd = sw.indexOf('].map(n =>', listStart);
  if (listStart < 0 || listEnd < 0) fail('could not parse service-worker sprite precache array');
  else {
    const names = JSON.parse(sw.slice(listStart, listEnd + 1));
    for (const name of names) {
      const rel = `assets/sprites/${name}.png`;
      if (!fs.existsSync(path.join(root, rel))) fail(`sprite precache file missing: ${rel}`);
    }
  }
}
for (const rel of ['assets/tiles/adv.png', 'assets/tiles/plants.png', 'assets/world/atlas.json', 'assets/world/avatar.png', 'assets/world/props.png', 'assets/world/chars.png', 'assets/world/nature.png', 'assets/world/village.json']) {
  if (!fs.existsSync(path.join(root, rel))) fail(`optional world art missing: ${rel}`);
}
if (process.exitCode) process.exit(process.exitCode);
console.log(`PASS: checked ${refs.length} HTML refs, service-worker shell/assets and world chunk paths.`);
