/* ===== LADANG (Tahap 3) =====
   st='farm'. 12 petak (4x3). Alat: cangkul (rumput -> tanah), benih (tanah -> tanaman).
   Ketuk tanaman matang = panen; petak kembali jadi tanah siap tanam.
   Waktu nyata: petak menyimpan p.t = Date.now() saat tanam. Matang bila Date.now()-p.t >= FC[c].ms,
   dihitung saat digambar/diketuk, jadi tanaman tetap tumbuh saat game ditutup atau offline.
   Simpan: S.farm = {p:[{s,c,t}], tool, day, gd, ed} lewat sv(). s: 0 rumput, 1 tanah, 2 tanaman.
   KESEIMBANGAN: panen dibatasi per hari (FARM.capG emas, FARM.capE Esensi) supaya ladang hanya
   penunjang. Pembanding tempur (normal, 5 hero): stage 1 ~25 emas, stage 5 ~85, stage 10 ~235, stage 20 ~640. */
const FARM={n:24,cols:6,capG:120,capE:1};
const FC=[
{n:'Wortel',ms:5*60e3,seed:3,g:6,e:0,col:'#f83',id:'carrot'},
{n:'Labu',ms:60*60e3,seed:6,g:14,e:0,col:'#eb3',id:'pumpkin'},
{n:'Bunga Matahari',ms:6*3600e3,seed:12,g:25,e:1,col:'#9cf',id:'sunflower'}];
const FPX=446,FPW=184,fCell=i=>[12+(i%FARM.cols)*108,44+(i/FARM.cols|0)*84,100,76];
function farmGet(){const n=Date.now(),d=today();let f=S.farm;
if(!f||typeof f!='object'||!Array.isArray(f.p))f=S.farm={p:[],tool:-1,day:d,gd:0,ed:0};
while(f.p.length<FARM.n)f.p.push({s:0}); /* jangan pernah memotong petak save lama/masa depan */
f.p.forEach((p,i)=>{if(!p||typeof p!='object'||!(p.s>=0&&p.s<=2))f.p[i]=p={s:0};
if(p.s==2){if(!FC[p.c]||!isFinite(p.t))f.p[i]={s:1};else if(p.t>n+6e4)p.t=n}}); /* jam mundur: waktu tanam di masa depan dipaksa ke sekarang */
if(typeof f.tool!='number'||!(f.tool>=-2&&f.tool<FC.length))f.tool=-1;
f.gd=+f.gd||0;f.ed=+f.ed||0;if(f.day!=d){f.day=d;f.gd=0;f.ed=0}return f}
const farmRipe=p=>p.s==2&&Date.now()-p.t>=FC[p.c].ms;
/* Penyiraman sekali per siklus plot. Hujan/ badai menerapkan efek yang sama otomatis. */
function farmWaterPlot(p){if(!p||(p.s!==1&&p.s!==2)||p.w)return false;p.w=1;if(p.s===2&&FC[p.c]&&isFinite(p.t))p.t-=FC[p.c].ms*.15;return true}
function farmAutoWaterAll(silent=false){const f=S.farm;if(!f||!Array.isArray(f.p))return 0;let n=0;f.p.forEach(p=>{if(farmWaterPlot(p))n++});if(n){sv();if(!silent)say('Hujan menyirami '+n+' petak. Tiap petak mendapat bonus pertumbuhan sekali.')}return n}

const farmReady=()=>farmGet().p.some(farmRipe);
const farmPend=f=>f.p.reduce((a,p)=>{if(p.s==2){a.g+=FC[p.c].g;a.e+=FC[p.c].e}return a},{g:0,e:0});
/* tolak tanam bila hasil yang sudah dikumpulkan + yang masih tumbuh sudah mencapai batas harian (mencegah tanaman sia-sia) */
function farmCan(c){const f=farmGet(),q=farmPend(f);if(f.gd+q.g>=FARM.capG)return'Batas panen harian tercapai. Coba lagi besok';if(c.e&&f.ed+q.e>=FARM.capE)return'Batas Esensi ladang hari ini tercapai';return''}
function farmHarvest(i){const f=farmGet(),p=f.p[i];if(!p||!farmRipe(p))return null;const c=FC[p.c],gg=Math.max(0,Math.min(c.g,FARM.capG-f.gd)),ee=Math.max(0,Math.min(c.e,FARM.capE-f.ed));f.gd+=gg;f.ed+=ee;S.g+=gg;S.es+=ee;f.p[i]={s:1,w:0};if(typeof ranchFeedAdd==='function')ranchFeedAdd(1);return{g:gg,e:ee}}
function farmMsg(r){say(r.g||r.e?'Panen: +'+r.g+' emas'+(r.e?' +'+r.e+' esensi':''):'Batas harian tercapai: panen tanpa hasil')}
function farmHarvestAll(){const f=farmGet();let g1=0,e1=0,k=0;f.p.forEach((p,i)=>{const r=farmHarvest(i);if(r){g1+=r.g;e1+=r.e;k++}});if(!k){say('Tidak ada yang siap panen');return}sv();sfx('coin');farmMsg({g:g1,e:e1})}
function farmTap(i){const f=farmGet(),p=f.p[i];
if(p.s==2&&farmRipe(p)){const r=farmHarvest(i);sv();sfx('coin');farmMsg(r);return}
if(f.tool===-2){if(p.s===0){say('Cangkul petak terlebih dahulu.');return}if(!farmWaterPlot(p)){say('Petak ini sudah disiram untuk siklus tanaman ini.');return}sv();sfx('heal');say(p.s===2?'Disiram: waktu tumbuh dipercepat sedikit.':'Tanah basah. Tanaman berikutnya mendapat bonus pertumbuhan.');return}
if(p.s==2){say('Belum matang: '+fmtT(FC[p.c].ms-(Date.now()-p.t)));return}
if(p.s==0){if(f.tool==-1){f.p[i]={s:1,w:0};sv();sfx('hit')}else say('Cangkul dulu petak rumput');return}
if(f.tool==-1){say('Petak sudah dicangkul');return}
const c=FC[f.tool],e=farmCan(c);if(e){say(e);return}if(S.g<c.seed){say('Emas tidak cukup');return}
const wet=!!p.w;S.g-=c.seed;f.p[i]={s:2,c:f.tool,t:Date.now()-(wet?FC[f.tool].ms*.15:0),w:wet};sv();sfx('heal');if(wet)say('Benih ditanam di tanah basah: pertumbuhan mendapat bonus sekali.')
}
function farmClick(x,y){if(y<34&&x<80){goBack();sfx('click');return}const f=farmGet();
if(x>=FPX&&x<=FPX+FPW){if(y>=44&&y<=74){f.tool=x<FPX+FPW/2?-1:-2;sfx('click')}else if(y>=222&&y<=252)farmHarvestAll();else for(let k=0;k<FC.length;k++)if(y>=80+k*46&&y<=122+k*46){f.tool=k;sfx('click')}return}
for(let i=0;i<FARM.n;i++){const c=fCell(i);if(x>=c[0]&&x<=c[0]+c[2]&&y>=c[1]&&y<=c[1]+c[3]){farmTap(i);return}}}
/* ---- Farming dunia nyata: input capture per pointer, aman untuk swipe + joystick multi-touch ---- */
const FARM_SEEDS=[{id:'seed_carrot',crop:0},{id:'seed_pumpkin',crop:1},{id:'seed_sunflower',crop:2}];
const farmSeedCrop=id=>{const q=FARM_SEEDS.find(x=>x.id===id);return q?q.crop:-1};
let farmWorldGestures=new Map();
function farmWorldEnsureStarterSeeds(){
 const f=farmGet();if(f.starterSeedsGranted)return false;
 if(typeof storagecraftEnsure==='function')storagecraftEnsure();
 const bag=S.gather&&S.gather.items;if(!bag)return false;
 /* Paket awal diberi satu kali agar siklus farming bisa dimainkan tanpa biaya tersembunyi. */
 bag.seed_carrot=Math.max(0,+bag.seed_carrot||0)+6;bag.seed_pumpkin=Math.max(0,+bag.seed_pumpkin||0)+3;bag.seed_sunflower=Math.max(0,+bag.seed_sunflower||0)+2;
 f.starterSeedsGranted=1;sv();say(wL('Paket benih awal: wortel 6, labu 3, bunga matahari 2.','Starter seeds: 6 carrots, 3 pumpkins, 2 sunflowers.'));return true;
}
function farmWorldTool(){return typeof hudToolId==='function'?hudToolId():(S.hb&&S.hb.slots&&S.hb.slots[S.hb.sel]||'hand')}
function farmWorldCoords(x,y){return{x:x+(typeof wcx==='number'?wcx:0)+(typeof OX==='number'?OX:0),y:y+(typeof wcy==='number'?wcy:0)}}
function farmWorldIndexAt(x,y){
 const d=typeof Tmap!=='undefined'&&Tmap.data?Tmap.data():null,F=d&&d.farm;if(!Array.isArray(F))return-1;
 const q=farmWorldCoords(x,y);let best=-1,bd=Infinity;
 for(let i=0;i<F.length;i++){const p=F[i],dx=q.x-p[0]*2,dy=q.y-p[1]*2;if(Math.abs(dx)>15||Math.abs(dy)>14)continue;const dist=dx*dx+dy*dy;if(dist<bd){bd=dist;best=i}}
 return best;
}
function farmWorldValid(i){
 const d=typeof Tmap!=='undefined'&&Tmap.data?Tmap.data():null,slot=d&&d.farm&&d.farm[i];if(!slot)return false;
 const x=slot[0]*2,y=slot[1]*2,tx=Math.floor(x/WS),ty=Math.floor(y/WS),c=d.grid&&d.grid[ty]&&d.grid[ty].charAt(tx);
 if(c==='~'||c==='T'||c==='X'||c==='p'||c==='S'||c==='R'||c==='G'||c==='Q'||c==='F'||c==='f')return false;
 if(typeof Tmap.collisionAt==='function'&&Tmap.collisionAt(tx,ty)===true)return false;
 if(typeof wBlocked==='function'&&wBlocked(x,y))return false;
 if(typeof npcHit==='function'&&npcHit(x,y))return false;
 if(S.world&&Math.hypot(x-S.world.x,y-S.world.y)>WS*3.1)return false;
 return true;
}
function farmWorldAction(i,tool){
 const f=farmGet(),p=f.p[i];if(!p||!farmWorldValid(i))return false;
 if(!f.starterSeedsGranted)farmWorldEnsureStarterSeeds();
 if(p.s===2&&farmRipe(p)){const r=farmHarvest(i);if(r){sv();sfx('coin');farmMsg(r);return true}}
 if(tool==='hoe'){
  if(p.s!==0){say(wL('Petak ini sudah dicangkul.','This plot is already tilled.'));return false;}
  f.p[i]={s:1,w:0};if(wAct){wAct.face((Tmap.data().farm[i][0]*2)-S.world.x,(Tmap.data().farm[i][1]*2)-S.world.y);wAct.play('dig',performance.now())}sv();sfx('hit');return true;
 }
 const crop=farmSeedCrop(tool);
 if(crop>=0){
  if(p.s!==1){say(wL('Cangkul tanah terlebih dahulu.','Till the soil first.'));return false;}
  if(typeof storagecraftEnsure==='function')storagecraftEnsure();const bag=S.gather&&S.gather.items,have=bag?Math.max(0,Math.floor(+bag[tool]||0)):0;
  if(have<1){say(wL('Benih tidak cukup. Tidak ada benih yang dipotong.','Not enough seeds. No seeds were consumed.'));return false;}
  const err=farmCan(FC[crop]);if(err){say(err);return false;}
  /* Semua validasi selesai sebelum benih dikurangi. */
  const wet=!!p.w;bag[tool]=have-1;f.p[i]={s:2,c:crop,t:Date.now()-(wet?FC[crop].ms*.15:0),w:wet};
  if(wAct){wAct.face((Tmap.data().farm[i][0]*2)-S.world.x,(Tmap.data().farm[i][1]*2)-S.world.y);wAct.play('dig',performance.now())}sv();sfx('heal');return true;
 }
 if(tool==='can'){
  const water=Math.max(0,Math.floor(+S.hb?.water||0));if(water<1){say(wL('Ember kosong. Isi di tepi air.','Bucket is empty. Fill it beside water.'));return false;}
  if(!farmWaterPlot(p)){say(wL('Petak ini tidak perlu disiram lagi pada siklus ini.','This plot has already been watered this cycle.'));return false;}
  S.hb.water=water-1;if(wAct){wAct.face((Tmap.data().farm[i][0]*2)-S.world.x,(Tmap.data().farm[i][1]*2)-S.world.y);wAct.play('watering',performance.now())}sv();sfx('heal');return true;
 }
 return false;
}
function farmWorldPointerDown(ev){
 if(st!=='world'||wI||wDlg||wTalk||wFade||lifeWorldQuick)return;
 const rect=cv.getBoundingClientRect(),x=(ev.clientX-rect.left)*VW/rect.width-OX,y=(ev.clientY-rect.top)*360/rect.height;
 const tool=farmWorldTool();if(tool!=='hoe'&&tool!=='can'&&farmSeedCrop(tool)<0)return;
 const i=farmWorldIndexAt(x,y);if(i<0)return;
 const seen=new Set();farmWorldGestures.set(ev.pointerId,{tool,seen});
 if(ev.cancelable)ev.preventDefault();ev.stopImmediatePropagation();seen.add(i);farmWorldAction(i,tool);
}
function farmWorldPointerMove(ev){const gesture=farmWorldGestures.get(ev.pointerId);if(!gesture||st!=='world')return;const rect=cv.getBoundingClientRect(),x=(ev.clientX-rect.left)*VW/rect.width-OX,y=(ev.clientY-rect.top)*360/rect.height,i=farmWorldIndexAt(x,y);if(i<0||gesture.seen.has(i))return;gesture.seen.add(i);farmWorldAction(i,gesture.tool);}
if(typeof cv!=='undefined'&&cv.addEventListener){cv.addEventListener('pointerdown',farmWorldPointerDown,{capture:true});addEventListener('pointermove',farmWorldPointerMove,{capture:true});const farmWorldEnd=ev=>farmWorldGestures.delete(ev.pointerId);addEventListener('pointerup',farmWorldEnd,{capture:true});addEventListener('pointercancel',farmWorldEnd,{capture:true});addEventListener('blur',()=>farmWorldGestures.clear());}

/* ---- gambar ---- */
const fmtDur=ms=>{const en=S.set.lang=='en';return ms>=3600e3?Math.round(ms/3600e3)+(en?'h':'j'):Math.round(ms/6e4)+'m'};
function fmtT(ms){const en=S.set.lang=='en',s=Math.max(0,Math.ceil(ms/1e3)),h=s/3600|0,m=(s%3600)/60|0,r=s%60,H=en?'h':'j',D=en?'s':'d';return h?h+H+' '+String(m).padStart(2,'0')+'m':m?m+'m '+String(r).padStart(2,'0')+D:r+D}
function farmCrop(k,cx,cy,sc,rp){if(self.wPlant&&wPlant(k,cx,cy,sc,rp))return;g.save();g.translate(cx,cy);g.scale(sc,sc);g.fillStyle='#3a9a3a';
if(k==0){g.fillRect(-1,-16,2,8);g.fillRect(-5,-18,4,4);g.fillRect(1,-18,4,4);g.fillStyle=rp?'#f83':'#c96';g.beginPath();g.moveTo(-6,-9);g.lineTo(6,-9);g.lineTo(0,10);g.closePath();g.fill()}
else if(k==1){g.fillRect(-1,-16,3,5);g.fillStyle=rp?'#eb3':'#bb7';g.beginPath();g.ellipse(0,-2,12,9,0,0,7);g.fill();g.strokeStyle='#a60';g.lineWidth=1;g.beginPath();g.moveTo(0,-11);g.lineTo(0,7);g.moveTo(-6,-9);g.lineTo(-6,5);g.moveTo(6,-9);g.lineTo(6,5);g.stroke()}
else{g.fillRect(-1,-4,2,14);g.fillStyle=rp?'#9cf':'#8ab';for(let i=0;i<5;i++){const a=i*1.2566-1.5708;g.beginPath();g.arc(Math.cos(a)*6,-8+Math.sin(a)*6,4,0,7);g.fill()}g.fillStyle='#fff';g.beginPath();g.arc(0,-8,3,0,7);g.fill()}
g.restore()}
function farmPlot(x,y,w,h,p,n,i){const ripe=farmRipe(p),k=p.s==2?FC[p.c]:null;g.fillStyle=p.s==0?'#2f5f36':'#5a3d22';g.fillRect(x,y,w,h);
if(p.s==0){g.fillStyle='#4a8a4a';for(let j=0;j<7;j++)g.fillRect(x+6+hh(i*9+j,4)*(w-14),y+6+hh(i*9+j,5)*(h-22),2,5)}else{g.fillStyle='#46301a';for(let r=0;r<4;r++)g.fillRect(x+4,y+10+r*14,w-8,5)}
if(k){const q=Math.min(1,(n-p.t)/k.ms);farmCrop(p.c,x+w/2,y+h/2+6,ripe?1.25:.5+.6*q,ripe);if(p.w){g.fillStyle='#8cf';g.beginPath();g.arc(x+w-9,y+9,3,0,7);g.fill()}
if(ripe){g.globalAlpha=.5+.4*Math.sin(t*6);g.strokeStyle='#fc4';g.lineWidth=3;g.strokeRect(x+1.5,y+1.5,w-3,h-3);g.globalAlpha=1;T('SIAP!',x+w/2,y+h-5,'#6f8',10,'center')}
else{g.fillStyle='#000';g.fillRect(x+8,y+h-14,w-16,5);g.fillStyle=k.col;g.fillRect(x+9,y+h-13,(w-18)*q,3);T(fmtT(k.ms-(n-p.t)),x+w/2,y+11,'#fff',9,'center')}}
else{T(p.s==0?'RUMPUT':(p.w?'TANAH BASAH':'TANAH'),x+w/2,y+h-5,p.s==0?'#8c9':p.w?'#8cf':'#a87',9,'center');if(p.w&&p.s===1){g.fillStyle='#8cf';g.beginPath();g.arc(x+w-10,y+9,3,0,7);g.fill();g.beginPath();g.arc(x+10,y+14,2,0,7);g.fill()}}
g.strokeStyle=ripe?'#fc4':'#000';g.lineWidth=ripe?3:2;g.strokeRect(x,y,w,h)}
function drawFarm(){const f=farmGet(),n=Date.now(),rd=f.p.filter(farmRipe).length;ov(.9);btn(6,5,76,28,'KEMBALI');T('LADANG',92,26,'#fc4',16);T('Emas: '+S.g+'  Esensi: '+S.es,632,24,'#fc4',12,'right');
f.p.forEach((p,i)=>{const c=fCell(i);farmPlot(c[0],c[1],c[2],c[3],p,n,i)});
const tb=(x,y,w,h,on,col)=>{g.fillStyle=on?'#2a7a4a':'#2b2545';g.fillRect(x,y,w,h);g.strokeStyle=on?'#fc4':col;g.lineWidth=on?3:2;g.strokeRect(x+.5,y+.5,w-1,h-1)};
tb(FPX,44,88,30,f.tool===-1,'#556');T('CANGKUL',FPX+44,63,'#fff',9,'center');tb(FPX+96,44,88,30,f.tool===-2,'#8cf');T('SIRAM',FPX+140,63,'#fff',10,'center');
FC.forEach((c,k)=>{const y=80+k*46;tb(FPX,y,FPW,42,f.tool==k,c.col);farmCrop(k,FPX+24,y+28,1,1);T(c.n,FPX+46,y+15,c.col,11);T('Tumbuh '+fmtDur(c.ms)+(c.e?'  +'+c.e+' Esensi':''),FPX+46,y+27,'#cde',9);T('Benih '+c.seed+' -> '+c.g+' emas',FPX+46,y+38,'#fc4',9)});
btn(FPX,222,FPW,30,'PANEN SEMUA'+(rd?' ('+rd+')':''),rd>0);
T('Emas hari ini: '+f.gd+'/'+FARM.capG,FPX,268,'#fc4',9);g.fillStyle='#000';g.fillRect(FPX,272,FPW,6);g.fillStyle='#fc4';g.fillRect(FPX+1,273,(FPW-2)*Math.min(1,f.gd/FARM.capG),4);
T('Esensi hari ini: '+f.ed+'/'+FARM.capE,FPX,292,'#6af',9);g.fillStyle='#000';g.fillRect(FPX,296,FPW,6);g.fillStyle='#6af';g.fillRect(FPX+1,297,(FPW-2)*Math.min(1,f.ed/FARM.capE),4);
T(f.tool===-2?'Alat: Siram. Satu penyiraman mempercepat pertumbuhan sekali.':f.tool===-1?'Alat: Cangkul. Ketuk petak rumput untuk mencangkul.':'Alat: benih '+FC[f.tool].n+'. Ketuk tanah kosong untuk menanam.',12,310,'#cde',10);
const weather=S.atmo&&S.atmo.weather||'clear';T((weather==='rain'||weather==='storm')?'Cuaca hujan: petak tersiram otomatis.':'Pilih SIRAM atau manfaatkan hujan untuk bonus tumbuh.',12,323,(weather==='rain'||weather==='storm')?'#8cf':'#9cf',9)}
