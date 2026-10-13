# Tahap 7C — Peternakan

## Fitur
- Kandang dapat dibeli dengan emas; kapasitas awal 4 hewan. Upgrade menaikkan kapasitas sebanyak 2 hewan per level (maksimum level 5).
- Ayam, sapi, babi, dan domba menggunakan animasi yang sudah tersedia di `assets/world/atlas.json`.
- Hewan bergerak acak sederhana di area kandang saat layar kandang aktif.
- Setiap hewan perlu diberi satu pakan per hari. Pakan berasal dari hasil panen ladang (+1 pakan tiap hasil dipanen).
- Produksi bertimestamp: telur, susu, jamur truffle, dan wol tetap matang ketika game tertutup selama jangka pakan aktif (sampai tengah malam lokal). Hasil perlu dikumpulkan sebelum dijual.
- Pasar Desa menjual hasil peternakan. Batas produksi adalah 8 produk per hari dan batas pendapatan penjualan 100 emas per hari.
- Data peternakan, persediaan, pakan, timestamp, dan pelacak jam monotonic disimpan sebagai `S.ranch` melalui `Save.*` / `sv()`.
- Tempat kandang dan pasar diambil dari `assets/world/index.json` (`places`), bukan koordinat interaksi yang ditulis terpisah di kode.
- Service worker dinaikkan ke v36 dan `js/ranch.js` dimasukkan ke daftar shell precache.

## Verifikasi yang dilakukan
- Pemeriksaan sintaks seluruh skrip JavaScript dan `sw.js` menggunakan `node --check`.
- Uji logika peternakan dengan jam tiruan: pembelian/upgrade kandang, batas kapasitas, pakan, produksi offline berdasarkan timestamp, pengumpulan produk, penjualan dibatasi, dan perlindungan jam mundur.
- Uji navigasi/tampilan browser penuh belum dapat diselesaikan di lingkungan pengujian; Chromium headless tidak menyelesaikan proses navigasi/screenshot dan perlu dites lagi pada server GitHub Pages atau server lokal pengguna.
