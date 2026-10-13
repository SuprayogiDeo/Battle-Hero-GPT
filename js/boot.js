/* BOOT: dijalankan terakhir, setelah semua fungsi tersedia */
/* dev.js (full unlock untuk uji) hanya dimuat bila ?dev=1, dan dijalankan SEBELUM game mulai (urutan sama seperti dulu).
 Bila filenya tidak ada, game tetap jalan. Produksi tidak pernah meminta dev.js. */
function bootStart(){dayRefresh();if(Save.recoveredFromBackup){say('Progres dipulihkan dari cadangan penyimpanan terakhir.');Save.recoveredFromBackup=false;}else if(Save.corruptSaveFound){say('Data simpan utama bermasalah. Game memakai data yang masih dapat dibaca.');}requestAnimationFrame(loop)}
if(DEV){document.title+=' [DEV]';const s=document.createElement('script');s.src='js/dev.js';s.onload=s.onerror=bootStart;document.head.appendChild(s)}else bootStart();
