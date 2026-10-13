# Hero Battle roadmap status

Roadmap baseline: 11 phases, `P0`–`P10`. Phase status describes acceptance work, not the number of patches; some prior phases retain open items.

| Phase | Status after Batch 6 | Remaining acceptance |
|---|---|---|
| P0 — Baseline audit | Initial audit completed | Reconfirm repository state before major refactors |
| P1 — HUD and controls | Partial | Physical-device landscape, touch targets, input pass-through, UI scale tests |
| P2 — Save/storage/transactions | Partial; chest, pending rewards, workshop safeguards integrated | Full capacity edge cases and browser persistence/manual validation |
| P3 — Farming/weather | Core partial | Visual feedback and wider crop/tool regressions |
| P4 — Offline production | Animal production uses bounded 24h catch-up | Extend/verify all processing stations and edge cases |
| P5 — Economy/crafting/settings | Partial; material store, workbench queue and resident recipes integrated | Price balancing, recipe breadth, full transaction/UI acceptance |
| P6 — Combat/equipment/bosses | Foundations integrated | Skill/stamina balance, enemy fairness, dungeon boss playtest and touch QA |
| P7 — Exploration/dungeons/stage flow | Expanded in Batch 6; map waypoints and 3-room dungeon integrated | Actual route/pathfinding, content variety, map appearance and all checkpoint edge cases |
| P8 — Quests/NPC relationships/Journal/map | Journal/friendship integrated; world map now supports discovery-gated waypoints | Full quest lifecycle and end-to-end route/quest validation |
| P9 — Achievements/content integration | Core categories integrated | Audit all conditions and rewards, consistency/balance and migration QA |
| P10 — Balancing and final QA | Not complete | Physical-device visual pass, regression/performance, license review and publish checklist |

Batch 6 adds a functional first dungeon loop and world-map waypoint system, but does not finish every system in the master specification. Values that are not playtested remain prototype defaults. Automated tests do not replace visual/touch QA on real devices.
