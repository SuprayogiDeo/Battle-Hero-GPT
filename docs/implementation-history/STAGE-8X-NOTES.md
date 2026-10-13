# Catatan implementasi — Tahap 8B (HUD, safe area, pengaturan)

- Kandidat: `0.4.2-rc.1`; service-worker cache `v49`.
- Lingkup: spesifikasi bagian 3, 12, 16 (AC-01 dan AC-13); tidak menambahkan fitur dunia selain perbaikan banner discovery/minimap yang tumpang tindih.
- HUD: minimap hanya satu; pada map tilemap minimap memakai viewport logical x=4/y=4 dan skala UI tersimpan; panel FOKUS ditaruh di x=122/y=92 dengan teks 10/9 px. Toast umum dipindah ke bawah. Banner besar memakai jenis `discovery` dan hanya dipicu oleh penemuan biome pertama yang dicatat secara idempoten di Journal.
- Input/layout: env safe-area dipakai untuk memosisikan kanvas; instruksi portrait yang sudah ada dipertahankan; pointerdown mencegah aksi default; hitbox hotbar, tombol aksi dan panel pengaturan disesuaikan agar minimal 44 CSS px efektif. Pengaturan dibagi menjadi tujuh halaman ringkas untuk mengurangi benturan antar-hitbox pada landscape pendek.
- Save: `S.set.ui` dinormalisasi dan ditulis melalui alur `sv()`/`Save.writeMain`; volume, vibrasi, efek visual memakai pengaturan `S.set` yang ada. Tidak ada akses penyimpanan baru di luar Save.*.
- Tes: `tools/test_interior_hud.js` diperluas untuk skala/hitbox, penyimpanan setting, discovery satu kali, UI tap tidak tembus, dan pemulihan posisi/tool setelah panel ditutup.
- **PLACEHOLDER** ukuran UI 0/1/2 memakai preset relatif (`0.9/1.0/1.1`); skala ini perlu dikonfirmasi pemilik dan disetel setelah uji HP. Status perangkat nyata: belum diuji pada HP. Safe-area browser/PWA dan ergonomi pada model HP berbeda masih perlu pemeriksaan manual.
- Chromium headless: dicoba pada server lokal dan dengan halaman `about:blank`, tetapi proses macet hingga timeout dan tidak menghasilkan DOM maupun screenshot. Playwright tersedia, tetapi browser bawaannya tidak terpasang; karena itu tidak ada klaim uji visual/browser penuh.
- Kebijakan aset: perubahan ini tidak menambahkan asset pack atau berkas sumber Aseprite; tidak menggunakan Paid Pack atau Tiny Wonder Free.


# Catatan implementasi — Tahap 8C (hotbar, tas/peti, AC-03/AC-04)

- Kandidat: `0.4.3-rc.1`; service-worker cache `v50`.
- Hotbar tetap 8 slot per halaman / 2 halaman; enam tool dasar memiliki konfigurasi unlock tunggal `HB_STARTER_TOOL_CONFIG` di `js/data.js`. Angka `hand:0, hoe:5, can:5, axe:4, pick:4, rod:6` secara eksplisit `PLACEHOLDER`, bukan balancing final. Slot 6–15 dapat diikat ke ID material yang tersedia di tas; mengatur slot tidak mengonsumsi material. Slot tool dasar ditolak oleh fungsi assignment/clear.
- Panel storage dua sisi menampilkan sembilan jenis material dengan atlas 9 cell; baris disusun menurut snapshot `scOrder`, dan hanya tombol sort eksplisit yang menyusun ulang. Transfer 1/setengah/semua serta quick-store/take menghitung ruang tujuan sebelum mutasi; transfer parsial hanya mengurangi jumlah yang benar-benar masuk.
- Upgrade peti tetap memvalidasi level, gold dan jumlah material lebih dahulu, lalu hanya mengonsumsi biaya terverifikasi. Tidak ada pemangkasan otomatis pada `S.materialStorage.items`. Item equipment saat bag utama penuh masuk `S.overflowItems` yang dibuka lewat tombol `HADIAH TERTUNDA`; bila kedua storage penuh, klaim berfitur batas harus ditolak sebelum reward diberikan dan jalur fallback menampilkan peringatan.
- Asset: `assets/world/items.png` (144×16) dibangun dengan `tools/build_inventory_icons.py` dari pilihan PNG 99 Ingredients plus simbol resource buatan skrip. ZIP/PSD/Aseprite tidak masuk repo. Entri asset/credit/licensing ditambahkan; review distribusi publik tetap wajib.
- Tes baru: `tools/test_inventory_storage.js` untuk protected slots, stack partial, mode half, hotbar swipe/quantity, kapasitas tas penuh sebelum gather/craft, sort stabil, overflow terlihat, dan isi peti tak berubah oleh upgrade. `npm test` menjadi gate batch ini.
- Browser Chromium headless dan HP fisik tidak diklaim lulus pada batch ini. Perlu uji visual mobile landscape, safe-area, hitbox, persistence, dan perilaku ketika main bag + temporary rewards sama-sama penuh. Proyek tetap privat.


# Catatan implementasi — Tahap 8D+8E (farming dunia, memancing, gathering, AC-02/03/04)

- Kandidat: `0.4.4-rc.1`; service-worker cache `v51`.
- Farming: `assets/world/index.json` dan `village.json` expose 24 cell grass field, 6×4. `farmGet()` menambah petak bila save berisi 12; tidak pernah memotong data petak lama/lebih panjang. Input capture menyimpan `Set` index per pointer ID untuk sekali aksi per petak; pointer ID terpisah tidak mengunci joystick. Validasi tanah, jumlah benih, collision, `wBlocked`, dan NPC mendahului pengurangan seed. Tombol aksi F tidak lagi membuka layar `farm`.
- Status crop: tanah, soil wet, seed, grow time, ripe memakai `S.farm.p` dan `farmWaterPlot()` yang sama antara watering dan hujan. Crop runtime punya tahap `crop_*_0..5`, turunan source crop `_00.._05`. Watering animation `avatar_watering` 5 frame dirakit dari strip WATERING. Ember menyimpan 0–6 charge melalui `S.hb.water`; HUD harus mempertahankan angka integer, bukan boolean.
- Memancing: aksi lempar membuat `lifeFish` fase `waiting`, world overlay menggambar pelampung/riak pada spot; gigitan pindah ke `bite`, aksi saat jendela terbuka memanggil `avatar_reeling` 13 frame dan menambah stock/book/total persisten. Feedback ringkas toast, bukan screen/popup. Jendela gigitan 1.2s adalah **PLACEHOLDER** untuk tuning HP; variasi timer cast lama juga perlu balancing.
- Gathering: pohon dekor di tepi forest dapat dipotong, core forest dan tree object bertanda unique/protected/quest tidak eligible; status `stump` dapat dibersihkan lalu pohon tersembunyi sampai respawn. Stone memakai animasi `avatar_mining` 10 frame. Overflow kayu/batu membuat entry `S.worldDrops`; `lifeTakeWorldDrop()` memindah sebanyak kapasitas kosong lalu meninggalkan sisa.
- **PLACEHOLDER:** cooldown lama di kode (tree 420000 ms, stone 540000 ms, bahan lain 300000–480000 ms) bukan keputusan balancing final. Waktu tumbuh crop lama juga belum ditetapkan ulang.
- Cache: `atlas.json` dan `chars.png` dipindahkan menjadi precache wajib bersama `index.json`; versi naik ke `v51`. Tidak ada source ZIP atau Aseprite dikemas. Sumber Aseprite Human v1.0 terpisah masih memerlukan konfirmasi syarat distribusi sebelum proyek publik.
- Tes: `tools/test_stage_8de.js` menguji field 6×4, aksi swipe/duplicate, seed habis, collision, moisture manual+rain, fishing bite/collection/toast, tree edge/core (termasuk resource marker)/unique, stump clearing, bag full + partial drop pickup, dan frame atlas. Tes batch baru: 59 pemeriksaan. `tools/test_life_logic.js` diperbarui untuk urutan gigitan waktu. Status Chromium headless: timeout tanpa DOM/screenshot; HP fisik belum diuji.


## Tahap 8F+8G — 0.4.5-rc.1 / cache v52

- Rumah `b_*` kini mempunyai metadata jendela malam dari `tools/build_lights.py`; builder menolak jendela yang keluar sprite atau overlap area pintu. Pengujian visual cahaya malam pada HP belum dilakukan.
- `assets/world/interior.json` v2 menyimpan registry entry/exit 15 bangunan; `intEnter/intExit` mempertahankan posisi pintu dunia dan tool terpilih. Panel layanan tidak otomatis terbuka karena kedekatan: aksi dilakukan di kasir, mesin gacha, dapur/barak/balai, papan misi fisik, atau palung pakan.
- `tools/world_design.json` menyimpan 5 biome sign, 2 gapura batas besar, dan 3 service object. `tools/build_world.py` memperbarui `assets/world/index.json` v5 dan chunks; sign fade bergantung jarak ke objek fisik, gate bersifat visual tanpa collision.
- Peta dunia menghapus nama biome permanen di kotak wilayah. Waypoint menggunakan flood fill/BFS di grid yang dapat dilalui, memeriksa keterhubungan target dari posisi pemain, dan menuntun ke sel langkah berikutnya alih-alih mengarah lurus melewati obstacle.
- Rilis: `0.4.5-rc.1`, service worker `v52`. `npm test` dijalankan pada batch ini; tes Chromium headless timeout/tidak menghasilkan DOM dan HP fisik belum diuji. Proyek tetap privat.


## Tahap 8H+8I — 0.4.6-rc.1 / cache v54

- Tutorial dunia berstatus per topik `belum/berjalan/selesai` dan tersimpan lewat Save; fase tujuh langkah menunggu aksi gameplay yang benar-benar berhasil, membutuhkan pilihan LANJUT/SIMPAN eksplisit setelah konfirmasi, dan tidak memindahkan pemain. Topik berurutan Toko, Gacha, Bertani, Memancing, Kebun Buah, Kumpul, dan Masak dengan milestone Stage 2/5/6.
- Syarat terkunci memakai toast singkat tanpa overlay gembok besar. `?perf=1` menambahkan profiler opt-in FPS dan JS heap jika dukungan browser tersedia.
- `docs/specification/Hero_Battle_Spesifikasi_Induk_v1.md` bagian 13 sekarang mencatat matriks pemeriksaan implementasi kandidat; checklist publikasi dan release candidate diperbarui, termasuk kolom pengukuran performa yang sengaja berstatus `BELUM DIUKUR (PLACEHOLDER)`. Detail: `STAGE-8H-8I-NOTES.md`.
- Tes `tools/test_tutorial_progress.js` memiliki 10 kelompok regresi; terdaftar ke `npm test`. Tes rilis mengunci versi/changelog, spesifikasi bagian 13, dan penghambat publikasi.
- Kandidat `0.4.6-rc.1`, cache `v54`; `npm test` lulus. Chromium headless timeout tanpa DOM dan uji HP belum dilakukan. Angka FPS/memori runtime tidak direkayasa; gerbang lisensi dan tes perangkat memblokir deployment publik.
