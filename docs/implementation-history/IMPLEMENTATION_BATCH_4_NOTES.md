# Hero Battle — Implementation Batch 4: Combat & Boss Foundations

**Status:** implemented in a separate working copy; source packages remain untouched.
**Service-worker cache:** `v44`.
**Roadmap:** P6 is in progress, not complete.

## Changes

- Armor retains its HP bonus and now also reduces incoming damage based on its item value. Mitigation is capped at 25%; the equipment detail panel shows the reduction.
- Timed team attack buffs use an explicit replacement/refresh helper. Applying a new timed buff replaces the active modifier and duration; the modifiers do not multiply-stack.
- Main-stage and tower bosses expose a dedicated HP bar and phase label while alive. Crossing 50% HP triggers one phase-transition announcement per boss instance. Existing boss-specific attack patterns and telegraph timers are retained.
- A persistent `bossClaims` ledger tracks once-only Main Stage boss rewards. Older saves migrate claimed boss stages from `stageClaims`, so previously claimed primary rewards are not accidentally granted again. Stage select labels previously-cleared boss stages as replayable. Main Stage replay remains reduced to 35% gold and does not repeat the primary stage/boss bonus.
- Service worker cache moved from `v43` to `v44`.

## Tests run

- `node --check` on every `js/*.js` and `sw.js`.
- `node tools/test_browser_smoke.js`: checks script load order, rewards/replay, inventory overflow, retry checkpoint, storage/workshop, and new P6 combat/boss cases.
- `node tools/test_stage2_batch.js`.
- `node tools/test_save_recovery.js`.
- `node tools/test_life_logic.js`.
- `python tools/test_7defg.py`.

## Remaining limitations

- P6 is only partially implemented; this does not claim the entire combat spec is done. Real-device visual playtesting has not been completed.
- Stamina as a separate resource, full attack/skill balance, boss fairness over all team compositions, and complete end-to-end touch-control acceptance remain open.
- Gear defense values and phase threshold (50%) are prototype values and should be tuned after playtesting.
