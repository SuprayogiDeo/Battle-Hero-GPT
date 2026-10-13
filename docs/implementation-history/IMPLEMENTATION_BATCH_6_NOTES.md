# Implementation Batch 6 — World Map & Dungeon Integration

**Bundle:** 0.3.0  
**Service worker cache:** v46  
**Scope:** continue from GitHub Ready v2; does not overwrite previous source archives.

## Included

- Discovery-respecting world-map overlay. The five primary biome regions remain visible; tile terrain detail and point-of-interest markers display only when the tile is discovered.
- Map tap selects a known walkable waypoint, stored under `S.journal.waypoint`; world HUD shows relative bearing/distance. This is a compass cue, not automatic pathfinding or teleportation.
- Legacy world saves with `disc='*'` migrate to the explored radius at their current position after the larger world map is ready.
- Adventure gate now has separate Main Stage, Dungeon, Daily Tower, and Cancel choices.
- Forest Ruins dungeon: three rooms, final-room boss, saved room checkpoint, retry at the current room after defeat, return to the village, room repeat reward reduction, and one-time primary final reward.
- Persistent `S.dungeons` data tracks room clears, current checkpoint, total clears, losses, active run and last result.
- Added test coverage for dungeon room checkpoint movement, separation from main-stage claims, repeat rewards, once-only primary essence, total-result persistence, and discovered waypoint rules.

## Automated validation

`npm test` passes including 29 JavaScript syntax checks, 32 static path references, 28 browser scripts loaded, existing save/storage/farming/ranch/combat/journal tests, Batch 6 dungeon and map tests, and world asset/service-worker cache checks.

## Known limits

- Map waypoint is an approximate direction/distance marker, not full obstacle-aware pathfinding.
- The world map uses a canvas-discovery cache and has only been exercised in automated canvas shims here; visual/contrast checks are still needed on a real mobile browser.
- Dungeon currently has three rooms and uses the existing battle engine; it is a first complete loop, not the full variety of planned dungeons, puzzle mechanics, all biome events or stage branching.
- Balance values (room-gold, primary loot and unlock threshold) are prototype defaults pending playtesting.
- Do not call this final release until physical-device landscape controls, visual rendering, asset licensing, and P0–P10 acceptance items are closed.
