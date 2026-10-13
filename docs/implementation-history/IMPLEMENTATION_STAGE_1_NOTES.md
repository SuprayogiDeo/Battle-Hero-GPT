# Hero Battle — Catatan Implementasi Tahap 1

**Versi kerja:** Stage 8 / Phase 1 Foundation  
**Basis:** salinan proyek `Hero_Battle_Stage7D-G_Complete.zip`  
**Status:** perubahan diterapkan pada salinan kerja; arsip proyek sumber tidak ditimpa.

## Ringkasan

Tahap pertama berfokus pada fondasi keselamatan data dan perilaku yang mudah menyebabkan kehilangan progres: pemulihan save, hadiah pengulangan stage, checkpoint setelah kalah/menang, kapasitas inventaris, notifikasi orientasi landscape, dan getaran perangkat. Ini **bukan implementasi penuh semua sistem** dalam Spesifikasi Induk Hero Battle.

## Perubahan yang diterapkan

1. **Save dengan cadangan pemulihan**
   - Menyimpan backup dari data utama yang valid.
   - Mencoba memulihkan backup ketika save utama rusak atau tidak dapat diparse.
   - Mempertahankan data valid terakhir ketika penulisan save gagal.
   - Memunculkan pesan jika penyimpanan gagal atau pemulihan diperlukan.

2. **Progress stage dan hadiah pengulangan**
   - Klaim hadiah cerita utama ditandai agar tidak dapat diberikan lebih dari sekali.
   - Hadiah emas untuk penyelesaian ulang dikurangi menjadi 35% dari hadiah emas stage awal pada implementasi ini.
   - Hadiah utama, bonus penyelesaian, dan essence/drop tertentu dibatasi untuk penyelesaian pertama sesuai logika saat ini.
   - Checkpoint menyimpan flag stage selesai sehingga pemuatan ulang setelah stage selesai tidak mengulang pertarungan yang sama.

3. **Kekalahan dan checkpoint**
   - Kekalahan mencatat checkpoint untuk melanjutkan ulang stage tanpa menaikkan `best` seolah stage telah selesai.
   - Saat dilanjutkan setelah kalah, hero dimulai ulang dengan 50% HP dan stage di-reset untuk percobaan berikutnya.
   - Barang dan progres permanen tidak sengaja dihapus oleh jalur kekalahan tersebut.

4. **Kapasitas inventaris dan hadiah berlebih**
   - Pemanggilan/undian equipment diblokir sebelum tiket, uang, atau pity dikonsumsi bila slot tidak cukup.
   - Item yang gagal masuk ke inventaris utama karena penuh dimasukkan ke daftar `overflowItems` yang tersimpan.
   - Pemain dapat mengambil item tertunda jika slot tersedia atau menjual item terpilih secara manual.
   - Tidak ada penjualan otomatis barang lama sebagai akibat inventaris penuh.

5. **Orientasi dan umpan balik kontrol**
   - Menampilkan pemberitahuan ketika perangkat mobile berorientasi portrait; permainan diarahkan ke landscape.
   - Menambahkan opsi getaran perangkat dan haptic feedback pada beberapa aksi yang didukung.
   - HUD dunia diubah agar hanya menampilkan jam digital kecil di kanan atas, tanpa teks cuaca permanen.

6. **Cache dan pengujian**
   - Versi cache service worker diperbarui ke `v40` agar perubahan dapat dimuat ulang.
   - Menambahkan tes pemulihan save dan smoke test browser berbasis Node.

## Hasil validasi yang dijalankan

Perintah yang dijalankan dari direktori proyek:

```bash
for f in js/*.js sw.js; do node --check "$f"; done
node tools/test_life_logic.js
python3 tools/test_7defg.py
node tools/test_save_recovery.js
node tools/test_browser_smoke.js
```

Hasil:

- `PASS` — sintaks JavaScript dan service worker.
- `PASS` — tes sistem life: memancing, cooldown gathering, resep/buff, batas pendapatan dunia, village level, pesanan NPC, dan status salju.
- `PASS` — tes world/assets dan kecocokan service worker `v40`.
- `PASS` — backup save valid, recovery save rusak, kegagalan penulisan, dan wipe.
- `PASS` — pemuatan 25 skrip pada smoke test DOM/canvas berbasis Node.
- `PASS` — idempotensi hadiah stage, recovery setelah clear, overflow loot, validasi kapasitas sebelum biaya, serta recovery checkpoint setelah kalah.

**Batas validasi:** uji end-to-end visual menggunakan Chromium headless tidak berhasil diselesaikan di lingkungan ini. Karena itu, render visual, sentuhan perangkat nyata, dan sesi browser penuh belum boleh dianggap tervalidasi hanya dari tes di atas.

## Belum selesai dari Spesifikasi Induk

Item berikut masih memerlukan tahap implementasi lanjutan atau audit terhadap arsitektur yang ada:

- Minimap dunia, papan penanda biome, detail navigasi, dan eksplorasi interior seluruh bangunan.
- Penyimpanan peti/chest lengkap, pemindahan stack, batas kapasitas penyimpanan sementara yang terdefinisi, serta alur hadiah quest ketika bag penuh.
- Validasi kapasitas output pada seluruh crafting/processing, antrean produksi dan catch-up offline dengan batas angka yang disepakati.
- Penyiraman otomatis tanaman oleh hujan, serta balancing cuaca dan sumber daya.
- Sistem hubungan penduduk, dungeon, alur Main Stage menyeluruh, achievement, dan konten bos/loot lengkap sesuai dokumen desain.
- Penyempurnaan global UI scale. Kontrol tertentu sudah memiliki ukuran yang dapat disetel, tetapi skala semua panel UI belum tersedia.
- Audit penuh terhadap pertempuran real-time, AI musuh, indikator serangan, atribut, buff, equipment, dan balancing.
- Autosave pada semua transisi transaksi dan setiap kondisi putus sesi. Checkpoint tahap ini belum menyimpan seluruh keadaan musuh/pertempuran di tengah wave.
- Uji regresi visual dan interaksi multi-resolusi pada perangkat/browser sungguhan.

## Risiko dan catatan teknis

- `overflowItems` pada tahap ini merupakan antrean hadiah tertunda yang persisten; kapasitas terbatasnya belum ditetapkan/diterapkan. Ini perlu dilengkapi agar selaras penuh dengan spesifikasi penyimpanan aman.
- Nilai 35% hadiah emas pengulangan dan 50% HP saat mencoba ulang adalah parameter implementasi awal, bukan hasil balancing akhir.
- Browser dapat menolak atau menghapus penyimpanan lokal; cadangan lokal membantu pemulihan, tetapi bukan pengganti cloud save atau backup eksternal.
- Tidak ada perubahan pada arsip sumber; semua perubahan ada pada salinan kerja yang dipaketkan dalam arsip implementasi.

## Langkah berikutnya yang disarankan

1. Uji manual paket ini di browser dan perangkat landscape.
2. Tetapkan angka TBD (kapasitas, batas offline, kurva XP, damage, drop rate, dan durasi efek).
3. Lanjutkan P1/P2 fondasi HUD dan data, lalu storage/crafting/economy, sebelum menambah konten dungeon dan hubungan penduduk.
