/* Ladang di dunia terbuka.
 Alur: cangkul (rumput -> tanah) -> benih (tanah -> tanaman) -> siram -> panen dengan alat terpilih.
 Tiap petak menyimpan waktu tanam p.t (Date.now()); matang bila Date.now()-p.t >= FC[c].ms,
 jadi tanaman tetap tumbuh saat game ditutup. S.farm = {p:[{s,c,t,w}], tool, day}; s: 0 rumput, 1 tanah, 2 tanaman. */
const FARM={n:24,cols:6};
const FC=[
{n:'Wortel',ms:5*60e3,seed:3,g:6,e:0,col:'#f83',id:'carrot'},
{n:'Labu',ms:60*60e3,seed:6,g:14,e:0,col:'#eb3',id:'pumpkin'},
{n:'Bunga Matahari',ms:6*3600e3,seed:12,g:25,e:1,col:'#9cf',id:'sunflower'}];
function farmGet(){const n=Date.now(),d=today();let f=S.farm;
if(!f||typeof f!='object'||!Array.isArray(f.p))f=S.farm={p:[],tool:-1,day:d};
while(f.p.length<FARM.n)f.p.push({s:0}); /* jangan pernah memotong petak save lama/masa depan */
f.p.forEach((p,i)=>{if(!p||typeof p!='object'||!(p.s>=0&&p.s<=2))f.p[i]=p={s:0};
if(p.s==2){if(!FC[p.c]||!isFinite(p.t))f.p[i]={s:1};else if(p.t>n+6e4)p.t=n}}); /* jam mundur: waktu tanam di masa depan dipaksa ke sekarang */
if(typeof f.tool!='number'||!(f.tool>=-2&&f.tool<FC.length))f.tool=-1;
f.day=d;return f}
const farmRipe=p=>p.s==2&&Date.now()-p.t>=FC[p.c].ms;
/* Penyiraman sekali per siklus plot. Hujan/ badai menerapkan efek yang sama otomatis. */
function farmWaterPlot(p){if(!p||(p.s!==1&&p.s!==2)||p.w)return false;p.w=1;if(p.s===2&&FC[p.c]&&isFinite(p.t))p.t-=FC[p.c].ms*.15;return true}
function farmAutoWaterAll(silent=false){const f=S.farm;if(!f||!Array.isArray(f.p))return 0;let n=0;f.p.forEach(p=>{if(farmWaterPlot(p))n++});if(n){sv();if(!silent)say(wL('Hujan turun, '+n+' petak ikut tersiram.','Rain is falling, '+n+' plots got a drink.'))}return n}

const farmReady=()=>farmGet().p.some(farmRipe);
function farmHarvest(i){const f=farmGet(),p=f.p[i];if(!p||!farmRipe(p))return null;const c=FC[p.c],gg=c.g,ee=c.e;S.g+=gg;S.es+=ee;f.p[i]={s:1,w:0};if(typeof ranchFeedAdd==='function')ranchFeedAdd(1);return{g:gg,e:ee}}
function farmMsg(r){say(wL('Panen +'+r.g+' emas'+(r.e?' +'+r.e+' esensi':''),'Harvest +'+r.g+' gold'+(r.e?' +'+r.e+' essence':'')))}
/* Farming dunia nyata: input capture per pointer, aman untuk swipe + joystick multi-touch */
const FARM_SEEDS=[{id:'seed_carrot',crop:0},{id:'seed_pumpkin',crop:1},{id:'seed_sunflower',crop:2}];
const farmSeedCrop=id=>{const q=FARM_SEEDS.find(x=>x.id===id);return q?q.crop:-1};
let farmWorldGestures=new Map();
function farmWorldEnsureStarterSeeds(){
 const f=farmGet();if(f.starterSeedsGranted)return false;
 if(typeof storagecraftEnsure==='function')storagecraftEnsure();
 const bag=S.gather&&S.gather.items;if(!bag)return false;
 /* Paket awal satu kali; hanya sebanyak ruang tas. Sisa diberikan nanti agar tidak melebihi kapasitas. */
 let room=typeof scFreeBag==='function'?scFreeBag():99;const given=[];
 f.starterGiven=f.starterGiven||{};
 [['seed_carrot',6],['seed_pumpkin',3],['seed_sunflower',2]].forEach(([id,n])=>{const need=n-(f.starterGiven[id]||0),add=Math.min(need,room);if(add>0){bag[id]=Math.max(0,+bag[id]||0)+add;f.starterGiven[id]=(f.starterGiven[id]||0)+add;room-=add;given.push(add)}});
 const done=f.starterGiven.seed_carrot>=6&&f.starterGiven.seed_pumpkin>=3&&f.starterGiven.seed_sunflower>=2;
 if(done)f.starterSeedsGranted=1;
 sv();if(given.length)say(wL('Paket benih awal diterima'+(done?'.':' sebagian: tas penuh, sisanya menyusul.'),'Starter seeds received'+(done?'.':' partly: bag full, rest later.')));
 else if(!done)say(wL('Tas penuh. Benih awal menunggu ruang kosong.','Bag is full. Starter seeds wait for free space.'));
 return given.length>0;
}
function farmWorldTool(){return typeof hudToolId==='function'?hudToolId():(S.hb&&S.hb.slots&&S.hb.slots[S.hb.sel]||'hand')}
function farmWorldCoords(x,y){const z=typeof wZoomActive==='function'&&wZoomActive()?WZOOM:1;return{x:(x+(typeof OX==='number'?OX:0))/z+(typeof wcx==='number'?wcx:0),y:y/z+(typeof wcy==='number'?wcy:0)}}
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
  if(p.s!==0){say(wL('Petak ini sudah digemburkan.','This plot is already tilled.'));return false;}
  f.p[i]={s:1,w:0};if(wAct){wAct.face((Tmap.data().farm[i][0]*2)-S.world.x,(Tmap.data().farm[i][1]*2)-S.world.y);wAct.play('dig',performance.now())}sv();sfx('hit');return true;
 }
 const crop=farmSeedCrop(tool);
 if(crop>=0){
  if(p.s!==1){say(wL('Gemburkan tanahnya dulu dengan cangkul.','Loosen the soil with the hoe first.'));return false;}
  if(typeof storagecraftEnsure==='function')storagecraftEnsure();const bag=S.gather&&S.gather.items,have=bag?Math.max(0,Math.floor(+bag[tool]||0)):0;
  if(have<1){say(wL('Benihnya kurang. Tidak ada yang terpakai.','Not enough seeds. Nothing was used.'));return false;}
    const wet=!!p.w;bag[tool]=have-1;if(bag[tool]<=0)delete bag[tool];f.p[i]={s:2,c:crop,t:Date.now()-(wet?FC[crop].ms*.15:0),w:wet};
  if(wAct){wAct.face((Tmap.data().farm[i][0]*2)-S.world.x,(Tmap.data().farm[i][1]*2)-S.world.y);wAct.play('dig',performance.now())}sv();sfx('heal');return true;
 }
 if(tool==='can'){
  const water=Math.max(0,Math.floor(+S.hb?.water||0));if(water<1){say(wL('Embernya kosong. Isi dulu di tepi air.','The bucket is empty. Fill it by the water.'));return false;}
  if(!farmWaterPlot(p)){say(wL('Petak ini masih basah. Cukup untuk sekarang.','This plot is still wet. That is enough for now.'));return false;}
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
