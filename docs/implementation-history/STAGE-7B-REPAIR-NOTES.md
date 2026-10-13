# Hero Battle — Perbaikan Tahap 7A/7B

## Perbaikan inti

- Renderer chunk memakai `assets/world/index.json` dan chunk `assets/world/chunks/cX_Y.json`; ukuran awal 128×96 tile, 32×32 tile per chunk.
- Generator `tools/build_world.py` membaca layout dari `tools/world_design.json`, mempertahankan koordinat desa sumber (kecuali jembatan sambungan yang didesain untuk menghubungkan desa), dan membangun terrain di seluruh area perluasan.
- Layout desain mencakup lima bioma, jalan penghubung, jembatan melintasi tepi air, enam tempat, area air/titik pancing, dan padang yang ditandai sebagai calon area kandang.
- Tabrakan pemain membaca collision dari chunk yang sudah dimuat. Air tetap menghalangi pemain; jembatan dan jalur desain dapat dilalui.
- Cache chunk menggunakan LRU maksimal 25 chunk. Kanvas terrain dibake per chunk 512×512; tidak membuat satu kanvas dunia besar.
- Minimap hanya menggambar sel yang telah ditemukan, dan data eksplorasi diringkas dalam `S.world.disc`. Nama bioma muncul ketika pemain berpindah bioma.
- `sw.js` dinaikkan ke v34. Indeks dunia dan semua chunk tercantum sebagai precache wajib untuk mode offline.
- ZIP sumber yang dikirim tidak memuat `manifest.webmanifest` dan folder ikon walaupun `index.html`/service worker merujuknya. Paket hasil menambahkan manifest dan ikon aplikasi yang diperlukan agar precache wajib tidak gagal pada file tersebut.

## File utama yang berubah

- `js/tilemap.js`
- `js/world.js`
- `sw.js`
- `tools/build_world.py`
- `tools/world_design.json`
- `assets/world/index.json`
- `assets/world/chunks/*.json` (12 chunk)
- `manifest.webmanifest` (ditambahkan)
- `icons/*.png` (ikon aplikasi ditambahkan)

## Pengujian yang dilakukan

- `node --check` pada seluruh skrip klasik di `js/*.js` dan `sw.js`: lulus.
- Validasi JSON pada desain, indeks, dan 12 chunk; semua layer memiliki jumlah sel yang sesuai ukuran chunk: lulus.
- Chromium headless melalui harness pengujian yang memuat skrip proyek dan data indeks/chunk aktual: renderer siap; seluruh 12 chunk diminta selama pengujian bergerak; jembatan bisa dilalui; tile air memblokir; tag fishing dan animal-pen dikenali; kunjungan bioma memperbarui eksplorasi; Console dan error JavaScript kosong.

## Batas verifikasi

Harness Chromium memakai `page.set_content()` dan mock jaringan/aset untuk menguji logika renderer dan interaksi, karena navigasi Chromium ke localhost/file pada lingkungan ini diblokir (`ERR_BLOCKED_BY_ADMINISTRATOR`). Karena itu, instalasi service worker pada origin nyata, reload offline sungguhan, perangkat HP, dan regresi manual seluruh pintu/NPC/save lama belum dapat dinyatakan lulus. Jalankan pengujian tersebut pada hosting atau server lokal di mesin pengembang sebelum rilis produksi.

## Perubahan minimap (v35)

- Panel minimap dipindah ke kiri atas; judul `DUNIA/WORLD` diganti `MINI MAP`.
- Seluruh peta langsung tampak sejak memasuki dunia; tidak perlu eksplorasi untuk membuka minimap.
- Status penuh disimpan ringkas sebagai `S.world.disc = '*'`, satu karakter, dan kompatibel dengan kunci save lama.
- Ukuran gambar tiap sel dihitung secara fraksional agar minimap tidak meluber dari panel ketika ukuran dunia lebih besar dari pixel minimap.
- Service worker dinaikkan ke v35 agar browser mengambil kode baru.
