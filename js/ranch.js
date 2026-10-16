const ranchL=(a,b)=>S.set&&S.set.lang==='en'?b:a;
/* PETERNAKAN 
 Semua data masuk ke S.ranch dan tersimpan lewat sv()/Save.*. Hewan memakai animasi atlas Sunnyside.
 Pakan didapat sebagai bahan samping panen ladang. Produksi berdasarkan timestamp; jam mundur dijaga
 dengan clock monoton tersimpan, pakan berlaku sampai tengah malam lokal, hasil dan penjualan dibatasi harian. */
const RANCH={buy:180,maxLevel:5,baseCap:4,perLevel:2,feedCap:99,stockCap:99,dailyOutputCap:8,dailyGoldCap:100,maxOfflineMs:24*3600e3};
const RANIM={
 chicken:{name:'Ayam',en:'Chicken',price:60,product:'egg',interval:12*60e3,sell:8,color:'#f5d58a'},
 cow:{name:'Sapi',en:'Cow',price:190,product:'milk',interval:20*60e3,sell:18,color:'#e8e4d9'},
 pig:{name:'Babi',en:'Pig',price:145,product:'truffle',interval:16*60e3,sell:14,color:'#f3a1a7'},
 sheep:{name:'Domba',en:'Sheep',price:170,product:'wool',interval:25*60e3,sell:24,color:'#e9e3cb'}
};
const RPRODUCT=[['egg','Telur','Egg'],['milk','Susu','Milk'],['truffle','Jamur truffle','Truffle'],['wool','Wol','Wool']];
const ranchDay=n=>new Date(n).toDateString();
function ranchState(){
 if(!S.ranch||typeof S.ranch!=='object'||Array.isArray(S.ranch))S.ranch={level:0,animals:[],feed:0,stock:{egg:0,milk:0,truffle:0,wool:0},day:ranchDay(Date.now()),made:0,soldGold:0,clock:0};
 const r=S.ranch;
 if(!Array.isArray(r.animals))r.animals=[];
 if(!r.stock||typeof r.stock!=='object')r.stock={};
 if(!r.madeByDay||typeof r.madeByDay!=='object')r.madeByDay={};
 RPRODUCT.forEach(p=>{r.stock[p[0]]=Math.max(0,Math.min(RANCH.stockCap,Math.floor(+r.stock[p[0]]||0)))});
 r.level=Math.max(0,Math.min(RANCH.maxLevel,Math.floor(+r.level||0)));
 r.feed=Math.max(0,Math.min(RANCH.feedCap,Math.floor(+r.feed||0)));
 r.made=Math.max(0,Math.floor(+r.made||0));r.soldGold=Math.max(0,Math.floor(+r.soldGold||0));r.clock=Math.max(0,+r.clock||0);
 return r;
}
function ranchNow(){const r=ranchState(),raw=Date.now();r.clock=Math.max(raw,r.clock||0);return r.clock;}
function ranchGet(){
 const r=ranchState(),now=ranchNow(),day=ranchDay(now);
 if(r.day!==day){r.day=day;r.made=Math.max(0,Math.floor(+r.madeByDay[day]||0));r.soldGold=0;}
 r.made=Math.max(0,Math.floor(+r.madeByDay[day]||r.made||0));r.madeByDay[day]=r.made;
 r.animals=r.animals.filter(a=>a&&RANIM[a.type]).slice(0,16);
 r.animals.forEach(a=>{
  a.id=String(a.id||('a'+Math.random().toString(36).slice(2,8)));
  a.x=Math.max(.07,Math.min(.93,isFinite(a.x)?+a.x:.2+Math.random()*.6));
  a.y=Math.max(.10,Math.min(.88,isFinite(a.y)?+a.y:.15+Math.random()*.7));
  a.tx=Math.max(.07,Math.min(.93,isFinite(a.tx)?+a.tx:a.x));a.ty=Math.max(.10,Math.min(.88,isFinite(a.ty)?+a.ty:a.y));
  a.fedDay=typeof a.fedDay==='string'?a.fedDay:'';a.fedUntil=Math.max(0,+a.fedUntil||0);a.nextAt=Math.max(0,+a.nextAt||0);a.pending=Math.max(0,Math.min(99,Math.floor(+a.pending||0)));
  /* Timestamp terlampau jauh di masa depan biasanya akibat jam perangkat dimundurkan. */
  if(a.fedUntil>now+36*3600e3)a.fedUntil=now;
  if(a.nextAt>now+30*24*3600e3)a.nextAt=now+RANIM[a.type].interval;
 });
 return r;
}
function ranchCapacity(r){return r.level?RANCH.baseCap+(r.level-1)*RANCH.perLevel:0;}
function ranchUpgradeCost(r){return r.level===0?RANCH.buy:Math.round(220+180*r.level+70*r.level*r.level);}
function ranchFeedAdd(n){const r=ranchGet(),old=r.feed;r.feed=Math.min(RANCH.feedCap,r.feed+Math.max(0,n|0));return r.feed-old;}
function ranchNeedsFeed(r){const now=ranchNow();return r.animals.filter(a=>!a.fedUntil||a.fedUntil<=now).length;}
function ranchSync(save){
 const r=ranchGet(),now=ranchNow();let changed=false;
 const offlineFloor=now-RANCH.maxOfflineMs;
 r.animals.forEach(a=>{
  const cfg=RANIM[a.type];if(!a.fedDay||!a.fedUntil||!a.nextAt||a.nextAt>a.fedUntil)return;
  const cutoff=Math.min(now,a.fedUntil);
  // Jangan membuat hasil untuk waktu yang lebih lama dari jendela offline 24 jam.
  if(a.nextAt<offlineFloor&&cutoff>=offlineFloor){a.nextAt=offlineFloor+cfg.interval;changed=true;}
  while(a.nextAt<=cutoff&&a.nextAt>=offlineFloor){
   // Jika antrian milik hewan penuh, tahan jadwal produksi; hasil tidak dihapus diam-diam.
   if(a.pending>=RANCH.stockCap)break;
   // Batas output mengikuti tanggal hasil matang, bukan tanggal pakan diberikan.
   const outputDay=ranchDay(a.nextAt),dayMade=Math.max(0,Math.floor(+r.madeByDay[outputDay]||0));
   if(dayMade<RANCH.dailyOutputCap){
    a.pending++;r.madeByDay[outputDay]=dayMade+1;changed=true;
    if(outputDay===r.day)r.made=dayMade+1;
   }
   a.nextAt+=cfg.interval;changed=true;
   // Batas langkah defensif untuk data lama/rusak agar tidak memblokir frame.
   if(a.nextAt<=now-8*24*3600e3){a.nextAt=now+cfg.interval;changed=true;break;}
  }
 });
 const days=Object.keys(r.madeByDay).sort((a,b)=>Date.parse(b)-Date.parse(a));days.slice(30).forEach(k=>{delete r.madeByDay[k];changed=true});
 if(changed&&save)sv();return changed;
}
function ranchBuyOrUpgrade(){
 const r=ranchGet(),cost=ranchUpgradeCost(r);
 if(r.level>=RANCH.maxLevel){say('Kandang sudah level maksimal');return}
 if(S.g<cost){say('Emas tidak cukup: perlu '+cost);return}
 S.g-=cost;r.level++;sv();sfx('coin');say(r.level===1?'Kandang dibeli! Kapasitas awal 4 hewan.':'Kandang ditingkatkan ke Lv '+r.level+' ('+ranchCapacity(r)+' hewan)');
}
function ranchBuyAnimal(type){
 const r=ranchGet(),cfg=RANIM[type];if(!cfg)return;
 if(!r.level){say(ranchL('Beli kandang dulu.','Buy a pen first.'));return}
 if(r.animals.length>=ranchCapacity(r)){say(ranchL('Kandang penuh. Tingkatkan dulu.','The pen is full. Upgrade it first.'));return}
 if(S.g<cfg.price){say('Emas tidak cukup: perlu '+cfg.price);return}
 S.g-=cfg.price;const x=.15+Math.random()*.7,y=.16+Math.random()*.65;
 r.animals.push({id:'r'+ranchNow().toString(36)+Math.random().toString(36).slice(2,5),type:type,x:x,y:y,tx:.1+Math.random()*.8,ty:.1+Math.random()*.8,fedDay:'',fedUntil:0,nextAt:0,pending:0});sv();sfx('clear');say(S.set.lang==='en'?cfg.en+' bought':cfg.name+' dibeli');
}
function ranchFeedAll(){
 ranchSync(true);const r=ranchGet(),need=ranchNeedsFeed(r),day=r.day,now=ranchNow();if(!r.animals.length){say('Belum ada hewan');return}if(!need){say(ranchL('Semua hewan masih kenyang.','All animals are still full.'));return}if(r.feed<need){say(ranchL('Pakan kurang, perlu '+need+'. Panen di ladang untuk dapat pakan.','Not enough feed, need '+need+'. Harvest in the field to get feed.'));return}
 r.feed-=need;const until=now+24*3600e3;
 r.animals.forEach(a=>{if(a.fedUntil>now)return;a.fedDay=day;a.fedUntil=until;a.nextAt=now+RANIM[a.type].interval;});sv();sfx('heal');say(ranchL('Pakan diberikan ke '+need+' hewan. Produksi jalan 24 jam.','Fed '+need+' animals. Production runs for 24 hours.'));
}
function ranchCollect(){
 const r=ranchGet();ranchSync(false);let got=0;
 r.animals.forEach(a=>{const p=RANIM[a.type].product,room=RANCH.stockCap-r.stock[p],n=Math.min(a.pending,room);if(n>0){r.stock[p]+=n;a.pending-=n;got+=n;}});
 if(!got){say(ranchL('Belum ada hasil yang siap.','Nothing is ready yet.'));return}sv();sfx('coin');say('Hasil dikumpulkan: '+got+' produk');
}
function ranchOpenMarket(){ranchSync(true);marketFrom='ranch';st='market';sfx('click');}
let marketFrom='world';
/* Ikon item kecil (telur, susu, ikan, dst). Bahan mentah memakai items.png lewat scItemIcon; sisanya digambar kode. s = ukuran px. */
function itemIcon(id,x,y,s){
 s=s||16;const u=s/16,o='#1a1220',L=Math.max(1,u*.9);
 const ell=(cx,cy,rx,ry,f,rot)=>{g.beginPath();g.ellipse(x+cx*u,y+cy*u,rx*u,ry*u,rot||0,0,7);g.fillStyle=f;g.fill();g.strokeStyle=o;g.lineWidth=L;g.stroke()};
 const rect=(a,b,w,h,f)=>{g.fillStyle=f;g.fillRect(x+a*u,y+b*u,w*u,h*u)};
 const tri=(p,f)=>{g.beginPath();g.moveTo(x+p[0]*u,y+p[1]*u);g.lineTo(x+p[2]*u,y+p[3]*u);g.lineTo(x+p[4]*u,y+p[5]*u);g.closePath();g.fillStyle=f;g.fill();g.strokeStyle=o;g.lineWidth=L;g.stroke()};
 g.save();
 switch(id){
  case'gold':ell(8,8,6.5,6.5,'#f4c542');ell(8,8,3.8,3.8,'#d99a1e');rect(7.3,5.8,1.4,4.4,'#f9e08a');break;
  case'egg':ell(8,9,5,6.2,'#f6e3b4');ell(6.4,7,1.4,2,'rgba(255,255,255,.7)',-.4);break;
  case'milk':rect(5,3,6,2.5,'#c9d6e8');rect(4,5.5,8,9,'#f4f4ee');rect(4,8,8,3.5,'#7fb4e6');g.strokeStyle=o;g.lineWidth=L;g.strokeRect(x+4*u,y+3*u,8*u,11.5*u);break;
  case'truffle':ell(8,9.5,6,5,'#5a3b2a');ell(6,8,1,1,'#8a6246');ell(10,10.5,1,1,'#8a6246');ell(8,12,.9,.9,'#8a6246');break;
  case'wool':ell(5.5,9,3.6,3.6,'#f2efe6');ell(10.5,9,3.6,3.6,'#f2efe6');ell(8,6.2,3.8,3.6,'#fbf9f2');ell(8,11,4,3,'#e8e4d8');break;
  case'fish':tri([11,8,15.5,3.5,15.5,12.5],'#5c8fb8');ell(7,8,6,3.8,'#8bc2e4');ell(5,7,.9,.9,'#101018');rect(8,6.5,1,3,'rgba(255,255,255,.45)');break;
  case'carrot':rect(7,1.5,2,3,'#58a84a');rect(9,2.5,2,2,'#58a84a');tri([4.5,5,11.5,5,8,15],'#ee8b2e');rect(6,7.5,3,1,'#c96a1c');break;
  case'pumpkin':rect(7.3,2,1.6,3,'#4d8a3c');ell(5.5,9.5,3.8,5,'#e58a2c');ell(10.5,9.5,3.8,5,'#e58a2c');ell(8,9.5,2.4,5.2,'#f2a040');break;
  case'moonflower':[[8,4.2],[12,7.2],[10.6,12],[5.4,12],[4,7.2]].forEach(p=>ell(p[0],p[1],2.8,2.8,'#cfe2ff'));ell(8,8.5,2.6,2.6,'#ffd96a');break;
  default:if(typeof scItemIcon==='function'&&typeof SC_MATERIALS!=='undefined'&&SC_MATERIALS.some(m=>m.id===id))scItemIcon(id,x,y,s);
 }
 g.restore();
}

function ranchSellAll(){
 const r=ranchGet();ranchSync(false);let gold=0,units=0,left=RANCH.dailyGoldCap-r.soldGold;
 RPRODUCT.forEach(p=>{const id=p[0],val=RANIM[({egg:'chicken',milk:'cow',truffle:'pig',wool:'sheep'})[id]].sell,n=Math.min(r.stock[id],Math.floor(left/val));if(n>0){r.stock[id]-=n;gold+=n*val;left-=n*val;units+=n;}});
 if(!gold){say(r.soldGold>=RANCH.dailyGoldCap?ranchL('Penjualan hari ini sudah cukup. Lanjut besok.','Enough sales for today. More tomorrow.'):'Belum ada hasil untuk dijual');return}
 r.soldGold+=gold;S.g+=gold;sv();sfx('coin');say('Terjual '+units+' produk: +'+gold+' emas');
}
function ranchUpdate(dt){
 const r=ranchGet();if(!r.level||!r.animals.length)return;const now=Date.now();
 r.animals.forEach(a=>{
  if(!a.moveAt||a.moveAt<now){a.tx=.1+Math.random()*.8;a.ty=.12+Math.random()*.74;a.moveAt=now+1600+Math.random()*2600;}
  const dx=(a.tx-a.x)*360,dy=(a.ty-a.y)*185,dist=Math.hypot(dx,dy),step=25*Math.max(0,dt||0);
  if(dist>step&&dist>.5){a.x+=dx/dist*step/360;a.y+=dy/dist*step/185;}else{a.x=a.tx;a.y=a.ty;}
 });
 ranchSync(true);
}
function ranchDrawAnimal(a,px,py){
 const cfg=RANIM[a.type],now=performance.now();
 Anim.shadow(g,px,py+2,9,3,.24);
 if(!(Anim.draw(g,'animal_'+a.type,now,px,py,false,1.25))){
  g.fillStyle=cfg.color;g.beginPath();g.ellipse(px,py-5,9,6,0,0,Math.PI*2);g.fill();g.fillStyle='#4a3329';g.fillRect(px+4,py-11,4,4);g.fillRect(px-6,py-1,3,4);g.fillRect(px+4,py-1,3,4);
 }
}
function drawRanch(){
 const r=ranchGet();ranchSync(true);ov(.95);btn(6,5,76,28,'KEMBALI');T('KANDANG',96,25,'#fc4',17);T('Emas: '+S.g,632,24,'#fc4',12,'right');
 /* Kandang/padang interaktif di sisi kiri. */
 g.fillStyle='#1b2b20';g.fillRect(10,43,370,213);g.fillStyle='#477c43';g.fillRect(16,49,358,201);
 for(let i=0;i<85;i++){const x=20+((i*73)%345),y=54+((i*47)%188);g.fillStyle=i%3?'rgba(155,209,91,.34)':'rgba(35,87,47,.4)';g.fillRect(x,y,2+(i%2),3)}
 g.strokeStyle='#b28b59';g.lineWidth=5;g.strokeRect(19,54,352,191);g.strokeStyle='#e0b77a';g.lineWidth=2;for(let x=24;x<371;x+=26){g.beginPath();g.moveTo(x,51);g.lineTo(x,61);g.moveTo(x,238);g.lineTo(x,249);g.stroke()}for(let y=65;y<237;y+=24){g.beginPath();g.moveTo(15,y);g.lineTo(25,y);g.moveTo(364,y);g.lineTo(374,y);g.stroke()}
 T('PADANG KANDANG',29,68,'#fff0bd',10);
 if(!r.level){ov(.45);card(52,102,286,92,'#fc4',false);T('Belum memiliki kandang',195,128,'#fff',14,'center');T('Beli kandang untuk menampung 4 hewan.',195,148,'#cde',10,'center');T('Biaya: '+RANCH.buy+' emas',195,169,'#fc4',12,'center')}
 else if(!r.animals.length){T('Belum ada hewan. Beli hewan di bawah.',195,159,'#fff',11,'center')}
 r.animals.forEach((a,i)=>{const px=22+a.x*343,py=59+a.y*183;ranchDrawAnimal(a,px,py);if(ranchNow()<=a.fedUntil){g.fillStyle='rgba(20,40,20,.8)';g.fillRect(px-22,py-31,44,11);T('DIRAWAT',px,py-23,'#aef5a1',7,'center')}if(a.pending>0){g.fillStyle='#fc4';g.beginPath();g.arc(px+11,py-21,5,0,7);g.fill();T(''+a.pending,px+11,py-18,'#201729',7,'center')}});
 T('Hewan: '+r.animals.length+'/'+ranchCapacity(r),25,267,'#cde',10);
 ['chicken','cow','pig','sheep'].forEach((type,i)=>{const cfg=RANIM[type],x=12+i*91;g.fillStyle=r.level&&r.animals.length<ranchCapacity(r)&&S.g>=cfg.price?'#2b6943':'#353140';g.fillRect(x,276,86,40);g.strokeStyle='#080b0a';g.lineWidth=1;g.strokeRect(x,276,86,40);Anim.draw(g,'animal_'+type,performance.now(),x+15,305,false,.7);T((S.set.lang==='en'?cfg.en:cfg.name).toUpperCase(),x+24,290,'#fff',8);T(cfg.price+' G',x+48,308,'#fc4',9,'center')});
 /* Panel manajemen kanan. */
 card(390,43,238,272,'#b28b59',true);
 if(!r.level){btn(398,67,222,33,'BELI KANDANG - '+RANCH.buy+' G',S.g>=RANCH.buy);T('Kapasitas setelah dibeli: 4 hewan',400,115,'#cde',9)}
 else{T('KANDANG Lv '+r.level+'/'+RANCH.maxLevel,402,62,'#fc4',12);btn(398,69,222,29,r.level>=RANCH.maxLevel?'LEVEL MAKS':'TINGKATKAN - '+ranchUpgradeCost(r)+' G',r.level<RANCH.maxLevel&&S.g>=ranchUpgradeCost(r));T('Kapasitas: '+r.animals.length+'/'+ranchCapacity(r),402,111,'#cde',10);T('Pakan tersedia: '+r.feed,402,130,'#9cf',10);btn(398,136,222,25,'BERI PAKAN SEMUA ('+ranchNeedsFeed(r)+')',r.animals.length>0&&r.feed>=ranchNeedsFeed(r)&&ranchNeedsFeed(r)>0);
 T('HASIL TERTUNDA',402,181,'#fc4',10);const pending=r.animals.reduce((n,a)=>n+a.pending,0);T('Produk siap: '+pending+'  |  Hari ini: '+r.made+'/'+RANCH.dailyOutputCap,402,197,'#cde',9);RPRODUCT.forEach((p,i)=>{T(p[S.set.lang==='en'?2:1]+': '+r.stock[p[0]],402,214+i*13,'#fff',9)});btn(398,257,222,24,'KUMPULKAN HASIL',pending>0);}
 btn(398,285,222,25,'KE PASAR / JUAL HASIL',1);T('Pakan dari panen · aktif 24 jam.',400,326,'#9cf',9);T('Batas jual: '+r.soldGold+'/'+RANCH.dailyGoldCap+' emas/hari',400,339,'#fc4',9);
}
function ranchClick(x,y){const r=ranchGet();
 if(y<34&&x<85){goBack();sfx('click');return}
 if(x>=12&&x<=376&&y>=276&&y<=316){const i=Math.floor((x-12)/91),type=['chicken','cow','pig','sheep'][i];if(type)ranchBuyAnimal(type);return}
 if(x>=390&&x<=630){
  if(!r.level&&y>=64&&y<=103){ranchBuyOrUpgrade();return}
  if(r.level&&y>=65&&y<=102){ranchBuyOrUpgrade();return}
  if(r.level&&y>=134&&y<=163){ranchFeedAll();return}
  if(r.level&&y>=256&&y<=282){ranchCollect();return}
  if(y>=284&&y<=320){ranchOpenMarket();return}
 }
}
function drawMarket(){
 const r=ranchGet();ranchSync(true);ov(.95);btn(6,5,76,28,'KEMBALI');T('PASAR',96,25,'#fc4',17);T('Emas: '+S.g,632,24,'#fc4',12,'right');
 card(28,47,584,204,'#b28b59',true);T('HASIL PETERNAKAN',46,68,'#fc4',12);
 RPRODUCT.forEach((p,i)=>{const y=83+i*42,cfg=RANIM[({egg:'chicken',milk:'cow',truffle:'pig',wool:'sheep'})[p[0]]];g.fillStyle='#29253b';g.fillRect(42,y,556,34);g.strokeStyle='#55455a';g.strokeRect(42.5,y+.5,555,33);g.fillStyle='#1a1630';g.fillRect(48,y+3,28,28);g.strokeStyle='#55455a';g.strokeRect(48.5,y+3.5,27,27);itemIcon(p[0],50,y+5,24);T(p[S.set.lang==='en'?2:1],86,y+21,'#fff',12);T('Stok: '+r.stock[p[0]],290,y+21,r.stock[p[0]]?'#fff':'#9ab',11);T('Harga '+cfg.sell+' G',422,y+21,'#fc4',11);T(r.stock[p[0]]?'SIAP':'KOSONG',570,y+21,r.stock[p[0]]?'#8f8':'#8a8aa0',10,'center')});
 const left=Math.max(0,RANCH.dailyGoldCap-r.soldGold);T('Batas penjualan hari ini: '+r.soldGold+'/'+RANCH.dailyGoldCap+' emas',320,274,'#fc4',10,'center');T('Produksi offline dibatasi maksimal 24 jam.',320,291,'#9cf',9,'center');if(!RPRODUCT.some(p=>r.stock[p[0]]>0)){const hl=r.level?[ranchL('Belum ada hasil.','Nothing to sell yet.'),ranchL('Rawat hewan di kandang','Tend your animals at'),ranchL('lalu kembali ke sini.','the pen, then return.')]:[ranchL('Belum punya kandang.','No pen yet.'),ranchL('Bangun kandang & beli','Build a pen and buy'),ranchL('hewan untuk mulai.','animals to start.')];hl.forEach((t,i)=>T(t,34,296+i*13,'#9cf',10))}btn(190,299,260,36,'JUAL SEMUA HASIL ('+left+' G TERSISA)',left>0&&RPRODUCT.some(p=>r.stock[p[0]]>0));
}
function marketClick(x,y){if(y<34&&x<85){if(marketFrom==='ranch')st='ranch';else goBack();sfx('click');return}if(y>=298&&y<=340&&x>=185&&x<=455){ranchSellAll();return}}

/* ===== Kandang di dunia ===== */
/* jumlah hewan per jenis untuk digambar di kandang dunia; sebelum kandang dibeli tampil 2 hewan hias per kandang */
function ranchWorldCounts(){
 const r=typeof S!=='undefined'&&S.ranch;if(!r||!r.level||!Array.isArray(r.animals))return{chicken:2,cow:2,pig:2,sheep:2};
 const c={chicken:0,cow:0,pig:0,sheep:0};r.animals.forEach(a=>{if(a&&c[a.type]!=null)c[a.type]++});return c;
}
const RPEN_LABEL={egg:['AMBIL TELUR','TAKE EGGS'],milk:['PERAH SUSU','MILK COW'],truffle:['CARI TRUFFLE','FIND TRUFFLE'],wool:['GUNTING WOL','SHEAR WOOL']};
function ranchPenInfo(type){
 const r=ranchGet();ranchSync(false);const cfg=RANIM[type];let pending=0,count=0;
 r.animals.forEach(a=>{if(a.type===type){count++;pending+=a.pending}});
 return{count,pending,product:cfg.product,label:RPEN_LABEL[cfg.product]};
}
/* ambil hasil hanya dari satu jenis hewan (telur dari ayam, susu dari sapi, dst) */
function ranchCollectType(type){
 const r=ranchGet();ranchSync(false);const cfg=RANIM[type],p=cfg.product;let got=0;
 r.animals.forEach(a=>{if(a.type!==type)return;const room=RANCH.stockCap-r.stock[p],n=Math.min(a.pending,room);if(n>0){r.stock[p]+=n;a.pending-=n;got+=n}});
 if(!got){say(ranchL('Belum ada hasil yang siap.','Nothing is ready yet.'));return false}
 sv();sfx('coin');say(ranchL('Diambil '+got+' '+(RPRODUCT.find(q=>q[0]===p)||[0,p])[1],'Collected '+got+' '+(RPRODUCT.find(q=>q[0]===p)||[0,0,p])[2]));return true;
}
