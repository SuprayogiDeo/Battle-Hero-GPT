# Hero Battle — Implementation Batch 2

**Release:** Stage 9 / Implementation Batch 2  
**Service worker cache:** `v42`  
**Scope:** Combined implementation work across storage/reward safety, farming/weather, ranch/offline production, save normalization, and accessibility/settings polish.

## How many stages are planned?

The roadmap is numbered **P0–P10**, which is 11 planning phases in total:

- **P0:** baseline audit and architecture inventory.
- **P1:** input, HUD, and control foundation.
- **P2:** storage, save safety, reward integrity, and transactions.
- **P3:** farming and contextual weather interactions.
- **P4:** bounded offline production.
- **P5:** equipment/economy transaction safety and settings/accessibility.
- **P6:** combat, enemies, bosses, equipment/buffs, and defeat flow.
- **P7:** world exploration, area/dungeon progression, and stage continuity.
- **P8:** quest, NPC relationships, unlocks, Journal, and world map.
- **P9:** achievements, quality-of-life polish, and content integration.
- **P10:** balancing, regression testing, and acceptance checks.

This release intentionally bundles several compatible workstreams instead of waiting for one small phase per package. **The roadmap is not yet fully implemented**; several large systems in the master specification remain future work. Stage 1 contains the first save/reward/checkpoint fixes. This batch extends that foundation.

## Changes in this batch

### 1. Inventory and reward consistency

- `ITEM_STORAGE.bag` is now the shared source of truth for bag capacity across inventory UI, pending reward actions, new-run notices, and equipment purchases.
- Temporary pending equipment/reward storage remains bounded by `ITEM_STORAGE.temporary`.
- Claim-one/claim-all actions require actual free capacity. Items are not silently auto-sold.
- Older saves with unexpected container shapes receive safe array defaults. Existing over-capacity items are not truncated during migration, avoiding silent data loss.
- Existing transaction guards continue to block a pull before gold, tickets, or pity counters are consumed when main-bag capacity is insufficient.

### 2. Farming and weather

- Rain/storm auto-waters eligible hoed plots and growing crops once per watering cycle.
- Watering gives the defined 15% growth-time advance to a growing crop; a plot cannot repeatedly receive the same cycle bonus.
- Wet, empty soil has a visual marker and label so the player can tell that it is ready for planting with the watering bonus.
- Farm help text reflects current rain/storm conditions instead of always saying that rain is active.

### 3. Ranch and offline production

- Feeding keeps an animal's production window active for 24 hours after the feeding action rather than resetting at local midnight. This reduces dependence on a daily login schedule.
- Offline production catch-up is capped at 24 hours.
- Output caps are recorded against the actual calendar date on which each product should mature, including across midnight.
- If an animal's pending-product queue is full, the next-product timestamp is held rather than silently advanced and discarded.
- Ranch UI text describes the 24-hour feed window and offline cap.

### 4. Settings and compatibility

- Saved settings are normalized to known ranges when loading older or malformed settings values.
- The control-size option is labelled more precisely as touch-control size.
- New interface messages are mapped for English mode.
- Service worker cache version advanced to `v42` so clients do not keep stale JavaScript from the preceding batch.

## Validation performed

The following checks passed on the packaged project:

- `node tools/test_stage2_batch.js`
- `node tools/test_save_recovery.js`
- `node tools/test_life_logic.js`
- `node tools/test_browser_smoke.js`
- `python tools/test_7defg.py`
- `node --check` on all `js/*.js` modules and `sw.js`
- Static check confirming primary inventory-capacity comparisons use `ITEM_STORAGE.bag` rather than the old hardcoded capacity.

The browser smoke test loads all **25 browser scripts** in their declared order in a mocked browser environment and runs progression/checkpoint/inventory assertions. It is not equivalent to a full interactive visual play test.

## Not yet completed from the master specification

- Full chest/storage infrastructure for arbitrary materials and multi-container transfers.
- General crafting/workbench recipe and timed-processing pipeline beyond the current cooking/processing features.
- Full persistent quest Journal and focus-navigation integration, beyond the current daily quests and village story/order systems.
- Complete NPC relationship progression with reward tiers.
- Full main-stage/dungeon content and encounter balancing against the final agreed combat/equipment system.
- A real browser/device visual pass covering touch hitboxes, landscape enforcement, responsive layout, all panel pause rules, and mobile audio/vibration behaviour.

## Safety and source handling

- This package is a new implementation copy. The previous source package and the original library archives are not overwritten.
- Changes are limited to code/assets/tests in this working copy. The project's real-browser visual behavior remains to be checked before treating the release as production-ready.
