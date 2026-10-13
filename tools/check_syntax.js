#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const jsDir = path.join(root, 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort().map(f => path.join(jsDir, f));
files.push(path.join(root, 'sw.js'));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `Syntax check failed: ${file}\n`);
    process.exit(result.status || 1);
  }
}
console.log(`PASS: syntax checked ${files.length} JavaScript files.`);
