# HERO BATTLE — SPESIFIKASI INDUK
**Versi:** 1.0  
**Status:** Perencanaan — belum memberi izin implementasi  
**Batas:** Tidak ada kode yang diubah dalam penyusunan dokumen ini.

> **Terminologi:** WAJIB = keputusan yang disepakati atau penjaga konsistensi; REKOMENDASI = masih dapat ditinjau; TBD = belum diputuskan.

## 1. Tujuan dan status dokumen

Dokumen ini menyatukan keputusan desain Hero Battle yang telah disepakati dalam percakapan. Fungsinya sebagai acuan produk, UI/UX, gameplay, penyimpanan data, pengujian, dan urutan implementasi.

Status: SPESIFIKASI PERENCANAAN. Tidak ada kode yang diubah melalui penyusunan dokumen ini. Implementasi hanya boleh dimulai setelah pemilik proyek memberi izin secara eksplisit.

Makna istilah: “WAJIB” berarti aturan yang telah disepakati atau diperlukan untuk menjaga konsistensi sistem; “REKOMENDASI” berarti rancangan yang disarankan dan masih dapat ditinjau; “TBD” berarti angka atau detail yang belum diputuskan.

## 2. Visi produk dan platform

Hero Battle adalah game hybrid farming dan adventure. Pemain membangun desa dan mengelola sumber daya, lalu menjelajahi area, melawan musuh, mengumpulkan material, menyelesaikan quest, dan memperkuat karakter.

Target interaksi utama adalah layar sentuh di HP dalam orientasi landscape. Tata letak, ukuran hitbox, dan jarak kontrol harus dirancang untuk orientasi ini; antarmuka tidak boleh bergantung pada hover.

- Kegiatan desa dan petualangan harus saling mendukung dan memiliki nilai progres yang seimbang.

- Pemain tidak dihukum berat karena berhenti bermain atau tidak login selama beberapa hari.

- Progress, hadiah, transaksi, dan unlock harus konsisten setelah pergantian area, restart, atau pemulihan sesi.

- Semua gedung dirancang memiliki interior yang dapat dijelajahi; masuk ke gedung tidak otomatis membuka panel atau menu.

## 3. HUD, kontrol, dan interaksi kontekstual

HUD menggunakan layar landscape dengan kontrol sentuh yang stabil dan tidak saling bertabrakan. Pemain harus dapat mengenali aksi yang tersedia tanpa memenuhi layar dengan teks.

- Joystick tetap di kiri bawah; hotbar 8 slot di tengah bawah; aksi utama dan maksimal dua aksi kontekstual di kanan bawah.

- Hotbar mendukung swipe horizontal untuk slot tambahan. Tool dipilih dengan mengetuk slot.

- Minimap terlihat sejak awal di kiri atas tanpa label “minimap”; jam digital kecil di kanan atas; cuaca disampaikan lewat efek dunia, bukan teks cuaca permanen. Minimap tidak boleh digambar ganda. Panel FOKUS berada di bawah area minimap; toast biasa harus ringkas, sementara banner besar hanya muncul saat biome pertama kali ditemukan atau momen cerita.

- Tas/menu diletakkan di sisi kanan tanpa bertabrakan dengan tombol aksi.

- Tombol UI tidak boleh meneruskan sentuhan ke dunia permainan. Target sentuh didasarkan pada hitbox, bukan hanya ukuran ikon. Target sentuh efektif minimum 44 CSS px pada landscape mobile; skala UI tidak boleh memotong kontrol atau membuat hitbox berdekatan saling tumpang-tindih.
- Safe area perangkat harus dihormati. Pada HP dalam portrait, tampilkan instruksi untuk memutar perangkat ke landscape dan cegah permainan terlihat seperti tata letaknya rusak.

- Aksi menggunakan kedekatan dan arah hadap karakter, dengan auto-facing ringan. Jangan membuat karakter berjalan jauh otomatis, menembus hambatan, atau mengabaikan rintangan.

- Label aksi berubah menurut konteks, misalnya CANGKUL, SIRAM, BICARA, BELI, MASUK, PANEN, dan SERANG.

- Panel penuh—inventaris lengkap, transaksi toko, pemilihan resep, gacha jika ada, dan panel penuh lain—menghentikan simulasi permainan. Menutup panel mengembalikan posisi serta tool terpilih.

- Toast dan petunjuk kecil tidak menghentikan permainan. Konfirmasi pembelian penting menghentikan permainan sampai pemain memilih.

## 4. Farming, gathering, pohon, dan memancing

Aktivitas dunia menggunakan pola interaksi yang konsisten: pilih tool atau item, dekati objek, arahkan karakter, lalu gunakan aksi kontekstual.

- Farming mendukung tap satu petak dan swipe melewati petak bersebelahan. Setiap petak hanya diproses sekali per gesture; petak tidak valid dilewati; gesture tidak menembus bangunan atau memicu interaksi NPC.

- Ketersediaan sumber daya diverifikasi per petak. Jika benih tidak cukup, hanya jumlah petak yang mampu diproses yang ditandai valid; tidak boleh ada konsumsi diam-diam.

- Siklus petak dunia adalah cangkul → tanam benih dari tas/hotbar → isi ember di dekat air → siram → panen. Status rumput/tanah basah/tanah dicangkul/tanaman tumbuh/matang harus tampak di dunia. Siklus kelembapan menggunakan satu field state: hujan dan siram manual memanggil aturan yang sama dan satu petak tidak memperoleh bonus siram berulang dalam siklus yang sama.

- Cangkul, penyiraman, dan penanaman menggunakan pola sapuan yang sama sejauh sesuai dengan tool. Joystick boleh menerima pointer lain secara bersamaan; satu gesture tidak boleh mengulang aksi pada petak yang sama.

- Pohon di tepi hutan dapat ditebang dan meninggalkan tunggul; tunggul dapat dibersihkan. Hutan inti dan pohon quest/unik dilindungi.

- Pohon tumbuh kembali setelah jeda atau dapat ditanam sebagai bibit. Satu pohon per aksi; upgrade kapak dapat mengurangi jumlah ayunan. Batu dapat ditambang dengan beliung dan muncul kembali setelah jeda. Jika kapasitas tas penuh, kayu/batu dijatuhkan di dekat sumber sebagai drop dunia yang terlihat dan dapat diambil sebagian setelah ruang tersedia.

- Pohon yang tumbang tidak boleh memblokir jalur utama. Frekuensi tumbuh kembali mengikuti jenis pohon dan biome; angka durasi masih TBD.

- Memancing: pilih pancing, dekati spot, tekan aksi untuk melempar, tunggu tanda ikan menggigit, lalu tekan dalam jendela waktu. Tidak ada popup besar yang muncul mengelilingi air.

- Feedback aksi singkat, misalnya “+3 Kayu” atau “+1 Ikan”. Hasil pancing memperbarui koleksi/buku ikan, tanpa popup besar; pelampung dan riak menjadi indikator gigitan, lalu aksi kedua harus dilakukan dalam jendela waktu. Syarat terkunci baru ditampilkan ketika pemain mencoba melakukan aksi terkait.

## 5. Inventaris, tas, hotbar, dan penyimpanan

Pemain memiliki tas pribadi dan peti. Kapasitas tas meningkat melalui progres. Peti memiliki tingkat kapasitas dan dapat di-upgrade atau diganti dengan versi lebih besar.

- Hotbar menampilkan 8 slot per halaman dan 2 halaman. Enam slot pertama adalah tool dasar terlindungi: tidak boleh dijual, ditimpa, atau dikosongkan oleh pengaturan slot bebas. Slot lainnya dapat diikat ke material yang tersedia di tas; jumlah material ditampilkan dan halaman dapat diganti dengan swipe. Angka pembuka tool masih PLACEHOLDER sampai balancing disetujui pemilik. Tool yang dipakai, item quest, dan item penting dikecualikan dari aksi jual atau pindah massal.

- Item otomatis menumpuk sampai batas stack; split stack manual didukung. Pemain dapat memindahkan sebagian stack dengan opsi 1, setengah, atau semua.

- Panel penyimpanan menampilkan tas dan peti berdampingan. Pemain memilih sumber/material lebih dahulu lalu memilih tujuan. Split 1/setengah/semua, quick-store/take, serta sort kategori/nama/jumlah tersedia. Urutan tampilan tidak berubah setelah jumlah berganti kecuali pemain memilih sort.

- Quick-store untuk item serupa/yang memenuhi syarat dan quick-take untuk item yang memenuhi syarat tersedia. Pengurutan berdasarkan kategori, nama, atau jumlah disediakan. Urutan item tidak berubah kecuali pemain memilih sort.

- Jika kapasitas peti baru lebih kecil daripada isi peti lama, penggantian ditolak atau peti harus dikosongkan lebih dahulu. Isi peti tidak boleh hilang karena upgrade.

- Tas penuh ketika membeli: transaksi ditolak sebelum uang dipotong. Tas penuh ketika panen: panen tetap di sumber jika mungkin; hasil hewan tetap di tempat produksi/penampungan.

- Material umum yang gagal masuk tas dapat jatuh di dekat pemain/sumber. Material khusus memakai penyimpanan sementara terbatas yang kapasitasnya terlihat.

- Jika penyimpanan sementara penuh, pemain menerima peringatan dan pilihan aman. Item tidak pernah dihapus diam-diam. Aturan untuk loot, quest rewards, dan hasil produksi harus menggunakan kebijakan penyimpanan yang sama atau menyatakan pengecualian dengan jelas.

- Hadiah quest yang tidak muat ditahan untuk diklaim kemudian atau masuk ke penyimpanan aman yang disepakati; hadiah tidak hilang.

- Crafting dan pemrosesan memvalidasi semua bahan serta kapasitas semua output sebelum menghabiskan bahan atau memulai proses. Jika output tidak muat, proses tidak dimulai.

- Hasil mesin yang selesai tetap menunggu untuk diklaim jika kapasitas tidak cukup. Peti/mesin tidak boleh menghapus hasil secara diam-diam.

## 6. Crafting, pemrosesan, equipment, dan tool

Meja crafting digunakan untuk tool, bahan bangunan, dan equipment; dapur digunakan untuk makanan dan buff; mesin pemrosesan mengubah bahan mentah menjadi produk.

- Resep yang sudah diketahui tersimpan. Resep dengan bahan kurang dinonaktifkan atau menunjukkan kekurangan tanpa memulai proses.

- Crafting berulang hanya diizinkan jika bahan dan kapasitas seluruh output mencukupi. Validasi dilakukan sebelum bahan dikonsumsi.

- Upgrade tool standar bersifat permanen dan tidak membutuhkan perbaikan rutin. Durability hanya direncanakan untuk tool/perlengkapan khusus.

- Rekomendasi: ketika durability item khusus mencapai nol, item tidak menghilang; kemampuan khususnya tidak tersedia sampai diperbaiki.

- Equipment petualangan memiliki slot tetap: senjata, armor, aksesori 1, aksesori 2, dan consumable. Pergantian equipment dilakukan melalui panel equipment.

- Equipment yang sedang dipakai dilindungi dari penjualan massal atau pemindahan tidak sengaja. Tool farming dan senjata petualangan memiliki peran yang jelas dan tidak otomatis saling menggantikan.

- Senjata memiliki pola seperti cepat, berat, atau jangkauan panjang. Armor dapat membedakan pertahanan dan mobilitas. Aksesori memberi variasi build, bukan syarat wajib untuk konten utama.

- Upgrade equipment meningkat terukur; equipment lama tidak langsung menjadi tidak berguna. Detail statistik dan biaya upgrade masih TBD.

## 7. Ekonomi, bangunan, desa, dan hewan

Ekonomi memiliki sumber dari hasil panen, material, barang olahan, serta permintaan penduduk. Material mentah harus tetap memiliki kegunaan untuk crafting dan upgrade sehingga menjual semuanya tidak selalu menjadi pilihan optimal.

- Bangunan utama: balai desa untuk upgrade/noticeboard/permintaan; pandai besi atau workshop untuk upgrade tool; toko dengan transaksi di kasir; rumah pemain untuk penyimpanan, istirahat, dan fitur rumah; dapur untuk memasak; barak untuk persiapan equipment dan akses pertempuran.

- Masuk bangunan tidak membuka menu otomatis. Menu atau transaksi dibuka saat berinteraksi dengan fasilitas yang relevan, misalnya kasir atau meja kerja.

- Village Level mengatur perkembangan bangunan dan unlock ekonomi; Main Stage mengatur cerita dan konten petualangan; tutorial merupakan syarat terpisah sesuai fitur.

- Setiap upgrade bangunan sebaiknya memiliki satu manfaat utama dan beberapa manfaat tambahan; jangan membuka terlalu banyak fitur sekaligus.

- Hewan menghasilkan produk berkala seperti telur, susu, wol, atau produk khusus. Sistem ini tidak menghukum ketidakhadiran pemain dan tidak membuat hewan mati atau produk hilang karena pemain offline.

- Produksi offline dibatasi durasi dan kapasitas penyimpanan. Batas durasi, formula catch-up, dan kapasitas numerik masih TBD.

- Harga total ditampilkan sebelum konfirmasi pembelian. Jual sebagian stack didukung. Penjualan massal mengecualikan item quest, tool dasar, dan tool yang sedang digunakan.

- Quest dapat memberi uang, material, reputasi, atau unlock. Barang mentah tidak boleh selalu lebih menguntungkan dijual daripada diproses.

## 8. Pertempuran, musuh, bos, status, dan buff

Pertempuran menggunakan model real-time action. Pemain mengendalikan gerak, serangan, dan menghindar secara langsung melalui kontrol layar sentuh.

- Joystick kiri untuk bergerak; serangan utama di kanan bawah; tombol menghindar dan skill khusus berada di dekat serangan. Serangan biasa tidak menghabiskan stamina kecuali ditetapkan berbeda saat balancing.

- Arah serangan berdasarkan arah hadap dan dapat sedikit menyesuaikan ke musuh terdekat. Tidak ada serangan otomatis tanpa persetujuan pemain.

- Kategori musuh: biasa, elite, dan bos. Serangan kuat diberi tanda yang terbaca; musuh tidak menyerang dari luar layar tanpa petunjuk yang adil, tidak muncul tepat di atas pemain, dan tidak menutup satu-satunya jalur keluar.

- Musuh tidak mengejar tanpa batas; jika pemain meninggalkan wilayah tempur, musuh dapat kembali ke area asal. Kesulitan terutama ditentukan oleh area dan jenis musuh; level membantu tetapi tidak meniadakan tantangan.

- Bos dapat dikalahkan ulang. Hadiah utama hanya sekali; pengulangan memberi hadiah lebih kecil. Status bos, hadiah, dan klaim tersimpan secara konsisten.

- HP habis menyebabkan respawn aman di checkpoint atau titik aman terdekat yang sudah terbuka. Tidak ada kehilangan barang atau progres utama. Perlindungan singkat setelah respawn direkomendasikan.

- Setelah kalah, musuh biasa reset mengikuti aturan area; status bos, quest, unlock, dan hadiah yang sah tetap tersimpan.

- Atribut karakter: HP, Attack, Defense, Stamina, Critical Chance, dan Movement Speed. Rekomendasi awal: tonjolkan HP, Attack, dan Defense; atribut lain diperkenalkan bertahap.

- XP diperoleh dari musuh/bos, Main Stage, quest, eksplorasi, dan tantangan yang sesuai. Farming rutin terutama maju lewat ekonomi dan Village Level, bukan menjadi satu-satunya cara menaikkan level petualangan.

- Atribut dasar naik otomatis saat level meningkat. Equipment dan buff membentuk variasi build; pemain tidak mengalokasikan poin atribut per level pada keputusan saat ini.

- Buff sejenis memperbarui durasi tanpa menumpuk kekuatan. Buff dapat berasal dari makanan, ramuan, dan efek khusus. Efek negatif meliputi poison, stun, dan efek sejenis bila dipakai oleh desain musuh.

- Efek status memakai indikator selain warna. Saat kalah, buff sementara berakhir sesuai keputusan desain awal; detail status apa yang bertahan masih perlu ditetapkan sebelum implementasi.

## 9. Dunia, biome, cuaca, dan eksplorasi

Dunia terdiri dari desa, padang rumput, hutan pinggiran, hutan inti, wilayah berbatu/tambang, perairan, serta area khusus cerita dan tantangan. Daftar final biome dan sumber daya masih TBD.

- Peta dunia menampilkan area utama sejak awal; detail lokasi dan rahasia terbuka ketika ditemukan. Minimap tetap tersedia dari awal.

- Papan penanda biome ditempatkan dekat jalur. Nama biome muncul saat pemain dekat dengan papan lalu memudar seiring jarak. Gerbang digunakan untuk transisi besar saja; banner besar dipakai saat penemuan pertama atau momen cerita.

- Kamera menyesuaikan ukuran interior: ruangan kecil terlihat utuh jika masih terbaca, ruangan besar mengikuti pemain dengan batas yang wajar. Pixel art tidak dikecilkan berlebihan hanya agar seluruh ruangan terlihat.

- Keluar dari interior mengembalikan pemain ke pintu eksterior dan mempertahankan state serta tool yang dipilih.

- Cuaca memberi dampak ringan melalui suasana, penyiraman, dan bonus kecil. Hujan dapat menyiram tanaman yang memenuhi syarat. Cuaca ekstrem, bila ada, tidak mengunci area penting atau menghilangkan barang/progres.

- Cuaca ditampilkan melalui dunia, bukan teks permanen di HUD. Siklus waktu dan cuaca saat offline harus mengikuti aturan catch-up berbatas.

## 10. Dungeon, Main Stage, quest, NPC, dan achievement

Dungeon dapat dikunjungi ulang untuk mengumpulkan material dan memperoleh hadiah pengulangan. Main Stage dapat dimainkan ulang, tetapi hadiah cerita utama hanya diberikan sekali.

- Dungeon memiliki pintu masuk/keluar jelas, checkpoint yang sesuai panjangnya, dan variasi pertarungan, eksplorasi, teka-teki sederhana, serta loot. Tidak semua dungeon harus berfokus pada pertempuran.

- Main Stage memiliki satu tujuan utama yang jelas dengan tujuan tambahan opsional. Progress tersimpan per langkah yang telah selesai; pemain boleh kembali ke desa untuk persiapan.

- Quest mencakup cerita utama, permintaan penduduk, eksplorasi, dan tantangan berulang. Beberapa quest boleh aktif sekaligus, tetapi satu quest fokus utama disorot.

- Journal mencatat quest aktif, selesai, dan tersedia. Progress quest tidak hilang saat sesi berakhir. Quest utama tidak gagal permanen karena pemain terlambat; tenggat hanya untuk quest sampingan yang memang dirancang demikian.

- NPC utama memiliki identitas, dialog, fungsi, dan jadwal sederhana. NPC penting tidak boleh hilang permanen akibat waktu atau progres; petunjuk lokasi harus jelas jika mereka berpindah.

- Hubungan penduduk membuka cerita, resep, dan bonus kecil tanpa kewajiban login harian. Tidak ada penurunan hubungan hanya karena pemain offline.

- Achievement mencatat pencapaian desa, progres, dan petualangan; memberi judul, kosmetik, atau hadiah kecil. Achievement bukan syarat progres utama. Hadiah dapat diklaim sekali dan notifikasinya tidak menghalangi kontrol.

- Unlock menggabungkan Main Stage, Village Level, dan tutorial sesuai kebutuhan setiap fitur. Saat pemain mencoba konten terkunci, persyaratan ditampilkan singkat dan jelas.

## 11. Journal, peta, waktu, autosave, dan pemulihan sesi

Journal menjelaskan apa yang perlu dilakukan; peta dunia menjelaskan ke mana harus pergi. Keduanya tidak boleh menduplikasi terlalu banyak informasi atau membebani HUD.

- Journal memiliki bagian Main Stage, quest sampingan, penduduk, dan achievement. Mengganti quest fokus hanya memindahkan penanda navigasi; progress quest lain tetap berjalan dan tersimpan.

- Peta menampilkan desa, bangunan penting, jalur, area, dungeon, tujuan fokus, serta status lokasi relevan. Penanda tidak boleh mengarahkan pemain melalui penghalang yang tidak dapat dilewati.

- Autosave terjadi setelah tindakan penting dan perubahan area. Tindakan penting meliputi transaksi, crafting/pemrosesan yang dimulai atau selesai, klaim hadiah, perubahan inventory, upgrade, perubahan quest, dan unlock.

- Save harus menghindari status setengah jadi. Transaksi uang/item dan klaim hadiah dicatat secara atomik atau melalui mekanisme setara agar tidak ada pemotongan tanpa hasil atau hadiah ganda.

- Saat restart, refresh, atau crash, game memulihkan data valid terakhir. Jika posisi terakhir tidak valid, gunakan titik aman yang sesuai, bukan memaksa pemain kembali ke awal permainan.

- Data pemulihan minimal mencakup posisi/area yang valid, inventory, equipment, tool terpilih, progres Main Stage/quest, Village Level, unlock, klaim hadiah, bangunan/produksi, dan pengaturan pemain.

- Pertumbuhan tanaman/hewan/produksi online maupun offline mengejar waktu berlalu dengan batas durasi dan kapasitas yang disepakati. Catch-up tidak boleh memberi hasil dua kali. Nilai batas masih TBD.

- Indikator simpan bersifat ringkas. Jika save gagal, tampilkan status yang jelas dan jangan menyatakan penyimpanan berhasil sebelum operasi berhasil.

## 12. Pengaturan dan aksesibilitas

- Pengaturan disepakati: ukuran UI, volume suara, getaran, dan pengurangan efek visual.

- Pengaturan tersimpan lintas sesi melalui Save.*. Perubahan ukuran UI tidak boleh membuat kontrol keluar layar, bertabrakan, atau mengurangi target sentuh efektif di bawah 44 CSS px.

- Kontras dan status aktif tidak mengandalkan warna saja. Teks harus terbaca pada layar HP landscape.

- Hitbox tombol cukup besar untuk sentuhan; efek visual tidak boleh menghalangi kontrol; kamera bergerak lembut.

- Posisi dan transparansi kontrol belum termasuk keputusan tetap. Jika akan ditambahkan, perlakukan sebagai fitur lanjutan dan evaluasi dampaknya ke tata letak tetap.

## 13. Audit konsistensi dan aturan pengikat

Audit ini adalah daftar aturan pengikat dan diperiksa terhadap kode kandidat `0.4.6-rc.1` melalui tes regresi yang disebut di [`STAGE-8H-8I-NOTES.md`](../implementation-history/STAGE-8H-8I-NOTES.md). Pemeriksaan otomatis menunjukkan konsistensi kode yang tercakup, tetapi tidak menggantikan pengujian visual/browser dan perangkat nyata; gate publikasi tetap terbuka.

| Area audit | Potensi benturan | Aturan pengikat / keputusan |
| --- | --- | --- |
| Panel penuh vs pertempuran | Panel membuka saat karakter diserang atau aksi dunia tetap berjalan. | Semua panel penuh menghentikan simulasi. Tap UI tidak diteruskan ke dunia; penanganan input harus konsisten. |
| Tas penuh vs loot/quest/produksi | Berbagai sistem dapat memakai aturan berbeda sehingga item bisa hilang. | Tidak ada penghapusan diam-diam. Tetapkan jalur aman per kategori: tetap di sumber, storage sementara yang terlihat, atau hadiah ditahan. Kapasitas harus divalidasi sebelum transaksi/proses. |
| Autosave vs hadiah/transaksi | Uang terpotong tetapi barang tidak diterima, atau hadiah diduplikasi setelah crash. | Transaksi, klaim, dan hasil proses harus diperlakukan atomik/idempoten; status klaim dan barang yang diberikan disimpan bersama. |
| Respawn vs progres bos | Reset musuh dapat salah mengembalikan bos atau memberikan loot utama berulang. | Musuh biasa reset sesuai area; status bos, hadiah utama, quest, dan unlock persisten. Hadiah pengulangan terpisah dari hadiah utama. |
| Level vs kesulitan area | Scaling otomatis dapat meniadakan dampak level atau menjadikan konten lama terlalu sulit. | Kesulitan utama berasal dari area/jenis musuh. Level membantu karakter, tetapi tidak menyamakan semua encounter. |
| Village Level vs Main Stage vs tutorial | Unlock dapat terjadi terlalu cepat atau fitur tak terbuka karena syarat yang tidak jelas. | Setiap fitur mendeklarasikan syaratnya secara eksplisit; ketiga sistem berbeda dan dapat digabungkan sesuai fitur. |
| Offline production vs kapasitas | Catch-up menghasilkan lebih banyak barang daripada kapasitas dan dapat menghapus/duplikasi hasil. | Hitung waktu dengan batas, cek kapasitas, pertahankan hasil di sumber/penampungan yang aman, dan pastikan catch-up hanya berjalan sekali per interval. |
| Tool farming vs equipment | Hotbar dan slot equipment memiliki fungsi tumpang tindih. | Tool farming dipilih dari hotbar; equipment tempur dikelola lewat panel equipment. Item yang sedang digunakan dilindungi dari aksi massal. |
| Waktu/cuaca vs tanaman | Hujan otomatis dan penyiraman manual bisa menghitung efek dua kali. | Status kelembapan tanaman memiliki satu sumber kebenaran; hujan menerapkan efek yang sama dengan aturan penyiraman yang eksplisit. |
| Peta vs navigasi | Penanda quest dapat menunjukkan jalur yang terhalang atau lokasi yang belum tersedia. | Tujuan hanya diarahkan ke jalur valid; unlock yang belum tersedia menjelaskan prasyarat, bukan mengarahkan ke akses yang tidak bisa dipakai. |
| Interior vs kamera | Ruangan kecil atau besar bisa memotong pemain/kontrol atau mengecilkan pixel art. | Kamera adaptif dengan batas interior; HUD tetap; interior tidak membuka menu otomatis. |

### Hasil silang implementasi kandidat `0.4.6-rc.1` (Tahap 8H–8I)

| Aturan bagian 13 | Bukti kode/tes saat ini | Status / sisa verifikasi |
| --- | --- | --- |
| Panel dan input | Suite interior/HUD, urutan input, dan regresi overlay yang ada | Lulus otomatis untuk kasus yang tercakup; tap/gesture di HP tetap perlu diuji. |
| Kapasitas dan kehilangan item | Tes inventori, overflow terlihat, crafting/gather capacity guards | Lulus otomatis pada skenario regresi; save storage penuh di browser nyata tetap terbuka. |
| Transaksi, klaim, dan Save | Suite save recovery, stage rewards, transaksi storage, serta tutorial save-failure rollback | Lulus otomatis untuk kasus yang tercakup; crash/interupsi perangkat nyata belum diuji. |
| Respawn/progres persisten | Tes checkpoint dungeon, hadiah satu kali, lifecycle save dan progres tutorial | Lulus pada suite terkait; QA lintas sesi HP tetap terbuka. |
| Stage vs Village Level vs tutorial | `HB_TUTORIAL_TOPICS` memisahkan prasyarat stage/topik dan status `belum/berjalan/selesai` | Lulus tes milestone Stage 2 toko/gacha, Stage 5 bertani, Stage 6 memancing lalu kebun/kumpul/masak. |
| Produksi offline dan kapasitas | Tes catch-up bounded dan kapasitas ternak/life | Inti otomatis tercakup; balancing/edge-case tambahan tetap mengikuti roadmap. |
| Hotbar vs equipment | Tes protected tool slots dan pemulihan hotbar/tool | Lulus pada tes inventory/HUD; pengoperasian sentuh riil belum diverifikasi. |
| Hujan vs siram manual | Tes moisture bersama pada Tahap 8D–8E | Lulus regresi world/farm; tuning pertumbuhan masih bertanda `PLACEHOLDER`. |
| Waypoint dan jalur valid | Tes route/BFS menghindari penghalang | Lulus tes grid; jalur aktual dan UX navigasi perlu playtest. |
| Interior dan kamera | 15 pintu, layanan objek eksplisit, metadata lampu dan rute masuk/keluar | Lulus tes data/integrasi; kamera visual/respons sentuh HP belum diverifikasi. |
| Tutorial/UX dan performa | 10 kelompok tes tutorial/profiler; profiler `?perf=1` opt-in | Perhitungan FPS/JS heap lulus uji sintetis. Angka runtime nyata belum diukur karena Chromium headless timeout. |
| Lisensi dan publikasi | `docs/LICENSE_AND_ASSETS.md`, `CREDITS`, publication checklist | **Belum lulus** sampai izin distribusi aset ditinjau dan HP QA selesai; game tetap privat. |

Audit ini tidak menganggap tes statis sebagai bukti kinerja runtime. Nilai FPS/memori yang belum diperoleh harus tetap bertanda `BELUM DIUKUR (PLACEHOLDER)`; jangan isi dengan angka sintetik.

## 14. Keputusan yang belum ditetapkan (TBD)

- Angka balancing: HP/damage, kurva XP, biaya upgrade, durasi status/buff, drop rate, level musuh, batas stamina, dan hadiah pengulangan.

- Batas durasi offline, algoritme catch-up, kapasitas storage sementara, dan jumlah hasil produksi maksimum yang dapat tertampung.

- Jumlah slot backpack/peti awal dan progres upgrade kapasitasnya; stack limit per kategori item.

- Jumlah dan daftar final biome, material, NPC, jenis hewan, dungeon, bos, Main Stage, quest, serta achievement.

- Durasi respawn per sumber pohon/batu, durasi jendela gigitan ikan, angka waktu tumbuh tanaman, aturan tepat untuk buff saat kalah, dan apakah ada save cloud/account di luar penyimpanan lokal. Nilai sementara di kode tetap bertanda PLACEHOLDER sampai diputuskan pemilik.

- Platform/arsitektur penyimpanan aktual dan jaminan pemulihan crash harus diverifikasi dari kode yang ada sebelum implementasi.

- Model detail bagi hadiah dungeon berulang dan loot acak; angka hadiah tidak boleh ditetapkan sebelum ekonomi dan progression curve diuji.

## 15. Urutan implementasi prioritas

Urutan berikut disarankan berdasarkan dependensi teknis dan risiko data. Implementasi tiap fase memerlukan izin pemilik proyek terlebih dahulu. Jangan mulai coding hanya karena spesifikasi ini selesai.

| Prioritas / fase | Ruang lingkup | Gate / hasil wajib sebelum lanjut |
| --- | --- | --- |
| P0 — Audit baseline | Inventaris kode yang ada, arsitektur input/world/time/save, bug aktif, aset dan sistem yang sudah berjalan. | Peta dependensi, risiko, dan daftar perubahan yang disetujui. Tidak mengubah kode sampai diberi izin. |
| P1 — Fondasi kontrol + HUD | Landscape layout, joystick, hotbar 8 slot + swipe, tombol kontekstual, input capture UI, minimap/jam, panel penuh pause. | Tidak ada overlap kontrol pada rasio HP target; tap UI tidak memicu dunia; state tool/posisi kembali setelah panel ditutup. |
| P2 — Model data + save/recovery | State player/world/inventory/quest/unlock, autosave, transaksi atomik, pemulihan lokasi aman, idempotensi reward. | Restart/crash test tidak menggandakan atau menghilangkan item, uang, hadiah, dan progres. |
| P3 — Inventory + storage | Tas, chest, kapasitas, stack/split, transfer, quick-store/take, proteksi item, penyimpanan sementara dan aturan penuh. | Uji kapasitas penuh dan partial stack; tak ada kehilangan diam-diam; upgrade peti tidak menghilangkan isi. |
| P4 — Farming + gathering + fishing | Tool kontekstual, swipe petak, penanaman/penyiraman, pohon/tunggul/regrowth, spot memancing, feedback. | Gesture memproses petak valid sekali saja; material/benih dihitung benar; aksi tak melewati penghalang. |
| P5 — Ekonomi + crafting + produksi | Toko kasir, jual parsial, harga total, crafting, dapur, mesin, validasi kapasitas, produksi offline bounded. | Validasi sebelum konsumsi; transaksi aman; output menunggu jika tidak muat; catch-up offline tidak duplikatif. |
| P6 — Village progression | Bangunan/interior, Village Level, upgrade, hewan, produk, balai desa, penduduk dan fasilitas. | Interior tidak memaksa menu; unlock jelas; produksi dan storage aman saat offline. |
| P7 — Combat + equipment + status | Real-time combat, AI musuh, serangan bertanda, dodge, HP/stamina, loot, equipment panel, buffs, respawn. | Serangan dapat dibaca/dihindari; kalah tidak menghilangkan progres; hadiah bos utama hanya sekali. |
| P8 — Dunia, dungeon, Main Stage, peta | Biome, papan nama, kamera interior, minimap/world map, dungeon replay, checkpoint, stage flow. | Transisi valid; peta tidak memberi rute buntu; stage dapat diulang tanpa mengulang hadiah utama. |
| P9 — Quest, NPC, achievement | Journal, quest fokus, multi-quest, hubungan penduduk, dialog/jadwal, achievement. | Progress persisted; klaim satu kali; tidak ada penalti karena offline; fokus tidak menghapus progress quest lain. |
| P10 — Balancing + polish + regression | Balancing ekonomi/combat, settings, aksesibilitas, optimasi dan regression test lintas sistem. | Acceptance test end-to-end lulus di perangkat/ukuran layar target; tidak ada blocker data/inventory/control. |

## 16. Kriteria penerimaan lintas sistem

| ID | Skenario pengujian | Kriteria lulus |
| --- | --- | --- |
| AC-01 | UI dan input | Semua kontrol utama terlihat pada landscape target dan aman dari safe area; target sentuh efektif minimal 44 CSS px; portrait menampilkan instruksi rotasi; satu tap pada UI tidak menjalankan aksi di dunia; minimap, FOKUS, dan banner tidak bertumpuk. |
| AC-02 | Swipe farming | Cangkul/benih/ember memproses tiap petak valid maksimum sekali per gesture; petak yang terhalang bangunan/NPC/collision dilewati; seed divalidasi sebelum dikurangi dan tidak pernah negatif; joystick pointer lain tetap dapat berjalan; hujan dan siram manual berbagi state kelembapan. |
| AC-03 | Kapasitas penuh | Pembelian/crafting ditolak sebelum biaya atau bahan dikonsumsi jika output tidak muat; world material yang tidak muat menjadi drop terlihat dekat sumber, dan item khusus disimpan sementara; item tidak hilang diam-diam. |
| AC-04 | Pindah peti | Item dan stack count tetap sama setelah quick-store/take; transfer parsial hanya memindahkan jumlah yang muat; isi peti tidak hilang saat upgrade/penolakan penggantian. |
| AC-05 | Autosave | Sesudah tindakan penting dan pergantian area, data yang berhasil disimpan pulih konsisten setelah restart. |
| AC-06 | Transaksi terputus | Gangguan pada saat save tidak menghasilkan uang/barang ganda atau transaksi setengah jadi. |
| AC-07 | Kalah dan respawn | Pemain kembali ke checkpoint/titik aman yang terbuka; inventory dan progres utama tetap utuh; musuh biasa reset sesuai area. |
| AC-08 | Bos replay | Hadiah utama hanya sekali; pengulangan memberi reward replay; status tidak digandakan setelah restart. |
| AC-09 | Buff | Penggunaan efek sejenis memperbarui durasi tanpa menumpuk kekuatan; status terbaca tanpa mengandalkan warna saja. |
| AC-10 | Produksi offline | Catch-up dibatasi durasi/kapasitas, tidak menghasilkan output ganda, dan hasil tidak hilang saat storage penuh. |
| AC-11 | Quest dan achievement | Progress tersimpan lintas sesi; fokus quest dapat berubah tanpa menghapus progress; reward sekali klaim. |
| AC-12 | Unlock dan peta | Syarat Main Stage/Village Level/tutorial diperiksa sesuai fitur; peta tidak menavigasi lewat jalur tidak valid. |
| AC-13 | Settings | UI scale, suara, getaran, dan pengurangan efek visual tetap tersimpan melalui Save.*; skala tidak memotong kontrol; hitbox efektif minimal 44 CSS px dan tidak tumpang-tindih. |

## 17. Tata kelola keputusan dan batas pekerjaan

- Spesifikasi ini adalah baseline desain; perubahan setelah ini harus dicatat sebagai keputusan baru agar bagian lain dapat diaudit ulang.

- Nilai numerik yang bertanda TBD tidak boleh diisi secara diam-diam; tentukan dengan balancing dan pengujian.

- Urutan implementasi adalah rekomendasi, bukan izin coding otomatis.

- Larangan eksplisit pemilik proyek berlaku: jangan ubah kode sampai ada izin langsung dari pemilik proyek.

- Sebelum tahap coding disetujui, lakukan audit baseline pada kode yang sebenarnya tersedia. Jangan menganggap semua fitur sudah ada hanya karena telah dispesifikasikan.