# GitHub publication checklist

Use this checklist for the exact commit intended for upload/deployment. Automated tests do not replace the manual gates below.

## Automated checks

- [x] Batch 8H+8I candidate `0.4.6-rc.1` / cache `v54` ran `npm test`; tutorial/save and profiler regression groups pass.
- [x] Release-integrity test checks version/service-worker consistency, entry scripts in precache, workflow safeguards and accidental file exclusions.
- [x] Original asset-pack `.zip` files and `.aseprite` sources are not present in the repository bundle.
- [ ] Run `npm test` again on the exact commit intended for review/publication (current worktree tests do not certify an unseen future commit).
- [ ] Test service-worker update/old-cache cleanup in a real browser before any public release.
- [ ] Record actual FPS/average FPS and JS heap (or mark unsupported) via `?perf=1` in a real browser; test menu, world idle, farming, combat, and interior for at least 60 seconds each. Automated profiler math tests use synthetic timestamps/heap and are not game performance measurements.

## Must resolve before public source/deployment

- [ ] Review `docs/LICENSE_AND_ASSETS.md` and confirm public source distribution of the derived Sunnyside World files is allowed, or replace/exclude the affected assets first.
- [ ] Check `CREDITS` for all third-party assets and preserve notices.
- [ ] Decide whether to license original code; do not apply a blanket open-source license to third-party artwork.
- [ ] Do not run **Deploy GitHub Pages** publicly until asset-license and device-test gates have passed. This is an explicit release blocker, not a recommendation.

## Manual device and hosting validation

- [ ] Test the game over HTTP/HTTPS, not `file://`.
- [ ] Verify landscape layout, touch target size, joystick, combat input, overlays, and screen exits on at least one real mobile browser.
- [ ] Verify tutorial topic status/phase survive reload, completed topics do not reappear, tutorial waits for the actual action, and player coordinates never change because of tutorial progression.
- [ ] Verify locked requirements appear as a short 2–3 second toast on attempted action, without a large lock overlay.
- [ ] Exercise `?perf=1` and capture FPS/JS heap per screen; mark the memory result unavailable rather than guessing if `performance.memory` is not exposed.
- [ ] Verify GitHub Pages subpath routing after deployment; references should remain relative to the repository URL.
- [ ] Test save recovery after reload/tab close and verify that no progress/reward is duplicated.
- [ ] Check that no save files, credentials, private source packs, or machine-specific paths have been committed.
- [ ] Back up local saves before destructive testing.

See [`RELEASE_CANDIDATE.md`](RELEASE_CANDIDATE.md) for `0.4.6-rc.1`, the current profiler instructions, and remaining manual gates. The game remains private.
