# Changelog

## Batch 9B-17 (audit HUD statis) — 0.4.8-rc.1 — hotbar vs tombol aksi di portrait, area ketuk, toast, dialog gerbang (cache v72)

- `tools/audit_hud_static.js` (baru, sekali pakai, TIDAK di `run_tests.js`): irisan/luar-kanvas HUD, ukuran tap, teks <= 9 px logis, kontras WCAG, teks terpanjang vs wadah, untuk z=.9/1/1.1 pada landscape (s=1,0) dan portrait (s~0,61).
- `hud.js`: (1) `hudLayout` menggeser hotbar ke kiri bila tepi kanannya menabrak lingkaran tombol aksi (portrait: langkah 72 logis; sebelumnya tumpang 23-30 px, kini 0; landscape tidak berubah); titik halaman/nama alat mengikuti pusat hotbar. (2) `hudDown`: titik di irisan area ketuk hotbar x tombol aksi menjadi milik pusat terdekat. (3) area ketuk FOKUS setinggi satuan sentuh (maks 56 logis), mulai tepat di bawah area minimap. (4) `hudFs()` (font naik ke ~8 px layar di layar kecil, lalu muat wadah) untuk label tombol aksi dan hitungan hotbar. (5) label petunjuk 'CARI PALUNG/FIND TROUGH' -> 'PALUNG/TROUGH', 'PAPAN MISI/QUEST BOARD' -> 'MISI/QUEST' (sebelumnya melebihi lingkaran tombol).
- `world.js`: toast biasa dipindah y 286 -> 268 (tak lagi menimpa nama alat hotbar) dan melebar mengikuti teks (336..420; teks EN 62 karakter sebelumnya 372 px di kotak 336); dialog gerbang: tombol setinggi satuan sentuh (30 -> 44 landscape, maks 52 portrait), kartu menyesuaikan.
- `adventure.js`: area ketuk TUTUP dan HAPUS PENANDA diperluas ke satuan sentuh (tampilan tidak berubah); teks kecil peta memakai `hudFs`.
- `tilemap.js`: hapus kode mati `ZONE`/`ZT` (tidak pernah dibaca).
- `tools/test_hud_regression.js` (baru, terdaftar di `run_tests.js`): irisan visual HUD = 0 dan di dalam 640x360, area ketuk >= 44 px (hotbar, aksi, FOKUS, minimap, dialog gerbang, TUTUP, HAPUS PENANDA; diukur dengan menyentuh), label/toast muat; profil s=.85/1/1.2 x ui 0/1/2. Tes ini menemukan area TUTUP hanya 42,9 px di s=.85, rumus diperbaiki menjadi `y<max(42,tu)`.
- `journal.js`: dua teks 7 px ("Berikutnya/Max bond" di kartu hubungan, catatan bonus tier di dasar layar) dinaikkan ke 8 px; lebar terpanjang (EN, 91 krc) 437 px dari 640 dan 144 px dari 296 kartu, jadi muat.
- Kode mati dihapus: `drawPlate` (tilemap.js, tak pernah dipanggil) dan cabang hapus-penanda tersembunyi `y>=320&&x<150` di `hbWorldMapClick` (tanpa tombol terlihat; ketukan tak sengaja di teks petunjuk menghapus penanda).
- `tools/test_inventory_storage.js`: asersi string hitungan hotbar diperbarui (font kini `hudFs(9,...)`; maksud tes sama).
- Ditunda (butuh keputusan/cek perangkat): papan dinding portrait (fs turun ke 10 logis = 6,1 px layar), baris wilayah peta, tombol tutorial, minimap z=.9 portrait (41,7 px).
- `sw.js` v72, `VERSION`, `tools/test_7defg.py` diselaraskan.

## Batch 9B-16 (data peta, skrip fix_map_10a) — 0.4.8-rc.1 — jalan Balai Desa, jalan timur jembatan, semak b_res5 (cache v71)

- `tools/fix_map_10a.py` (baru, idempoten; memanggil `build_minimap_roads.py`): (1) tangga diagonal menuju Balai Desa diganti jalur L 1 petak: (77,44) turun ke (77,47), lalu ke barat sampai jalan x=65; 9 petak tangga yang tak terpakai kembali jadi rumput. Jalan di luar desa lama memang polos (ground 34, tanpa tepi), jalur baru mengikuti itu. (2) Jalan timur jembatan: 3 petak (y 22..24) di x 61..62, 2 petak (y 23..24) di x=63, lalu 1 petak; tepi rumput memakai tile tepi yang sama dengan sisi barat (S 35, N 40, SE 49, NE 48, SW 42, S+W 46 yang sudah ada di tiles.png). (3) `bush_c` (50,14) -> (50,16), >= 3 petak dari pintu b_res5 dan dari jalan; sel padat lama dibuka, yang baru ditutup.
- Aset berubah: `assets/world/index.json` (grid, objects, roads), `chunks/c1_0.json`, `chunks/c2_1.json`. `tiles.png` tidak berubah (tidak ada tile baru; ID maks < 160).
- `tools/test_map_10a.js` (baru, terdaftar di `run_tests.js`): BFS pintu Balai Desa -> x=65, bekas tangga bukan jalan, jalan timur jembatan berjalan dan bukan air, jarak bush_c >= 3, semua ID tile < 160.
- `sw.js` v71, `VERSION`, `tools/test_7defg.py` diselaraskan.

## Batch 9B-15 (keterbacaan papan, nama peta, kotak nama interior) — 0.4.8-rc.1 — papan terbaca malam, font adaptif peta, kotak nama selebar teks (cache v70)

- `tilemap.js`: papan dinding (`wallSign`) dan papan atap (`roofSign`) kini masuk antrean `LBL` berjenis `sign` dan digambar di `overlay()` (sesudah tint malam) dengan posisi sama persis; diredupkan halus `0,35*FX.n` hanya pada papan (kotak untuk papan dinding, warna teks untuk papan atap). Siang/salju: `FX.n < 0,02` -> redupan 0, tampilan sama. Varian terkunci (`md=='l'`) tetap tanpa papan. Cache lebar `WSC` dan jepitan lebar sprite tidak berubah. Konsekuensi diterima: pohon di depan pintu tidak lagi menutupi papan. `Tmap.labelFont` diekspos.
- `adventure.js` peta penuh: font nama tempat adaptif (`Tmap.labelFont`, dijepit 8..11 px), tabrakan memakai kotak teks sebenarnya, prioritas market > village_hall > workshop > kitchen > pier, maks 6 nama non-prioritas, tanpa bayangan ganda (outline dari `T()`).
- `interior.js`: `intNameBox()` — lebar kotak nama ruangan mengikuti teks terpanjang ID/EN (padding 12, 150..260 px; font 10 -> 8 px lalu dipotong "…"). Durasi fade tidak berubah. `sfx('click')` pada pintu dipertahankan (tidak ada efek pintu di audio).
- `tools/test_interior_name_box.js` (baru, terdaftar di `run_tests.js`): semua ruangan `INT_B` x 2 bahasa.
- `sw.js` v70, `VERSION`, `tools/test_7defg.py` diselaraskan.

## Batch 9B-14 (peta penuh, bersih-bersih HUD) — 0.4.8-rc.1 — tombol M, jalan/jembatan/nama tempat di peta dunia, hapus hudMini (cache v69)

- `adventure.js`: peta dunia (state `worldmap`, dibuka dengan mengetuk minimap) kini juga dibuka/ditutup dengan tombol M (Esc dan TUTUP tetap); jalan `V.roads` dan jembatan `+` tergambar di petak yang sudah dijelajahi; nama tempat (ID/EN) ditulis di samping penanda tanpa saling menimpa. Skala tetap mengikuti ukuran kartu (~2,9 px/petak) karena tinggi kanvas logis 360.
- `hud.js`: `hudMini()` dan `hudMM` dihapus (hanya dipanggil saat `!wVon`; minimap dunia bertilemap digambar `Tmap.hud`).
- Banner zona: tidak ada kode baru; toast `discovery` (`jrDiscoverBiome`, journal.js) sudah menampilkan nama wilayah saat pertama kali masuk.
- `sw.js` v69, `VERSION`, `tools/test_7defg.py` diselaraskan.

## Batch 9B-13 (polish visual dunia) — 0.4.8-rc.1 — minimap, label bangunan, transisi interior (cache v68)

- `tilemap.js` minimap: jendela 64x48 petak mengikuti pemain (sebelumnya seluruh peta 128x96 dikecilkan ke 100x76 = <1 px/petak, jalan dan jembatan tak terlihat); jembatan `+`, jalan (`V.roads`), bangunan berbingkai, ladang, penanda tempat (emas) dan gerbang (biru), penanda pemain berkedip 5px berbingkai. Noise petak `X` diredam. Posisi/ukuran HUD tidak berubah.
- `tilemap.js` label: ukuran font adaptif (`labelFont`, target >=11 px layar, 8-13 px logis) untuk papan dinding, plat, dan label melayang; papan dinding dijepit selebar sprite bangunan; label melayang yang bertabrakan digeser ke atas (maks 4x) dan plat digambar lebih dulu.
- `interior.js`/`hud.js` transisi pintu: 0,52 dtk (sebelumnya 0,4), ease smoothstep, tahan hitam 0,06 dtk saat adegan ditukar (`intFadeAlpha`).
- `tools/build_minimap_roads.py`: menambahkan `roads` ke `assets/world/index.json` (jalankan setelah `build_world.py`).
- `tools/test_stage_9a.js`: asersi minimap menguji perilaku (tanpa fog), bukan string sumber.

## Batch 9B-12 (polish UI interaksi Pasar, Step 2) — 0.4.8-rc.1 — umpan balik interior, transisi layar, Desa/Toko, paging Gudang (cache v67)

- `interior.js`: objek fungsional berkilau halus; objek terdekat disorot dengan siku sudut + tag nama (ID/EN); fade singkat saat layar dibuka dari / ditutup ke interior.
- `life.js`: layar Desa menampilkan chip bahan (ikon + punya/butuh, hijau/merah); status level maks berisi ringkasan; ikon kunci diganti penanda yang konsisten.
- `screens.js`: kartu penawaran Toko menampilkan kekurangan emas / ajakan beli.
- `ranch.js`: ikon `gold` pada `itemIcon()`.
- `storagecraft.js`: daftar bahan Gudang dipaging 6 baris x 24px (tombol ◀ n/m ▶), teks 11px.

## Batch 9B-11 (polish UI interaksi Pasar) — 0.4.8-rc.1 — panel/tombol seragam, ikon item, perbaikan layout (cache v66)

- `render.js`: outline teks memakai `lineJoin='round'` (hilangkan artefak "duri" pada huruf).
- `screens.js`: `btn()` dan `card()` bergaya bevel/berpaku; label tombol mengecil otomatis bila kepanjangan.
- `ranch.js`: ikon item prosedural `itemIcon()`; layar Pasar memakai ikon, panel tidak ditimpa tombol, petunjuk saat stok kosong.
- `journal.js` / `life.js`: Dapur dan Pesanan memakai nama bahan berbahasa Indonesia/Inggris dan ikon; bahan cukup hijau, kurang merah; teks lebih besar.
- `storagecraft.js`: label TAS/petunjuk tidak menimpa tombol; kolom Peti menampilkan nama bahan; nama bahan di daftar bengkel.
- `interior.js`: lebar toast mengikuti teks.

## Batch 9B-10 (polish visual, Step 2) — 0.4.8-rc.1 — Pasar besar yang bisa dimasuki, kasir pindah ke dalam (cache v65)

Aset: `tools/build_market_assets.py` (hall `b_market` 208x144 px + sprite interior `vendor`, `scale`, `market_table`). Data peta: `tools/fix_map_9f.py` (idempoten; index.json, chunk, village.json).
Urutan pipeline setelah rebuild dunia: build_interiors -> build_lights -> fix_map_9a..9e -> build_market_assets -> fix_map_9f.

- Pasar baru: hall besar (13x9 tile) di bekas taman timur (x 39..51, y 25..33), pintu menghadap selatan di (45,34). Papan atap menampilkan "PASAR"/"MARKET" (digambar `tilemap.js` dari meta `sign`, ikut bahasa). Nama tempat diganti dari "Pasar Desa" menjadi "Pasar".
- Taman timur (x 36..52, y 25..35) dikosongkan seluruhnya atas permintaan; jalan masuk dari jalan utama lewat jalur barat (x 37..38) ke halaman depan (y 34..35).
- Kios lama dan layanan luar `market_cashier` dihapus. Kasir pindah ke interior baru `market` (17x10): kasir (layar pasar), loket dapur (MASAK), meja desa + papan pesanan, papan harga (harga jual ternak dari data), papan berita (level desa, rekor stage, batas jual harian), pedagang (dialog bergilir), timbangan, meja dagang, rak, bahan, peti penitipan.
- Judul layar pasar "PASAR DESA" -> "PASAR". `place.village_market` kini bangunan ber-sprite (`b_market`), HUD tidak lagi menampilkan "CARI KASIR"; pintu lewat tombol MASUK seperti bangunan lain.
- Tes diperbarui: 14 bangunan, 2 layanan luar ruangan, footprint hall, jalan masuk terjangkau, taman timur kosong, interior `market`.

## Batch 9B-9 (polish visual, Step 1) — 0.4.8-rc.1 — Pasar padat, papan kosong dibuang, tepi jembatan padat per piksel (cache v64)

Data lewat `tools/fix_map_9e.py` (idempoten; menyentuh index.json, chunk c1_0, village.json). Tes 9C diperbarui.

- Kios Pasar (Kasir Pasar) kini padat (x=33..35, y=24..25); baris depannya tetap bebas sehingga kasir terjangkau. Sebelumnya karakter bisa menembus kios.
- Papan merah kosong di tile (37,23) dibuang (bukan papan misi dan tanpa teks).
- Jembatan timur: hanya tepi (pagar) yang padat; lantai papan tetap bisa dilalui. Collision per pita piksel lewat `index.json › bridgeRails` + `Tmap.railSolid` yang dipanggil `wSolid` (pagar atas y-lokal < 16 px di baris 22, pagar bawah y-lokal >= 18 px di baris 24). Memadatkan satu tile penuh (percobaan pertama) salah karena satu tile baris pagar juga berisi papan lantai, sehingga lantai yang tampak datar tidak bisa dimasuki dari jalan kanan. Tes 9C memeriksa pita ini, termasuk kotak kaki pemain.

## Batch 9B-8 (perbaikan 9D) — 0.4.8-rc.1 — Jarak bangunan dari jalan, plat Hutan Jamur (cache v63)

Dari daftar bug foto no. 8 dan 9. Data lewat `tools/fix_map_9d.py` (idempoten).

- Bengkel Desa digeser 4 petak dan Dapur Desa 3 petak ke barat (keduanya kini berpusat di x=952, tile 59), berjarak >= 3 petak dari jalan utama x=65; sebelumnya sprite bengkel menimpa jalan. Jalan ke pintu bengkel dibuat ulang (baris y=46, x=58..65), pintu dapur kini langsung di jalan barat-timur y=61. Posisi baru diikuti `places`, `signAt`, `interior.json`, `INT_B`, `world_design.json`, dan `build_interiors.py` (entri `home` dan `res7` yang sudah dihapus di 9A juga dibuang dari sana).
- Hutan Jamur: ditambah plat (`sign`, `biomeSign:'mushroom'`) di mulut jalan masuk (tile 102,28) seperti biome lain; label melayang tempatnya dimatikan lewat `noLabel` agar tidak ganda. Ditambahkan juga ke `biomeSigns` di `world_design.json`.

## Batch 9B-7 (perbaikan 9C) — 0.4.8-rc.1 — Jalan rumah timur, dek jembatan, jamur bisa dipetik (cache v62)

Dari daftar bug foto no. 5, 6, 7. Data lewat `tools/fix_map_9c.py` (idempoten); tes baru `tools/test_stage_9c.js` (mencakup 9A-9C).

- Jalan ke pintu Rumah Penduduk timur disejajarkan dengan pintunya (3 petak, x=49..51); petak jalan nyasar di (50,20) dibuang.
- Jembatan timur: seluruh dek (y=22..24) kini bisa dilalui. Sebelumnya baris atas/bawah padat sehingga pemain di jalur bawah terhalang. `tools/build_world.py` memakai variabel `w`/`yc` yang tidak ada (UnboundLocalError) di baris ini; diganti sehingga skrip bisa dijalankan lagi.
- Ikon "E" di atas sumber daya (jamur, herba, batu, buah) dihapus.
- Semua jamur dekor di Hutan Jamur (`deco:'mushroom'`) kini bisa dipetik lewat aksi biasa: hilang selama jeda 6 menit lalu muncul lagi di tempat yang sama (`lifeMushState`, `lifeNearResource`, `lifeMarkHarvested`). Batas harian mengumpulkan (`LIFE.gatherCap` = 12) tidak diubah.

## Batch 9B-6 (perbaikan 9B) — 0.4.8-rc.1 — Gerbang ladang, gerbang petualangan simetris (cache v61)

Dari daftar bug foto no. 3 dan 4. Data lewat `tools/fix_map_9b.py` (idempoten), perilaku lewat world.js, hud.js, tilemap.js.

- Ladang: celah utara kini berisi gerbang kayu dua daun (`drawPenGate`) yang membuka saat pemain mendekat; nama "Ladang" tampil sebagai label melayang yang memudar. Tombol aksi "LADANG", pesan "Ladangnya di petak rumput terbuka", label permanen di bawah ladang, dan sorot kuning saat didekati dihapus (tanaman kini ada di dalam ladang).
- Gerbang petualangan: menara kanan digeser dari x=560 ke 544 sehingga kedua menara simetris terhadap jalan (x=29..32, sumbu x=31); `bld.G` menjadi [27,8,34,8]. Dua plat kosong dihapus, nama "Gerbang" jadi label melayang (`labels` di data dunia). Sorot dan label permanen gerbang dihapus; dialog gerbang tetap lewat tombol aksi.

## Batch 9B-5 (perbaikan 9A) — 0.4.8-rc.1 — Taman Desa, ladang tunggal, jalan sejajar pintu (cache v60)

Dari daftar bug foto no. 1 dan 2. Dijalankan lewat `tools/fix_map_9a.py` (memutakhirkan `index.json`, chunk, dan `village.json`; idempoten).

- Dihapus: Rumah Kamu (`b_home`, berisi tempat tidur + peti), rumah penduduk selatan (`b_res6` di x=35,y=32), padang berpagar timur (pagar, tebing bertingkat, tangga) beserta jalan penghubung pintunya. Peti tetap ada di Barak dan Pondok Penebang; entri `home` dan `res7` dihapus dari `INT_B` dan `interior.json`.
- Diisi Taman Desa: petak bunga, bangku, dan lampu simetris di kedua sisi jalan utama (sumbu x=31), padang lapang dengan pohon di tepi selatan/timur, dua petak bunga simetris di sekitar lampu x=45.
- Petak tanam 6x4 (24 petak) dipindah ke ladang barat berpagar (x=11..16, y=30..33). Pagar utara ladang diberi celah di ujung jalan setapak (x=13..14), diatur lewat `farmGate` di data dunia dan dibaca `farmRect`/`farmFence` di tilemap.js. Pintu bergerak, plat, dan sorot dekat ladang menyusul di 9B.
- Jalan ke pintu Toko disempitkan jadi 2 petak (x=19..20) dan jalan ke Rumah Penduduk barat dilebarkan jadi 3 petak (x=11..13) sehingga simetris terhadap pintu masing-masing.

## Batch 9B-4 — 0.4.8-rc.1 — Perbaikan jembatan, pagar ladang, sprite rusak (cache v59)

- Pagar ladang digambar ulang dengan `drawFence` (`farmFence` di tilemap.js): tiang sudut, balok menyambung, tanpa celah di sudut.
- Sprite `flower_7` (blok oranye, crop atlas salah) dihapus dari dunia (71 objek) dan dari pembangkit dekor.
- Jembatan timur: baris pagar atas/bawah kini padat (hanya baris tengah bisa dilalui); tiang simetris (x=55 dan 58); tile tepi sungai lama di ujung kiri dihapus; ujung kanan dicerminkan agar sama dengan kiri.
- Bangunan: jalan setapak dari pintu Bengkel, Dapur, Balai Desa, dan Pondok Penebang ke jalan terdekat (juga ditambah di `world_design.json`); pohon/batu/semak yang menumpuk di bangunan atau menghalangi pintu dihapus.
- Desa: lorong timur-barat di depan pintu barisan rumah utara (y=13) plus penghubung ke jalan utama; jalan pendek ke pintu rumah selatan dan rumah timur; semak/batu di jalur dihapus.
- Petak kebun 6x4 dipindah dari depan Barak (menimpa sprite bangunan) ke padang berpagar di timur-selatan desa (x=39..44, y=29..32).
- Jembatan barat: ujung bawah kiri dan kanan kini memakai tutup rel yang sama dengan sisi atas.

## Batch 9B-3 — 0.4.8-rc.1 — Gerbang kandang dan papan nama dinding (cache v58)

- Kandang: plat nama dihapus (hewan sudah menjelaskan isinya); celah pagar selatan kini berisi gerbang kayu dua daun yang membuka ke dalam saat pemain mendekat atau masuk (`drawPenGate`, easing di `Tmap.update`).
- Bangunan (Bengkel, Dapur, Balai Desa, Pondok Penebang, Pondok Nelayan): plat bertiang di jalan diganti papan nama yang menempel di dinding tepat di atas pintu; posisinya dihitung otomatis dari data `door` sprite (`wallSign`).
- Tempat tanpa bangunan (Pasar, Dermaga, Kebun Buah, Hutan Jamur): tiang plat dihapus; nama tampil sebagai label melayang yang memudar saat pemain dekat.

## Batch 9B-2 — 0.4.8-rc.1 — Polish dunia: jembatan, bangunan, kandang, sumber daya, memancing (cache v57)

- Jembatan kayu kini tepat menutupi air (x=54..59) dengan satu petak tumpuan di tiap sisi; tidak lagi menjulur ke darat.
- Footprint collision bangunan diturunkan dari ukuran sprite; baris di depan pintu selalu bebas dan dua baris di depannya bebas pohon acak (tidak ada dinding tak terlihat).
- Plat nama bangunan berdiri di sisi kanan-depan (tidak menimpa pintu). Papan/plat dan labelnya digambar di lapisan atas sehingga tidak tertutup pohon; lebar plat menyesuaikan teks. Area 5x5 di sekitar papan biome bebas pohon.
- Hutan Jamur memakai jamur animasi asli Sunnyside (tools/add_mushrooms.py), bukan batu berkilau emas. Batu `rock_*` kini padat (tidak bisa ditembus).
- Sumber daya (jamur, pohon, herba, buah, batu): setelah dipanen hilang total tanpa bayangan/tunggul/timer, lalu muncul lagi di titik acak yang valid di zona yang sama (hutan tetap di hutan). Bekas pohon tidak lagi menjadi dinding tak terlihat. Simpanan lama dimigrasi otomatis.
- Kandang dipisah per spesies (ayam, domba, sapi, babi): pagar menyambung, pintu di sisi selatan, interior bisa dimasuki, hewan hanya berkeliaran di kandangnya. Dari dalam/depan kandang, tombol aksi mengambil telur/susu/truffle/wol langsung atau membuka menu kandang.
- Memancing hanya di laut/danau (badan air luas) dan pemain harus menempel ke tepi air; pelampung selalu mendarat di air dalam.
- Bayangan kontak di bawah bangunan. Tes baru: tools/test_polish_10a.js.

## Batch 9B — 0.4.7-rc.2 — Satu kios pasar (cache v56)

- Dua kios merah identik (Pasar Desa + Kasir Pasar) digabung jadi satu: tempat pasar dipindah ke posisi kasir (x=34) tanpa sprite sendiri, sehingga label "Pasar Desa" dan aksi kasir berada di kios yang sama. Cache service worker dinaikkan agar perangkat yang sudah memasang v55 memuat peta baru.

## Batch 9A — 0.4.7-rc.1 — Jembatan kayu, pembersihan peta & HUD fokus (cache v55)

- Gapura biome dihapus (`biomeGates` kosong; papan nama biome tetap). Papan biome Meadow dipindah dari atas jembatan ke samping jalan.
- Penumpukan bangunan diperbaiki: Pasar Desa digeser ke x=30 dan Kasir Pasar ke x=34 sehingga kios tidak saling menimpa dan tidak menimpa bangku. Tes baru memeriksa semua sprite bangunan/kios bertubuh >= 30 px tidak bertumpuk.
- Jembatan timur diganti jembatan kayu: papan berlapis dengan pagar, tiang, balok ujung, tiang berlapis di atas air, dan bayangan di air. Tile baru id 128-143 (`tools/build_bridge_tiles.py`, `assets/world/bridge_tiles.json`; sheet tiles.png jadi 5 baris); `build_world.py` memakai `style: plank`.
- Minimap langsung terbuka penuh sejak awal (tanpa penemuan wilayah); penemuan biome hanya memicu banner.
- Panel FOKUS pindah ke bawah minimap (mengikuti skala UI) dan bisa diminimalkan dengan ketuk; status `S.journal.fmin` tersimpan.
- Batas bertani dan memancing: sudah dihapus sejak 8J, diverifikasi tidak ada sisa batas harian pada panen/memancing. Tidak ada popup "E / KETUK" atau "MEMANCING/GIGITAN" dekat air (tes memeriksa seluruh js/ kecuali kamus i18n; entri kamus lama tak terpakai tetap ada).
- Urutan pembangunan ulang dunia: `build_bridge_tiles.py` -> `build_world.py` -> `build_lights.py`. Patch kode: `tools/patch_9a.py`. Tes: `tools/test_stage_9a.js`.

## Batch 8J — 0.4.6-rc.1 — Pembersihan pasca-audit (cache v54)

- Menghapus batas harian panen ladang dan memancing; panen selalu memberi hasil penuh dan tetap memerlukan alat terpilih.
- Memancing tanpa popup: tombol "E / KETUK" dan kotak "GIGITAN!" dihapus; tarik hanya lewat ikon tangan kanan-bawah dan sesi menutup otomatis setelah tangkapan.
- Benih awal mengikuti kapasitas tas dan diberikan bertahap bila tas penuh; key benih bernilai nol dibersihkan.
- Menghapus layar ladang lama (`drawFarm`, `farmTap`, `farmClick`) beserta kait di `screens.js` dan `input.js`.
- Menulis ulang teks dunia (NPC, toast ladang/pancing/tas/bengkel) dengan nada hangat, ringkas, santai, dan menenangkan; deskripsi aplikasi disamakan.
- Menghapus tutorial awal: layar Cara Bermain tidak lagi muncul otomatis saat Main pertama (tetap bisa dibuka dari menu) dan petunjuk sekali-tampil di pertempuran dihapus.
- Menyeragamkan teks sistem (peternakan, toko, misi, kehidupan desa, tutorial milestone) ke gaya ringkas tanpa seruan dan kata baku berlebihan.
- Merapikan komentar kode dari label proses internal, menaikkan cache service worker ke `v54`.

## Batch 8H+8I — 0.4.6-rc.1 — Tutorial milestone persisten, audit konsistensi & profiler (cache v53)

- Menambahkan status tutorial per topik `belum/berjalan/selesai` melalui `Save.*`, pemulihan fase setelah reload, dan pencegahan kemunculan ulang setelah selesai. Urutan milestone: Stage 2 toko/gacha, Stage 5 bertani, Stage 6 memancing, lalu kebun buah, kumpul, dan masak. Fase LANJUT/SIMPAN perlu konfirmasi eksplisit; jika Save gagal, tutorial tidak ditandai selesai.
- Menerapkan alur tujuh fase: penanda, satu instruksi, sorot kontrol, tunggu aksi nyata, konfirmasi, lanjut, simpan. Tutorial tidak memindahkan karakter; lewati hanya melalui tindakan eksplisit pemain.
- Menyamakan toast syarat alat terkunci menjadi 2,5 detik tanpa panel/gembok besar.
- Menambahkan profiler opt-in `?perf=1` untuk FPS saat ini/rata-rata dan JS heap saat browser menyediakan `performance.memory`; nilai FPS/memori runtime belum direkam karena Chromium headless timeout.
- Mengaudit bagian 13 spesifikasi, memperbarui checklist publikasi dan status release candidate, menambahkan regresi tutorial/profiler, serta menaikkan cache service worker ke `v53`.
- `npm test` lulus pada repo kerja dan paket ekstraksi. Chromium headless visual dan tes HP fisik belum selesai; izin distribusi aset tetap menjadi gerbang. **Tidak ada deployment publik.**

## Batch 8F+8G — 0.4.5-rc.1 — Lampu rumah, layanan objek, signage biome & rute peta aman (cache v52)

- Memperbarui `tools/build_lights.py` agar menghasilkan metadata jendela malam untuk 14 sprite rumah `b_*`; setiap kotak jendela divalidasi di dalam sprite dan tidak boleh menimpa area pintu. Cahaya di-render oleh runtime, pintu tetap dapat dimasuki.
- Memperluas `assets/world/interior.json` ke v2 dengan registry entry/exit untuk 15 bangunan. Kamera interior tetap adaptif; keluar memulihkan posisi pintu dan tool terpilih. Layanan tetap eksplisit: kasir untuk transaksi toko, mesin gacha khusus, dapur/barak/balai memakai objek interior, papan misi dan palung pakan adalah objek fisik; berdiri di dekat bangunan tidak otomatis membuka menu.
- `tools/world_design.json` dan `tools/build_world.py` kini menghasilkan 5 papan nama biome di dekat jalur, 2 gapura visual untuk perbatasan besar, serta objek layanan papan misi/kasir/palung. Label biome terikat pada papan dan memudar berdasarkan jarak; tidak menambahkan collision pada papan/gapura.
- Peta dunia tidak lagi menampilkan nama biome permanen di dalam wilayah. Waypoint kini memilih petak aman yang dapat dicapai dan memakai BFS empat-arah untuk mengarahkan kompas mengelilingi air, pohon, bangunan, dan penghalang; jalur buntu ditandai jelas dan tidak menghasilkan arah lurus menembus penghalang.
- Menambahkan regresi Tahap 8F+8G untuk pintu bangunan, jendela/pintu, objek layanan, signage/gapura, dan routing waypoint. Cache service worker dinaikkan ke `v52`.
- Uji Chromium headless dan HP fisik tetap gate manual; proyek tetap privat. Lisensi/distribusi aset turunan harus ditinjau ulang sebelum publikasi.

## Batch 8D+8E — 0.4.4-rc.1 — Farming dunia, memancing, tebang & tambang (cache v51)

- Ladang sekarang berupa petak dunia 6×4 di grass patch terbuka; save lama ditambah petaknya tanpa memotong data. Tap/swipe memproses setiap sel sekali per gesture, melewati sel yang terhalang, dan benih divalidasi sebelum dikurangi. Siklus cangkul → benih → isi ember di air → siram → panen menggunakan state moisture yang sama untuk hujan dan siram manual.
- Crop memakai enam tahap atlas Sunnyside (`crop_*_0` sampai `_5`, bersumber dari `*_00` sampai `*_05`); avatar mendapatkan animasi WATERING 5 frame. Tombol aksi tidak lagi membuka layar farming lama.
- Memancing tetap di dunia: aksi pertama melempar kail, pelampung/riak memberi tanda, aksi kedua saat gigitan menjalankan REELING 13 frame dan memperbarui buku/stok ikan; hasil ditampilkan sebagai toast `+1 Ikan`, tanpa popup besar.
- Pohon tepi hutan dapat ditebang dengan AXE 10 frame, meninggalkan tunggul yang bisa dibersihkan; pohon inti/unik dilindungi. Batuan menggunakan MINING 10 frame. Sumber diberi cooldown dan muncul kembali; material berlebih menjadi world drop yang terlihat dan bisa diambil parsial ketika ruang tas tersedia.
- Menambah `tools/test_stage_8de.js` (59 pemeriksaan); `npm test` juga memeriksa 6×4, sapuan tanpa aksi ganda, benih kurang/negatif, kelembapan bersama, urutan pancing, perlindungan pohon dan resource marker inti, tunggul, kapasitas penuh/partial drop, dan frame atlas.
- Nilai waktu gigitan, pertumbuhan tanaman lama, dan respawn masih `PLACEHOLDER` untuk tuning; tidak dianggap angka final. Service worker dinaikkan ke `v51`; atlas dan karakter menjadi bagian precache wajib. Proyek tetap privat.
- Chromium headless masih timeout tanpa DOM/screenshot; uji HP fisik belum dilakukan.

## Batch 8C — 0.4.3-rc.1 — Hotbar, tas + peti, dan transfer aman (cache v50)

- Enam alat dasar hotbar terkunci dari penimpaan; 10 slot sisanya mengikat material dari tas, menampilkan jumlah, dan tetap memakai swipe halaman. Konfigurasi pembuka alat terpusat dengan tanda `PLACEHOLDER`.
- Gudang menjadi dua panel tas/peti, pilih sumber lalu tujuan, split 1/setengah/semua, quick-store/take, dan sort kategori/nama/jumlah. Daftar tidak diurutkan ulang saat jumlah berubah; hanya tombol sort yang mengubah urutan.
- Transfer bahan menghitung batas tujuan sebelum mutasi dan hanya mengurangi sumber sebanyak yang benar-benar muat. Crafting dan upgrade tetap memeriksa kapasitas/bahan sebelum biaya; upgrade peti tidak memangkas isi lama. Hadiah equipment tertunda dapat dibuka langsung dari panel tas/peti.
- Menambahkan atlas material turunan `assets/world/items.png` melalui `tools/build_inventory_icons.py` dari ikon terpilih 99 Ingredients dan simbol resource sederhana. ZIP pack dan berkas Aseprite tidak dimasukkan ke repo.
- Menambah regresi `tools/test_inventory_storage.js`; memperbarui versi repo ke `0.4.3-rc.1`, service worker/cache ke `v50`, katalog aset, kredit, roadmap, dan catatan implementasi.
- Status validasi perangkat harus dicatat terpisah: tes otomatis dijalankan pada batch ini; Chromium headless/HP fisik belum diklaim lulus. Proyek tetap privat.

## Batch 8B — 0.4.2-rc.1 — HUD responsif, safe area, dan pengaturan (cache v49)

- Mencegah minimap ganda dan banner biome permanen; banner besar hanya ditampilkan saat biome pertama kali ditemukan, sedangkan toast biasa lebih ringkas.
- Memisahkan panel FOKUS dari minimap/banner dan memastikan teks HUD baru minimal 9 px.
- Menghormati safe-area viewport, mempertahankan instruksi rotasi portrait, menangkap pointer UI, dan memperbesar hitbox hotbar/aksi serta tombol pengaturan menjadi minimal 44 CSS px efektif.
- Menambahkan skala UI 3 tingkat serta membagi Pengaturan ke halaman ringkas agar target sentuh tidak saling menimpa; volume, getaran, pengurangan efek, dan ukuran UI tetap memakai Save.*.
- Menambah regresi untuk skala/hitbox HUD, penyimpanan pengaturan, penemuan biome idempoten, input yang tidak tembus, serta pemulihan posisi/tool setelah panel ditutup.
- Memperbarui spesifikasi, roadmap, catatan implementasi, dan cache service worker ke `v49`.
- `npm test` lulus; Chromium headless timeout sebelum menghasilkan DOM/screenshot, dan pengujian HP nyata tetap terbuka. Proyek tetap privat dan tidak dipublikasikan.

## Batch 7+ — 0.4.1-rc.2 — Tahap 8A: HUD kontekstual + interior bangunan (cache v48)

## Batch 7+ — 0.4.1-rc.2 — Tahap 8A: HUD kontekstual + interior bangunan (cache v48)
- Baru `js/interior.js`: 15 bangunan desa punya interior yang bisa dijelajahi (Toko dengan kasir + mesin gacha, Barak, Balai Desa, Bengkel, Dapur, Rumah Kamu, Pondok Penebang/Nelayan, 7 rumah penduduk). Masuk lewat tombol aksi MASUK di pintu; KELUAR kembali ke pintu luar. Posisi interior tidak disimpan: save selalu pulih di pintu luar. Menu/transaksi hanya terbuka lewat objek (kasir, mesin gacha, kompor, meja kerja, dst.).
- Baru `js/hud.js`: minimap kiri-atas tanpa judul (ketuk = peta dunia), hotbar 8 slot (ketuk pilih, geser = halaman 2), satu tombol aksi ikon tangan dengan label kontekstual, jam HH:MM. Tool terpilih di `S.hb` (save lama tanpa field ini tetap valid).
- Alat menentukan aksi: Kapak = tebang, Beliung = gali, Tangan = petik, Pancing = lempar kail; alat tidak sesuai menampilkan petunjuk, bukan aksi. Ember punya status kosong/berisi.
- Bangunan terkunci tidak lagi digelapkan/bergembok: coba masuk -> toast syarat 3 detik.
- Eksterior rumah diganti dari `Houses_Sprite_Sheet.png` (15 bangunan, `b_*` di sprites.png). Pembangun: `tools/build_interiors.py`; pemasangan kode: `tools/patch_8a.py`. Tes: `tools/test_interior_hud.js`.
- Dikecualikan/ditunda: jendela menyala malam untuk rumah baru, Gerbang/Papan Misi/Pasar/Kandang tetap objek luar, farming sapuan, memancing tanpa popup, papan biome, tutorial, hotbar item bebas.

## Batch 7 — Release Candidate Hardening (`0.4.0-rc.1`, `sw.js` cache v47)

- Reconfirmed baseline by running the full `npm test` suite on the release candidate.
- Added `tools/test_release_integrity.js` to validate version/cache consistency, entry-point script precache coverage, GitHub Pages workflow safety, release docs, and common accidental-artifact exclusions.
- Added the release-integrity check to the standard `npm test` pipeline so local checks and GitHub Actions use the same acceptance gate.
- Refreshed active README/roadmap with acceptance-status accounting; historical batch notes remain unchanged.
- Added a release-candidate checklist that separates passed automation from still-pending mobile, visual, license and public-deployment gates.
- Bumped the service-worker cache to `v47` so deployed clients request the new release shell.
- Public release is still blocked on third-party asset distribution review and physical-device testing.

## Batch 6 — World Map & Dungeon Integration (`sw.js` cache v46)

- Added a world-map overlay: primary biome regions remain visible while tile detail and points of interest reveal through exploration.
- Removed the unconditional whole-map discovery migration; legacy `disc='*'` saves migrate to the explored radius around the saved player position.
- Added safe world-map waypoints with a direction/distance cue; waypoints do not teleport the player and cannot be set on undiscovered tiles.
- Added a three-room Forest Ruins dungeon accessible from the adventure gate after Main Stage 3 and the opening tutorial. The final room is a boss fight.
- Dungeon room checkpoints survive reloads/defeats; normal room gold and material drops are reduced for repeat clears and the primary final-room reward is one-time.
- Added regression coverage for dungeon progression, checkpoint persistence, replay reward reduction, primary reward idempotency, and waypoint discovery rules.
- Updated runtime cache to `v46` and package version to `0.3.0`.
- Automated tests pass; full visual and touch QA on a physical phone remains pending.

## Batch 5 — Journal & Resident Bonds (`sw.js` cache v45)

- Added a Journal tab and saved focus for the next Main Stage, daily quest, village story, or village request.
- Added world HUD focus text and idempotent first-visit biome discovery tracking.
- Added persistent NPC relationship tiers, per-day voluntary conversation progress, village request/story contribution, one-time tier rewards, and relationship milestone dialogue.
- Added two resident-relation-gated kitchen recipes and a compact kitchen layout for six recipes.
- Expanded achievements with village, crafting, fishing, exploration, and relationship goals.
- Expanded English translations and bumped the service-worker cache to `v45`.
- Added regression coverage for Journal, relationship rewards, recipe unlocking, and biome discovery.

## Batch 4 — Combat & Boss Foundations (`sw.js` cache v44)

- Armor damage mitigation is capped at 25% and shown in equipment detail.
- Timed attack buff refresh replaces the active modifier rather than stacking modifiers.
- Main-stage/tower bosses display health and phase UI; the 50% threshold triggers one transition announcement per boss instance.
- Persistent `bossClaims` prevents repeat primary rewards and migrates legacy stage-claim data; replay gold is reduced.
- Added/extended automated regression coverage across save recovery, storage/workshop, farming/weather, ranch offline production, combat and boss reward behavior.

Earlier batch notes are in `docs/implementation-history/`.
