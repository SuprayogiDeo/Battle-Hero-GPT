/* INTERIOR BANGUNAN 
 Skrip klasik. Dimuat sebelum hud.js. Setiap bangunan di desa punya ruangan yang bisa dijelajahi.
 Keadaan runtime (TIDAK disimpan): wI = {b, room, x, y} saat pemain di dalam. S.world tetap = titik di depan pintu eksterior,
 jadi simpan/muat saat di dalam selalu pulih di pintu luar (titik aman). Aksi lewat tombol aksi (hud.js), bukan pop-up otomatis.
 Seni: assets/world/interior.png (+interior.json) dibuat tools/build_interiors.py. Bila belum termuat dipakai kotak warna. */
const INT_IM=new Image();INT_IM.src='assets/world/interior.png';let INT_SPR=null;
try{fetch('assets/world/interior.json').then(r=>r.ok?r.json():null).then(j=>{if(j&&j.spr)INT_SPR=j.spr}).catch(()=>{})}catch(e){}
let wI=null,wFade=null,intT=0;
/* kaki bangunan (px 1x) = objek 'b_*' di index.json; pintu = titik tengah kaki. lv = level desa minimum (place.unlockLevel), stg = stage minimum (WUN) */
const INT_B=[
{id:'toko',tpl:'shop',x:320,y:320,n:['TOKO','SHOP']},
{id:'pasar',tpl:'market',x:728,y:544,n:['PASAR','MARKET']},
{id:'barak',tpl:'barracks',x:712,y:320,n:['BARAK','BARRACKS'],stg:3},
{id:'bengkel',tpl:'workshop',x:952,y:736,n:['BENGKEL DESA','VILLAGE WORKSHOP'],lv:2},
{id:'dapur',tpl:'kitchen',x:952,y:976,n:['DAPUR DESA','VILLAGE KITCHEN'],lv:3},
{id:'penebang',tpl:'woodcutter',x:1448,y:336,n:['PONDOK PENEBANG','WOODCUTTER HUT'],lv:4},
{id:'balai',tpl:'hall',x:1240,y:704,n:['BALAI DESA','VILLAGE HALL'],lv:5},
{id:'nelayan',tpl:'fisher',x:776,y:1184,n:['PONDOK NELAYAN',"FISHERMAN'S HUT"]},
{id:'res1',tpl:'res1',x:200,y:320,n:['RUMAH PENDUDUK','RESIDENT HOUSE']},
{id:'res2',tpl:'res2',x:808,y:320,n:['RUMAH PENDUDUK','RESIDENT HOUSE']},
{id:'res3',tpl:'res3',x:192,y:208,n:['RUMAH PENDUDUK','RESIDENT HOUSE']},
{id:'res4',tpl:'res1',x:328,y:208,n:['RUMAH PENDUDUK','RESIDENT HOUSE']},
{id:'res5',tpl:'res2',x:832,y:208,n:['RUMAH PENDUDUK','RESIDENT HOUSE']},
{id:'res6',tpl:'res3',x:712,y:208,n:['RUMAH PENDUDUK','RESIDENT HOUSE']}];
/* pesan singkat [ID, EN] */
const INT_MSG={
 books:['Buku-buku tua tentang pertanian dan petualangan.','Old books about farming and adventure.'],
 bed:['Kamu beristirahat sejenak. Progres tersimpan.','You rest for a moment. Progress saved.'],
 fire:['Api unggun kecil menghangatkan ruangan.','A small fire warms the room.'],
 forge:['Tungku menyala. Meja kerja ada di sebelahnya.','The forge glows. The workbench is next to it.'],
 anvil:['Landasan besi yang sudah lama dipakai.','A well-used iron anvil.'],
 plan:['Peta strategi. Berangkat lewat Gerbang di utara desa.','A strategy map. Depart through the Gate north of the village.'],
 rods:['Pancing dipilih dari hotbar (terbuka di stage 6), lalu dekati titik air.','Pick the Rod from the hotbar (stage 6), then stand near a fishing spot.'],
 logs:['Tumpukan kayu. Tebang pohon di tepi hutan dengan Kapak.','A log pile. Chop trees at the forest edge with the Axe.'],
 hay:['Jerami kering untuk hewan ternak.','Dry hay for the livestock.'],
 pot:['Rak bahan dapur penduduk.','The resident\'s pantry shelf.']};
/* Templat ruangan. w,h tile (32 px); y 0-1 = dinding atas; pintu = kolom dx di baris bawah.
 o: [sprite,x,y,fw,fh,aksi,label,pesan] (jejak tabrakan fw x fh tile; kaki sprite = bawah jejak); d: dekor lantai [sprite,cx,cy];
 hg: tempelan dinding [sprite,cx,barisAtas]; win: kolom jendela; gl: cahaya [cx,cy,r] */
const INT_T={
/* Pasar (9F): kasir menjual hasil ternak; loket dapur + meja desa + papan pesanan; pedagang, papan harga/berita, timbangan, meja dagang, peti. */
market:{w:17,h:10,fl:['floor_wood_a','floor_wood_b'],wl:'wall_wood',dx:8,win:[4,12],
 o:[['shelf_goods',1,2,2,1,'msg','RAK','pot'],['shelf_goods2',3,2,2,1,'msg','RAK','pot'],['notice',6,2,2,1,'msg','HARGA','harga'],['notice',8,2,2,1,'news','BERITA'],['notice',10,2,2,1,'orders','PESANAN'],['pantry',13,2,2,1,'storage','BAHAN'],
 ['map_table',1,4,3,1,'village','DESA'],['counter',7,4,3,1,'market','KASIR'],['vendor',10,4,1,1,'msg','PEDAGANG','vendor'],['prep_table',13,4,2,1,'cook','DAPUR'],
 ['market_table',1,6,3,1,'msg','MEJA DAGANG','meja'],['scale',5,6,1,1,'msg','TIMBANGAN','timbangan'],['market_table',11,6,3,1,'msg','MEJA DAGANG','meja'],['chest',15,6,1,1,'storage','PETI'],
 ['w_crates',1,8,1,1],['w_barrel',2,8,1,1],['w_sack',14,8,1,1],['w_crates',15,8,1,1]],
 d:[['rug_red',8.5,6.4]],hg:[['banner',3.2,0],['banner',13.6,0]],gl:[[8,5,90]]},
shop:{w:13,h:9,fl:['floor_wood_a','floor_wood_b'],wl:'wall_wood',dx:6,win:[6],
 o:[['shelf_goods',1,2,2,1],['shelf_goods2',3,2,2,1],['counter',7,3,3,1,'cashier','BELI'],['gacha',10,3,2,1,'gacha','GACHA'],['w_crates',1,6,1,1],['w_barrel',11,7,1,1],['w_sack',2,7,1,1]],
 d:[['rug_red',6.5,6]],hg:[],gl:[]},
barracks:{w:15,h:9,fl:['floor_stone_a','floor_stone_b'],wl:'wall_stone',dx:7,win:[12],
 o:[['weapon_rack',2,2,2,1,'heroes','PERSIAPAN'],['weapon_rack',5,2,2,1,'heroes','PERSIAPAN'],['map_table',8,3,3,1,'msg','PETA','plan'],['chest',13,2,1,1,'storage','PETI'],['w_bench',11,6,1,1]],
 d:[['rug_blue',7.5,6]],hg:[['banner',7.4,0],['banner_blue',10.6,0]],gl:[]},
hall:{w:14,h:10,fl:['floor_stone_a','floor_stone_b'],wl:'wall_cream',dx:7,win:[11],
 o:[['shelf_books',1,2,2,1,'msg','BUKU','books'],['shelf_books',3,2,2,1,'msg','BUKU','books'],['map_table',5,3,3,1,'village','DESA'],['notice',9,2,2,1,'orders','PESANAN'],['cabinet',12,2,1,1]],
 d:[['rug_red',6.5,6.4]],hg:[['banner_blue',8.1,0]],gl:[]},
workshop:{w:11,h:8,fl:['floor_dark','floor_dark'],wl:'wall_stone',dx:5,win:[8],
 o:[['forge',1,2,2,1,'msg','TUNGKU','forge'],['workbench',4,3,3,1,'workshop','MEJA KERJA'],['anvil',8,3,1,1,'msg','LANDASAN','anvil'],['logs',1,5,2,1],['w_crates',9,2,1,1],['w_barrel',9,6,1,1]],
 d:[],hg:[],gl:[[2,3,70]]},
kitchen:{w:11,h:8,fl:['floor_check','floor_check'],wl:'wall_cream',dx:5,win:[7],
 o:[['stove',1,2,2,1,'cook','MASAK'],['pantry',4,2,2,1,'storage','BAHAN'],['prep_table',7,3,2,1,'cook','MASAK'],['w_barrel',9,2,1,1],['tw_stool',3,5,1,1]],
 d:[['rug_green',5.5,5.9]],hg:[],gl:[[2,3,60]]},
home:{w:11,h:8,fl:['floor_wood_a','floor_wood_b'],wl:'wall_wood',dx:5,win:[5],
 o:[['tw_bedset',1,2,4,1,'bed','ISTIRAHAT'],['fireplace',6,2,2,1,'msg','API','fire'],['chest',9,2,1,1,'storage','PETI'],['tw_lamp',9,5,1,1],['tw_stool',3,5,1,1]],
 d:[['rug_red',5.5,5.6]],hg:[['tw_picture',8.2,1]],gl:[[7,3,60]]},
woodcutter:{w:9,h:7,fl:['floor_dark','floor_wood_b'],wl:'wall_wood',dx:4,win:[4],
 o:[['logs',1,2,2,1,'msg','KAYU','logs'],['hay',4,2,2,1,'msg','JERAMI','hay'],['chest',7,2,1,1,'storage','PETI'],['w_bench',6,4,1,1]],d:[['rug_green',4.5,4.9]],hg:[],gl:[]},
fisher:{w:9,h:7,fl:['floor_wood_a','floor_wood_b'],wl:'wall_wood',dx:4,win:[3],
 o:[['rod_rack',1,2,2,1,'msg','PANCING','rods'],['tw_bedset',4,2,4,1,'bed','ISTIRAHAT'],['w_crates',1,4,1,1],['w_barrel',7,4,1,1]],d:[['rug_green',4.5,5]],hg:[],gl:[]},
res1:{w:9,h:7,fl:['floor_wood_a','floor_wood_b'],wl:'wall_wood',dx:4,win:[5],
 o:[['tw_bedset',1,2,4,1,'msg','TEMPAT TIDUR','bed'],['shelf_books',6,2,2,1,'msg','BUKU','books'],['tw_stool',2,4,1,1]],d:[['rug_blue',4.5,4.8]],hg:[['tw_picture',5.3,1]],gl:[]},
res2:{w:9,h:7,fl:['floor_stone_a','floor_wood_b'],wl:'wall_cream',dx:4,win:[5],
 o:[['fireplace',1,2,2,1,'msg','API','fire'],['cabinet',4,2,1,1],['tw_bedset',5,2,4,1,'msg','TEMPAT TIDUR','bed']],d:[['rug_red',4.5,4.8]],hg:[],gl:[[2,3,56]]},
res3:{w:9,h:7,fl:['floor_check','floor_wood_a'],wl:'wall_wood',dx:4,win:[5],
 o:[['shelf_goods',1,2,2,1,'msg','RAK','pot'],['shelf_books',3,2,2,1,'msg','BUKU','books'],['tw_bedset',5,4,3,1],['w_pot',7,2,1,1]],d:[['rug_green',3.5,5.1]],hg:[],gl:[]}};
function intTpl(id){return INT_T[id]}
/* Susun ruangan: peta tabrakan + daftar objek yang dapat berinteraksi. Murni data (aman dipanggil tes). */
function intCompile(b){
 const T0=INT_T[b.tpl],w=T0.w,h=T0.h,sol=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x==0||x==w-1||y<2||(y==h-1&&x!=T0.dx))sol[y*w+x]=1;
 const objs=T0.o.map(a=>({s:a[0],x:a[1],y:a[2],fw:a[3],fh:a[4],act:a[5]||null,lab:a[6]||'',msg:a[7]||''}));
 objs.forEach(o=>{for(let y=o.y;y<o.y+o.fh;y++)for(let x=o.x;x<o.x+o.fw;x++)if(x>=0&&y>=0&&x<w&&y<h)sol[y*w+x]=1});
 return{t:T0,w:w,h:h,dx:T0.dx,sol:sol,objs:objs,sx:T0.dx*WS+WS/2,sy:(h-2)*WS+26};
}
function intSolid(px,py){const r=wI.room,tx=Math.floor(px/WS),ty=Math.floor(py/WS);if(tx<0||ty<0||tx>=r.w||ty>=r.h)return true;return !!r.sol[ty*r.w+tx]}
const intBlocked=(x,y)=>intSolid(x-WFH,y-WFV)||intSolid(x+WFH,y-WFV)||intSolid(x-WFH,y)||intSolid(x+WFH,y);
/* pintu eksterior terdekat (pemain berdiri tepat di bawah kaki bangunan) */
function intDoorNear(){
 if(!S.world||wI)return null;let best=null,bd=1e9;
 INT_B.forEach(b=>{const dx=Math.abs(S.world.x-b.x*2),dy=S.world.y-b.y*2;if(dx<=44&&dy>=4&&dy<=52){const d=dx+dy;if(d<bd){bd=d;best=b}}});
 return best;
}
function intLockMsg(b){
 if(b.stg&&best<b.stg)return wL('Terkunci. Capai stage '+b.stg+' dulu (rekormu: '+best+')','Locked. Reach stage '+b.stg+' first (your best: '+best+')');
 if(b.lv&&((S.village&&S.village.level)||1)<b.lv)return wL(b.n[0]+' terkunci. Perlu level desa '+b.lv+'.',b.n[1]+' is locked. Village level '+b.lv+' needed.');
 return '';
}
function intFade(fn){wFade={t:0,fn:fn,done:0};wjid=null;wjx=wjy=0}
function intEnter(b){
 const room=intCompile(b),back={x:S.world.x,y:S.world.y,tool:S.hb&&Number.isFinite(S.hb.sel)?S.hb.sel:0};
 intFade(()=>{wI={b:b,room:room,x:room.sx,y:room.sy,near:null,cx:null,cy:null,returnPos:back};wjid=null;wjx=wjy=0;wNear=null;wNpc=null;wPlace=null;sv();sfx('click')});
}
function intTryEnter(b){const m=intLockMsg(b);if(m){wSay(m,3);sfx('click');return}intEnter(b)}
function intExit(){const back=wI&&wI.returnPos;intFade(()=>{wI=null;if(back&&S.world){S.world.x=back.x;S.world.y=back.y;if(S.hb)S.hb.sel=back.tool}wjid=null;wjx=wjy=0;wHint=0;sv();sfx('click')})}
function intFadeStep(dt){if(!wFade)return;wFade.t+=dt;if(!wFade.done&&wFade.t>=.2){wFade.done=1;wFade.fn()}if(wFade.t>=.4)wFade=null}
/* objek interaktif terdekat / zona keluar */
function intNear(){
 if(!wI)return null;const r=wI.room,px=wI.x,py=wI.y;
 if(Math.abs(px-r.sx)<=38&&py>=(r.h-2)*WS+4)return{exit:1,lab:'KELUAR'};
 let best=null,bd=34;
 r.objs.forEach(o=>{if(!o.act)return;const x0=o.x*WS,x1=(o.x+o.fw)*WS,y0=o.y*WS,y1=(o.y+o.fh)*WS,d=Math.hypot(Math.max(x0-px,0,px-x1),Math.max(y0-py,0,py-y1));if(d<bd){bd=d;best=o}});
 return best;
}
/* Pasar: pesan dinamis dari data game (harga jual ternak, level desa, batas jual harian). Aman bila data belum termuat. */
function intPriceMsg(){const A=typeof RANIM!=='undefined'?RANIM:null;if(!A)return wL('Harga jual hasil ternak ada di kasir.','Livestock sell prices are at the cashier.');
 return wL('Harga jual: telur '+A.chicken.sell+', susu '+A.cow.sell+', truffle '+A.pig.sell+', wol '+A.sheep.sell+' emas. Jual lewat kasir.','Sell prices: egg '+A.chicken.sell+', milk '+A.cow.sell+', truffle '+A.pig.sell+', wool '+A.sheep.sell+' gold. Sell at the cashier.')}
function intNewsMsg(){const lv=(S.village&&S.village.level)||1;let sold='',cap='';try{const r=typeof ranchGet==='function'?ranchGet():null;if(r&&typeof RANCH!=='undefined'){sold=r.soldGold;cap=RANCH.dailyGoldCap}}catch(e){}
 const lim=cap!==''?wL(' Batas jual hari ini '+sold+'/'+cap+' emas.',' Today\'s sales limit '+sold+'/'+cap+' gold.'):'';
 return wL('Berita desa: level '+lv+', rekor stage '+best+'.'+lim,'Village news: level '+lv+', best stage '+best+'.'+lim)}
let intVendN=0;
function intVendorMsg(){const L=[['Selamat datang di Pasar! Hasil ternak dijual di kasir.','Welcome to the Market! Sell your livestock goods at the cashier.'],['Butuh bahan? Loket dapur dan papan pesanan ada di sebelah kanan.','Need ingredients? The kitchen counter and orders board are to the right.'],['Peti di pojok boleh dipakai menitip barang.','Feel free to store things in the chest in the corner.']],m=L[intVendN++%L.length];return wL(m[0],m[1])}
function intAct(o){
 if(o.exit){intExit();return}
 sfx('click');
 switch(o.act){
  case'cashier':shopTab=2;wGo('shop');break;
  case'market':marketFrom='world';wGo('market');break;
  case'news':wSay(intNewsMsg(),5);break;
  case'gacha':shopTab=0;wGo('shop');break;
  case'heroes':wGo('heroes');break;
  case'village':lifeOpenVillage();break;
  case'orders':lifeOpenOrders();break;
  case'cook':lifeOpenKitchen();break;
  case'storage':lifeOpenStorage();break;
  case'workshop':lifeOpenWorkshop();break;
  case'bed':sv();wSay(wL(INT_MSG.bed[0],INT_MSG.bed[1]),3);break;
  case'msg':{if(o.msg==='harga'){wSay(intPriceMsg(),5);break}if(o.msg==='vendor'){wSay(intVendorMsg(),5);break}const m=INT_MSG[o.msg]||INT_MSG.books;wSay(wL(m[0],m[1]),4);break}
 }
}
const INT_LAB={KASIR:['KASIR','CASHIER'],PEDAGANG:['BICARA','TALK'],HARGA:['LIHAT','LOOK'],BERITA:['BACA','READ'],'MEJA DAGANG':['LIHAT','LOOK'],TIMBANGAN:['LIHAT','LOOK'],DAPUR:['DAPUR','KITCHEN'],BELI:['BELI','BUY'],GACHA:['GACHA','GACHA'],PERSIAPAN:['HERO','HEROES'],PETI:['PETI','CHEST'],PETA:['LIHAT','LOOK'],DESA:['DESA','VILLAGE'],PESANAN:['PESANAN','ORDERS'],BUKU:['BACA','READ'],TUNGKU:['LIHAT','LOOK'],LANDASAN:['LIHAT','LOOK'],'MEJA KERJA':['MEJA','BENCH'],MASAK:['MASAK','COOK'],BAHAN:['BAHAN','PANTRY'],ISTIRAHAT:['ISTIRAHAT','REST'],API:['LIHAT','LOOK'],KAYU:['LIHAT','LOOK'],JERAMI:['LIHAT','LOOK'],PANCING:['LIHAT','LOOK'],'TEMPAT TIDUR':['TIDUR','REST'],RAK:['LIHAT','LOOK'],KELUAR:['KELUAR','EXIT']};
const intLabel=l=>{const q=INT_LAB[l];return q?wL(q[0],q[1]):l};
function intCtx(){const n=wI&&intNear();wI&&(wI.near=n);return n?{l:intLabel(n.lab),on:1,f:()=>intAct(n)}:null}
function intUpdate(dt){
 const w=wI;intT+=dt;if(wMsg.t>0)wMsg.t-=dt;if(self.wFx)wFx(dt);
 let dx=wjx,dy=wjy;const kx=(KD.d||KD.arrowright?1:0)-(KD.a||KD.arrowleft?1:0),ky=(KD.s||KD.arrowdown?1:0)-(KD.w||KD.arrowup?1:0);
 if(kx||ky){const l=Math.hypot(kx,ky);dx=kx/l;dy=ky/l}
 if(wFade)dx=dy=0;let mv=0;
 if(dx||dy){const nx=w.x+dx*WSPEED*dt,ny=w.y+dy*WSPEED*dt;if(!intBlocked(nx,w.y)){w.x=nx;mv=1}if(!intBlocked(w.x,ny)){w.y=ny;mv=1}if(dx)wface=dx>0?1:-1}
 wwalk=mv?wwalk+dt:0;if(wAct)wAct.update(mv?dx:0,mv?dy:0);
 w.near=intNear();if(self.lifeWorldUpdate)lifeWorldUpdate(dt);
}
/* kamera: ruangan kecil dipusatkan utuh; ruangan besar mengikuti pemain dengan batas */
function intCam(){
 const w=wI,r=w.room,RW=r.w*WS,RH=r.h*WS,AH=312;
 const tx=RW<=640?-(640-RW)/2:Math.max(0,Math.min(RW-640,w.x-320)),ty=RH<=AH?-(AH-RH)/2:Math.max(0,Math.min(RH-AH,w.y-AH/2));
 if(w.cx==null){w.cx=tx;w.cy=ty}else{w.cx+=(tx-w.cx)*.25;w.cy+=(ty-w.cy)*.25}
 return[Math.round(w.cx),Math.round(w.cy)];
}
function intSp(n,cx,by,z,col){
 const r=INT_SPR&&INT_SPR[n];
 if(r&&INT_IM.complete&&INT_IM.naturalWidth>0){g.drawImage(INT_IM,r.x,r.y,r.w,r.h,Math.round(cx-r.w*z/2),Math.round(by-r.h*z),r.w*z,r.h*z);return}
 g.fillStyle=col||'#8c5330';g.fillRect(Math.round(cx-16),Math.round(by-28),32,28);
}
function intTile(n,tx,ty,ox,oy,dw,dh){
 const r=INT_SPR&&INT_SPR[n];
 if(r&&INT_IM.complete&&INT_IM.naturalWidth>0){g.drawImage(INT_IM,r.x,r.y,r.w,r.h,ox+tx*WS,oy+ty*WS,dw||WS,dh||WS);return}
 g.fillStyle=(tx+ty)%2?'#a8693a':'#b87340';g.fillRect(ox+tx*WS,oy+ty*WS,dw||WS,dh||WS);
}
function intDraw(){
 const w=wI,r=w.room,T0=r.t;g.imageSmoothingEnabled=false;g.fillStyle='#0d0b14';g.fillRect(-OX,0,VW,360);
 const cam=intCam(),ox=-cam[0],oy=-cam[1];
 for(let y=2;y<r.h-1;y++)for(let x=1;x<r.w-1;x++)intTile(T0.fl[(x*7+y*13)%2],x,y,ox,oy);
 for(let x=1;x<r.w-1;x++)intTile(T0.wl,x,0,ox,oy,WS,WS*2);
 T0.win.forEach(c=>intTile('window',c,0,ox,oy,WS,WS*2));
 for(let y=0;y<r.h;y++){intTile('wall_side',0,y,ox,oy);intTile('wall_side',r.w-1,y,ox,oy)}
 for(let x=1;x<r.w-1;x++)intTile(x==r.dx?'door_gap':'wall_bot',x,r.h-1,ox,oy);
 T0.d.forEach(a=>{const q=INT_SPR&&INT_SPR[a[0]];intSp(a[0],ox+a[1]*WS,oy+a[2]*WS+(q?q.h:16),2)});
 T0.hg.forEach(a=>{const q=INT_SPR&&INT_SPR[a[0]];intSp(a[0],ox+a[1]*WS,oy+a[2]*WS+(q?q.h*2:60)+2,2)});
 const items=[];
 r.objs.forEach(o=>items.push({y:(o.y+o.fh)*WS,f:()=>intSp(o.s,ox+(o.x+o.fw/2)*WS,oy+(o.y+o.fh)*WS,2)}));
 items.push({y:w.y,f:()=>{const px=ox+w.x,py=oy+w.y;
  if(wAct&&self.Anim&&Anim.has('avatar_'+wAct.state)){Anim.shadow(g,px,py-1,9,3,.3);wAct.draw(g,px,py,performance.now(),WZ)}
  else{g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px,py-1,10,4,0,0,7);g.fill();g.fillStyle='#fc4';g.fillRect(px-7,py-26,14,24)}}});
 items.sort((a,b)=>a.y-b.y).forEach(i=>i.f());
 const fl=.82+.18*Math.sin(intT*9);
 if(T0.gl.length){const old=g.globalCompositeOperation;g.globalCompositeOperation='lighter';T0.gl.forEach(a=>{const cx=ox+a[0]*WS,cy=oy+a[1]*WS,q=g.createRadialGradient(cx,cy,2,cx,cy,a[2]*fl);q.addColorStop(0,'rgba(255,170,80,.34)');q.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=q;g.fillRect(cx-a[2],cy-a[2],a[2]*2,a[2]*2)});g.globalCompositeOperation=old}
 const vg=g.createRadialGradient(320,160,120,320,160,420);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.38)');g.fillStyle=vg;g.fillRect(-OX,0,VW,312);
 const n=w.near;if(n&&!n.exit){const q=n,cx=ox+(q.x+q.fw/2)*WS,cy=oy+q.y*WS-18+Math.sin(intT*6)*2;T('▼',cx,cy,'#fc4',12,'center')}
 g.fillStyle='rgba(8,6,16,.78)';g.fillRect(6,6,150,22);g.strokeStyle='#e6c45a';g.lineWidth=1;g.strokeRect(6.5,6.5,149,21);T(wL(w.b.n[0],w.b.n[1]),81,21,'#fe8',10,'center');
 if(wMsg.t>0){g.globalAlpha=Math.min(1,wMsg.t);g.fillStyle='rgba(0,0,0,.75)';g.fillRect(106,44,428,24);g.strokeStyle='#fc4';g.lineWidth=1;g.strokeRect(106.5,44.5,427,23);T(wMsg.s,320,61,'#fe8',11,'center');g.globalAlpha=1}
 if(!wTalk){g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.arc(JC[0],JC[1],JR,0,7);g.fill();g.globalAlpha=.8;g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.globalAlpha=.85;g.fillStyle='#9cf';g.beginPath();g.arc(JC[0]+wjx*JR*.6,JC[1]+wjy*JR*.6,14,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();g.globalAlpha=1}
 btn(500,6,58,26,wL('MENU','MENU'),1);
}
