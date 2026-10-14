/* Hero Battle - memancing, pengumpulan, dapur/buff, progres desa, pesanan, cuaca.
 Skrip klasik; penyimpanan hanya melalui S + sv()/Save.*. Lokasi sumber daya dibaca dari index.json hasil tools/build_world.py. */
const LIFE={gatherCap:12,goldCap:120,essCap:1,ticketCap:1,sellFishCap:80};
const LIFE_FISH=[
 {id:'bluegill',name:'Ikan Sirip Biru',en:'Bluegill',biomes:['lake'],times:['day','dawn'],seasons:['spring','summer'],rarity:'common',price:7},
 {id:'carp',name:'Ikan Mas',en:'Carp',biomes:['lake','meadow'],times:['any'],seasons:['spring','summer','autumn'],rarity:'common',price:9},
 {id:'river_trout',name:'Trout Sungai',en:'River Trout',biomes:['lake','mountain'],times:['dawn','day'],seasons:['spring','autumn','winter'],rarity:'uncommon',price:18},
 {id:'gold_koi',name:'Koi Emas',en:'Golden Koi',biomes:['lake'],times:['dusk','night'],seasons:['spring'],rarity:'rare',price:45},
 {id:'sardine',name:'Sarden Laut',en:'Sea Sardine',biomes:['coast'],times:['day','dawn'],seasons:['spring','summer','autumn'],rarity:'common',price:7},
 {id:'mackerel',name:'Makarel',en:'Mackerel',biomes:['coast'],times:['dusk','night'],seasons:['summer','autumn'],rarity:'uncommon',price:20},
 {id:'moon_eel',name:'Belut Bulan',en:'Moon Eel',biomes:['coast'],times:['night'],seasons:['autumn','winter'],rarity:'rare',price:55},
 {id:'snow_char',name:'Arang Salju',en:'Snow Char',biomes:['mountain'],times:['dawn','night'],seasons:['winter'],rarity:'rare',price:62},
 {id:'moss_fish',name:'Ikan Lumut',en:'Moss Fish',biomes:['forest','lake'],times:['any'],seasons:['summer','autumn'],rarity:'uncommon',price:16},
 {id:'starlight_fish',name:'Ikan Cahaya Bintang',en:'Starlight Fish',biomes:['coast','lake'],times:['night'],seasons:['winter'],rarity:'legendary',price:95}
];
const LIFE_RECIPES=[
 {id:'fish_soup',name:'Sup Ikan Segar',en:'Fresh Fish Soup',needs:{fish:1,carrot:1,egg:1},atk:.08,hp:.05,stages:3,desc:'ATK +8% / HP +5%'},
 {id:'farm_stew',name:'Semur Ladang',en:'Farmstead Stew',needs:{pumpkin:1,milk:1,herb:1},atk:.05,hp:.10,stages:3,desc:'ATK +5% / HP +10%'},
 {id:'forest_omelet',name:'Telur Dadar Hutan',en:'Forest Omelette',needs:{egg:1,mushroom:1,herb:1},atk:.10,hp:.04,stages:2,desc:'ATK +10% / HP +4%'},
 {id:'moon_broth',name:'Kaldu Bunga Bulan',en:'Moonflower Broth',needs:{moonflower:1,milk:1,fruit:1},atk:.06,hp:.08,stages:3,desc:'ATK +6% / HP +8%'}
];
const LIFE_UPGRADES=[null,{gold:150,wood:5,stone:3},{gold:360,wood:10,stone:8},{gold:700,wood:18,stone:15},{gold:1200,wood:28,stone:24}];
let lifeFish=null,lifeFishBookScroll=0,lifeWorldQuick=false,lifeWeatherTick=0,lifeWeatherParts=[],lifeLastSave=0,lifeNpcSynced=0;
function lifeNow(){const n=Date.now();if(!isFinite(S.lifeClock))S.lifeClock=n;if(n>S.lifeClock)S.lifeClock=n;return S.lifeClock}
function lifeDayKey(){return new Date(lifeNow()).toDateString()}
function lifeEnsure(){
 const day=lifeDayKey();
 if(!S.fish||typeof S.fish!=='object')S.fish={day,caughtToday:0,stock:{},book:{},total:0,soldGold:0};
 if(S.fish.day!==day){S.fish.day=day;S.fish.caughtToday=0;S.fish.soldGold=0;}
 S.fish.stock=S.fish.stock&&typeof S.fish.stock==='object'?S.fish.stock:{};S.fish.book=S.fish.book&&typeof S.fish.book==='object'?S.fish.book:{};S.fish.total=+S.fish.total||0;S.fish.caughtToday=+S.fish.caughtToday||0;S.fish.soldGold=+S.fish.soldGold||0;
 if(!S.gather||typeof S.gather!=='object')S.gather={day,items:{wood:0,stone:0,mushroom:0,herb:0,fruit:0},nodes:{},count:0};
 if(S.gather.day!==day){S.gather.day=day;S.gather.count=0;}S.gather.items=S.gather.items||{};S.gather.nodes=S.gather.nodes||{};['wood','stone','mushroom','herb','fruit'].forEach(k=>S.gather.items[k]=Math.max(0,+S.gather.items[k]||0));S.gather.count=+S.gather.count||0;
 if(!S.kitchen||typeof S.kitchen!=='object')S.kitchen={food:{carrot:0,pumpkin:0,moonflower:0},cooked:0};S.kitchen.food=S.kitchen.food||{};['carrot','pumpkin','moonflower'].forEach(k=>S.kitchen.food[k]=Math.max(0,+S.kitchen.food[k]||0));
 if(!S.village||typeof S.village!=='object')S.village={level:1,story:0};S.village.level=Math.max(1,Math.min(5,+S.village.level||1));S.village.story=Math.max(0,Math.min(4,+S.village.story||0));
 if(!S.orders||typeof S.orders!=='object')S.orders={day,done:[]};if(S.orders.day!==day){S.orders.day=day;S.orders.done=[];S.orders.list=null;}S.orders.done=Array.isArray(S.orders.done)?S.orders.done:[];
 if(!S.worldEarn||typeof S.worldEarn!=='object')S.worldEarn={day,gold:0,essence:0,tickets:0};if(S.worldEarn.day!==day){S.worldEarn={day,gold:0,essence:0,tickets:0};}
 if(!S.atmo||typeof S.atmo!=='object')S.atmo={weather:'clear',changedAt:lifeNow(),day,seed:lifeHash(day),clock:0};
 if(!S.buff||typeof S.buff!=='object'||!(S.buff.stages>0))S.buff=null;
 if(typeof lifeNodesMigrate==='function')lifeNodesMigrate();
}
function lifeHash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
function lifeLang(id,en){return S.set.lang==='en'?en:id}
function lifeBiome(tx,ty){const d=typeof Tmap!=='undefined'&&Tmap.data?Tmap.data():null;const L=d&&d.biomeRegions||[];for(let i=0;i<L.length;i++){const b=L[i];if(tx>=b.x&&ty>=b.y&&tx<b.x+b.w&&ty<b.y+b.h)return b.id;}return'meadow'}
function lifeSeason(){if(S.set&&((S.set.season|0)===2))return'winter';const m=new Date(lifeNow()).getMonth();return m<=1||m===11?'winter':m<=4?'spring':m<=7?'summer':'autumn'}
function lifeHour(){return typeof wHr==='number'?wHr:9}
function lifeTimeBand(){const h=lifeHour();return h<6?'night':h<8?'dawn':h<17?'day':h<20?'dusk':'night'}
function lifeDailyGrant(gold,essence,ticket){lifeEnsure();const d=S.worldEarn;const g=Math.max(0,Math.min(gold||0,LIFE.goldCap-d.gold));const e=Math.max(0,Math.min(essence||0,LIFE.essCap-d.essence));const tk=Math.max(0,Math.min(ticket||0,LIFE.ticketCap-d.tickets));d.gold+=g;d.essence+=e;d.tickets+=tk;S.g+=g;S.es+=e;S.ft=(S.ft||0)+tk;sv();return{gold:g,essence:e,ticket:tk}}
function lifeAssetData(){return typeof Tmap!=='undefined'&&Tmap.data?Tmap.data():null}
function lifeWaterComps(d){
 /* Komponen air (4-arah) dihitung sekali per grid: ukuran badan air menentukan apakah itu laut/danau (luas) atau parit/sungai kecil. */
 if(d.__waterComp&&d.__waterComp.grid===d.grid)return d.__waterComp;
 const w=d.w,h=d.h,id=new Int32Array(w*h).fill(-1),size=[];let n=0;
 for(let y0=0;y0<h;y0++)for(let x0=0;x0<w;x0++){
  if(id[y0*w+x0]>=0||d.grid[y0].charAt(x0)!=='~')continue;
  let cnt=0;const q=[y0*w+x0];id[y0*w+x0]=n;
  while(q.length){const c=q.pop(),cx=c%w,cy=(c/w)|0;cnt++;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(id[ni]>=0||d.grid[ny].charAt(nx)!=='~')continue;id[ni]=n;q.push(ni)}}
  size.push(cnt);n++;
 }
 return d.__waterComp={grid:d.grid,id,size,w};
}
const LIFE_BIG_WATER=80; /* minimal petak air terhubung agar dianggap laut/danau */
function lifeIsWater(d,x,y){return x>=0&&y>=0&&x<d.w&&y<d.h&&d.grid[y].charAt(x)==='~'}
function lifeDeepWater(d,x,y){
 /* petak "dalam": air luas, seluruh 8 tetangga juga air -> pelampung jatuh jelas di air, bukan di tepi tanah */
 if(!lifeIsWater(d,x,y))return false;const c=lifeWaterComps(d);if(c.size[c.id[y*d.w+x]]<LIFE_BIG_WATER)return false;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!lifeIsWater(d,x+dx,y+dy))return false;
 return true;
}
function lifeFishingSpot(){lifeEnsure();if(st!=='world'||!S.world)return null;const data=lifeAssetData();if(!data||!data.grid)return null;
 const px=S.world.x,py=S.world.y,tx=Math.floor(px/WS),ty=Math.floor(py/WS);
 /* 1) pemain harus menempel ke tepi air (jarak kaki ke petak air terdekat <= 16 px) */
 let edge=Infinity;
 for(let y=ty-1;y<=ty+1;y++)for(let x=tx-1;x<=tx+1;x++){if(!lifeIsWater(data,x,y))continue;const c=lifeWaterComps(data);if(c.size[c.id[y*data.w+x]]<LIFE_BIG_WATER)continue;
  const ddx=Math.max(x*WS-px,0,px-(x+1)*WS),ddy=Math.max(y*WS-py,0,py-(y+1)*WS);edge=Math.min(edge,Math.hypot(ddx,ddy))}
 if(edge>16)return null;
 /* 2) pelampung dilempar ke petak air dalam terdekat (maks 4 tile) sehingga mendarat jelas di air */
 let ans=null,dist=Infinity;
 for(let y=Math.max(0,ty-4);y<=Math.min(data.h-1,ty+4);y++)for(let x=Math.max(0,tx-4);x<=Math.min(data.w-1,tx+4);x++){
  if(!lifeDeepWater(data,x,y))continue;const d=Math.hypot((x+.5)*WS-px,(y+.5)*WS-py);if(d<dist){dist=d;ans={x,y,biome:lifeBiome(x,y),d}}}
 return ans&&dist<=WS*4.2?ans:null;
}
function lifeFishPool(spot){const band=lifeTimeBand(),season=lifeSeason();let pool=LIFE_FISH.filter(f=>f.biomes.includes(spot.biome)&&(f.times.includes('any')||f.times.includes(band))&&f.seasons.includes(season));if(!pool.length)pool=LIFE_FISH.filter(f=>f.biomes.includes(spot.biome));if(!pool.length)pool=LIFE_FISH.filter(f=>f.biomes.includes('lake'));return pool}
function lifeChooseFish(spot){const pool=lifeFishPool(spot);const weights={common:62,uncommon:27,rare:9,legendary:2};let total=pool.reduce((a,f)=>a+(weights[f.rarity]||1),0),v=Math.random()*total;for(const f of pool){v-=weights[f.rarity]||1;if(v<=0)return f;}return pool[pool.length-1]}
function lifeStartFishing(spot){lifeEnsure();if(lifeFish&&lifeFish.active)return false;
 lifeFish={active:true,spot,phase:'waiting',elapsed:0,biteAt:1.6+Math.random()*2.3,deadline:0,fish:null};
 if(wAct){wAct.action=null;wAct.onDone=null;wAct.face((spot.x+.5)*WS-S.world.x,(spot.y+.5)*WS-S.world.y);wAct.state='idle';wAct.t0=performance.now();}
 sfx('cast');say(lifeLang('Umpan sudah dilempar. Tunggu pelampungnya bergerak.','Line is cast. Watch for the bobber to move.'));return true;
}
function lifeFishTap(){if(!lifeFish||!lifeFish.active)return false;
 if(lifeFish.phase==='waiting')return false;
 if(lifeFish.phase==='bite'){
  if(lifeFish.deadline<=0){lifeFish.phase='miss';return false;}
  if(wAct){wAct.face((lifeFish.spot.x+.5)*WS-S.world.x,(lifeFish.spot.y+.5)*WS-S.world.y);wAct.play('reeling',performance.now());}
  const f=lifeChooseFish(lifeFish.spot);lifeFish.fish=f;lifeFish.phase='caught';lifeEnsure();S.fish.caughtToday++;S.fish.total++;S.fish.book[f.id]=(S.fish.book[f.id]||0)+1;S.fish.stock[f.id]=(S.fish.stock[f.id]||0)+1;lifeFish.elapsed=0;sv();if(typeof hapticPulse==='function')hapticPulse(f.rarity==='legendary'?[18,24,18]:12);sfx(f.rarity==='legendary'?'limit':'coin');say(lifeLang('+1 Ikan · '+f.name,'+1 Fish · '+f.en));return true;
 }
 return false;
}
function lifeFishClose(){lifeFish=null;if(wAct){wAct.action=null;wAct.state='idle';wAct.t0=performance.now()}}
function lifeFishUpdate(dt){if(!lifeFish||!lifeFish.active)return;lifeFish.elapsed+=dt;
 if(lifeFish.phase==='waiting'&&lifeFish.elapsed>=lifeFish.biteAt){lifeFish.phase='bite';lifeFish.elapsed=0;lifeFish.deadline=1.2; /* PLACEHOLDER: jendela gigitan perlu tuning HP */ sfx('hit');}
 else if(lifeFish.phase==='bite'){lifeFish.deadline-=dt;if(lifeFish.deadline<=0){lifeFish.phase='miss';lifeFish.elapsed=0;say(lifeLang('Ikannya lepas. Coba lagi.','It got away. Try again.'));}}
 else if((lifeFish.phase==='caught'||lifeFish.phase==='miss')&&lifeFish.elapsed>.9)lifeFishClose();
}
function lifeFishSellAll(){lifeEnsure();const f=S.fish;if(f.soldGold>=LIFE.sellFishCap){say(lifeLang('Penjualan ikan hari ini sudah cukup. Lanjut besok.','Enough fish sales for today. More tomorrow.'));return}let amount=0;Object.keys(f.stock).forEach(id=>{const item=LIFE_FISH.find(q=>q.id===id);if(item)amount+=(f.stock[id]||0)*item.price});const paid=Math.min(amount,LIFE.sellFishCap-f.soldGold,LIFE.goldCap-S.worldEarn.gold);if(paid<=0){say(lifeLang('Tidak ada ikan untuk dijual, atau batas emas hari ini tercapai.','No fish to sell, or the gold limit for today is reached.'));return}let left=paid;const ids=Object.keys(f.stock).sort((a,b)=>(LIFE_FISH.find(q=>q.id===a)||{price:0}).price-(LIFE_FISH.find(q=>q.id===b)||{price:0}).price);for(const id of ids){const q=LIFE_FISH.find(f=>f.id===id);if(!q)continue;while((f.stock[id]||0)>0&&left>=q.price){f.stock[id]--;left-=q.price;}if(left<q.price)break}const actual=paid-left;f.soldGold+=actual;lifeDailyGrant(actual,0,0);sv();sfx('coin');say(lifeLang('Ikan terjual, +'+actual+' emas.','Fish sold, +'+actual+' gold.'));}
function lifeOpenFishBook(){lifeEnsure();lifeFishClose();lifeWorldQuick=false;wFrom=st==='world'?1:wFrom;st='fishbook';sv()}
function lifeTreeObjectId(o){return'tree_obj_'+Math.round(+o.x)+'_'+Math.round(+o.y)}
function lifeTreeEdgeEligible(o){
 if(!o||!String(o.a||'').startsWith('tree')||o.unique||o.protected||o.quest||['q','u','Q','U'].includes(o.c))return false;
 const x=Math.floor((+o.x||0)/16),y=Math.floor((+o.y||0)/16);
 return x>=64&&x<128&&y>=0&&y<64&&(x<=71||x>=120||y<=10||y>=52);
}
function lifeTreeResourceEligible(r){
 if(!r||r.kind!=='tree')return true;
 if(r.unique||r.protected||r.quest||r.biome!=='forest')return false;
 const x=Math.floor(+r.x),y=Math.floor(+r.y);
 if(!(x>=64&&x<128&&y>=0&&y<64&&(x<=71||x>=120||y<=10||y>=52)))return false;
 /* Resource markers over an actual eligible tree are handled by that object so the tree/stump art changes in place. */
 const d=lifeAssetData();return !(d&&Array.isArray(d.objects)&&(d.objects||[]).some(o=>lifeTreeEdgeEligible(o)&&Math.hypot((+o.x/16)-x,(+o.y/16)-y)<1.5));
}
function lifeTreeObjectState(o){if(!lifeTreeEdgeEligible(o))return'';const q=S.gather&&S.gather.nodes&&S.gather.nodes[lifeTreeObjectId(o)];if(!q)return'';if(q.gone)return'hidden';if(!q.readyAt||lifeNow()>=q.readyAt)return'';return q.cleared?'hidden':q.stump?'stump':''}
/* ===== Siklus sumber daya =====
 Dipanen -> hilang total (tanpa bayangan/tunggul/penanda) -> setelah jeda muncul lagi di titik ACAK di dalam zona yang sama
 (hutan tetap di hutan, jamur tetap di hutan jamur, dst). Posisi baru dipilih saat panen dan disimpan di S.gather.nodes[id].pos. */
let lifeDynMap=null,lifeDynRef=null,lifeDynSeen=-1,lifeDynNext=0,lifeDynRev=0;
const LIFE_TREE_ZONE=[64,0,64,64];
function lifeNodePos(r){const q=S.gather&&S.gather.nodes&&S.gather.nodes[r.id];return q&&q.pos?q.pos:{x:r.x,y:r.y}}
function lifeZoneOf(r,d){if(r.zone&&r.zone.length===4)return{x:r.zone[0],y:r.zone[1],w:r.zone[2],h:r.zone[3]};const b=(d.biomeRegions||[]).find(q=>q.id===r.biome);return b?{x:b.x,y:b.y,w:b.w,h:b.h}:{x:0,y:0,w:d.w,h:d.h}}
function lifePickSpot(r){
 const d=lifeAssetData();if(!d||!d.grid)return{x:r.x,y:r.y};
 const z=lifeZoneOf(r,d),px=S.world?S.world.x/WS:-99,py=S.world?S.world.y/WS:-99,minD=r.kind==='tree'?1.4:1.0;
 const obs=(d.objects||[]).filter(o=>!(o.k&&o.k.indexOf('flower')===0)).map(o=>[o.x/16,o.y/16-.5]);
 const taken=[];(d.resources||[]).forEach(q=>{if(q.id!==r.id){const p=lifeNodePos(q);taken.push([p.x,p.y])}});
 Object.keys(S.gather.nodes||{}).forEach(id=>{const q=S.gather.nodes[id];if(id!==r.id&&q&&q.pos)taken.push([q.pos.x,q.pos.y])});
 const places=(d.places||[]).filter(p=>p.sprite||p.type==='market'||p.type==='pier'||p.type==='animal_pen');
 for(let n=0;n<90;n++){
  const x=z.x+Math.floor(Math.random()*z.w),y=z.y+Math.floor(Math.random()*z.h);
  if(x<0||y<0||x>=d.w||y>=d.h||d.grid[y].charAt(x)!=='.')continue;
  if(Math.hypot(x+.5-px,y+.5-py)<3)continue;
  if((d.pens||[]).some(q=>x>=q.x-1&&x<=q.x+q.w&&y>=q.y-1&&y<=q.y+q.h+1))continue;
  if(places.some(q=>Math.hypot(q.x-x,q.y-y)<3.2))continue;
  if(taken.some(t=>Math.hypot(t[0]-x,t[1]-y)<2.5))continue;
  if(obs.some(o=>Math.hypot(o[0]-(x+.5),o[1]-(y+.5))<minD))continue;
  return{x,y};
 }
 return{x:r.x,y:r.y};
}
function lifeMarkHarvested(r,ms){
 const now=lifeNow(),node={readyAt:now+ms,last:now,m:1};node.pos=lifePickSpot(r);
 if(r.object){node.gone=1;node.a=r.a||'tree_1'}
 S.gather.nodes[r.id]=node;lifeDynRev++;return node;
}
function lifeNodesMigrate(){
 /* Simpanan lama menyimpan tunggul/"cleared"; ubah ke model baru (asli hilang permanen + posisi baru) sekali saja. */
 const d=lifeAssetData();if(!d||!S.gather||!S.gather.nodes)return;
 Object.keys(S.gather.nodes).forEach(id=>{const q=S.gather.nodes[id];if(!q||q.m)return;
  const m=/^tree_obj_(-?\d+)_(-?\d+)$/.exec(id);
  if(m){const o=(d.objects||[]).find(v=>Math.round(+v.x)===+m[1]&&Math.round(+v.y)===+m[2]);
   if(q.stump||q.cleared||q.readyAt){q.gone=1;q.a=(o&&o.a)||'tree_1';q.readyAt=q.readyAt||lifeNow();q.pos=lifePickSpot({id,kind:'tree',x:Math.floor(+m[1]/16),y:Math.floor(+m[2]/16)-1,zone:LIFE_TREE_ZONE});q.stump=0;q.cleared=0}
  }else if(q.stump||q.cleared){const r=(d.resources||[]).find(v=>v.id===id);if(r){q.pos=lifePickSpot(r)}q.stump=0;q.cleared=0}
  q.m=1;lifeDynRev++;
 });
}
function lifeTreeTile(x,y){return[Math.floor(x),Math.floor(y)]}
function lifeDynBuild(){
 const d=lifeAssetData(),map=Object.create(null),now=lifeNow();let next=Infinity;
 if(d){
  const nodes=S.gather.nodes;
  Object.keys(nodes).forEach(id=>{const q=nodes[id];if(!q)return;
   const m=/^tree_obj_(-?\d+)_(-?\d+)$/.exec(id);
   if(q.readyAt&&now<q.readyAt)next=Math.min(next,q.readyAt);
   if(m&&q.gone){map[Math.floor((+m[2]-1)/16)*d.w+Math.floor(+m[1]/16)]=false}   /* tempat pohon asli: terbuka */
  });
  Object.keys(nodes).forEach(id=>{const q=nodes[id];if(!q||!q.gone||!q.pos||(q.readyAt&&now<q.readyAt))return;map[q.pos.y*d.w+q.pos.x]=true});   /* pohon yang tumbuh lagi: padat */
  (d.resources||[]).forEach(r=>{if(r.kind!=='tree'||!lifeTreeResourceEligible(r))return;const q=nodes[r.id]||{};if(q.readyAt&&now<q.readyAt)return;const p=lifeNodePos(r);map[p.y*d.w+p.x]=true});
 }
 lifeDynMap=map;lifeDynRef=S.gather.nodes;lifeDynSeen=lifeDynRev;lifeDynNext=next;
}
function lifeDynSolid(tx,ty){
 if(!S||!S.gather||!S.gather.nodes||typeof Tmap==='undefined'||!Tmap.data)return null;const d=Tmap.data();if(!d)return null;
 if(lifeDynRef!==S.gather.nodes||lifeDynSeen!==lifeDynRev||lifeNow()>=lifeDynNext)lifeDynBuild();
 const v=lifeDynMap[ty*d.w+tx];return v===true||v===false?v:null;
}
function lifeMovedTrees(){
 /* pohon yang tumbuh kembali di titik acak + penanda pohon sumber daya yang siap, digambar sebagai sprite pohon biasa */
 const out=[],d=lifeAssetData();if(!d||!S.gather||!S.gather.nodes)return out;const now=lifeNow(),nodes=S.gather.nodes;
 Object.keys(nodes).forEach(id=>{const q=nodes[id];if(!q||!q.gone||!q.pos||(q.readyAt&&now<q.readyAt))return;out.push({x:q.pos.x*16+8,y:(q.pos.y+1)*16,a:q.a||'tree_1'})});
 (d.resources||[]).forEach(r=>{if(r.kind!=='tree'||!lifeTreeResourceEligible(r))return;const q=nodes[r.id]||{};if(q.readyAt&&now<q.readyAt)return;const p=lifeNodePos(r);out.push({x:p.x*16+8,y:(p.y+1)*16,a:'tree_1'})});
 return out;
}

function lifeNearWorldDrop(){lifeEnsure();if(!S.world||!Array.isArray(S.worldDrops))return null;let best=null,bd=46;for(const d of S.worldDrops){if(!d||!(+d.qty>0))continue;const dist=Math.hypot((d.x+.5)*WS-S.world.x,(d.y+1)*WS-S.world.y);if(dist<bd){bd=dist;best=d}}return best}
function lifeTakeWorldDrop(id){lifeEnsure();const d=(S.worldDrops||[]).find(x=>x&&x.id===id);if(!d)return false;const room=typeof scFreeBag==='function'?scFreeBag():Math.max(0,60-Object.values(S.gather.items||{}).reduce((a,n)=>a+(+n||0),0));const n=Math.min(Math.max(0,Math.floor(+d.qty||0)),room);if(n<1){say(lifeLang('Tas penuh. Bahannya tetap di tanah.','Bag is full. The materials stay on the ground.'));return false;}S.gather.items[d.item]=(S.gather.items[d.item]||0)+n;d.qty-=n;if(d.qty<=0)S.worldDrops=S.worldDrops.filter(x=>x!==d);sv();sfx('clear');say(lifeLang('+'+n+' '+d.item,'+'+n+' '+d.item));return true}
function lifeNearResource(){
 lifeEnsure();const d=lifeAssetData();if(!d||!Array.isArray(d.resources)||!S.world)return null;const now=lifeNow();let best=null,bd=44;
 const consider=r=>{const dist=Math.hypot((r.x+.5)*WS-S.world.x,(r.y+1)*WS-S.world.y);if(dist<bd){bd=dist;best=r}};
 d.resources.forEach(r=>{if(r.kind==='tree'&&!lifeTreeResourceEligible(r))return;const q=S.gather.nodes[r.id]||{};if(q.readyAt&&now<q.readyAt)return;const p=lifeNodePos(r);consider(Object.assign({},r,{x:p.x,y:p.y}))});
 (d.objects||[]).forEach(o=>{if(!lifeTreeEdgeEligible(o))return;const id=lifeTreeObjectId(o),q=S.gather.nodes[id];if(q&&(q.gone||(q.readyAt&&now<q.readyAt)))return;
  consider({id,kind:'tree',sourceKind:'tree',x:(+o.x/16)-.5,y:(+o.y/16)-1,respawnMs:420000,amount:2,object:true,a:o.a,zone:LIFE_TREE_ZONE,biome:'forest' /* PLACEHOLDER: 7 menit sebelum pohon tumbuh lagi */})});
 Object.keys(S.gather.nodes).forEach(id=>{const q=S.gather.nodes[id];if(!q||!q.gone||!q.pos||!q.readyAt||now<q.readyAt)return;
  consider({id,kind:'tree',sourceKind:'tree',x:q.pos.x,y:q.pos.y,respawnMs:420000,amount:2,object:true,a:q.a,zone:LIFE_TREE_ZONE,biome:'forest'})});
 return best;
}
function lifeDoGather(r){lifeEnsure();if(!r)return false;
 const now=lifeNow();
 if(r.kind==='stump'){
  const q=S.gather.nodes[r.id];if(!q||!q.stump||now>=q.readyAt)return false;
  q.stump=0;q.cleared=1;q.last=now;if(wAct){wAct.face((r.x+.5)*WS-S.world.x,(r.y+1)*WS-S.world.y);wAct.play('axe',performance.now())}sv();sfx('hit');say(lifeLang('Tunggulnya sudah bersih. Pohonnya akan tumbuh lagi nanti.','Stump cleared. The tree will grow back in a while.'));return true;
 }
 if(S.gather.count>=LIFE.gatherCap){say(lifeLang('Cukup mengumpulkan untuk hari ini. Lanjut besok ya.','That is enough gathering for today. More tomorrow.'));return false}
 /* PLACEHOLDER respawn: 7 menit pohon, 9 menit batu, 6/5/8 menit bahan lain; minta tuning bermain. */
 const map={tree:['wood',2,420000,'axe'],stone:['stone',2,540000,'mining'],mushroom:['mushroom',1,360000,'dig'],herb:['herb',1,300000,'dig'],fruit:['fruit',1,480000,'axe']},q=map[r.kind]||['herb',1,300000,'dig'];
 S.gather.items[q[0]]=(S.gather.items[q[0]]||0)+q[1];lifeMarkHarvested(r,r.respawnMs||q[2]);S.gather.count++;if(wAct){wAct.face((r.x+.5)*WS-S.world.x,(r.y+1)*WS-S.world.y);wAct.play(q[3],performance.now())}sv();if(typeof hapticPulse==='function')hapticPulse(12);sfx(q[3]==='axe'?'hit':'clear');say('+'+q[1]+' '+q[0]+' · muncul lagi '+Math.ceil((r.respawnMs||q[2])/60000)+' menit');return true;
}
function lifeDrawWorldDrops(){if(!S.world||!Array.isArray(S.worldDrops))return;const cx=typeof wcx==='number'?wcx:0,cy=typeof wcy==='number'?wcy:0;for(const d of S.worldDrops){if(!d||!(+d.qty>0))continue;const x=(d.x+.5)*WS-cx-OX,y=(d.y+1)*WS-cy;if(x<-22||x>VW+22||y<-8||y>370)continue;g.fillStyle='rgba(18,22,24,.72)';g.fillRect(x-15,y-13,30,12);g.fillStyle=d.item==='wood'?'#d8a16a':d.item==='stone'?'#aabac4':'#b5df9b';g.fillRect(x-7,y-8,14,5);T(String(d.qty),x,y-4,'#fff',9,'center');}}
function lifeFoodCount(k){lifeEnsure();if(k==='egg'||k==='milk'||k==='truffle'||k==='wool')return Math.max(0,+(S.ranch&&S.ranch.stock&&S.ranch.stock[k])||0);if(k==='fish')return Object.keys(S.fish.stock).reduce((a,id)=>a+(S.fish.stock[id]||0),0);return Math.max(0,+(S.kitchen.food[k])||0)+(S.gather.items[k]||0)}
function lifeConsume(k,n){if(k==='egg'||k==='milk'||k==='truffle'||k==='wool'){if(S.ranch&&S.ranch.stock)S.ranch.stock[k]=Math.max(0,S.ranch.stock[k]-n);return}if(k==='fish'){let left=n;for(const id of Object.keys(S.fish.stock)){const take=Math.min(left,S.fish.stock[id]||0);S.fish.stock[id]-=take;left-=take;if(!left)break}return}if(k==='herb'||k==='mushroom'||k==='fruit'||k==='wood'||k==='stone'){S.gather.items[k]=Math.max(0,(S.gather.items[k]||0)-n);return}S.kitchen.food[k]=Math.max(0,(S.kitchen.food[k]||0)-n)}
function lifeCanCook(recipe){return Object.keys(recipe.needs).every(k=>lifeFoodCount(k)>=(recipe.needs[k]||0))}
function lifeCook(recipe){lifeEnsure();if(!lifeCanCook(recipe)){say(lifeLang('Bahannya belum cukup. Coba panen, ternak, memancing, atau kumpulkan dulu.','Not enough materials yet. Try farming, ranching, fishing, or gathering.'));return}Object.keys(recipe.needs).forEach(k=>lifeConsume(k,recipe.needs[k]));S.buff={id:recipe.id,name:recipe.name,atk:Math.min(.10,recipe.atk),hp:Math.min(.10,recipe.hp),stages:recipe.stages,lastStage:null};S.kitchen.cooked=(S.kitchen.cooked||0)+1;sv();sfx('heal');say('Masakan aktif: '+recipe.name+' ('+recipe.stages+' stage)');}
function lifeOpenKitchen(){lifeEnsure();if(st==='world')wFrom=1;lifeWorldQuick=false;st='kitchen';sv()}
function lifeOpenVillage(){lifeEnsure();if(st==='world')wFrom=1;lifeVillageSyncNPCs();lifeWorldQuick=false;st='village';sv()}
function lifeVillageSyncNPCs(){if(!Array.isArray(NPCS))return;const level=S.village&&S.village.level||1,d=lifeAssetData();if(!d||!d.npcs)return;const additions=[
 {id:'builder',h:'npc_builder',n:['Tukang Bangun','Builder'],reqLevel:2},
 {id:'cook',h:'npc_cook',n:['Koki Desa','Village Cook'],reqLevel:3},
 {id:'woodcutter',h:'npc_woodcutter',n:['Penebang Kayu','Woodcutter'],reqLevel:4}
 ];additions.forEach(o=>{if(level<o.reqLevel||NPCS.some(q=>q.id===o.id))return;const pos=d.npcs[o.id];if(!pos)return;o.tx=pos[0];o.ty=pos[1];NPCS.push(o)});lifeNpcSynced=level;}
function lifeUpgradeVillage(){lifeEnsure();const v=S.village;if(v.level>=5){say(lifeLang('Desa sudah di level tertinggi.','The village is at its highest level.'));return}const c=LIFE_UPGRADES[v.level];if(!c)return;const items=S.gather.items;if(S.g<c.gold||items.wood<c.wood||items.stone<c.stone){say('Butuh '+c.gold+' emas, '+c.wood+' kayu, '+c.stone+' batu');return}S.g-=c.gold;items.wood-=c.wood;items.stone-=c.stone;v.level++;lifeVillageSyncNPCs();lifeDailyGrant(0,0,0);sv();sfx('clear');say(lifeLang('Desa naik ke level '+v.level+'. Ada penghuni dan bangunan baru.','Village is now level '+v.level+'. New neighbors and buildings arrived.'));}
function lifeOrderList(){lifeEnsure();const o=S.orders;if(Array.isArray(o.list)&&o.list.length)return o.list;const pool=[
 {id:'wood',item:'wood',n:3,name:'Kayu untuk renovasi',en:'Wood for renovation',npc:'Tukang Bangun',npcEn:'Builder',gold:35},
 {id:'stone',item:'stone',n:3,name:'Batu untuk fondasi',en:'Stone for the foundation',npc:'Tukang Bangun',npcEn:'Builder',gold:42},
 {id:'herb',item:'herb',n:2,name:'Herba untuk tabib',en:'Herbs for the healer',npc:'Petani',npcEn:'Farmer',gold:28},
 {id:'egg',item:'egg',n:2,name:'Telur untuk kedai',en:'Eggs for the inn',npc:'Koki Desa',npcEn:'Village Cook',gold:32},
 {id:'fish',item:'fish',n:1,name:'Ikan untuk jamuan',en:'Fish for the feast',npc:'Koki Desa',npcEn:'Village Cook',gold:30},
 {id:'fruit',item:'fruit',n:2,name:'Buah untuk pasar',en:'Fruit for the market',npc:'Pedagang',npcEn:'Merchant',gold:34},
 {id:'mushroom',item:'mushroom',n:2,name:'Jamur untuk dapur',en:'Mushrooms for the kitchen',npc:'Koki Desa',npcEn:'Village Cook',gold:32}
 ];let h=lifeHash(o.day+':'+(S.village.level||1)),out=[];while(out.length<3){h=(Math.imul(h,1664525)+1013904223)>>>0;const q=pool[(h>>>8)%pool.length];if(!out.some(x=>x.id===q.id))out.push(q)}o.list=out;return out;}
function lifeOrderCount(item){return lifeFoodCount(item)}
function lifeOrderDeliver(i){const a=lifeOrderList()[i];if(!a||S.orders.done.includes(a.id))return;if(lifeOrderCount(a.item)<a.n){say('Bahan kurang: perlu '+a.n+' '+a.item);return}lifeConsume(a.item,a.n);S.orders.done.push(a.id);const pay=lifeDailyGrant(a.gold,0,0);sv();sfx('coin');say('Pesanan selesai: +'+pay.gold+' emas (batas dunia '+S.worldEarn.gold+'/'+LIFE.goldCap+')');}
const LIFE_STORY=[
 {title:'Batu pertama',en:'The first stone',desc:'Kumpulkan 3 batu untuk fondasi balai desa.',enDesc:'Gather 3 stones for the village hall foundation.',need:{stone:3},gold:30},
 {title:'Atap dan dinding',en:'Roof and walls',desc:'Sediakan 5 kayu untuk memperbaiki rumah.',enDesc:'Provide 5 wood to repair the homes.',need:{wood:5},gold:35},
 {title:'Dapur bersama',en:'A shared kitchen',desc:'Bawa 2 herba dan 2 jamur untuk dapur desa.',enDesc:'Bring 2 herbs and 2 mushrooms for the village kitchen.',need:{herb:2,mushroom:2},gold:40},
 {title:'Pasar kembali hidup',en:'The market comes alive',desc:'Bawa 3 buah dan 2 telur untuk pasar.',enDesc:'Bring 3 fruit and 2 eggs to the market.',need:{fruit:3,egg:2},gold:45}
];
function lifeStoryDeliver(){lifeEnsure();const v=S.village,quest=LIFE_STORY[v.story];if(!quest){say(lifeLang('Cerita desa sudah tamat.','The village story is complete.'));return}if(v.level<Math.min(5,v.story+1)){say(lifeLang('Naikkan level desa ke '+Math.min(5,v.story+1)+' dulu.','Raise the village to level '+Math.min(5,v.story+1)+' first.'));return}if(!Object.keys(quest.need).every(k=>lifeFoodCount(k)>=quest.need[k])){say('Bahan misi belum lengkap.');return}Object.keys(quest.need).forEach(k=>lifeConsume(k,quest.need[k]));v.story++;const pay=lifeDailyGrant(quest.gold,v.story===4?1:0,v.story===4?1:0);sv();sfx('clear');say('Misi cerita: '+quest.title+' · +'+pay.gold+' emas'+(pay.essence?' +Esensi':'')+(pay.ticket?' +Tiket':''));}
function lifeBeforeStage(){lifeEnsure();let b=S.buff;if(b&&b.lastStage!==null&&b.lastStage!==undefined&&b.lastStage!==stage){b.stages--;if(b.stages<=0){S.buff=null;b=null;}}if(b){b.lastStage=stage;hs.forEach(h=>{if(h._lifeBase){const ratio=h.mh?Math.max(0,Math.min(1,h.hp/h.mh)):1;h.mh=h._lifeBase.mh*(1+b.hp);h.hp=h.mh*ratio;h.lm=h._lifeBase.lm*(1+b.atk);}})}else hs.forEach(h=>{if(h._lifeBase){const ratio=h.mh?Math.max(0,Math.min(1,h.hp/h.mh)):1;h.mh=h._lifeBase.mh;h.hp=h.mh*ratio;h.lm=h._lifeBase.lm;}});sv();}
function lifeWeatherInit(){lifeEnsure();const a=S.atmo,n=lifeNow();if(!a.changedAt||!isFinite(a.changedAt)||a.changedAt>n+60000)a.changedAt=n;if(!a.weather||!['clear','cloudy','rain','storm','snow'].includes(a.weather))a.weather='clear';if(n-a.changedAt>360000){const season=lifeSeason(),pool=season==='winter'?['clear','cloudy','snow','snow','rain']:season==='summer'?['clear','clear','cloudy','rain','storm']:['clear','cloudy','rain','rain','storm'];a.weather=pool[lifeHash(lifeDayKey()+':'+Math.floor(n/360000))%pool.length];a.changedAt=n;sv();}if((a.weather==='rain'||a.weather==='storm')&&typeof farmAutoWaterAll==='function')farmAutoWaterAll(true);}
function lifeWeather(){lifeWeatherInit();return S.atmo.weather}
function lifeWeatherName(){return({clear:['Cerah','Clear'],cloudy:['Berawan','Cloudy'],rain:['Hujan','Rain'],storm:['Badai','Storm'],snow:['Salju','Snow']})[lifeWeather()]||['Cerah','Clear']}
function lifeWorldUpdate(dt){lifeEnsure();lifeWeatherInit();lifeNow();if(S.atmo){S.atmo.clock=(+S.atmo.clock||0)+dt;}
 if(st==='world'){lifeFishUpdate(dt);}
 lifeVillageSyncNPCs();if(lifeNow()-lifeLastSave>30000){lifeLastSave=lifeNow();sv();}}
function lifeDrawWeather(){const wx=lifeWeather(),en=S.set.lang==='en',n=wx==='rain'||wx==='storm'?42:wx==='snow'?60:0;if(wx==='cloudy'){g.fillStyle='rgba(78,91,111,.09)';g.fillRect(-OX,0,VW,360)}if(wx==='rain'||wx==='storm'){g.strokeStyle=wx==='storm'?'rgba(160,204,255,.68)':'rgba(155,200,240,.5)';g.lineWidth=1;for(let i=0;i<n;i++){const x=((i*97+t*(wx==='storm'?190:130))%VW)-OX,y=(i*71+t*(wx==='storm'?300:230))%370;g.beginPath();g.moveTo(x,y);g.lineTo(x-3,y+9);g.stroke()}if(wx==='storm'&&Math.sin(t*1.9)>0.985){g.fillStyle='rgba(220,235,255,.22)';g.fillRect(-OX,0,VW,360)}}else if(wx==='snow'||wSn){g.fillStyle='rgba(235,245,255,.14)';g.fillRect(-OX,0,VW,360);for(let i=0;i<60;i++){const x=((i*71+Math.sin(t+i)*12-t*9)%VW+VW)%VW-OX,y=(i*49+t*(20+(i%5)*5))%370;g.fillStyle='rgba(255,255,255,.84)';g.fillRect(x,y,i%4===0?2:1,i%4===0?2:1)}}}
function lifeDrawResourceNodes(){const d=lifeAssetData();if(!d||!d.resources||!S.world)return;lifeEnsure();const cx=typeof wcx==='number'?wcx:0,cy=typeof wcy==='number'?wcy:0,n=lifeNow(),tm=performance.now();
 for(const r of d.resources){
  if(r.kind==='tree')continue; /* pohon digambar sebagai sprite pohon lewat Tmap.tall (urutan kedalaman) */
  const st=S.gather.nodes[r.id]||{};if(st.readyAt&&n<st.readyAt)continue; /* sedang pulih: tidak ada bayangan/penanda sama sekali */
  const p=lifeNodePos(r),x=(p.x+.5)*WS-cx-OX,y=(p.y+1)*WS-cy;if(x<-32-OX||x>VW+32||y<-25||y>390)continue;
  g.save();
  if(r.kind==='stone'){Anim.shadow(g,x,y-1,13,4,.28);g.fillStyle='#586b75';g.beginPath();g.moveTo(x-12,y);g.lineTo(x-9,y-13);g.lineTo(x-1,y-19);g.lineTo(x+10,y-14);g.lineTo(x+13,y-3);g.closePath();g.fill();g.fillStyle='#9bb4bc';g.fillRect(x-5,y-12,4,3)}
  else if(r.kind==='mushroom'){Anim.shadow(g,x,y-1,16,4,.25);const a=['mush_red_1','mush_blue_2','mush_blue_1'];let ok=false;for(let i=0;i<3;i++)ok=Anim.draw(g,a[i],tm+i*170,x-11+i*11,y-(i%2)*4,false,2)||ok;
   if(!ok){for(let i=0;i<3;i++){g.fillStyle=['#dc5360','#dc8b48','#a96ac7'][i];g.fillRect(x-10+i*8,y-10-(i%2)*4,7,5);g.fillStyle='#f7e8bd';g.fillRect(x-7+i*8,y-5-(i%2)*4,2,6)}}}
  else if(r.kind==='herb'){Anim.shadow(g,x,y-1,10,3,.22);g.strokeStyle='#3a8c4b';g.lineWidth=3;for(let i=0;i<3;i++){g.beginPath();g.moveTo(x,y);g.lineTo(x-7+i*7,y-13-i%2*3);g.stroke();g.fillStyle='#76bd61';g.fillRect(x-8+i*7,y-15-i%2*3,5,4)}}
  else{Anim.shadow(g,x,y-1,10,3,.22);g.strokeStyle='#4b8a48';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-19);g.stroke();g.fillStyle='#b93d43';g.beginPath();g.arc(x-6,y-12,4,0,7);g.arc(x+6,y-16,4,0,7);g.fill();g.fillStyle='#e9bb68';g.fillRect(x-1,y-22,3,5)}
  g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x-10,y-37,20,10);T('E',x,y-29,'#fc4',8,'center');g.restore();
 }}
function lifeDrawWorldOverlay(){lifeEnsure();lifeDrawLockedPlaces();g.fillStyle='rgba(8,18,22,.76)';g.fillRect(VW-OX-78,6,68,22);g.strokeStyle='#8db9c0';g.strokeRect(VW-OX-77.5,6.5,67,21);T((self.hudClock?hudClock():String(Math.floor(lifeHour())).padStart(2,'0')+':00'),VW-OX-44,21,'#e4f1f2',10,'center');
 lifeDrawWorldDrops();
 if(lifeFish&&lifeFish.active){const cx=typeof wcx==='number'?wcx:0,cy=typeof wcy==='number'?wcy:0,x=(lifeFish.spot.x+.5)*WS-cx-OX,y=(lifeFish.spot.y+.5)*WS-cy,phase=lifeFish.phase;g.strokeStyle=phase==='bite'?'#ffe36d':'#9edfea';g.lineWidth=1.5;for(let j=0;j<(phase==='bite'?3:2);j++){const r=5+j*5+(phase==='bite'?Math.abs(Math.sin(t*16))*4:Math.sin(t*4+j)*2);g.beginPath();g.ellipse(x,y+3,r,r*.45,0,0,Math.PI*2);g.stroke()}g.fillStyle=phase==='bite'?'#ffe36d':'#f7f3e7';g.beginPath();g.ellipse(x,y-2,3.5,5,0,0,Math.PI*2);g.fill();g.fillStyle='#c64d4d';g.fillRect(x-2,y-7,4,3);return;}
 if(lifeWorldQuick){g.fillStyle='rgba(5,10,15,.88)';g.fillRect(152,43,336,280);g.strokeStyle='#e6c45a';g.lineWidth=2;g.strokeRect(153,44,334,278);T('MENU KEHIDUPAN DESA',320,63,'#fc4',14,'center');btn(180,72,280,27,'BUKU IKAN',1);btn(180,105,280,27,'DAPUR & MASAKAN',1);btn(180,138,280,27,'TINGKAT DESA',1);btn(180,171,280,27,'PESANAN & CERITA',1);btn(180,204,280,27,'GUDANG MATERIAL',1);btn(180,237,280,27,'BENGKEL & PENGOLAHAN',1);btn(180,270,280,27,'KEMBALI KE MENU UTAMA',1);}
 if(lifeWorldQuick||lifeFish&&lifeFish.active)return;
 
}
function lifeDrawLockedPlaces(){return;const d=lifeAssetData();if(!d||!Array.isArray(d.places)||!S.world)return;const cx=typeof wcx==='number'?wcx:0,cy=typeof wcy==='number'?wcy:0;d.places.forEach(p=>{if(!(p.unlockLevel>(S.village&&S.village.level||1)))return;const sz=p.footprint||[3,3],x=p.x*WS-cx-OX,y=(p.y-sz[1]+1)*WS-cy,w=sz[0]*WS,h=sz[1]*WS;if(x+w<-30||x>VW+30||y+h<0||y>360)return;g.save();g.fillStyle='rgba(12,14,22,.6)';g.fillRect(x,y,w,h);g.strokeStyle='#a6a7b0';g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,h-2);g.fillStyle='#bfc7d2';g.fillRect(x+w/2-5,y+h/2-1,10,8);g.beginPath();g.arc(x+w/2,y+h/2-1,5,Math.PI,Math.PI*2);g.strokeStyle='#bfc7d2';g.beginPath();g.arc(x+w/2,y+h/2-1,5,Math.PI,Math.PI*2);g.stroke();g.restore();});}
function lifeWorldAfterRender(){lifeDrawWorldOverlay();}
function lifeOpenOrders(){lifeWorldQuick=false;wFrom=st==='world'?1:wFrom;st='quests';qTab=2;lifeEnsure();}
function lifeDrawFishBook(){lifeEnsure();ov(.94);btn(6,5,76,28,'KEMBALI');T('BUKU IKAN',95,25,'#7eddf1',17);T('Tertangkap: '+S.fish.total+' · Hari ini: '+S.fish.caughtToday,632,24,'#fc4',10,'right');
 const rar={common:'#d5e3eb',uncommon:'#67df91',rare:'#7fc9ff',legendary:'#f4c95d'};const start=lifeFishBookScroll;LIFE_FISH.slice(start,start+6).forEach((f,i)=>{const y=42+i*39,owned=S.fish.book[f.id]||0,count=S.fish.stock[f.id]||0;card(20,y,600,34,owned?rar[f.rarity]:'#4b4c58',1);g.fillStyle=owned?rar[f.rarity]:'#7b7b82';g.fillRect(30,y+9,16,16);T(owned?f.name:'???',56,y+14,owned?'#fff':'#999',11);T((S.set.lang==='en'?f.rarity:f.rarity==='common'?'Biasa':f.rarity==='uncommon'?'Tidak umum':f.rarity==='rare'?'Langka':'Legenda').toUpperCase(),286,y+14,rar[f.rarity],8);T('Stok '+count+' · '+f.price+' G',418,y+14,'#fc4',10,'center');T(owned?'×'+owned:'Belum ditemukan',584,y+14,'#cde',9,'right')});btn(24,285,92,25,'▲',start>0);btn(124,285,92,25,'▼',start+6<LIFE_FISH.length);btn(248,285,178,32,'JUAL IKAN ('+S.fish.soldGold+'/'+LIFE.sellFishCap+' G)',lifeFoodCount('fish')>0);btn(439,285,178,32,'KE DAPUR',1);T('Spesies dipengaruhi bioma, jam, musim, dan rarity.',320,338,'#9cf',10,'center')}
function lifeFishBookClick(x,y){if(y<34&&x<85){goBack();return}if(y>=280&&y<=318){if(x<120&&lifeFishBookScroll>0)lifeFishBookScroll--;else if(x>=120&&x<225&&lifeFishBookScroll+6<LIFE_FISH.length)lifeFishBookScroll++;else if(x>=245&&x<430)lifeFishSellAll();else if(x>=435)lifeOpenKitchen();}}
function lifeDrawKitchen(){lifeEnsure();ov(.94);btn(6,5,76,28,'KEMBALI');T('DAPUR DESA',95,25,'#fc4',17);T('Bahan panen: wortel '+S.kitchen.food.carrot+' · labu '+S.kitchen.food.pumpkin+' · bunga bulan '+S.kitchen.food.moonflower,320,46,'#cde',9,'center');T('Ternak: telur '+lifeFoodCount('egg')+' · susu '+lifeFoodCount('milk')+' | Ikan: '+lifeFoodCount('fish'),320,60,'#9cf',9,'center');
 LIFE_RECIPES.forEach((r,i)=>{const y=72+i*61,ok=lifeCanCook(r);card(18,y,604,54,ok?'#66bd87':'#4f4a5b',1);T(S.set.lang==='en'?r.en:r.name,31,y+17,'#fff',12);T(r.desc+' · '+r.stages+' stage',31,y+33,'#fc4',10);T(Object.keys(r.needs).map(k=>k+':'+r.needs[k]).join('  '),31,y+46,'#b5ccdb',9);btn(486,y+10,122,34,'MASAK',ok)});
 if(S.buff){card(18,322,604,28,'#f7c45c',1);T('Buff aktif: '+S.buff.name+' · ATK +'+Math.round(S.buff.atk*100)+'% HP +'+Math.round(S.buff.hp*100)+'% · '+S.buff.stages+' stage',320,340,'#fff4d1',9,'center')}else T('Tidak ada buff aktif. Masakan mengganti buff sebelumnya dan maksimal +10% ATK/HP.',320,342,'#9cf',9,'center')}
function lifeKitchenClick(x,y){if(y<34&&x<85){goBack();return}for(let i=0;i<LIFE_RECIPES.length;i++){const yy=72+i*61;if(y>=yy&&y<=yy+54&&x>=480){lifeCook(LIFE_RECIPES[i]);return}}}
function lifeDrawVillage(){lifeEnsure();const v=S.village;lifeVillageSyncNPCs();ov(.94);btn(6,5,76,28,'KEMBALI');T('MEMBANGUN DESA DARI BATU PERTAMA',320,26,'#fc4',15,'center');T('Level '+v.level+'/5 · Emas '+S.g,632,25,'#cde',10,'right');
 for(let i=1;i<=5;i++){const x=38+(i-1)*114;g.fillStyle=i<=v.level?'#4c985d':'#292637';g.fillRect(x,48,94,26);g.strokeStyle=i===v.level?'#fc4':'#56515e';g.strokeRect(x+.5,48.5,93,25);T('DESA '+i,x+47,65,i<=v.level?'#fff':'#777',10,'center')}
 const c=LIFE_UPGRADES[v.level];card(30,88,580,94,'#b99a60',1);if(c){T('Peningkatan berikutnya',46,108,'#fc4',12);T('Emas '+c.gold+' · Kayu '+c.wood+' · Batu '+c.stone,46,130,'#fff',13);T('Inventaris: Kayu '+S.gather.items.wood+' · Batu '+S.gather.items.stone+' · Herba '+S.gather.items.herb+' · Jamur '+S.gather.items.mushroom+' · Buah '+S.gather.items.fruit,46,149,'#cde',10);btn(420,112,166,42,'TINGKATKAN DESA',S.g>=c.gold&&S.gather.items.wood>=c.wood&&S.gather.items.stone>=c.stone)}else T('Desa sudah mencapai level tertinggi!',320,132,'#8f8',15,'center');
 card(30,194,580,78,'#7b6d91',1);T('Bangunan dan penghuni terbuka',46,214,'#fc4',12);const bld=[['Pasar & kandang','Level 1'],['Bengkel + tukang bangun','Level 2'],['Dapur + koki','Level 3'],['Pondok penebang','Level 4'],['Balai Desa','Level 5']];bld.forEach((b,i)=>T((i+1<=v.level?'✓ ':'🔒 ')+b[0]+' ('+b[1]+')',46+(i%2)*282,232+Math.floor(i/2)*14,i+1<=v.level?'#b9e7a6':'#777',9));
 const q=LIFE_STORY[v.story];card(30,282,580,60,'#9f7a4b',1);T('RANTAI CERITA '+(Math.min(4,v.story+1))+'/4',44,300,'#fc4',10);T(q?(S.set.lang==='en'?q.en:q.title):'Semua cerita selesai',44,315,'#fff',11);T(q?(S.set.lang==='en'?q.enDesc:q.desc):'Desa telah dibangun bersama!',44,330,'#cde',9);btn(438,296,156,30,'SERAHKAN MISI',!!q)}
function lifeVillageClick(x,y){if(y<34&&x<85){goBack();return}if(y>=104&&y<=162&&x>=410){lifeUpgradeVillage();return}if(y>=282&&y<=334&&x>=435){lifeStoryDeliver();return}}
function lifeDrawOrders(){lifeEnsure();ov(.94);btn(6,5,76,28,'KEMBALI');btn(96,8,110,24,'MISI HARIAN',0);btn(212,8,120,24,'PENCAPAIAN',0);btn(340,8,138,24,'PESANAN DESA',1);T('PAPAN MISI DESA',320,54,'#fc4',15,'center');T('Hadiah dunia hari ini: '+S.worldEarn.gold+'/'+LIFE.goldCap+' emas · Esensi '+S.worldEarn.essence+'/'+LIFE.essCap+' · Tiket '+S.worldEarn.tickets+'/'+LIFE.ticketCap,320,70,'#9cf',9,'center');
 lifeOrderList().forEach((o,i)=>{const y=80+i*55,done=S.orders.done.includes(o.id),has=lifeOrderCount(o.item)>=o.n;card(20,y,600,48,done?'#45484b':has?'#75b97a':'#57718a',1);T((S.set.lang==='en'?o.en:o.name)+' · '+(S.set.lang==='en'?(o.npcEn||'Villager'):(o.npc||'Warga')),32,y+18,done?'#888':'#fff',10);T('Serahkan '+o.n+' '+o.item+' · Hadiah '+o.gold+' emas',32,y+35,'#fc4',9);btn(500,y+8,100,31,done?'SELESAI':has?'SERAHKAN':'KURANG',has&&!done)});
 const q=LIFE_STORY[S.village.story];card(20,250,600,87,'#9d7b50',1);T('MISI CERITA: MEMBANGUN DESA DARI BATU PERTAMA',32,269,'#fc4',11);T(q?(S.set.lang==='en'?q.en:q.title):'Cerita selesai',32,287,'#fff',11);T(q?(S.set.lang==='en'?q.enDesc:q.desc):'Semua tahap sudah diselesaikan.',32,303,'#cde',9);T('Bahan: '+(q?Object.keys(q.need).map(k=>k+' '+q.need[k]).join(', '):'—'),32,319,'#9cf',9);btn(476,282,124,38,'SERAHKAN',!!q);}
function lifeOrderClick(x,y){if(y<34&&x<85){goBack();return}if(y<34&&x>=96&&x<206){qTab=0;return}if(y<34&&x>=212&&x<334){qTab=1;return}if(y>=80&&y<245){const i=Math.floor((y-80)/55);if(i>=0&&i<3&&x>490)lifeOrderDeliver(i);return}if(y>=278&&y<=326&&x>=470)lifeStoryDeliver();}
function lifeInputState(x,y){if(st==='fishbook'){lifeFishBookClick(x,y);return true}if(st==='kitchen'){lifeKitchenClick(x,y);return true}if(st==='village'){lifeVillageClick(x,y);return true}return false}
function lifeQuickClick(x,y){if(y<70||y>310){lifeWorldQuick=false;return}if(y>=72&&y<=99)lifeOpenFishBook();else if(y>=105&&y<=132)lifeOpenKitchen();else if(y>=138&&y<=165)lifeOpenVillage();else if(y>=171&&y<=198)lifeOpenOrders();else if(y>=204&&y<=231&&typeof lifeOpenStorage==='function')lifeOpenStorage();else if(y>=237&&y<=264&&typeof lifeOpenWorkshop==='function')lifeOpenWorkshop();else if(y>=270&&y<=297){lifeWorldQuick=false;worldLeave();}}
function lifeInit(){lifeEnsure();lifeVillageSyncNPCs();}

/* Wrappers keep existing systems in place and extend their entry points. */
const _lifeWorldInteract=wInteract;
wInteract=function(){if(st==='world'&&!wDlg&&!wTalk){if(lifeWorldQuick)return;const tool=typeof hudToolId==='function'?hudToolId():'hand',spot=lifeFishingSpot();if(spot&&tool==='rod'){lifeStartFishing(spot);return}const resource=lifeNearResource();if(resource){const need=(resource.kind==='tree'||resource.kind==='stump')?'axe':(resource.kind==='stone'||resource.kind==='rock'||resource.kind==='ore')?'pick':null;if(need&&tool!==need){say(lifeLang('Pilih '+(need==='axe'?'Kapak':'Beliung')+' di hotbar terlebih dahulu.','Select '+(need==='axe'?'Axe':'Pickaxe')+' on the hotbar first.'));return}lifeDoGather(resource);return}if(spot){say(lifeLang('Pilih Pancing di hotbar untuk mulai memancing.','Pick the fishing rod on the hotbar to start fishing.'));return}if(wNpc){if(wNpc.id==='elder'||wNpc.id==='builder'){lifeOpenVillage();return}if(wNpc.id==='cook'){lifeOpenKitchen();return}if(wNpc.id==='woodcutter'){say('Kumpulkan kayu dan batu di penanda sumber daya.');return}}
 if(wPlace){const level=+(wPlace.unlockLevel||1);if((S.village.level||1)<level){say('Bangunan terkunci. Perlu level desa '+level+'.');return}if(wPlace.type==='animal_pen'){wGo('ranch');return}if(wPlace.type==='market'){marketFrom='world';wGo('market');return}if(wPlace.type==='pier'||wPlace.type==='fisher_hut'){if(spot){lifeStartFishing(spot)}else say(lifeLang('Dekati air di titik pancing untuk memancing.','Get near the water at a fishing spot to fish.'));return}if(wPlace.type==='kitchen'){lifeOpenKitchen();return}if(wPlace.type==='workshop'){if(typeof lifeOpenWorkshop==='function')lifeOpenWorkshop();else lifeOpenVillage();return}if(wPlace.type==='village_hall'){lifeOpenVillage();return}if(wPlace.type==='orchard'){say(lifeLang('Kebun buah: petik buah di dekat pohon.','Orchard: pick fruit near the trees.'));return}if(wPlace.type==='mushroom_grove'){say(lifeLang('Hutan jamur: cari jamur di sekitar sini.','Mushroom grove: look for mushrooms around here.'));return}if(wPlace.type==='woodcutter_hut'){say('Pondok penebang: kumpulkan kayu dan batu untuk membangun desa.');return}}}
 _lifeWorldInteract();};
const _lifeWorldDown=worldDown;
worldDown=function(id,x,y){if(st==='world'&&lifeWorldQuick){lifeQuickClick(x,y);return}if(st==='world'&&x>=500&&x<=558&&y>=6&&y<=32){lifeWorldQuick=true;return}_lifeWorldDown(id,x,y)};
const _lifeDrawWorld=drawWorld;
drawWorld=function(){_lifeDrawWorld();lifeWorldAfterRender();};
const _lifeUpdWorld=updWorld;
updWorld=function(dt){if(lifeWorldQuick){lifeWorldUpdate(dt);return}_lifeUpdWorld(dt);lifeWorldUpdate(dt)};
const _lifeSnow=wSnow;
wSnow=function(){return _lifeSnow()||lifeWeather()==='snow'};
const _lifeDrawScreen=draw;
draw=function(){_lifeDrawScreen();if(!['fishbook','kitchen','village'].includes(st))return;g.save();g.translate(OX,0);if(st==='fishbook')lifeDrawFishBook();else if(st==='kitchen')lifeDrawKitchen();else lifeDrawVillage();g.restore()};
const _lifeDrawQuests=drawQuests;
drawQuests=function(){if(qTab===2){lifeDrawOrders();return}_lifeDrawQuests();btn(340,8,138,24,'PESANAN DESA',0)};
const _lifeQuestClick=questClick;
questClick=function(x,y){if(y<34&&x>=338&&x<=480){qTab=2;lifeEnsure();return}if(qTab===2){lifeOrderClick(x,y);return}_lifeQuestClick(x,y)};
const _lifeMarketDraw=drawMarket;
drawMarket=function(){_lifeMarketDraw();btn(458,299,164,36,'DAPUR DESA',1);btn(458,258,164,30,'TINGKAT DESA',1);};
const _lifeMarketClick=marketClick;
marketClick=function(x,y){if(x>=458&&x<=625&&y>=299&&y<=339){lifeOpenKitchen();return}if(x>=458&&x<=625&&y>=258&&y<=291){lifeOpenVillage();return}_lifeMarketClick(x,y)};
// A capturing listener handles the additional screens before the legacy input handler.
cv.addEventListener('pointerdown',function(ev){if(!['fishbook','kitchen','village'].includes(st))return;ev.stopImmediatePropagation();const r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)*VW/r.width-OX,y=(ev.clientY-r.top)*360/r.height;lifeInputState(x,y);},{capture:true});
const _lifeMkH=mkH;
mkH=function(id){const h=_lifeMkH(id);if(S.buff&&S.buff.stages>0){h._lifeBase={mh:h.mh,lm:h.lm};h.mh*=1+Math.min(.10,S.buff.hp||0);h.hp=h.mh;h.lm*=1+Math.min(.10,S.buff.atk||0);}else h._lifeBase={mh:h.mh,lm:h.lm};return h};
const _lifeStartStage=startStage;
startStage=function(){lifeBeforeStage();_lifeStartStage()};
const _lifeFarmHarvest=farmHarvest;
farmHarvest=function(i){lifeEnsure();const farm=S.farm,p=farm&&farm.p&&farm.p[i],kind=p&&FC[p.c]?['carrot','pumpkin','moonflower'][p.c]:null;const r=_lifeFarmHarvest(i);if(r&&kind){S.kitchen.food[kind]=(S.kitchen.food[kind]||0)+1;sv()}return r};
const _lifeNpcStart=npcStart;
npcStart=function(o){if(o&&o.id==='elder'){lifeOpenVillage();return}if(o&&o.id==='builder'){lifeOpenVillage();return}if(o&&o.id==='cook'){lifeOpenKitchen();return}_lifeNpcStart(o)};
lifeInit();

addEventListener('keydown',function(e){if(st==='world'&&e.key==='Escape'&&lifeWorldQuick){lifeWorldQuick=false;wjid=null;wjx=wjy=0;e.preventDefault();}});
