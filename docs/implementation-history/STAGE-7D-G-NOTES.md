# Hero Battle — Catatan Implementasi Tahap 7D–7G

## Tahap 7D — Memancing
- Memancing hanya dimulai saat pemain dekat tile air yang punya tag `fishing_spot`.
- Alur satu ketukan: lempar, tunggu gigitan, ketuk pada jendela waktu, lalu hasil masuk ke Buku Ikan.
- Spesies dipilih berdasarkan bioma, jam dunia, musim, dan rarity.
- Animasi avatar `REELING` ditambahkan ke atlas Sunnyside: **13 frame** (Aseprite tag inklusif 175–187).
- Batas: 5 tangkapan/hari, penjualan ikan 80 emas/hari, dan batas emas dunia 120/hari. Stok dan buku tersimpan dalam `S.fish`.

## Tahap 7E — Pengumpulan dan dapur
- 11 titik pengumpulan berbasis desain: kayu, batu, jamur, herba, dan buah.
- Node memiliki cooldown timestamp; aksi harian maksimum 12. Waktu berjalan memakai `S.lifeClock` yang tidak mundur.
- Animasi Sunnyside `AXE` **10 frame**, `MINING` **10 frame**, dan animasi `DIG` yang sudah ada dipakai sesuai jenis node.
- Resep menggabungkan hasil ladang, ternak, ikan, dan pengumpulan. Satu buff aktif; bonus dibatasi maksimal +10% ATK/HP selama 2–3 stage.
- Status dapur dan buff disimpan dalam `S.kitchen` dan `S.buff`.

## Tahap 7F — Desa, NPC, pesanan
- Desa memiliki 5 level; peningkatan memakai emas, kayu, dan batu. Level membuka bengkel/tukang bangun, dapur/koki, pondok penebang, dan Balai Desa.
- Sprite NPC Sunnyside untuk tukang bangun, koki, dan penebang dibuat melalui `tools/build_chars.py` (idle masing-masing 9 frame).
- Papan Misi lama diperluas untuk 3 pesanan harian dari NPC dan rantai cerita 4 tahap “Membangun Desa dari Batu Pertama”.
- Hadiah dunia memakai `lifeDailyGrant()` dengan batas bersama: maksimum 120 emas, 1 Esensi, dan 1 tiket per hari.
- Progres disimpan dalam `S.village` dan `S.orders`; data tetap berada di struktur save yang sama.

## Tahap 7G — Suasana
- Menambahkan cuaca cerah, berawan, hujan, badai, dan salju; efek partikel dirender di dunia.
- Mode musim salju memakai renderer salju dunia yang sudah ada; mode siang/malam memakai jam dunia yang sudah ada dan ditampilkan pada HUD bersama cuaca.
- Pergantian cuaca memakai timestamp dan state `S.atmo`. Tanggal kegiatan dunia mengikuti high-water timestamp `S.lifeClock` agar memundurkan jam tidak mereset batas harian.

## File utama yang ditambahkan/diubah
- `js/life.js` — sistem memancing, koleksi, dapur/buff, progres desa, pesanan, cuaca.
- `js/world.js` — rendering node sumber daya dan overlay cuaca.
- `js/i18n.js` — kamus Inggris untuk teks fitur baru.
- `sw.js` — versi cache **v39**, precache skrip fitur dan data chunk.
- `index.html` — memuat `js/life.js` dalam urutan skrip klasik.
- `assets/world/atlas.json`, `assets/world/chars.png` — animasi avatar dan sprite NPC.
- `assets/world/index.json`, `assets/world/chunks/` — hasil generator dunia.
- `tools/build_chars.py`, `tools/build_world.py`, `tools/world_design.json` — pipeline aset dan desain dunia.
- `tools/test_7defg.py`, `tools/test_life_logic.js` — pemeriksaan statis dan smoke test logika.

## Pengujian yang dijalankan
Dari direktori root proyek:
```bash
for f in js/*.js sw.js; do node --check "$f" || exit 1; done
node tools/test_life_logic.js
python tools/test_7defg.py
```
Hasil terakhir: seluruh pemeriksaan sintaks lulus; smoke test memancing/batas tangkapan, pengumpulan/cooldown, resep/buff, batas hadiah dunia, level desa, pesanan NPC, cuaca salju, dan clock rollback lulus. Validator dunia mengonfirmasi 128×96 tile, 12 chunk 32×32, 5 bioma, 10 lokasi, 11 node sumber daya, serta jumlah frame atlas Sunnyside.

## Batasan verifikasi
Pengujian Chromium UI/e2e tidak dapat diselesaikan di runtime ini karena Chromium menolak navigasi lokal dengan `ERR_BLOCKED_BY_ADMINISTRATOR`. Oleh sebab itu layar akhir, Service Worker setelah instalasi di origin hosting, dan perangkat HP belum dinyatakan teruji. Uji regresi manual untuk semua bangunan, NPC, save lama, dan offline tetap perlu dijalankan di hosting target.
