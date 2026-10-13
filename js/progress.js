/* ===== MISI HARIAN, PENCAPAIAN, STATISTIK, TUTORIAL ===== */
let qDirty=0,flushT=6,qTab=0,RSX={},showStat=0,howP=0,howNext='menu',coachCur=null,coachGap=0;
const RX=id=>RSX[id]||(RSX[id]={dmg:0,taken:0,heal:0,ult:0,par:0});
const DQ=[{k:'kills',n:40,g:60,t:'Kalahkan 40 musuh'},{k:'ults',n:2,g:50,t:'Pakai Limit Break 2 kali'},{k:'stages',n:4,g:70,t:'Selesaikan 4 stage'},{k:'bossKills',n:1,g:90,t:'Kalahkan 1 boss'},{k:'parries',n:5,g:60,t:'Tangkis 5 serangan boss'},{k:'maxCombo',n:15,g:70,t:'Capai kombo 15'},{k:'pulls',n:1,g:50,t:'Panggil hero 1 kali di Toko'},{k:'arenaWins',n:1,g:80,e:1,t:'Menang 1 kali di Arena'},{k:'events',n:1,g:70,t:'Mainkan Event Serbuan 1 kali'},{k:'ups',n:2,g:60,t:'Naikkan level atau skill hero 2 kali'}];
const ACH=[
{id:'kills',n:'Pembasmi',d:'Kalahkan musuh',t:[100,1000,10000],v:()=>S.st.kills||0},
{id:'stage',n:'Penakluk Stage',d:'Capai stage tertinggi',t:[5,20,50],v:()=>best},
{id:'hero',n:'Kolektor Hero',d:'Miliki banyak hero',t:[5,12,25],v:()=>Object.keys(S.own).length},
{id:'ult',n:'Penguasa Limit Break',d:'Pakai Limit Break',t:[10,100,500],v:()=>S.st.ults||0},
{id:'pull',n:'Pemanggil',d:'Panggil hero di Toko',t:[10,50,200],v:()=>S.st.pulls||0},
{id:'boss',n:'Pemburu Boss',d:'Kalahkan boss',t:[5,25,100],v:()=>S.st.bossKills||0},
{id:'parry',n:'Penangkis',d:'Tangkis serangan boss',t:[20,100,500],v:()=>S.st.parries||0},
{id:'combo',n:'Raja Kombo',d:'Kombo tertinggi',t:[15,40,80],v:()=>S.st.maxCombo||0},
{id:'arena',n:'Gladiator',d:'Menang di Arena',t:[3,15,50],v:()=>S.st.arenaWins||0},
{id:'village',n:'Pembangun Desa',d:'Tingkat desa',t:[2,4,5],v:()=>S.village&&S.village.level||1},
{id:'artisan',n:'Perajin',d:'Hasil crafting diklaim',t:[1,10,50],v:()=>S.workshop&&S.workshop.totalCrafted||0},
{id:'angler',n:'Pemancing',d:'Ikan tertangkap',t:[10,50,100],v:()=>S.fish&&S.fish.total||0},
{id:'explorer',n:'Penjelajah',d:'Wilayah ditemukan',t:[2,4,5],v:()=>Object.keys(S.journal&&S.journal.seenBiomes||{}).length},
{id:'friendship',n:'Sahabat Desa',d:'Penduduk jadi teman',t:[1,3,5],v:()=>typeof jrNpcList==='function'?jrNpcList().filter(n=>typeof jrTier==='function'&&jrTier(n.id)>=2).length:0}
];
const ACG=[150,500,1500],ACE=[0,2,5];
function dayQ(){const d=today();if(S.q.day==d)return;let h=0;for(let i=0;i<d.length;i++)h=(h*31+d.charCodeAt(i))>>>0;const r=()=>(h=(h*1664525+1013904223)>>>0)/4294967296,p=DQ.map((_,i)=>i);for(let i=p.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[p[i],p[j]]=[p[j],p[i]]}S.q={day:d,ids:p.slice(0,3),p:{},cl:[0,0,0],bonus:0};qDirty=1}
function stat(k,n){n=n==null?1:n;S.st[k]=(S.st[k]||0)+n;dayQ();S.q.p[k]=(S.q.p[k]||0)+n;qDirty=1}
function statMax(k,v){dayQ();if(v>(S.st[k]||0)){S.st[k]=v;qDirty=1}if(v>(S.q.p[k]||0)){S.q.p[k]=v;qDirty=1}}
const qList=()=>{dayQ();return S.q.ids.map((id,i)=>{const q=DQ[id],v=Math.min(q.n,S.q.p[q.k]||0);return{q,i,v,done:v>=q.n,cl:!!S.q.cl[i]}})};
const achT=a=>S.ac[a.id]||0;
const qClaimable=()=>{const L=qList();return L.some(x=>x.done&&!x.cl)||(L.every(x=>x.cl)&&!S.q.bonus)||ACH.some(a=>achT(a)<3&&a.v()>=a.t[achT(a)])};
function qClaim(i){const x=qList()[i];if(!x||!x.done||x.cl)return;S.q.cl[i]=1;S.g+=x.q.g;S.es+=x.q.e||0;sv();sfx('coin');say('+'+x.q.g+' emas'+(x.q.e?' +'+x.q.e+' esensi':''))}
function qBonus(){const L=qList();if(!L.every(x=>x.cl)||S.q.bonus)return;S.q.bonus=1;S.g+=150;S.ft++;sv();sfx('clear');say('Bonus: +150 emas dan 1 panggilan gratis!')}
function achClaim(i){const a=ACH[i],k=achT(a);if(k>=3||a.v()<a.t[k])return;S.ac[a.id]=k+1;S.g+=ACG[k];S.es+=ACE[k];sv();sfx('clear');say(a.n+' '+['I','II','III'][k]+': +'+ACG[k]+' emas'+(ACE[k]?' +'+ACE[k]+' esensi':''))}
function drawQuests(){ov(.92);btn(6,5,76,28,'KEMBALI');btn(96,8,110,24,'MISI HARIAN',qTab==0);btn(212,8,120,24,'PENCAPAIAN',qTab==1);T('Emas: '+S.g+'  Esensi: '+S.es,632,24,'#fc4',12,'right');
if(qTab==0){const L=qList(),dn=L.filter(x=>x.cl).length;T('Misi hari ini ('+dn+'/3)',320,56,'#fc4',14,'center');
L.forEach((x,i)=>{const y=66+i*64;card(20,y,600,56,x.cl?'#555':x.done?'#6f8':'#6af',1);T(x.q.t,32,y+20,x.cl?'#888':'#fff',13);g.fillStyle='#111';g.fillRect(32,y+28,380,10);g.fillStyle=x.done?'#6c6':'#4a7acb';g.fillRect(32,y+28,380*x.v/x.q.n,10);T(x.v+'/'+x.q.n,420,y+38,'#ccc',10);T('Hadiah: +'+x.q.g+' emas'+(x.q.e?' +'+x.q.e+' esensi':''),32,y+51,'#fc4',10);btn(500,y+13,100,30,x.cl?'DIAMBIL':x.done?'AMBIL':'BELUM',x.done&&!x.cl)});
const all=L.every(x=>x.cl);card(20,262,600,52,S.q.bonus?'#555':all?'#fc4':'#444',1);T('Bonus: selesaikan semua misi',32,284,S.q.bonus?'#888':'#fff',13);T('Hadiah: +150 emas dan 1 panggilan gratis',32,304,'#fc4',10);btn(470,272,130,30,S.q.bonus?'DIAMBIL':'AMBIL BONUS',all&&!S.q.bonus);T('Misi diperbarui setiap hari.',320,336,'#9cf',10,'center')}
else ACH.forEach((a,i)=>{const y=38+i*22,k=achT(a),mx=k>=3,tg=mx?a.t[2]:a.t[k],v=Math.min(a.v(),tg),ok=!mx&&a.v()>=tg;card(20,y,600,20,ok?'#6f8':mx?'#555':'#6af',1);T(a.n.slice(0,15),29,y+13,mx?'#888':'#fff',8);T(a.d.slice(0,25),119,y+13,'#9ab',7);for(let j=0;j<3;j++){g.fillStyle=j<k?'#fc4':'#333';g.fillRect(209+j*9,y+5,7,7)}g.fillStyle='#111';g.fillRect(240,y+7,205,7);g.fillStyle=ok?'#6c6':'#4a7acb';g.fillRect(240,y+7,205*v/tg,7);T(v+'/'+tg,451,y+13,'#ccc',8);btn(548,y+1,66,18,mx?'MAKS':ok?'AMBIL':'BELUM',ok)})}
function questClick(x,y){if(y<34&&x<80){st='menu';sfx('click');return}if(y<34&&x>96&&x<206){qTab=0;sfx('click');return}if(y<34&&x>212&&x<332){qTab=1;sfx('click');return}
if(qTab==0){for(let i=0;i<3;i++){const yy=66+i*64;if(x>500&&x<600&&y>yy+13&&y<yy+43)qClaim(i)}if(x>470&&x<600&&y>272&&y<302)qBonus()}else ACH.forEach((a,i)=>{const yy=38+i*22;if(x>548&&x<614&&y>yy+1&&y<yy+20)achClaim(i)})}
/* statistik pertempuran */
const fmtN=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(Math.round(n));
function statPanel(x,y,w){const L=hs.map(h=>({h,s:RSX[h.d.id]||{dmg:0,taken:0,heal:0,ult:0,par:0}})),mx=Math.max(1,...L.map(o=>o.s.dmg)),tot=L.reduce((a,o)=>a+o.s.dmg,0)||1,mv=L.reduce((a,o)=>o.s.dmg>a.s.dmg?o:a,L[0]||{s:{dmg:0}});
T('HERO',x+34,y,'#9cf',9);T('DAMAGE',x+140,y,'#9cf',9);T('DITERIMA',x+w-290,y,'#9cf',9);T('PULIH',x+w-215,y,'#9cf',9);T('TANGKIS',x+w-145,y,'#9cf',9);T('LIMIT',x+w-62,y,'#9cf',9);
L.forEach((o,i)=>{const yy=y+6+i*30,d=o.h.d,bx=x+140,bw=w-440;g.fillStyle='#2b2545';g.fillRect(x,yy,w,27);g.strokeStyle=RC[d.rar];g.lineWidth=1;g.strokeRect(x+.5,yy+.5,w-1,26);spr(d.s,x+14,yy+25,1.5,0);T(d.n.slice(0,14),x+32,yy+17,o.h.dead?'#888':'#fff',9);if(o===mv&&tot>1)T('MVP',x+114,yy+17,'#fc4',8);g.fillStyle='#111';g.fillRect(bx,yy+8,bw,11);g.fillStyle=ultCol(d);g.fillRect(bx,yy+8,bw*o.s.dmg/mx,11);T(fmtN(o.s.dmg)+' ('+Math.round(100*o.s.dmg/tot)+'%)',bx+3,yy+17,'#fff',8);T(fmtN(o.s.taken),x+w-290,yy+17,'#f88',10);T(fmtN(o.s.heal),x+w-215,yy+17,'#6f8',10);T(String(o.s.par||0),x+w-145,yy+17,'#6f8',10);hico(d.id,3,x+w-62,yy+13,1,.9);T(String(o.s.ult),x+w-44,yy+17,'#fc4',10)})}
function statOverlay(){ov(.97);T('STATISTIK PERTEMPURAN',320,36,'#fc4',18,'center');statPanel(20,64,600);T('Statistik dihitung sejak awal run ini. Ketuk untuk menutup.',320,262,'#9cf',10,'center')}
/* tutorial: petunjuk sekali-tampil + layar Cara Bermain */
const COACH=[['Pertempuran berjalan otomatis. Ketuk musuh untuk memfokuskan serangan tim.',()=>true],['Ikon di kartu hero = skill (S1). Ketuk untuk memakainya, atau biarkan AUTO.',()=>hs.some(h=>!h.dead&&h.cd<=0)&&tutT>7],['Limit Break siap! Ketuk ikon emas di kartu hero (atau tombol Limit Break di atas).',()=>lb>=100],['Boss! Ketuk area merah untuk menangkis serangannya.',()=>es.some(e=>e.d.boss&&!e.dead)],['Kontrol manual: geser joystick kiri; ATK, S1, S2, Limit Break ada di kanan.',()=>MAN],['Hero yang gugur bangkit dengan HP rendah di stage berikutnya.',()=>hs.some(h=>h.dead)],['Hero AI bisa menghindari zona merah, dan healer/tank kadang menangkis otomatis. Parry-mu tetap paling andal!',()=>tele.some(k=>!k.dead)&&tutT>10]];
function coachDraw(){if(st!='fight')return;if(!coachCur&&t>coachGap){const i=COACH.findIndex((c,j)=>!((S.coach>>j)&1)&&c[1]());if(i>=0){coachCur={i,u:t+6.5};S.coach|=1<<i;qDirty=1}}
if(coachCur){if(t>coachCur.u){coachCur=null;coachGap=t+1.5;return}const a=Math.max(0,Math.min(1,(coachCur.u-t)*2,(t-(coachCur.u-6.5))*4));g.globalAlpha=a;g.fillStyle='rgba(0,0,0,.72)';g.fillRect(70,112,500,26);g.strokeStyle='#fc4';g.lineWidth=1;g.strokeRect(70.5,112.5,499,25);T(COACH[coachCur.i][0],320,129,'#fe8',11,'center');g.globalAlpha=1}}
const HOW=[['Dasar Pertempuran',[['recruit',0]],['Pertempuran berjalan otomatis.','Ketuk musuh untuk memfokuskan serangan tim.','Tombol AUTO mengaktifkan skill otomatis.','Tombol x1/x2/x3 mengatur kecepatan.']],
['Skill (S1)',[['recruit',1],['acolyte',1],['archmage',1],['squire',1]],['Setiap hero punya satu skill dengan ikonnya sendiri.','Ikonnya ada di kartu hero di bagian bawah layar.','Ketuk kartu untuk memakai skill, atau biarkan AUTO.']],
['Limit Break',[['archmage',3],['paladin',3],['stormmage',3]],['Kalahkan musuh dan bangun kombo untuk mengisi gauge Limit Break.','Saat penuh, ikon emas muncul di kartu setiap hero.','Ketuk ikon itu: tiap hero punya Limit Break dan sinematiknya sendiri.','Gauge dipakai bersama, jadi pilih hero yang tepat.']],
['Kontrol Manual',[['valkyrie',0],['knight',2],['recruit',2]],['Nyalakan tombol KONTROL di atas layar.','Geser joystick kiri untuk bergerak.','ATK, S1, S2, dan Limit Break ada di sisi kanan.','S2 hanya lewat kontrol manual dan beda tiap peran.']],
['Boss dan Tangkis',[['paladin',1],['clubber',1]],['Boss menyerang dengan area merah di tanah.','Ketuk area merah tepat waktu untuk menangkis.','Hero AI bisa menghindar; healer dan tank kadang menangkis sendiri (Refleks naik lewat bintang).','Tangkisan manualmu juga mengisi Limit Break, jadi tetap yang paling andal.']],
['Hero, Toko dan Gear',[['acolyte',1],['squire',1],['hunter',1]],['Panggil hero baru di Toko (ada panggilan gratis harian).','Naikkan level, skill, dan evolusi di menu Pahlawan.','Pasang equipment untuk menambah ATK dan HP.','Buka Liontin di Toko untuk gear. AUTO PASANG memilihkan yang terbaik.','Susun pasukan: penjaga, penyerang, dan penyembuh.']],
['Misi dan Pencapaian',[['necro',3],['valkyrie',3]],['Misi harian memberi emas dan panggilan gratis.','Pencapaian memberi hadiah emas dan Esensi.','Buka dari menu: MISI & PENCAPAIAN.']]];
function howEnd(){if(howNext=='play'){howNext='menu';st='menu';newRun(1)}else st='menu'}
function drawHow(){ov(.95);const h=HOW[howP],n=h[1].length;T(h[0],320,50,'#fc4',22,'center');h[1].forEach((k,i)=>{const cx=320+(i-(n-1)/2)*70;g.fillStyle='#2b2545';g.fillRect(cx-28,72,56,56);g.strokeStyle='#fc4';g.lineWidth=2;g.strokeRect(cx-28,72,56,56);hico(k[0],k[1],cx,100,3,1)});h[2].forEach((l,i)=>T(l,320,168+i*26,'#cde',12,'center'));T('Halaman '+(howP+1)+'/'+HOW.length,320,298,'#9ab',10,'center');btn(40,310,100,30,'<',0);btn(270,310,100,30,'LEWATI',0);btn(500,310,100,30,howP<HOW.length-1?'LANJUT':howNext=='play'?'MULAI MAIN':'TUTUP',1)}
function howClick(x,y){if(y>310&&y<340){if(x>40&&x<140){if(howP>0){howP--;sfx('click')}}else if(x>270&&x<370){sfx('click');howEnd()}else if(x>500&&x<600){sfx('click');if(howP<HOW.length-1)howP++;else howEnd()}}}
function mkItem(slot,rar){const nm=slot=='w'?WN:slot=='a'?AN:XN,it={u:S.iu++,slot,rar,ic:IC[slot][Math.random()*IC[slot].length|0],nm:nm[Math.random()*nm.length|0],lv:0};if(slot=='x')it.ty=Object.keys(XT)[Math.random()*4|0];return it}
const iVal=it=>{const m=1+.1*it.lv;return it.slot=='w'?WB[it.rar]*m:it.slot=='a'?AB[it.rar]*m:XT[it.ty][1][RAR.indexOf(it.rar)]*m};
const iName=it=>RP[it.rar]+' '+it.nm,iDesc=it=>it.slot=='w'?'ATK +'+iVal(it).toFixed(0)+'%':it.slot=='a'?'HP +'+iVal(it).toFixed(0)+'% · Damage masuk -'+Math.round(Math.min(.25,iVal(it)/440)*100)+'%':XT[it.ty][0]+' +'+iVal(it).toFixed(0)+'%';
const iUp=it=>Math.round(40*(it.lv+1)**1.5*(1+RAR.indexOf(it.rar)*.8)),iSell=it=>Math.round(SELL[it.rar]*(1+it.lv*.6));
const equippedBy=u=>Object.keys(S.eq).find(h=>{const e=S.eq[h];return e&&(e.w==u||e.a==u||e.x==u)});
let soldAuto={n:0,g:0},sumW='',sellDlg=null,fullDlg=null,gearBack='heroes',overflowSel=null,overflowPage=0,overflowBack='gear';
/* Kapasitas storage: inventory utama + penyimpanan hadiah sementara. Nilai ini aman untuk disetel ulang saat balancing. */
const ITEM_STORAGE={bag:120,temporary:30};
const itemDeliveryRoom=()=>Math.max(0,ITEM_STORAGE.bag-(S.items||[]).length)+Math.max(0,ITEM_STORAGE.temporary-(S.overflowItems||[]).length);
const itemRewardCanFit=(n=1)=>itemDeliveryRoom()>=n;
let stageLootWarned=false;
/* Perkiraan kapasitas gudang; loot tidak otomatis dijual saat kapasitas penuh. */
function ovfPreview(k){const o=S.items.length+k-ITEM_STORAGE.bag;if(o<=0)return null;const c=S.items.filter(x=>!x.lk&&!equippedBy(x.u)).sort((a,b)=>RAR.indexOf(a.rar)-RAR.indexOf(b.rar)||a.lv-b.lv).slice(0,o);return c.length?{n:c.length,g:c.reduce((a,i)=>a+iSell(i),0)}:null}
function fullClick(x,y){const d=fullDlg;if(!d||y<246||y>274)return;if(x>130&&x<250){fullDlg=null;gslot='w';gsel=null;gpage=0;sellDlg=null;gearBack='shop';st='gear';sfx('click');say('Kosongkan slot atau ambil hadiah tertunda, lalu coba lagi.')}else if(x>260&&x<380){fullDlg=null;sfx('click')}else if(x>390&&x<510){fullDlg=null;sfx('click')}}
function openOverflow(from){overflowBack=from||'gear';overflowPage=0;overflowSel=(S.overflowItems[0]&&S.overflowItems[0].u)||null;st='overflow';sfx('click')}
function overflowClick(x,y){
  const a=S.overflowItems||[],pages=Math.max(1,Math.ceil(a.length/18));overflowPage=Math.min(overflowPage,pages-1);
  if(y<34&&x<80){st=overflowBack;sfx('click');return}
  if(y>=54&&y<222){const c=Math.floor((x-10)/103),r=Math.floor((y-54)/56),i=overflowPage*18+r*6+c;if(c>=0&&c<6&&r>=0&&r<3&&a[i]){overflowSel=a[i].u;sfx('click')}return}
  if(y>=304&&y<336){
    if(x>=10&&x<44&&overflowPage>0){overflowPage--;overflowSel=null;sfx('click');return}
    if(x>=50&&x<84&&overflowPage+1<pages){overflowPage++;overflowSel=null;sfx('click');return}
    const it=a.find(q=>q.u===overflowSel);
    if(x>=130&&x<238){if(!it){say('Pilih hadiah terlebih dahulu');return}if(S.items.length>=ITEM_STORAGE.bag){say('Gudang penuh. Kosongkan satu slot dahulu.');return}S.items.push(it);S.overflowItems.splice(S.overflowItems.indexOf(it),1);overflowSel=null;sv();sfx('clear');say('Hadiah dipindahkan ke gudang');return}
    if(x>=245&&x<355){if(!it){say('Pilih hadiah terlebih dahulu');return}if(it.lk){say('Item terkunci. Buka kunci sebelum menjual.');return}const value=iSell(it);S.g+=value;S.overflowItems.splice(S.overflowItems.indexOf(it),1);overflowSel=null;sv();sfx('coin');say('Hadiah dijual manual: +'+value+' emas');return}
    if(x>=360&&x<492){if(!a.length){say('Tidak ada hadiah tertunda');return}const free=Math.max(0,ITEM_STORAGE.bag-S.items.length);if(free<a.length){say('Perlu '+a.length+' slot kosong untuk mengambil semua hadiah.');return}S.items.push(...a);S.overflowItems=[];overflowSel=null;sv();sfx('clear');say('Semua hadiah tertunda dipindahkan');return}
  }
}
function drawFull(){const d=fullDlg;if(!d)return;ov(.78);card(110,66,420,222,'#f88',1);T('GUDANG PENUH',320,98,'#f88',16,'center');T('Gudang '+S.items.length+'/'+ITEM_STORAGE.bag,320,120,'#fc4',12,'center');wr('Pembelian dibatalkan sebelum emas atau tiket dipotong.',320,146,60,'#cde',10,'center');T('Perlu '+d.need+' slot kosong untuk transaksi ini.',320,184,'#f88',13,'center');wr('Hadiah lama tetap aman. Kosongkan slot atau ambil hadiah tertunda.',320,210,60,'#9cf',10,'center');btn(130,246,120,28,'BUKA GUDANG',1);btn(260,246,120,28,'TUTUP',0);btn(390,246,120,28,'BATAL',0)}
function addItem(it){if(!it)return false;if(!Array.isArray(S.items))S.items=[];if(!Array.isArray(S.overflowItems))S.overflowItems=[];if(S.items.length<ITEM_STORAGE.bag){S.items.push(it);return true}if(S.overflowItems.length<ITEM_STORAGE.temporary){S.overflowItems.push(it);soldAuto.n++;say(S.set?.lang==='en'?'Main bag full; item saved to PENDING REWARDS.':'Gudang utama penuh; item disimpan di HADIAH TERTUNDA.');return false}say(S.set?.lang==='en'?'Main bag and PENDING REWARDS are full. Item was not added; free space before claiming a reward.':'Gudang utama dan HADIAH TERTUNDA penuh. Item tidak ditambahkan; kosongkan ruang sebelum klaim hadiah.');return false}
const sellList=r=>S.items.filter(i=>!i.lk&&!equippedBy(i.u)&&RAR.indexOf(i.rar)<=r);
function rollRar(w){let r=Math.random()*100,a=0;for(let i=0;i<4;i++){a+=w[i];if(r<a)return RAR[i]}return'N'}
function eqOf(id){const e=S.eq[id]||{};return['w','a','x'].map(s=>S.items.find(i=>i.u==e[s]))}
function eqStat(id){const[w,a,x]=eqOf(id),o={atk:0,hp:0,crit:0,cd:0,ls:0,as:0,dr:0};if(w)o.atk=iVal(w)/100;if(a){o.hp=iVal(a)/100;o.dr=Math.min(.25,iVal(a)/440)}if(x)o[x.ty]+=iVal(x)/100;return o}
function dropItem(q){
  // Item drop hanya dibuat bila ada ruang pasti di bag atau gudang sementara.
  if(itemDeliveryRoom()<=pendI.length){if(!stageLootWarned){stageLootWarned=true;say('Penyimpanan item penuh. Loot tambahan tidak dijatuhkan sampai ada ruang.')}return false}
  const w=[Math.max(20,70-stage*2),Math.min(55,25+stage),Math.min(20,2+stage*.6+q*8),Math.min(8,stage*.15+q*3)];let rar=rollRar(w);if(q&&rar=='N')rar='R';pendI.push(mkItem(['w','a','x'][Math.random()*3|0],rar));return true
}
const gearList=()=>S.items.filter(i=>i.slot==gslot).sort((a,b)=>iScore(b,selH)-iScore(a,selH)||RAR.indexOf(b.rar)-RAR.indexOf(a.rar)||b.lv-a.lv||a.u-b.u);

/* ===== TUTORIAL DUNIA PERSISTEN — Stage 8H =====
   Status/topik: belum → berjalan → selesai. Setiap fase ditulis melalui sv()/Save.*.
   Tutorial bersifat non-modal: pemain tetap bebas bergerak dan tidak pernah dipindah paksa. */
const HB_TUTORIAL_TOPICS=[
 {id:'shop',stage:2,after:[],title:'Panduan Toko',instruction:'Buka Toko dari menu.',target:'menu_shop',trigger:'menu'},
 {id:'gacha',stage:2,after:['shop'],title:'Panduan Gacha',instruction:'Di Toko, lakukan satu panggilan jika sumber daya cukup.',target:'shop_pull',trigger:'shop'},
 {id:'farming',stage:5,after:['gacha'],title:'Panduan Bertani',instruction:'Pilih alat hotbar, lalu olah satu petak ladang.',target:'farm_tool',trigger:'world'},
 {id:'fishing',stage:6,after:['farming'],title:'Panduan Memancing',instruction:'Pilih pancing, hadap air, lalu lempar kail.',target:'fishing_tool',trigger:'world'},
 {id:'orchard',stage:6,after:['fishing'],title:'Panduan Kebun Buah',instruction:'Pergilah ke kebun dan kumpulkan satu buah.',target:'resource_action',trigger:'world'},
 {id:'gather',stage:6,after:['orchard'],title:'Panduan Mengumpulkan',instruction:'Kumpulkan satu sumber daya dari dunia.',target:'resource_action',trigger:'world'},
 {id:'cook',stage:6,after:['gather'],title:'Panduan Memasak',instruction:'Masak satu resep ketika bahan mencukupi.',target:'cook_recipe',trigger:'kitchen'}
];
const HB_TUT_PHASES=['penanda','instruksi','sorot','tunggu','konfirmasi','lanjut','simpan'];
function hbTutorialEnsure(){
 let changed=false;
 if(!S.tutorials||typeof S.tutorials!=='object'||Array.isArray(S.tutorials)){S.tutorials={active:null,topics:{}};changed=true;}
 if(!S.tutorials.topics||typeof S.tutorials.topics!=='object'||Array.isArray(S.tutorials.topics)){S.tutorials.topics={};changed=true;}
 if(!Object.prototype.hasOwnProperty.call(S.tutorials,'active')){S.tutorials.active=null;changed=true;}
 HB_TUTORIAL_TOPICS.forEach(t=>{let q=S.tutorials.topics[t.id];if(!q||typeof q!=='object'||Array.isArray(q)){q=S.tutorials.topics[t.id]={status:'belum',phase:'',actions:0};changed=true;}if(!['belum','berjalan','selesai'].includes(q.status)){q.status='belum';changed=true;}if(!Number.isFinite(+q.actions)||+q.actions<0){q.actions=0;changed=true;} });
 const active=S.tutorials.active;if(active){const q=S.tutorials.topics[active];if(!q||q.status!=='berjalan'){S.tutorials.active=null;changed=true;}else if(!HB_TUT_PHASES.includes(q.phase)){q.phase='penanda';changed=true;}}
 return changed;
}
function hbTutorialStatus(id){hbTutorialEnsure();const q=S.tutorials.topics[id];return q?q.status:'belum';}
function hbTutorialActive(){hbTutorialEnsure();const id=S.tutorials.active;return id?{id,topic:HB_TUTORIAL_TOPICS.find(t=>t.id===id),state:S.tutorials.topics[id]}:null;}
function hbTutorialStart(id){
 hbTutorialEnsure();const t=HB_TUTORIAL_TOPICS.find(q=>q.id===id);if(!t||S.tutorials.active||hbTutorialStatus(id)==='selesai'||(+best||0)<t.stage)return false;
 const q=S.tutorials.topics[id],old={status:q.status,phase:q.phase,startedAt:q.startedAt},oldActive=S.tutorials.active;
 q.status='berjalan';q.phase='penanda';q.startedAt=Date.now();q.skipped=0;S.tutorials.active=id;
 if(!sv()){Object.assign(q,old);S.tutorials.active=oldActive;return false;}return true;
}
function hbTutorialSetPhase(id,next){const q=S.tutorials.topics[id];if(!q||q.status!=='berjalan'||!HB_TUT_PHASES.includes(next))return false;const old=q.phase;q.phase=next;if(!sv()){q.phase=old;return false;}return true;}
function hbTutorialAction(id,note){
 hbTutorialEnsure();const a=hbTutorialActive();if(!a||a.id!==id||a.state.status!=='berjalan'||a.state.phase!=='tunggu')return false;
 const old={phase:a.state.phase,note:a.state.note,actions:a.state.actions};a.state.phase='konfirmasi';a.state.note=String(note||'');a.state.actions=(+a.state.actions||0)+1;a.state.actionAt=Date.now();
 if(!sv()){Object.assign(a.state,old);return false;}return true;
}
function hbTutorialComplete(id,skipped=false){
 hbTutorialEnsure();const q=S.tutorials.topics[id];if(!q||q.status!=='berjalan'||S.tutorials.active!==id)return false;
 const old={status:q.status,phase:q.phase,completedAt:q.completedAt,skipped:q.skipped},oldActive=S.tutorials.active,oldLast=S.tutorials.lastCompleted;
 q.status='selesai';q.phase='simpan';q.completedAt=Date.now();q.skipped=skipped?1:0;S.tutorials.active=null;S.tutorials.lastCompleted=id;
 if(!sv()){Object.assign(q,old);S.tutorials.active=oldActive;S.tutorials.lastCompleted=oldLast;return false;}return true;
}
function hbTutorialAdvance(){
 const a=hbTutorialActive();if(!a)return false;const phase=a.state.phase;
 if(phase==='penanda')return hbTutorialSetPhase(a.id,'instruksi');
 if(phase==='instruksi')return hbTutorialSetPhase(a.id,'sorot');
 if(phase==='sorot')return hbTutorialSetPhase(a.id,'tunggu');
 if(phase==='konfirmasi')return hbTutorialSetPhase(a.id,'lanjut');
 if(phase==='lanjut')return hbTutorialComplete(a.id,false);
 return false;
}
function hbTutorialSkip(){const a=hbTutorialActive();return a?hbTutorialComplete(a.id,true):false;}
function hbTutorialEligible(t){
 if((+best||0)<t.stage||t.after.some(id=>hbTutorialStatus(id)!=='selesai'))return false;
 if(t.trigger==='menu')return st==='menu';
 if(t.trigger==='shop')return st==='shop'&&shopTab===0;
 if(t.trigger==='world')return st==='world';
 if(t.trigger==='kitchen')return st==='kitchen';
 return false;
}
function hbTutorialObserve(){
 if(hbTutorialEnsure())sv();const a=hbTutorialActive();
 if(a)return;
 for(const t of HB_TUTORIAL_TOPICS){if(hbTutorialStatus(t.id)==='selesai')continue;if(hbTutorialEligible(t)){hbTutorialStart(t.id);return;}}
}
