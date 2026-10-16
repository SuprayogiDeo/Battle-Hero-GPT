# Hero Battle

Hero Battle adalah game 2D pixel-art untuk browser dengan pertarungan real-time, eksplorasi dunia, farming, crafting, pengembangan desa, dan progres yang tersimpan lokal. Antarmuka mobile dirancang untuk **orientasi landscape**.

> **Status rilis:** `0.4.8-rc.1` / cache `v73` — Tahap 8H+8I menambah tutorial milestone per topik yang tersimpan, menunggu aksi nyata tanpa memindahkan pemain, dan profiler FPS/JS heap opt-in (`?perf=1`). Fitur interior/layanan objek, papan biome/rute aman, farming, memancing, penebangan, dan penambangan tetap tersedia. Proyek tetap privat; deployment publik dilarang sampai gerbang lisensi dan tes HP selesai. Nilai yang belum ditetapkan bertanda `PLACEHOLDER`. `npm test` lulus, tetapi Chromium headless timeout sebelum menghasilkan DOM; angka FPS/memori runtime dan uji HP nyata belum tersedia. Izin distribusi aset pihak ketiga tetap perlu ditinjau sebelum publikasi.

## Jalankan secara lokal

Game adalah web statis; tidak perlu `npm install` untuk menjalankannya.

```bash
python -m http.server 8000
```

Buka <http://localhost:8000> di browser. Jangan membuka `index.html` langsung melalui `file://`; service worker dan beberapa fitur web memerlukan HTTP/HTTPS.

## Pengujian

Prasyarat pengujian: Node.js 20 atau lebih baru dan Python 3.10+.

```bash
npm test
```

Perintah tersebut memeriksa sintaks, referensi file statis, alur pemuatan skrip, penyimpanan/pemulihan, world/farming gesture/moisture, fishing/gathering, storage/workshop, regresi combat/boss, tutorial milestone, dan integritas kandidat.

Untuk mengukur sesi game secara langsung, tambahkan `?perf=1` pada URL lokal. Overlay menampilkan FPS saat ini, FPS rata-rata, dan JS heap jika browser mengekspos `performance.memory`. Angka hanya valid untuk perangkat/sesi yang diukur; profiler ini bukan pengganti pengujian HP nyata.

Untuk memperluas area dunia yang terlihat, tambahkan `?zoom=0.8` pada URL (nilai 0.5-0.99; tanpa parameter = tampilan normal). Zoom hanya berlaku pada lapisan dunia; HUD, menu, dan interior tidak berubah. Karena kanvas internal 640x360, nilai non-bulat membuat pixel art sedikit tidak rata; `?zoom=0.5` adalah satu-satunya nilai yang pas-piksel. Uji visual di HP nyata masih diperlukan sebelum dijadikan default.

CI GitHub Actions menjalankan tes yang sama ketika ada push atau pull request ke `main`/`master`. Pemeriksaan integritas release candidate juga memverifikasi konsistensi versi, service-worker cache, dan workflow GitHub Pages.

## Publikasikan ke GitHub Pages

1. Buat repositori GitHub dan unggah isi folder ini ke branch `main`.
2. Pastikan **publication checklist** pada [`docs/PUBLICATION_CHECKLIST.md`](docs/PUBLICATION_CHECKLIST.md) sudah ditinjau—terutama ketentuan distribusi aset pihak ketiga.
3. Buka **Settings → Pages**, pilih GitHub Actions jika diminta.
4. Jalankan workflow **Deploy GitHub Pages** secara manual dari tab **Actions** setelah siap memublikasikan.
5. URL Pages akan ditampilkan oleh GitHub setelah workflow berhasil.

Workflow deploy sengaja manual (`workflow_dispatch`) sehingga commit biasa tidak langsung membuat situs publik.

## Struktur repository

- `index.html` — entry point aplikasi.
- `js/` — kode gameplay, input, UI, world, save, PWA, combat, storage, crafting, peta dunia, dan dungeon.
- `assets/` — aset runtime dan data dunia yang digunakan game.
- `icons/`, `manifest.webmanifest`, `sw.js` — instalasi PWA dan offline cache.
- `tools/` — tes, generator aset/dunia, dan data desain.
- `docs/specification/` — spesifikasi induk Hero Battle (Markdown, PDF, DOCX).
- `docs/asset-catalog/` — katalog dan kontak lembar aset untuk referensi.
- `docs/implementation-history/` — catatan rilis/implementasi sebelumnya.
- `tools/archive/patches/` — patch-script historis; tidak diperlukan untuk menjalankan game.

## Status fitur

Implementasi meliputi dasar save dengan pemulihan, inventaris dan hadiah tertunda, farming/cuaca, produksi ternak offline terbatas, gudang material, bengkel crafting berantrean, mitigasi armor, refresh buff, pencatatan hadiah bos agar klaim utama tidak terulang, Journal dengan fokus tujuan, penemuan biome, hubungan penduduk persisten, resep dapur berbasis hubungan, achievement desa/pengolahan/eksplorasi, peta yang menghormati penemuan lokasi, waypoint tanpa teleport, serta dungeon Forest Ruins tiga ruangan dengan checkpoint dan hadiah utama satu kali.

Game **belum memenuhi seluruh spesifikasi induk**. Combat dan bos masih memerlukan balancing dan playtesting; waypoint belum berupa pathfinding otomatis; dungeon baru berupa loop tiga ruangan; dan sebagian integrasi quest/stage serta pengujian visual/sentuh perangkat nyata masih terbuka. Lihat [`docs/ROADMAP.md`](docs/ROADMAP.md) dan [`docs/RELEASE_CANDIDATE.md`](docs/RELEASE_CANDIDATE.md) untuk status acceptance dan tes manual yang masih diperlukan.

## Penyimpanan dan privasi

Progress disimpan secara lokal pada browser/perangkat. Belum ada akun atau sinkronisasi cloud. Menghapus data situs/browser dapat menghilangkan save lokal; sebelum pengujian, simpan cadangan data browser bila diperlukan.

## Hak cipta dan lisensi

Tidak ada lisensi open-source menyeluruh yang diterapkan pada seluruh repository ini. Kode dan aset pihak ketiga dapat memiliki ketentuan berbeda; jangan menganggap seluruh isi repository bebas digunakan ulang hanya karena ada di GitHub. Baca [`docs/LICENSE_AND_ASSETS.md`](docs/LICENSE_AND_ASSETS.md) sebelum membuat repositori atau deployment publik.

## Kredit

Kredit aset yang diketahui dicantumkan di [`CREDITS`](CREDITS). Pertahankan kredit tersebut jika aset terkait masih digunakan.
