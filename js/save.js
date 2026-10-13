/* ===== SAVE: satu-satunya pintu ke penyimpanan data =====
   Semua baca/tulis data pemain lewat Save.* (jangan memanggil localStorage langsung di tempat lain).
   Nanti Firebase / login Google cukup dipasang di sini: ganti isi Store, atau tambahkan fungsi
   ke Save.onWrite (dipanggil setiap kali data utama ditulis) tanpa menyentuh kode game. */
/* Mode DEV: buka game dengan ?dev=1 (mis. .../index.html?dev=1). Hanya dalam mode ini js/dev.js dimuat (lihat boot.js),
   dan data disimpan di slot TERPISAH (akhiran _dev) sehingga progres asli tidak pernah tertimpa/ter-unlock. */
const DEV=/[?&]dev=1(&|$)/.test(location.search);
const SAVE_KEYS=DEV?{main:'hb_s4_dev',backup:'hb_s4_dev_backup',best:'hb_best_dev',man:'hb_man_dev'}:{main:'hb_s4',backup:'hb_s4_backup',best:'hb_best',man:'hb_man'};
const Store={ // lapisan terendah: localStorage, aman bila diblokir (mode privat dsb.)
  get(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};
const Save={
  onWrite:[], // fungsi(S,best) yang dipanggil setelah tiap simpan, mis. sinkron ke cloud
  recoveredFromBackup:false,
  corruptSaveFound:false,
  failureNotified:false,
  validPayload(raw){try{const q=JSON.parse(raw);return !!(q&&q.own&&typeof q.own==='object'&&!Array.isArray(q.own))}catch(e){return false}},
  readMain(){
    const main=Store.get(SAVE_KEYS.main);
    if(Save.validPayload(main)){try{return JSON.parse(main)}catch(e){}}
    const backup=Store.get(SAVE_KEYS.backup);
    if(main!==null||backup!==null)Save.corruptSaveFound=true;
    if(Save.validPayload(backup)){
      Save.recoveredFromBackup=true;
      try{return JSON.parse(backup)}catch(e){}
    }
    return null;
  },
  readBest(){return +Store.get(SAVE_KEYS.best)||0},
  readMan(){return Store.get(SAVE_KEYS.man)!='0'},
  writeMain(S,best){
    let raw;try{raw=JSON.stringify(S)}catch(e){return false}
    if(!raw)return false;
    const previous=Store.get(SAVE_KEYS.main);
    // Backup hanya ditimpa dari save utama yang valid, jadi save rusak tidak merusak cadangan.
    if(Save.validPayload(previous))Store.set(SAVE_KEYS.backup,previous);
    const ok=Store.set(SAVE_KEYS.main,raw);
    if(!ok)return false;
    Store.set(SAVE_KEYS.best,best);
    Save.onWrite.forEach(f=>{try{f(S,best)}catch(e){}});
    Save.failureNotified=false;
    return true;
  },
  writeMan(v){Store.set(SAVE_KEYS.man,v?1:0)},
  wipe(){Object.keys(SAVE_KEYS).forEach(k=>Store.del(SAVE_KEYS[k]));Save.recoveredFromBackup=false;Save.corruptSaveFound=false;Save.failureNotified=false}
};
