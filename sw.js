// Hero Battle service worker. Naikkan VERSION setiap kali Anda mengganti file game.
const VERSION = 'v68';
const CACHE = 'hero-battle-' + VERSION;
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  // kode game (urutan pemuatan diatur di index.html)
  './js/assets.js',
  './js/audio.js',
  './js/save.js',
  './js/data.js',
  './js/progress.js',
  './js/autogear.js',
  './js/modes.js',
  './js/combat.js',
  './js/hero-icons.js',
  './js/ai.js',
  './js/manual.js',
  './js/anim.js',
  './js/tilemap.js',
  './js/world.js',
  './js/farm.js',
  './js/ranch.js',
  './js/npc.js',
  './js/i18n.js',
  './js/settings.js',
  './js/render.js',
  './js/screens.js',
  './js/life.js',
  './js/storagecraft.js',
  './js/journal.js',
  './js/adventure.js',
  './js/interior.js',
  './js/hud.js',
  './js/input.js',
  './js/pwa.js',
  './js/boot.js',
  // Data dan atlas dunia diperlukan agar dunia chunk bisa dirender bahkan saat offline.
  './assets/world/index.json',
  './assets/world/atlas.json',
  './assets/world/chars.png',
  './assets/world/ui.png',
  './assets/world/items.png',
  './assets/world/tiles.png',
  './assets/world/sprites.png',
  './assets/world/sea.png'
];

// Gambar sprite & tileset: wajib ada supaya game tampil, jadi ikut di-precache.
const ART = ['tileset','kenney'].map(n => './assets/tiles/' + n + '.png')
  .concat(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "125", "126", "127", "128", "129", "130", "131", "g1", "g2", "g3", "g4", "h0", "h1", "h10", "h11", "h12", "h13", "h14", "h15", "h16", "h17", "h18", "h19", "h2", "h20", "h21", "h22", "h23", "h24", "h25", "h3", "h4", "h5", "h6", "h7", "h8", "h9"].map(n => './assets/sprites/' + n + '.png'));

// Opsional: bila file tidak ada di hosting, instalasi tetap berhasil (dunia memakai warna polos sebagai cadangan).
const ART_OPT = ['adv','plants'].map(n => './assets/tiles/' + n + '.png')
  .concat(['avatar.png','props.png','nature.png','village.json','interior.png','interior.json','hud.png','hud.json'].map(n => './assets/world/' + n)); // Aset tambahan opsional Sunnyside World

// Audio disimpan sejak awal supaya musik dan efek suara langsung jalan saat offline.
// Dicoba satu per satu: bila ada file yang tidak ada, instalasi tetap berhasil.
const AUDIO = ['arrow','arrowhit','fire','explode','sword','slash','spear','ice','dark','poison','heal','shield','magic','hurt','kill','portal','coin','click','hit','cast','clear','slam','parry','limit','boss','title','battle']
  .map(n => './audio/' + n + '.ogg');

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL.concat(ART).map(u => new Request(u, { cache: 'reload' }))).then(() => Promise.allSettled(ART_OPT.concat(AUDIO).map(u => c.add(new Request(u, { cache: 'reload' })))))
        .then(() => c.match('./assets/world/index.json'))
        .then(r => { if (!r) throw new Error('World index missing from precache'); return r.json(); })
        .then(idx => { if (!idx.chunks || !idx.chunks.length) throw new Error('World chunk list is empty'); return c.addAll(idx.chunks.map(ch => new Request('./assets/world/' + ch.file, { cache: 'reload' }))); }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('hero-battle-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // dev.js (alat uji, hanya dengan ?dev=1) tidak pernah lewat cache.
  if (url.pathname.endsWith('/js/dev.js')) return;

  // Halaman: ambil versi terbaru dulu, jatuh ke cache saat offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Aset lain (audio/*.ogg, ikon): cache dulu, simpan otomatis saat pertama kali diunduh.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
