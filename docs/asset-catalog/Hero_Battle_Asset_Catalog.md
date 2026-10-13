# Hero Battle — Katalog Aset dan Rekomendasi Integrasi

**Status:** katalog sumber dan aturan integrasi aset; implementasi Tahap 8D+8E memakai atlas runtime turunan untuk inventaris, crop dan animasi dunia.  
**Tujuan:** menentukan aset yang tersedia untuk UI/UX HP landscape, karakter/animasi, dunia, ladang, peternakan, inventaris, interior, dan atmosfer.

## Ringkasan inventaris

| Sumber | File yang dikatalogkan | Temuan utama | Rekomendasi |
|---|---:|---|---|
| Sunnyside World v2.1 | 430 | 396 PNG, 31 GIF, 3 Aseprite dari folder `Sunnyside_World_Assets`; ada tileset 16 px, 32 px hutan, UI, 20 aksi karakter, crop, hewan, dan VFX. | Jadikan standar visual utama. |
| 99 Ingredients | 207 | 99 ikon PNG individual 16×16, 9 spritesheet PNG, 99 PSD sumber. | Gunakan khusus ikon inventaris, bahan resep, Buku Masakan, dan hasil. |
| Tiny Wonder Farm Free | 13 | Karakter, furniture, farm objects, tanaman, jembatan, dan tilemap musim semi/interior. | Hanya bahan referensi/seleksi; versi Free dibatasi non-komersial oleh kreator. |
| `Paid Pack.zip` | 11 | PNG generik: Character, Fens, Fire, House, Plants, Sheep, Tile Map, Trees, Water, Toilet. Tidak ada identitas kreator/lisensi di ZIP. | Jangan integrasikan sampai sumber dan lisensi teridentifikasi. |
| Aseprite Human v1.0 (unggahan terpisah) | 1 | 96×64 px, 310 frame timeline, 19 layer, 34 tag. Berbeda dari Aseprite v0.07 yang ada di ZIP Sunnyside. | Sumber teknis animasi; konfirmasi syarat lisensi file versi terpisah. |

**Catatan cara menghitung:** Katalog Sunnyside hanya memasukkan folder sumber seni `Sunnyside_World_Assets`, bukan ribuan ekspor/referensi internal GameMaker yang berulang. Workbook mempunyai 662 baris aset yang bisa difilter.

## Rekomendasi visual utama

### 1. Hotbar dan HUD HP landscape
Sunnyside sudah menyediakan ikon yang cocok dengan gaya game, termasuk `UI/shovel.png`, `UI/water.png`, `UI/axe.png`, `UI/pickaxe.png`, `UI/rod.png`, `UI/plant.png`, `UI/basket.png`, ikon tangan, panel 9-slice, confirm/cancel, bar, cursor, dan indikator. Aset ini cocok sebagai dasar hotbar. Bingkai slot aktif, ukuran area sentuh, tata letak joystick, tombol aksi, safe-area, dan indikator jumlah barang tetap perlu dirancang khusus untuk mobile.

### 2. Karakter dan alat
Sunnyside memiliki 20 folder aksi karakter manusia dengan 8 varian/layer per aksi (160 PNG) serta sumber Aseprite. Aksi yang relevan termasuk `IDLE`, `WALKING`, `AXE`, `DIG`, `MINING`, `WATERING`, `REELING`, `CASTING`, `CAUGHT`, `CARRY`, dan lainnya. Gunakan pipeline karakter proyek (`tools/build_chars.py`) untuk menjaga anchor kaki dan komposisi layer konsisten.

**Verifikasi REELING:** parser Aseprite membaca tag `reeling` di indeks frame **274–286 (0-based), 13 frame** pada file v1.0 terpisah. Ini berarti indeks frame bukan 175–187. Tag `axe` pada v1.0 muncul dua kali (8 dan 10 frame); parser berbasis dictionary dapat menimpa tag `axe` yang lebih awal jika tidak dinormalisasi.

### 3. Ladang, hewan, dan aktivitas dunia
- `Elements/Crops/` mempunyai 78 file, termasuk 11 jenis tanaman dengan tahap pertumbuhan, tanah, dan item pendukung.
- `Elements/Animals/` mempunyai strip 4-frame untuk sapi, ayam, domba, babi, bebek, burung, dan satu strip blinking.
- `UI/rod.png`, animasi `REELING`, `CASTING`, `CAUGHT`, serta `Elements/Crops/fish.png` dapat mendukung memancing. Katalog ikan dengan banyak spesies/rarity masih membutuhkan ikon/sprite tambahan yang sesuai.
- `Elements/Plants/` menyediakan pohon dan jamur dekoratif. Sprite pohon buah dengan state kosong–berbunga–berbuah–siap panen belum terkonfirmasi, sehingga kemungkinan perlu diadaptasi atau dibuat.
- `Elements/VFX/` berisi efek api, glint, dan asap cerobong. Itu berguna untuk beberapa efek, tetapi tidak membuktikan tersedia efek/tileset lengkap untuk hujan, badai, atau musim salju.

### 4. Inventaris dan dapur
99 Ingredients menyediakan 99 ikon individual 16×16, sembilan spritesheet, dan file PSD yang dapat diedit. Tahap 8C mengambil ikon terpilih untuk herb, mushroom, dan tonic dalam `assets/world/items.png`; simbol kayu, batu, buah, dan produk sederhana dibuat oleh `tools/build_inventory_icons.py`. Runtime atlas 144×16 px memuat 9 cell 16×16. Gunakan PNG individual untuk runtime dan PSD hanya untuk penyuntingan. Jangan menaruh arsip ZIP/PSD sumber di repo atau menjual ulang ikon mentah. Uji ukuran/kontras ikon pada HP masih terbuka. Tahap 8D memakai crop Sunnyside tahap `_00` sampai `_05` (runtime `crop_*_0` sampai `_5`); `tools/build_chars.py` menghasilkan `avatar_watering` 5 frame. Tahap 8E menggunakan `avatar_reeling` 13 frame, `avatar_axe` 10 frame, dan `avatar_mining` 10 frame. Tidak ada source ZIP/Aseprite ikut repo, dan syarat file Human v1.0 terpisah masih perlu konfirmasi sebelum distribusi.

### 5. Interior bangunan
Sunnyside tetap menjadi sumber utama tileset dan komponen UI. Interior toko harus diprototipe lebih dahulu untuk memverifikasi apakah tile yang diperlukan sudah tersedia: pintu, dinding, rak, konter, kasir, serta jalur keluar. Mesin gacha tidak ditemukan sebagai berkas khusus yang jelas bernama demikian; bila tidak ada tile yang bisa dirakit dengan baik, lebih aman membuat sprite baru yang mengikuti palet Sunnyside.

Tiny Wonder Farm Free memiliki `farm inside free.png` dan `furniture free.png`, tetapi jangan gunakan versi Free pada build komersial tanpa memperoleh lisensi yang sesuai.

### 6. Gap visual yang harus dicatat
1. **HUD mobile siap pakai:** ikon alat dan panel tersedia; layout hotbar, slot terpilih, joystick sentuh, aksi kontekstual, serta safe-area perlu dibuat/diintegrasikan.
2. **Mesin gacha:** belum ada aset khusus yang terkonfirmasi.
3. **Papan nama biome/gapura:** runtime sekarang memakai sprite `sign` yang tersedia untuk lima papan nama; gapura besar digambar prosedural tanpa aset pack baru. Verifikasi kontras/fade visual di HP masih terbuka.
4. **Kebun buah berproduksi:** pohon dekoratif tersedia, state panen belum terkonfirmasi.
5. **Terrain salju:** tidak ditemukan tileset musim dingin yang jelas pada aset utama yang ditinjau. Butuh aset berlisensi atau varian terrain buatan sendiri.
6. **Paid Pack:** sumber, pembuat, dan lisensi belum diketahui; jangan dipakai di build rilis sampai terverifikasi.
7. **Aseprite v1.0 terpisah:** berbeda dari v0.07 yang ada dalam ZIP Sunnyside; catat sumber asli dan syarat file terpisah sebelum distribusi.

## Lisensi — ringkasan kerja

- **Sunnyside World:** halaman kreator menyatakan aset boleh untuk proyek komersial/non-komersial dan dapat dimodifikasi; kredit tidak wajib tetapi diapresiasi. Dilarang mengemas ulang/menjual aset mentah serta melatih AI dengan aset. Pertahankan atribusi proyek `CREDITS`. Sumber: https://danieldiggle.itch.io/sunnyside
- **99 Ingredients:** halaman kreator mengizinkan penggunaan komersial/non-komersial dan modifikasi; redistribusi atau penjualan ikon mentah dilarang, kredit opsional. Sumber: https://keifoopx.itch.io/99-various-ingredients
- **Tiny Wonder Farm Free:** halaman kreator membedakan versi Free (non-komersial) dan Premium (komersial/non-komersial). Versi Free yang diunggah jangan dipakai pada build komersial tanpa lisensi yang sesuai. Sumber: https://butterymilk.itch.io/tiny-wonder-farm-asset-pack
- **Paid Pack.zip:** identitas paket belum dapat ditetapkan dari nama file/isi saja; minta URL asli atau bukti pembelian.
- **Aseprite Human v1.0:** file upload terpisah tidak identik dengan versi v0.07 dalam ZIP Sunnyside. Konfirmasi asal/ketentuan file ini secara spesifik sebelum distribusi.

Ini ringkasan kerja, bukan nasihat hukum. Simpan bukti pembelian/halaman lisensi untuk semua paket yang digunakan.

## Urutan integrasi yang direkomendasikan

1. Validasi lisensi Paid Pack dan Aseprite v1.0 terpisah.
2. Pilih ikon hotbar Sunnyside dan uji 99 Ingredients dalam frame inventaris.
3. Rancang HUD mobile: joystick tetap kiri bawah, hotbar di bawah, tombol aksi utama + aktivitas tambahan di kanan bawah, minimap kiri atas tanpa judul, jam kecil di kanan atas.
4. Prototipe interior Toko: masuk lewat pintu, rak, kasir, mesin gacha, dan pintu keluar.
5. Audit tileset untuk signage biome dan interior sebelum menggambar aset baru.
6. Buat daftar gap untuk pohon buah berproduksi, ikon spesies ikan, dan terrain salju.

## Isi workbook

- **Mulai Di Sini:** ringkasan paket, temuan utama, dan urutan kerja.
- **Katalog Aset:** 662 baris dengan path file, format, dimensi, frame (jika diketahui), kategori, rekomendasi pemakaian, prioritas, dan catatan lisensi.
- **Pemetaan Fitur:** pemetaan aset ke HUD, karakter, ladang, hewan, memancing, inventaris, interior, gapura, salju, dan cuaca.
- **Animasi:** tag Aseprite dari v1.0 dan v0.07, jumlah frame, indeks, serta jumlah variasi strip berdasarkan nama file.
- **Lisensi:** ringkasan syarat penggunaan dan sumber.
- **Kebutuhan Aset:** daftar gap visual dan langkah yang diperlukan.



### Tahap 8F+8G — penanda biome dan jendela rumah
Papan nama 5 biome menggunakan sprite `sign` yang tersedia, terikat pada objek dunia dan memudar saat pemain menjauh. Dua gapura besar dan palung pakan dirender prosedural; tidak menambah aset pack baru. `tools/build_lights.py` menghasilkan data lampu untuk 14 sprite rumah baru, memvalidasi batas sprite dan menghindari overlap pintu.
