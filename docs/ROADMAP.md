# Hero Battle roadmap status — Batch 8H+8I RC1

Roadmap terdiri dari 11 fase (`P0`–`P10`). Status berikut menunjukkan acceptance kerja, bukan sekadar apakah ada kode fitur. Fase diberi status selesai hanya jika kriteria pentingnya telah diverifikasi.

| Fase | Status setelah Batch 8H+8I RC1 | Acceptance yang masih terbuka |
|---|---|---|
| P0 — Audit baseline | **Selesai untuk baseline saat ini** | Ulangi jika arsitektur/data disusun ulang secara besar |
| P1 — HUD dan kontrol | Parsial | Uji landscape, target sentuh, input pass-through, UI scale dan keluar-masuk panel pada HP nyata |
| P2 — Save/storage/transaksi | Parsial; tes regresi inventaris, split, kapasitas dan upgrade peti tersedia | Edge-case save di browser nyata, penampungan temporer penuh, dan validasi sentuh pada HP |
| P3 — Farming/cuaca | Inti 6×4 terintegrasi | Validasi visual petak/animasi/touch swipe dan tuning placeholder durasi di HP |
| P4 — Produksi offline | Inti ternak dengan catch-up 24 jam | Uji ulang lintas sesi dan edge-case kapasitas untuk semua jenis proses |
| P5 — Ekonomi/crafting/pengaturan | Parsial; chest/workbench dan panel tas-peti dua arah terhubung | Balancing ekonomi, semua jalur transaksi, dan validasi layar/perangkat nyata |
| P6 — Combat/equipment/bos | Fondasi terintegrasi | Playtest fairness, stamina/skill, fase bos, drop dan kontrol sentuh |
| P7 — Eksplorasi/dungeon/stage | Loop dungeon 3 ruangan dan peta terintegrasi; gathering/fishing di dunia | Variasi konten, collision/pathfinding, respawn placeholder dan skenario checkpoint |
| P8 — Quest/NPC/Journal/peta | Integrasi dasar + 7 tutorial milestone persisten | Lifecycle quest end-to-end, rute aktual, NPC schedule, dialog dan klaim hadiah penuh; tutorial perlu uji visual/touch HP |
| P9 — Achievement/integrasi konten | Kategori inti tersedia | Audit semua kondisi, hadiah, migrasi save dan keseimbangan |
| P10 — Balancing dan QA akhir | **Automated release gates ditambahkan; acceptance akhir belum selesai** | QA visual HP, performance pass, license review, dan checklist publikasi |

## Status jumlah fase

- P0 telah diaudit dan diperiksa ulang melalui tes baseline.
- P1–P9 memiliki implementasi parsial hingga cukup luas, tetapi masih ada acceptance terbuka di setiap fase tersebut.
- P10 sekarang memiliki pemeriksaan otomatis integritas rilis, tetapi belum diterima sebagai fase final karena pengujian perangkat dan keputusan lisensi berada di luar tes otomatis.

Dengan definisi ketat “fase selesai hanya bila acceptance-nya terpenuhi”, **10 fase (P1–P10) masih punya pekerjaan acceptance terbuka**. Batch 7 memperkuat fondasi rilis, tetapi tidak mengubah semua fase itu menjadi selesai. Jangan menyamakan jumlah batch implementasi dengan jumlah fase yang sudah diterima.

## Release candidate

Tahap 8F+8G menghasilkan kandidat `0.4.5-rc.1`, cache `v52`; Tahap 8H+8I memajukan kandidat menjadi `0.4.6-rc.1`, cache `v53`, dengan tutorial milestone yang disimpan dan profiler opt-in. Game tetap privat. `npm test` mencakup tes tutorial baru; Chromium headless tidak menghasilkan DOM, angka FPS/memori aktual belum diukur, dan uji visual/touch HP nyata tetap gate manual. P1 dan P2 tetap parsial sampai uji perangkat/persistence nyata selesai.

Aset turunan Sunnyside World tetap mengikuti batasan di [`LICENSE_AND_ASSETS.md`](LICENSE_AND_ASSETS.md). Jangan membuat repository atau deployment menjadi publik tanpa keputusan pemilik dan peninjauan lisensi aset.


## Batch 8F+8G RC1 (historis)

Kandidat `0.4.5-rc.1` / cache `v52` menambahkan cahaya jendela untuk rumah baru, metadata pintu masuk/keluar interior, layanan yang diaktifkan objek eksplisit, papan biome yang memudar, gapura visual perbatasan besar, dan waypoint peta berbasis BFS yang tidak menuntun menembus penghalang. Acceptance manual yang masih terbuka: verifikasi visual malam/interior/signage dan uji sentuh/rotasi di browser HP fisik.


## Batch 8H+8I RC1

Kandidat `0.4.6-rc.1` / cache `v53` menambahkan tujuh topik tutorial dengan status persisten, fase tujuh langkah, konfirmasi aksi nyata, milestone stage yang eksplisit, serta profiler FPS/JS heap opt-in melalui `?perf=1`. Tes kode otomatis lulus. Pengukuran numerik runtime belum tersedia karena Chromium headless timeout; uji HP dan review izin distribusi aset belum selesai. **Jangan deploy publik sampai dua gerbang tersebut lolos.**
