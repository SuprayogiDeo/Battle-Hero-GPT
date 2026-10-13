# Hero Battle — Batch 5: Journal, Resident Bonds, and Progress Integration

**Runtime cache:** `v45`  
**Purpose:** add the first integrated Journal/focus flow and persistent resident relationships without replacing the existing daily quests, achievements, or village orders.

## Changes

- Added `js/journal.js`, loaded after `storagecraft.js` and before `input.js`, and precached it in `sw.js`.
- Added a fourth `JURNAL / JOURNAL` tab to the existing quest/achievement/village-order screen.
- Journal can focus the next Main Stage, a daily quest, the village story, or the next available resident order. The world HUD shows the focused objective and short instruction.
- Added first-visit tracking for the five recognized biomes. Repeat visits do not repeat the discovery award/toast.
- Added persistent resident relationship points, tiers, no-decay/offline behavior, one counted conversation per resident per day, and relationship gains from successful village order/story/village upgrade actions.
- Relationship tier rewards are recorded in a per-resident ledger and therefore cannot be claimed twice. NPC story lines appear at relationship milestones.
- Added two kitchen recipes unlocked at tier 2 relationship with the Cook or Farmer. The kitchen was compacted to show the extra recipes without placing interaction buttons beyond the 360px canvas.
- Expanded achievements with village level, crafting outputs, caught fish, biome discovery, and befriended residents; achievement rows use a compact layout to remain within the landscape canvas.
- Added English translations for the new Journal, relationship, recipe, and achievement labels.
- Updated runtime service-worker cache to `v45`.

## Automatic validation

`npm test` passed all available suites after the changes. Coverage includes syntax and static paths, script-load smoke tests, stage rewards/save recovery, material storage/workshop, combat/boss, farming/weather, animal offline production, Journal focus, relationship tier reward idempotency, relationship-gated recipes, first-time biome discovery, and world data integrity.

## Remaining caveats

- Full dungeon loop, navigable world map with routefinding, and all Main Stage/world transitions remain incomplete.
- P1 real-device touch/layout acceptance and P10 visual/performance acceptance are still pending.
- Relationship tier thresholds and recipe balance are prototype defaults and need playtesting.
- This is not a declaration that the full master specification is complete.
