# Implementation Batch 7 — Release Candidate Hardening

**Bundle:** `0.4.0-rc.1`  
**Service worker cache:** `v47`  
**Purpose:** freeze a reproducible GitHub-ready candidate and strengthen release acceptance checks without claiming the uncompleted features or manual tests are complete.

## Delivered

- Synchronized `package.json`, `VERSION`, changelog, active README and service-worker cache version.
- Added `tools/test_release_integrity.js` to check version consistency, entry-point script precaching, PWA manifest icon/relative-path configuration, GitHub Pages staging assumptions, manual/test-gated deployment, asset licensing gates and accidental inclusion of source packs/secrets/save files.
- Wired release integrity into `npm test` and therefore into the existing GitHub Actions CI workflow.
- Added a release-candidate manual acceptance guide and refreshed the active roadmap/checklist.
- Kept the GitHub Pages deploy workflow manual (`workflow_dispatch`) and test-gated; no site was published by this work.

## Tests run on the candidate

`npm test` passed all suites:

- JavaScript syntax: 29 files.
- Static references, service-worker assets and world chunks: pass.
- Script-loading smoke test and integrated storage, workshop, combat, boss, journal, NPC relationship, dungeon and waypoint regressions: pass.
- Save recovery, life-system, offline production, crop/weather regressions: pass.
- Release integrity: versions aligned at `0.4.0-rc.1` / `v47`, 28 entry scripts precached, relative PWA paths checked, Pages staging file set checked, publication blockers documented, and no asset-pack archives/source Aseprite files/secret/local save files packaged.
- World/data regression: pass.

A local HTTP smoke check returned HTTP 200 for `/`, `index.html`, `manifest.webmanifest`, `sw.js`, core entry scripts, `assets/world/index.json`, and the PWA icon.

## Limits and release blockers

- Chromium headless did not start successfully in the execution environment, including a minimal `about:blank` attempt. No visual rendering or touch test is claimed from that attempt.
- Mobile landscape, touch input, overlays, save/reload, and real GitHub Pages subpath behaviour still need manual verification.
- The public redistribution status of the derived Sunnyside World source artwork has not been confirmed. Keep public repository/deployment disabled until the asset terms are resolved or the affected assets are replaced/excluded.
- Combat balancing, dungeon variety/pathfinding and acceptance work across P1–P10 are not complete. `docs/ROADMAP.md` is the authoritative active status.

## Outcome

Batch 7 is a release-candidate hardening pass, **not a final public release certification**. This package passed automation and local HTTP availability checks; it still requires the explicit manual and licensing gates listed in `docs/RELEASE_CANDIDATE.md` and `docs/PUBLICATION_CHECKLIST.md`.
