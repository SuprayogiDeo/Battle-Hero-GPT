# Release candidate 0.4.7-rc.1

**Status:** kandidat privat untuk review kode. BUKAN rilis publik; jangan jalankan workflow deploy sebelum gate lisensi aset dan pengujian HP nyata lulus. Cache service worker `v53`.

## Verifikasi otomatis yang telah dijalankan

- [x] `npm test` berhasil pada kandidat `0.4.7-rc.1` / cache `v55`, pada repo kerja dan hasil ekstraksi arsip.
- [x] JavaScript sintaks dan path aset statis lolos pemeriksaan.
- [x] Tes pemulihan save, farming/cuaca, produksi offline, storage/workshop, combat/boss, Journal/relationship, dungeon dan waypoint lulus.
- [x] Pemeriksaan integritas versi, service-worker cache, HTML entry point dan workflow GitHub Pages lulus.
- [x] Tes regresi tutorial: 7 topik, tiga status, milestone Stage 2/5/6, urutan prasyarat, aksi nyata, posisi karakter tidak berubah, skip eksplisit, simpan/pulih fase, dan rollback saat save gagal.
- [x] Tes profiler menghitung FPS dari frame delta serta membaca JS heap ketika field tersedia; sesi non-`?perf=1` tidak mengaktifkan profiler. Tes unlock memastikan toast singkat tanpa overlay gembok besar.
- [x] Audit kode berbasis tes untuk spesifikasi bagian 13 dicatat di [`STAGE-8H-8I-NOTES.md`](implementation-history/STAGE-8H-8I-NOTES.md).
- [x] Aset pack asli (`.zip`) dan source `.aseprite` tidak dimasukkan ke repository.
- [x] Release ZIP diekstrak dan struktur entry point diverifikasi.

## Gate yang belum selesai

- [ ] Tes di HP Android Chrome dalam landscape: joystick, tombol serang, penghindaran, hotbar, tombol aksi, dan rotate notice.
- [ ] Uji overlay/panel: tap tidak menembus UI ke dunia; close/return tidak memindahkan pemain atau mengganti tool tanpa sengaja.
- [ ] Uji save dari sesi nyata: reload/tab close, save korup, browser storage penuh, dan pemulihan setelah pindah area.
- [ ] Uji GitHub Pages pada URL repository bersubpath, bukan hanya root `localhost`.
- [ ] Konfirmasi bahwa redistribusi file aset turunan Sunnyside World pada source repository publik diizinkan; bila belum, ganti atau pisahkan aset sebelum publikasi.
- [ ] Tetapkan lisensi untuk kode original jika ingin memberikan izin penggunaan ulang; jangan menambahkan lisensi blanket yang mencakup karya pihak ketiga.
- [ ] Lakukan balancing gameplay dan regression pass berdasarkan hasil playtest nyata.
- [ ] Ukur FPS/memori nyata: Chromium headless di lingkungan implementasi timeout sebelum menghasilkan DOM, sehingga angka game belum terukur. Jalankan `?perf=1` pada browser target dan isi tabel ukur di bawah.
- [ ] Jalankan checklist tutorial dan semua input/HUD di HP landscape; pengujian perangkat belum dilakukan dan merupakan blocker.
- [ ] Konfirmasikan izin redistribusi aset turunan/Sunnyside World melalui gate lisensi. Tidak ada deployment publik sampai kedua gate terakhir ini selesai.

## Jalankan secara lokal

Persyaratan tes: Node.js 20+ dan Python 3.10+. Dari direktori root proyek:

```bash
npm test
python -m http.server 8000
```

Buka `http://localhost:8000` dalam orientasi landscape. Untuk profil sesi, buka `http://localhost:8000/?perf=1` (tambahkan `&perf=1` bila sudah ada query). Overlay menunjukkan FPS saat ini, rata-rata FPS, dan JS heap jika `performance.memory` didukung browser. Ukur tiap skenario setidaknya 60 detik; jangan menganggap JS heap sama dengan seluruh memori proses browser. Nilai tanpa pengukuran diberi label `BELUM DIUKUR (PLACEHOLDER)`.

## Keputusan publikasi

Jangan jalankan workflow **Deploy GitHub Pages** secara publik sampai gate lisensi dan tes HP nyata selesai. Upload ke private repository untuk review sumber berbeda dari men-deploy game ke situs publik.

## Profil performa — pengukuran runtime belum tersedia

| Skenario | Durasi | FPS saat ini / rata-rata | JS heap / limit | Browser + perangkat | Status |
| --- | --- | --- | --- | --- | --- |
| Menu / HUD | 60 dtk | BELUM DIUKUR (PLACEHOLDER) | BELUM DIUKUR (PLACEHOLDER) | BELUM DIISI | Menunggu browser nyata |
| Dunia idle | 60 dtk | BELUM DIUKUR (PLACEHOLDER) | BELUM DIUKUR (PLACEHOLDER) | BELUM DIISI | Menunggu HP/browser nyata |
| Dunia + farming | 60 dtk | BELUM DIUKUR (PLACEHOLDER) | BELUM DIUKUR (PLACEHOLDER) | BELUM DIISI | Menunggu HP/browser nyata |
| Combat ramai | 60 dtk | BELUM DIUKUR (PLACEHOLDER) | BELUM DIUKUR (PLACEHOLDER) | BELUM DIISI | Menunggu HP/browser nyata |
| Interior | 60 dtk | BELUM DIUKUR (PLACEHOLDER) | BELUM DIUKUR (PLACEHOLDER) | BELUM DIISI | Menunggu HP/browser nyata |

Uji Chromium headless di lingkungan implementasi timeout bahkan pada halaman sederhana tanpa menghasilkan DOM/screenshot. Itu adalah batas pengujian lingkungan; bukan hasil FPS 0 atau bukti performa buruk/baik. `npm test` menguji perhitungan profiler dengan timestamp/heap sintetis saja, bukan performa render game.
