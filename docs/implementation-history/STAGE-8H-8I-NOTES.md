# Implementasi dan audit — Tahap 8H+8I

- Kandidat: `0.4.6-rc.1`; service-worker cache: `v53`. Game tetap privat. Tidak ada deploy/publikasi publik dalam tahap ini.

## 8H — Tutorial milestone persisten

- `HB_TUTORIAL_TOPICS` menyimpan 7 topik berurutan: Toko → Gacha (milestone Stage 2), Bertani (Stage 5), Memancing (Stage 6), Kebun Buah, Kumpul, lalu Masak. Prasyarat topik ditulis eksplisit dan berbeda dari Village Level/level karakter.
- Setiap topik memiliki status `belum`, `berjalan`, atau `selesai`, berikut fase. Perubahan status/fase lewat `sv()` dan `Save.*`; pemulihan save lama mendapat wadah default tanpa menghapus data. Save gagal saat complete me-rollback status sehingga UI tidak menyatakan selesai secara palsu.
- Fase: `penanda` → `instruksi` → `sorot` → `tunggu` → `konfirmasi` → `lanjut` → `simpan`. Aksi diterima hanya pada fase `tunggu` dan hanya setelah wrapper aksi gameplay melaporkan sukses (membuka Toko, gacha yang benar-benar dibayar, aksi petak, cast pancing, kumpul buah/sumber, masak sukses). Setelah konfirmasi, pemain menekan LANJUT lalu tombol SIMPAN yang terlihat; status hanya selesai setelah Save berhasil. Save gagal mempertahankan topik di fase lanjut. Skip adalah tindakan eksplisit dan menandai topik selesai; tidak ada teleport/perubahan koordinat dari tutorial.
- Highlight menggunakan target HUD/tombol yang sudah ada. Panel tutorial tidak mematikan simulasi atau joystick, sehingga gerak pemain tetap bebas; verifikasi visual dan input simultan pada HP masih perlu dilakukan.
- Toast persyaratan alat terkunci berlangsung 2,5 detik; syarat pintu/world yang lain tetap 3 detik. Overlay besar tempat terkunci nonaktif; hotbar hanya mempertahankan indikator kecil di slot alat belum terbuka.

## 8I — Uji, konsistensi, dan performa

- Tes baru `tools/test_tutorial_progress.js` memiliki 10 kelompok regresi: status topik, milestone, tujuh fase/aksi nyata, penyelesaian sekali, restore fase, urutan prasyarat, rollback Save gagal, toast unlock, dan profiler FPS/heap opt-in. Tes profiler menjalankan fungsi dengan timestamp/heap simulasi; nilai itu bukan metrik performa game.
- Tes ini terdaftar ke `npm test`. `tools/test_release_integrity.js` mengunci versi/changelog, bagian 13 spesifikasi, placeholder pengukuran, serta gerbang publikasi. `tools/test_7defg.py` diperbarui untuk cache `v54`.
- `?perf=1` mengaktifkan overlay dengan FPS window, FPS rata-rata dari ring buffer frame deltas, JS heap dan heap limit jika `performance.memory` diekspos browser. Normal sessions disabled. JS heap bukan keseluruhan memori proses browser.
- **Pengukuran FPS/memori runtime belum tersedia.** Chromium headless pada lingkungan ini timeout tanpa menghasilkan DOM/screenshot, termasuk saat memuat halaman sederhana. Jangan mencatat FPS sebagai 0 atau memakai angka sintetik sebagai hasil. Gunakan `docs/RELEASE_CANDIDATE.md` untuk merekam 60 detik per skenario pada browser target; kalau heap tidak tersedia, tandai `tidak didukung`.

## Audit konsistensi terhadap spesifikasi bagian 13

| Area | Kode/test yang mendukung | Kesimpulan |
| --- | --- | --- |
| Panel penuh/tap UI | Existing smoke/input/UI regression suites; new tutorial UI is non-modal | Automatized coverage ada; pointer/touch nyata tetap harus diuji. |
| Item penuh/loot | 8C storage tests, 8D–8E world-drop tests, Stage 2 transaction tests | Jalur pengaman ada dan lolos skenario otomatis; storage pressure/crash nyata belum diuji. |
| Atomic/idempotent Save/reward | Save recovery, one-time rewards, tutorial save-failure rollback | Lulus di test harness; browser-kill/crash/real-device belum diuji. |
| Respawn/progres | Dungeon checkpoints/one-time rewards, saved tutorial phase | Lulus otomatis untuk kasus yang tercakup. |
| Stage vs Village Level vs tutorial | `HB_TUTORIAL_TOPICS[].stage/after` plus independent `S.village` features | Milestone tutorial tegas; runbook belum membuktikan semua fitur/gameplay unlock end-to-end. |
| Offline production | Existing bounded 24h tests | Aturan batas tercakup; balancing dan skenario penuh tetap backlog. |
| Hotbar vs equipment | Protected-slot inventory tests | Lulus otomatis; sentuh HP belum diuji. |
| Rain/manual moisture | Existing farm moisture shared-source tests | Lulus otomatis; growth timings masih `PLACEHOLDER`. |
| Route/pathing | Existing BFS waypoint tests | Grid routes avoid blocked cells; runtime walking/player route UX needs playtest. |
| Interior/camera/services | 8F–8G 351 checks, doors/services/sign metadata | Data/logic tests pass; visual camera and input need HP validation. |
| Tutorial progression | 10 regression groups in `test_tutorial_progress.js` | Persisted status and actual action gates pass tests; visual overlay still needs browser QA. |
| FPS/memory | profiler calculation test + `?perf=1` overlay | Code path tested synthetically; real runtime measurements are pending. |
| License/publication | `CREDITS`, `docs/LICENSE_AND_ASSETS.md`, publication checklist | **OPEN/BLOCKING** until rights review and real HP tests pass. |

## Gate manual yang masih wajib

- Jalankan di Chromium/Firefox desktop dan Android Chrome landscape; uji tutorial tap-through, swipe/joystick bersamaan, action gate, lewati/simpan, lanjut setelah reload, dan topik selesai tak muncul lagi.
- Rekam FPS/average FPS/JS heap untuk Menu, Dunia idle, Farming, Combat ramai, dan Interior, minimal 60 detik setiap skenario; simpan browser/perangkat, resolution, thermal/power mode. Gunakan angka aktual atau `tidak didukung`, bukan perkiraan.
- Uji storage penuh/reload/save recovery serta overlay/UI input agar tidak tembus ke dunia.
- Review ulang syarat distribusi Sunnyside World dan asset turunannya, CREDITS, dan izin publikasi. Sampai seluruhnya selesai, jangan menjalankan workflow deploy publik.

## Status tes terakhir

- `npm test`: lulus; 31 skrip JavaScript syntax checked, 34 referensi HTML/asset, 30 skrip runtime, existing regression suites (HUD 283; storage 36; world/life 59; interior/sign/path 351), tutorial/profiler 10 kelompok, release integrity, dan world/data regression `v53`.
- Chromium headless: timeout tanpa DOM; uji HP nyata: belum dilakukan.
