# Hero Battle — Implementation Batch 3: Gudang Material & Bengkel

**Status:** Implemented in a separate working copy; source archives are unchanged.  
**Service worker cache:** `v43`  
**Roadmap:** This batch completes additional work under P2 (storage and transaction safety) and P5 (economy/crafting foundations). It does not mark either phase entirely complete.

## 1. New material storage

- Added a persistent material bag and a separate chest (`S.materialStorage`) that are migrated safely for old saves.
- Material bag capacity is currently a **provisional tuning value**: 60 units at Village Level 1, increasing by 15 per village level to 120.
- Chest capacities are **provisional tuning values**: Level 1 = 100 units, Level 2 = 180, Level 3 = 300.
- Upgrade Level 1 → 2 requires Village Level 2, 160 gold, 8 wood, and 4 stone.
- Upgrade Level 2 → 3 requires Village Level 4, 360 gold, 16 wood, and 12 stone.
- Supports manual transfer of 1, 5, or all units per material between bag and chest. Capacity is validated before transferring; no transfer silently deletes resources.
- Materials placed in the chest remain eligible for village upgrades, orders, and recipes. Consumption draws from the bag first, then the chest.
- Resource gathering is blocked before the new material would exceed the material-bag capacity; the player is instructed to use storage.
- Currently included material IDs: wood, stone, herb, mushroom, fruit, plank, stone brick, rope, and forest tonic. Fish, ranch products, and crop food retain their existing specialized inventories; a unified chest for every item category is still future work.

## 2. Workshop and timed processing

- Added four starter recipes: wood planks, stone bricks, fiber rope, and forest tonic.
- Recipe times are provisional tuning defaults (30–60 seconds).
- Queue capacity is three jobs. Completed, unclaimed jobs continue to occupy a slot, making the output visible and preventing silent loss.
- The ingredient and output-space checks happen before ingredients are consumed.
- One output unit is reserved in the material bag when a job starts. Gathering and taking materials from the chest account for those reservations, avoiding overfilling the bag while jobs are pending.
- Jobs use persisted start/ready timestamps, so closing the game does not reset a timer. On reopening, completed outputs remain in the queue until claimed.
- If a legacy save or externally altered state leaves no output capacity, claiming is blocked and the output remains in the workshop.
- Workshop access is available from the world quick menu and the village workshop building when unlocked.

## 3. Integration and compatibility

- Added `js/storagecraft.js` after `js/life.js` in `index.html`.
- Updated `js/life.js` village quick menu to expose Material Storage and Workshop/Processing.
- Changed the unlocked workshop building interaction to open the new workshop screen.
- Added `js/storagecraft.js` to the service worker shell and increased cache version to `v43`.
- Existing food recipes/orders/upgrades can see and consume the supported raw materials across bag + chest without changing their current reward model.

## 4. Tests run

All following tests passed on this package:

- `node tools/test_stage2_batch.js`
- `node tools/test_save_recovery.js`
- `node tools/test_life_logic.js`
- `node tools/test_browser_smoke.js`
- `python tools/test_7defg.py`
- `node --check` for every `js/*.js` file and `sw.js`

The browser smoke test now loads 26 scripts and exercises chest transfers, material availability across containers, chest-upgrade validation, crafting reservations, ready-job claiming, no-consumption failure paths, and queue limits.

## 5. Not yet proven

- No full interactive visual test on a real mobile browser has been completed in this batch. Canvas layout, touch hitboxes, and navigation should still be manually checked in portrait/landscape devices.
- Timings, capacities, and upgrade costs above are prototype defaults, not final balance decisions.
- This is not the complete master specification. The following remain substantially unfinished: comprehensive unified item storage, full recipe catalogue and processing stations, complete combat/boss balance, dungeon and Main Stage content, persistent quest Journal/focus navigation, NPC friendship tiers, achievement integration, full mobile-device visual acceptance, and final regression/balance pass.

---

# 11-phase roadmap status

The roadmap uses `P0` through `P10`: **11 phases total**. Progress is tracked by scope, not by how many ZIPs have been issued. An item being touched does not mean all acceptance criteria for that phase are complete.

| Phase | Main scope | Status after Batch 3 |
|---|---|---|
| P0 | Baseline audit and architecture inventory | **Initial audit done** against the packaged project, notes, and automated tests; not a full visual audit |
| P1 | Input, HUD, control foundations | **Partial** — existing HUD/control work plus prior settings/orientation improvements; device acceptance remains |
| P2 | Storage, save safety, reward integrity, transactions | **Partial, expanded this batch** — save backup, overflow inbox, material chest, bounded transfers and transaction guards exist; unified storage for every item type remains |
| P3 | Farming and contextual weather | **Core partial implementation** — rain/storm auto-watering and once-per-cycle bonus; swipe-across-plots acceptance remains |
| P4 | Bounded offline production | **Core partial implementation** — ranch catch-up capped at 24 hours; complete offline simulation of every production station is not yet unified |
| P5 | Equipment/economy transaction safety and settings | **Partial, expanded this batch** — pull/claim guards, settings normalization, starter timed recipes; full economic balance and all crafting stations remain |
| P6 | Combat, enemies, bosses, equipment/buffs, defeat flow | **Not complete against master spec** — baseline combat exists, but agreed real-time/AI/boss/equipment acceptance still needs full audit and work |
| P7 | World exploration, dungeon, stage continuity | **Partial prototype exists** — chunked world/resources/buildings are present; full dungeon/main-stage flow remains |
| P8 | Quests, NPC relationships, unlocks, Journal, map | **Partial** — daily/village orders and NPC functions exist; complete persistent Journal, relationship tiers, and focus navigation remain |
| P9 | Achievements, QoL polish, content integration | **Partial/needs audit** — existing menus and settings exist; final integration is outstanding |
| P10 | Balance, regression, and acceptance | **Not complete** — automated suite passes, but visual device playtest and final balancing remain |

### How many phases remain?

- **5 major numbered phases remain ahead in the roadmap: P6–P10.**
- Earlier phases P1–P5 have already received implementation work, but **P1–P5 are not all complete**; remaining acceptance tasks in those phases must be finished alongside the later work.
- Next recommended batch: complete the remaining P2/P5 interfaces (full storage categories and consistent processing), then tackle P6 combat acceptance, followed by P7–P10.
