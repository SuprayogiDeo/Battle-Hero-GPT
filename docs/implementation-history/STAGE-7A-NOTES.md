Tahap 7A - chunk world

- World index: assets/world/index.json (128x96, chunk 32x32, spawn/building/NPC metadata global).
- Chunk JSON: assets/world/chunks/cX_Y.json; each stores local ground/shadow/decor/over/collision, objects, biome.
- Renderer requests radius 2 chunks, caches at most 36 chunk canvases, and uses per-chunk snow variants. Canvas chunk dimensions max 512x512; no world-sized canvas.
- Generator: python tools/build_world.py --width 128 --height 96 [--chunk 32]. The source village is kept intact and its relative coordinates are preserved.
- Service worker version: v32; index and all indexed chunk files are precached during install for offline use.

Validation: generated JSON and JavaScript syntax checked. Chromium headless visual/gameplay smoke test was not completed in this environment; mobile-device behavior has not been tested.
