#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const refsFromHTML = source => [...source.matchAll(/(?:src|href)=[\"']([^\"']+)[\"']/g)].map(m => m[1]);

const pkg = JSON.parse(read('package.json'));
const versionText = read('VERSION');
const sw = read('sw.js');
const html = read('index.html');
const changelog = read('CHANGELOG.md');
const readme = read('README.md');
const licenseNotice = read('docs/LICENSE_AND_ASSETS.md');
const pubChecklist = read('docs/PUBLICATION_CHECKLIST.md');
const rcGuide = read('docs/RELEASE_CANDIDATE.md');
const ci = read('.github/workflows/ci.yml');
const pages = read('.github/workflows/pages.yml');
const manifest = JSON.parse(read('manifest.webmanifest'));
const specification = read('docs/specification/Hero_Battle_Spesifikasi_Induk_v1.md');
const tutorialCode = read('js/progress.js');

assert.match(pkg.version, /^\d+\.\d+\.\d+-rc\.\d+$/, 'package version should identify a release candidate');
assert.match(versionText, new RegExp(`repository bundle: ${pkg.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), 'VERSION and package.json versions must match');
const swMatch = sw.match(/const VERSION\s*=\s*['"](v\d+)['"]/);
assert.ok(swMatch, 'service-worker cache version is declared');
assert.match(versionText, new RegExp(`Runtime service-worker cache: ${swMatch[1]}`), 'VERSION and service worker cache must match');
assert.match(changelog, new RegExp(`^## Batch 9[AB][^\n]*${swMatch[1]}`, 'm'), 'changelog has a current entry for this cache version');
assert.match(readme, new RegExp(pkg.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'README describes the current candidate');
assert.equal(manifest.orientation, 'landscape', 'PWA manifest declares the required mobile orientation');
assert.equal(manifest.start_url, './', 'PWA start URL remains relative for GitHub Pages repository subpaths');
assert.equal(manifest.scope, './', 'PWA scope remains relative for GitHub Pages repository subpaths');
for (const icon of manifest.icons || []) {
  assert.ok(!icon.src.startsWith('/'), `PWA icon path must be relative: ${icon.src}`);
  assert.ok(fs.existsSync(path.join(root, icon.src)), `PWA icon exists: ${icon.src}`);
}

// Every external script that the HTML boot sequence loads must also be offline-pre-cached.
const scripts = [...html.matchAll(/<script\s+src=["']([^"']+)["']/g)].map(m => m[1]);
const shellMatch = sw.match(/const SHELL\s*=\s*\[([\s\S]*?)\];/);
assert.ok(shellMatch, 'service worker has a shell precache array');
const shellPaths = new Set([...shellMatch[1].matchAll(/["']\.\/([^"']+)["']/g)].map(m => `./${m[1]}`));
for (const src of scripts) {
  assert.ok(src.startsWith('./') || !/^[a-z]+:/i.test(src), `script reference should be relative to support GitHub Pages subpaths: ${src}`);
  const rel = src.startsWith('./') ? src : `./${src}`;
  assert.ok(fs.existsSync(path.join(root, rel)), `entry point script exists: ${src}`);
  assert.ok(shellPaths.has(rel), `script is included in service-worker shell cache: ${rel}`);
}

// GitHub Pages deployment must remain explicit, test-gated and subpath-safe.
assert.match(ci, /node-version:\s*20/, 'CI uses supported Node.js version');
assert.match(ci, /run:\s*npm test/, 'CI runs the same complete test command as local development');
assert.match(pages, /workflow_dispatch:/, 'public deployment is manually triggered');
assert.match(pages, /run:\s*npm test/, 'Pages deployment tests the candidate before packaging');
assert.match(pages, /cp -R js assets icons _site\//, 'Pages staging includes runtime code, assets and icons');
assert.match(pages, /touch _site\/\.nojekyll/, 'Pages staging disables Jekyll processing');
assert.match(pages, /upload-pages-artifact/, 'Pages workflow uploads the staged static game');

// Simulate the staging copy performed by the Pages workflow and validate the deployable payload.
const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hero-battle-pages-stage-'));
try {
  for (const rel of ['index.html', 'manifest.webmanifest', 'sw.js', 'CREDITS']) {
    fs.copyFileSync(path.join(root, rel), path.join(stageDir, rel));
  }
  for (const rel of ['js', 'assets', 'icons']) {
    fs.cpSync(path.join(root, rel), path.join(stageDir, rel), { recursive: true });
  }
  fs.writeFileSync(path.join(stageDir, '.nojekyll'), '');
  for (const ref of refsFromHTML(fs.readFileSync(path.join(stageDir, 'index.html'), 'utf8'))) {
    if (/^(?:https?:|data:|#|\/\/)/i.test(ref) || ref === './' || ref === '') continue;
    assert.ok(fs.existsSync(path.join(stageDir, ref.replace(/^\.\//, ''))), `staged Pages file exists: ${ref}`);
  }
  const stagedManifest = JSON.parse(fs.readFileSync(path.join(stageDir, 'manifest.webmanifest'), 'utf8'));
  for (const icon of stagedManifest.icons || []) assert.ok(fs.existsSync(path.join(stageDir, icon.src)), `staged PWA icon exists: ${icon.src}`);
  for (const match of shellMatch[1].matchAll(/[\"']\.\/([^\"']+)[\"']/g)) {
    const rel = match[1];
    if (!rel.endsWith('/')) assert.ok(fs.existsSync(path.join(stageDir, rel)), `staged service-worker shell file exists: ${rel}`);
  }
  assert.ok(fs.existsSync(path.join(stageDir, '.nojekyll')), 'Pages staging marker exists');
} finally {
  fs.rmSync(stageDir, { recursive: true, force: true });
}

// Ensure publication blockers are deliberately documented instead of accidentally omitted.
assert.ok(fs.existsSync(path.join(root, 'docs/PUBLICATION_CHECKLIST.md')));
assert.ok(fs.existsSync(path.join(root, 'docs/RELEASE_CANDIDATE.md')));
assert.ok(fs.existsSync(path.join(root, 'docs/implementation-history/IMPLEMENTATION_BATCH_7_NOTES.md')));
assert.match(licenseNotice, /Sunnyside World/i);
assert.match(licenseNotice, /Before making this repository public or deploying it/i);
assert.match(pubChecklist, /real mobile browser/i);
assert.match(rcGuide, /Jangan jalankan workflow.*sampai gate lisensi/i);
assert.match(specification, /Hasil silang implementasi kandidat `0\.4\.6-rc\.1`/i, 'specification section 13 records an implementation consistency audit');
assert.match(tutorialCode, /status:'belum'/);
assert.match(tutorialCode, /phase='penanda'/);
assert.match(pubChecklist, /actual FPS\/average FPS and JS heap/i, 'publication checklist requires real runtime profiling');
assert.match(rcGuide, /\?perf=1/);
assert.match(rcGuide, /BELUM DIUKUR \(PLACEHOLDER\)/);
assert.match(pubChecklist, /Do not run \*\*Deploy GitHub Pages\*\* publicly until asset-license and device-test gates have passed/i, 'public deployment is blocked until manual gates pass');

// Guard against accidentally packaging original/source asset bundles or local save/secret files.
const forbidden = [];
function walk(dir, rel = '') {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = ent.name;
    if (name === '.git' || name === 'node_modules' || name === '_site') continue;
    const childRel = rel ? `${rel}/${name}` : name;
    const full = path.join(dir, name);
    if (ent.isDirectory()) walk(full, childRel);
    else {
      if (/\.(?:aseprite|zip)$/i.test(name)) forbidden.push(childRel);
      if (/(^|\/)\.env(?:\..*)?$/i.test(childRel)) forbidden.push(childRel);
      if (/(?:^|\/)(?:id_rsa|credentials\.json|secrets\.json)$/i.test(childRel)) forbidden.push(childRel);
      if (/\.(?:save\.json|local-save\.json)$/i.test(name)) forbidden.push(childRel);
    }
  }
}
walk(root);
assert.deepEqual(forbidden, [], `repository must not package source packs, secrets, or local saves: ${forbidden.join(', ')}`);

// A generic root LICENSE would imply a blanket license over third-party art; the repo instead uses a scope note.
assert.ok(fs.existsSync(path.join(root, 'CREDITS')));
assert.ok(fs.existsSync(path.join(root, 'docs/LICENSE_AND_ASSETS.md')));

console.log(`PASS: release integrity for ${pkg.version}/${swMatch[1]} — versions aligned, ${scripts.length} entry scripts precached, Pages workflow test-gated/manual, license gates documented, and no source asset archives/secrets/local saves packaged.`);
