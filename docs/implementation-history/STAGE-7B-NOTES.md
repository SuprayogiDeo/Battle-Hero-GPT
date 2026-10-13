Tahap 7B - world design

- Layout berasal dari tools/world_design.json: lima bioma, jalur, dan enam lokasi bernama.
- tools/build_world.py membaca desain dan menghasilkan assets/world/index.json serta chunk 32x32.
- Chunk membawa tag fishing_spot untuk tile air (~) dan animal_pen_area untuk tile bioma padang; siap dipakai tahap 7C/7D.
- Minimapa di sudut hanya menampilkan tile yang sudah dikunjungi. Jejak kunjungan disimpan sebagai string bit ringkas di S.world.disc dan tetap berada dalam save hb_s4 lama.
- Nama bioma muncul saat pemain memasuki bioma berbeda. Nama lokasi ditampilkan melalui penanda kecil di dunia.
- Service worker dinaikkan ke v33.

Pemeriksaan: node --check pada tilemap.js, world.js, i18n.js, sw.js lulus; generator menghasilkan 12 chunk untuk 128x96 dan seluruh JSON berhasil dibaca. Uji gameplay Chromium/headless serta HP belum dilakukan.
