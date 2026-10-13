/* Hero Battle — material storage, capacity-safe transfers, and queued workshop crafting.
   All persistent data is stored through S + sv(); this module preserves older saves. */
const SC_MATERIALS=[
 {id:'wood',name:'Kayu',en:'Wood',icon:0,category:'raw'}, {id:'stone',name:'Batu',en:'Stone',icon:1,category:'raw'},
 {id:'herb',name:'Herba',en:'Herbs',icon:2,category:'raw'}, {id:'mushroom',name:'Jamur',en:'Mushrooms',icon:3,category:'raw'},
 {id:'fruit',name:'Buah',en:'Fruit',icon:4,category:'raw'}, {id:'plank',name:'Papan',en:'Planks',icon:5,category:'processed'},
 {id:'stone_brick',name:'Bata batu',en:'Stone bricks',icon:6,category:'processed'}, {id:'rope',name:'Tali serat',en:'Fiber rope',icon:7,category:'processed'},
 {id:'forest_tonic',name:'Tonik hutan',en:'Forest tonic',icon:8,category:'consumable'},
 {id:'seed_carrot',name:'Benih wortel',en:'Carrot seeds',icon:9,category:'seed'}, {id:'seed_pumpkin',name:'Benih labu',en:'Pumpkin seeds',icon:10,category:'seed'}, {id:'seed_sunflower',name:'Benih bunga matahari',en:'Sunflower seeds',icon:11,category:'seed'}
];
const SC_ITEM_IM=new Image();SC_ITEM_IM.src='assets/world/items.png';
function scItemIcon(id,x,y,size=16){const m=SC_MATERIALS.find(q=>q.id===id);if(!m)return;if(m.category==='seed'){g.save();g.fillStyle=id==='seed_carrot'?'#efad55':id==='seed_pumpkin'?'#d38f35':'#f2d36c';g.beginPath();g.ellipse(x+size*.5,y+size*.56,size*.19,size*.34,-.55,0,Math.PI*2);g.fill();g.fillStyle='#5b9a48';g.fillRect(x+size*.57,y+size*.12,Math.max(2,size*.13),size*.28);g.restore();return}if(!SC_ITEM_IM.complete||!SC_ITEM_IM.naturalWidth)return;g.imageSmoothingEnabled=false;g.drawImage(SC_ITEM_IM,m.icon*16,0,16,16,x,y,size,size)}
const SC_CHEST_CAP=[0,100,180,300];
const SC_RECIPES=[
 {id:'planks',name:'Papan kayu',en:'Wood planks',needs:{wood:3},output:'plank',time:30,desc:'3 kayu → 1 papan'},
 {id:'stone_bricks',name:'Bata batu',en:'Stone bricks',needs:{stone:3},output:'stone_brick',time:45,desc:'3 batu → 1 bata'},
 {id:'fiber_rope',name:'Tali serat',en:'Fiber rope',needs:{herb:2},output:'rope',time:30,desc:'2 herba → 1 tali'},
 {id:'forest_tonic',name:'Tonik hutan',en:'Forest tonic',needs:{herb:2,mushroom:1},output:'forest_tonic',time:60,desc:'2 herba + 1 jamur → 1 tonik'}
];
let scBack='world',scOrigin='world',scStorageScroll=0,scWorkshopScroll=0;
let scSelectedId=null,scSelectedSide='bag',scAmountMode='all',scSortMode='category',scOrder=SC_MATERIALS.map(m=>m.id),scHotbarPage=0;
const scIsMaterial=k=>SC_MATERIALS.some(q=>q.id===k);
function storagecraftEnsure(){
 if(typeof S==='undefined'||!S)return;
 if(!S.gather||typeof S.gather!=='object')S.gather={items:{wood:0,stone:0,herb:0,mushroom:0,fruit:0}};
 S.gather.items=S.gather.items&&typeof S.gather.items==='object'?S.gather.items:{};
 if(!S.materialStorage||typeof S.materialStorage!=='object')S.materialStorage={level:1,items:{}};
 S.materialStorage.level=Math.max(1,Math.min(3,Math.floor(+S.materialStorage.level||1)));
 S.materialStorage.items=S.materialStorage.items&&typeof S.materialStorage.items==='object'?S.materialStorage.items:{};
 SC_MATERIALS.forEach(m=>{S.gather.items[m.id]=Math.max(0,Math.floor(+S.gather.items[m.id]||0));S.materialStorage.items[m.id]=Math.max(0,Math.floor(+S.materialStorage.items[m.id]||0));});
 if(!S.hb||typeof S.hb!=='object'||Array.isArray(S.hb))S.hb={sel:0,pg:0,water:0,slots:{}};
 if(!S.hb.slots||typeof S.hb.slots!=='object'||Array.isArray(S.hb.slots))S.hb.slots={};
 if(!S.workshop||typeof S.workshop!=='object')S.workshop={queue:[],nextId:1,totalCrafted:0};
 if(!Array.isArray(S.workshop.queue))S.workshop.queue=[];
 S.workshop.nextId=Math.max(1,Math.floor(+S.workshop.nextId||1));
 S.workshop.totalCrafted=Math.max(0,Math.floor(+S.workshop.totalCrafted||0));
 // Preserve queued output on migration; do not truncate old data.
 S.workshop.queue.forEach(j=>{if(j&&typeof j==='object'){j.qty=Math.max(1,Math.floor(+j.qty||1));j.readyAt=Number.isFinite(+j.readyAt)?+j.readyAt:Date.now();j.output=SC_MATERIALS.some(m=>m.id===j.output)?j.output:'plank';}});
}
const scBagCap=()=>60+15*(Math.max(1,Math.min(5,+S.village?.level||1))-1);
const scChestCap=()=>SC_CHEST_CAP[S.materialStorage?.level||1]||100;
const scBagUsed=()=>Object.values(S.gather?.items||{}).reduce((a,v)=>a+Math.max(0,Math.floor(+v||0)),0);
const scChestUsed=()=>Object.values(S.materialStorage?.items||{}).reduce((a,v)=>a+Math.max(0,Math.floor(+v||0)),0);
const scReservedOutputs=()=>Math.max(0,(S.workshop?.queue||[]).reduce((a,j)=>a+Math.max(1,Math.floor(+j.qty||1)),0));
const scFreeBag=()=>Math.max(0,scBagCap()-scBagUsed()-scReservedOutputs());
const scFreeChest=()=>Math.max(0,scChestCap()-scChestUsed());
const scLang=(id,en)=>S.set?.lang==='en'?en:id;
const scMaterialCount=k=>(+S.gather?.items?.[k]||0)+(+S.materialStorage?.items?.[k]||0);
function scMove(kind,id,amount){
 storagecraftEnsure();if(!scIsMaterial(id)||(kind!=='store'&&kind!=='take')){say(scLang('Material atau tujuan tidak valid.','Invalid material or destination.'));return false;}
 const bag=S.gather.items,chest=S.materialStorage.items,src=kind==='store'?bag:chest,dst=kind==='store'?chest:bag;
 const have=Math.max(0,Math.floor(+src[id]||0)),requested=amount==='all'?have:amount==='half'?Math.max(1,Math.floor(have/2)):Math.max(0,Math.floor(+amount||0));
 const room=kind==='store'?scFreeChest():scFreeBag(),n=Math.min(requested,have,room);
 if(n<=0){say(scLang(kind==='store'?'Peti penuh atau bahan tidak tersedia.':'Tas penuh atau peti kosong.','Chest full or material unavailable.'));return false;}
 // Hitung jumlah final lebih dahulu; sumber hanya dikurangi sebanyak yang benar-benar muat di tujuan.
 src[id]=have-n;dst[id]=Math.max(0,Math.floor(+dst[id]||0))+n;sv();sfx('click');
 const partial=n<requested;say(partial?scLang('Dipindahkan '+n+' dari '+requested+'. Sisanya tetap aman di sumber.','Moved '+n+' of '+requested+'. The remainder stays safe at the source.'):scLang(kind==='store'?'Disimpan: ':'Diambil: ',kind==='store'?'Stored: ':'Taken: ')+n+' '+(SC_MATERIALS.find(m=>m.id===id)?.name||id));return true;
}
function scUpgradeChest(){
 storagecraftEnsure();const level=S.materialStorage.level;if(level>=3){say(scLang('Peti sudah mencapai kapasitas maksimum.','Chest is already at maximum capacity.'));return false;}
 const req=level===1?{village:2,gold:160,wood:8,stone:4}:{village:4,gold:360,wood:16,stone:12};
 if((S.village?.level||1)<req.village){say(scLang('Perlu Village Level '+req.village+'.','Requires Village Level '+req.village+'.'));return false;}
 if(S.g<req.gold||scMaterialCount('wood')<req.wood||scMaterialCount('stone')<req.stone){say(scLang('Bahan upgrade peti belum cukup.','Not enough materials to upgrade the chest.'));return false;}
 // Validate everything before charging or consuming any material.
 S.g-=req.gold;lifeConsume('wood',req.wood);lifeConsume('stone',req.stone);S.materialStorage.level++;
 sv();sfx('clear');say(scLang('Peti ditingkatkan. Kapasitas kini '+scChestCap()+'.','Chest upgraded. New capacity: '+scChestCap()+'.'));return true;
}
function scSyncQueue(){storagecraftEnsure();let changed=false;const now=Date.now();S.workshop.queue.forEach(j=>{if(!j.done&&now>=j.readyAt){j.done=true;changed=true;}});if(changed)sv();return changed;}
function scCanCraft(recipe){storagecraftEnsure();return !!recipe&&S.workshop.queue.length<3&&scBagUsed()+scReservedOutputs()+1<=scBagCap()&&Object.keys(recipe.needs).every(k=>scMaterialCount(k)>=(recipe.needs[k]||0));}
function scStartCraft(recipeId){
 storagecraftEnsure();const recipe=SC_RECIPES.find(r=>r.id===recipeId);scSyncQueue();
 if(!recipe){say(scLang('Resep tidak ditemukan.','Recipe not found.'));return false;}
 if(S.workshop.queue.length>=3){say(scLang('Antrean bengkel penuh. Klaim hasil yang sudah selesai dahulu.','Workshop queue is full. Claim a finished output first.'));return false;}
 if(!Object.keys(recipe.needs).every(k=>scMaterialCount(k)>=(recipe.needs[k]||0))){say(scLang('Bahan belum cukup. Tidak ada bahan yang dikonsumsi.','Not enough ingredients. No materials were consumed.'));return false;}
 if(scBagUsed()+scReservedOutputs()+1>scBagCap()){say(scLang('Ruang hasil crafting tidak tersedia. Kosongkan tas atau tingkatkan desa.','No reserved crafting output space. Clear the bag or upgrade the village.'));return false;}
 // All validations precede consumption. One reserved bag unit protects the output while processing.
 Object.keys(recipe.needs).forEach(k=>lifeConsume(k,recipe.needs[k]));
 const now=Date.now();S.workshop.queue.push({jobId:S.workshop.nextId++,recipeId:recipe.id,output:recipe.output,qty:1,startedAt:now,readyAt:now+recipe.time*1000,done:false});
 sv();sfx('click');say(scLang('Crafting dimulai: '+recipe.name+'.','Crafting started: '+recipe.en+'.'));return true;
}
function scClaimCraft(jobId){
 storagecraftEnsure();scSyncQueue();const ix=S.workshop.queue.findIndex(j=>j.jobId===jobId),job=S.workshop.queue[ix];
 if(!job){say(scLang('Hasil tidak ditemukan.','Output not found.'));return false;}
 if(!job.done&&Date.now()<job.readyAt){say(scLang('Proses belum selesai.','Processing is not finished yet.'));return false;}
 if(scBagUsed()+job.qty>scBagCap()||scBagUsed()+scReservedOutputs()>scBagCap()){say(scLang('Tas bahan penuh. Hasil tetap aman di bengkel. Simpan material lain dahulu.','Material bag is full. Output remains safe in the workshop. Store other materials first.'));return false;}
 S.gather.items[job.output]=(S.gather.items[job.output]||0)+job.qty;S.workshop.queue.splice(ix,1);S.workshop.totalCrafted+=job.qty;sv();sfx('clear');say(scLang('Hasil diambil: '+(SC_MATERIALS.find(m=>m.id===job.output)?.name||job.output)+'.','Output claimed: '+(SC_MATERIALS.find(m=>m.id===job.output)?.en||job.output)+'.'));return true;
}
function lifeOpenStorage(){storagecraftEnsure();lifeWorldQuick=false;if(st!=='storage'&&st!=='workshop')scOrigin=st==='world'?'world':st;scBack=scOrigin;scSelectedId=null;scSelectedSide='bag';scAmountMode='all';scHotbarPage=S.hb?.pg?1:0;st='storage';sv();}
function lifeOpenWorkshop(){storagecraftEnsure();lifeWorldQuick=false;if(st!=='storage'&&st!=='workshop')scOrigin=st==='world'?'world':st;scBack=scOrigin;scSyncQueue();st='workshop';sv();}
const _scEnsureLife=lifeEnsure;
lifeEnsure=function(){_scEnsureLife();storagecraftEnsure();};
const _scFoodCount=lifeFoodCount;
lifeFoodCount=function(k){storagecraftEnsure();if(scIsMaterial(k))return scMaterialCount(k);return _scFoodCount(k);};
const _scConsume=lifeConsume;
lifeConsume=function(k,n){storagecraftEnsure();if(scIsMaterial(k)){n=Math.max(0,Math.floor(+n||0));if(scMaterialCount(k)<n)return false;const bag=Math.min(n,+S.gather.items[k]||0);S.gather.items[k]=Math.max(0,(+S.gather.items[k]||0)-bag);const rest=n-bag;S.materialStorage.items[k]=Math.max(0,(+S.materialStorage.items[k]||0)-rest);return true;}return _scConsume(k,n);};
const _scGather=lifeDoGather;
lifeDoGather=function(r){
 storagecraftEnsure();if(!r)return false;
 if(r.kind==='stump')return _scGather(r);
 const map={tree:['wood',2,420000,'axe'],stone:['stone',2,540000,'mining'],mushroom:['mushroom',1,360000,'dig'],herb:['herb',1,300000,'dig'],fruit:['fruit',1,480000,'axe']},req=map[r.kind]||['herb',1,300000,'dig'];
 if(S.gather.count>=LIFE.gatherCap)return _scGather(r);
 const now=lifeNow(),id=r.id,item=req[0],qty=req[1],room=scFreeBag(),stored=Math.min(room,qty),dropped=qty-stored;
 /* Satu transaksi: kapasitas dihitung dahulu, lalu tas + drop + cooldown disimpan bersama. */
 if(stored)S.gather.items[item]=(S.gather.items[item]||0)+stored;
 S.gather.nodes[id]={readyAt:now+(r.respawnMs||req[2]),last:now,stump:r.kind==='tree'?1:0};S.gather.count++;
 if(dropped){if(!Array.isArray(S.worldDrops))S.worldDrops=[];const wx=Number.isFinite(+r.x)?+r.x:Math.floor(((S.world&&S.world.x)||0)/WS),wy=Number.isFinite(+r.y)?+r.y:Math.floor(((S.world&&S.world.y)||0)/WS);S.worldDrops.push({id:'drop_'+id+'_'+now,item,qty:dropped,x:wx,y:wy,createdAt:now});}
 if(wAct&&S.world){wAct.face((r.x+.5)*WS-S.world.x,(r.y+.5)*WS-S.world.y);wAct.play(req[3],performance.now())}sv();if(typeof hapticPulse==='function')hapticPulse(12);sfx(req[3]==='axe'?'hit':'clear');
 const msg=(stored?'+'+stored+' ':'')+(item==='wood'?'Kayu':item==='stone'?'Batu':item==='mushroom'?'Jamur':item==='herb'?'Herba':'Buah')+(dropped?' · '+dropped+' dijatuhkan dekat sumber':'');say(msg||scLang('Tunggul dibersihkan.','Stump cleared.'));return true;
};
function scClose(){st=scOrigin||'world';if(st==='world'){lifeWorldQuick=false;}sv();}
function scApplySort(mode){
 if(!['category','name','qty'].includes(mode))return false;scSortMode=mode;
 const lang=S.set?.lang==='en',rank={raw:0,seed:1,processed:2,consumable:3};scOrder=SC_MATERIALS.slice().sort((a,b)=>mode==='category'?((rank[a.category]??9)-(rank[b.category]??9)||(lang?a.en:a.name).localeCompare(lang?b.en:b.name)):mode==='name'?(lang?a.en:a.name).localeCompare(lang?b.en:b.name):(scMaterialCount(b.id)-scMaterialCount(a.id)||a.id.localeCompare(b.id))).map(m=>m.id);sfx('click');return true;
}
function scQuickMove(kind){
 storagecraftEnsure();if(kind!=='store'&&kind!=='take')return false;
 const ids=SC_MATERIALS.map(m=>m.id),src=kind==='store'?S.gather.items:S.materialStorage.items,dst=kind==='store'?S.materialStorage.items:S.gather.items;
 let room=kind==='store'?scFreeChest():scFreeBag(),moved=0;
 if(room<=0){say(scLang(kind==='store'?'Peti penuh. Tidak ada material yang dipindah.':'Tas penuh. Material di peti tetap aman.','Destination full. No materials were moved.'));return false;}
 // Quick-store/take is one transaction: room is reserved first and only moved units leave source.
 for(const id of ids){if(room<=0)break;const n=Math.min(Math.max(0,Math.floor(+src[id]||0)),room);if(!n)continue;src[id]-=n;dst[id]=Math.max(0,Math.floor(+dst[id]||0))+n;room-=n;moved+=n;}
 if(!moved){say(scLang('Tidak ada material yang bisa dipindah.','No materials can be moved.'));return false;}
 sv();sfx('click');say(scLang('Transfer cepat: '+moved+' material. Sisa tetap di sumber.','Quick transfer: '+moved+' materials. Remainder stays at source.'));return true;
}
function scSelectedAmount(){const m=SC_MATERIALS.find(q=>q.id===scSelectedId);if(!m)return 0;const side=scSelectedSide==='chest'?'chest':'bag',n=side==='bag'?+S.gather.items[m.id]||0:+S.materialStorage.items[m.id]||0;return scAmountMode==='all'?'all':scAmountMode==='half'?'half':1;}
function scAssignSlot(index){
 storagecraftEnsure();index=Math.floor(+index);if(index<6||index>15){say(scLang('Enam alat dasar dilindungi.','The six starter tools are protected.'));return false;}
 const picked=SC_MATERIALS.find(m=>m.id===scSelectedId),have=picked?Math.max(0,+S.gather.items[picked.id]||0):0;
 if(scSelectedSide==='bag'&&picked&&have<1){say(scLang('Material tidak tersedia di tas.','Material is not available in the bag.'));return false;}
 if(scSelectedSide==='bag'&&picked&&have>0){if(typeof hudAssignQuickSlot!=='function')return false;return hudAssignQuickSlot(index,picked.id);}
 if(typeof hudClearQuickSlot!=='function')return false;return hudClearQuickSlot(index);
}
function lifeDrawStorage(){
 storagecraftEnsure();ov(.96);btn(6,5,76,28,scLang('KEMBALI','BACK'));T(scLang('TAS + PETI','BAG + CHEST'),320,23,'#fc4',15,'center');btn(488,5,140,27,scLang('BENGKEL','WORKSHOP'),1);
 btn(8,34,96,22,scLang('KATEGORI','CATEGORY'),scSortMode==='category');btn(108,34,82,22,scLang('NAMA A-Z','NAME A-Z'),scSortMode==='name');btn(194,34,82,22,scLang('JUMLAH ↓','COUNT ↓'),scSortMode==='qty');
 T(scLang('TAS','BAG')+' '+scBagUsed()+'/'+scBagCap(),78,54,'#bde',9,'center');T(scLang('PETI L'+S.materialStorage.level,'CHEST L'+S.materialStorage.level)+' '+scChestUsed()+'/'+scChestCap(),460,54,'#fc4',9,'center');
 const h=hudEnsure(),p=scHotbarPage?1:0;T(scLang('HOTBAR','HOTBAR'),12,76,'#b9d7e7',9);for(let k=0;k<8;k++){const index=p*8+k,x=56+k*35,y=60,t=HB_TOOLS[index],slot=S.hb.slots[index],fixed=index<6;card(x,y,32,27,fixed?'#374a53':'#4c6170',fixed||!!slot);if(t&&typeof hudIcon==='function')hudIcon(t.i,x+5,y+1,1.3,1);else if(slot)scItemIcon(slot,x+7,y+2,16);else T('+',x+16,y+18,'#8198a5',12,'center');if(fixed)T('K',x+26,y+25,'#fc4',9,'center');else if(slot)T(String(+S.gather.items[slot]||0),x+29,y+25,'#fff',9,'right');}
 btn(342,60,92,27,scLang('HAL '+(p+1)+'/2','PAGE '+(p+1)+'/2'),1);T(scLang('Pilih bahan tas → slot; kosongkan tanpa pilihan','Select bag item → slot; clear with no selection'),480,77,'#9ab',9,'center');
 T(scLang('BAHAN','MATERIAL'),34,96,'#b9d7e7',9);T(scLang('TAS','BAG'),274,96,'#b9d7e7',9,'right');T(scLang('PETI','CHEST'),607,96,'#b9d7e7',9,'right');
 const names=S.set?.lang==='en';scOrder.forEach((id,i)=>{const m=SC_MATERIALS.find(q=>q.id===id);if(!m)return;const y=100+i*14,selBag=scSelectedId===id&&scSelectedSide==='bag',selChest=scSelectedId===id&&scSelectedSide==='chest';card(8,y,304,13,selBag?'#fc4':'#4c6170',selBag);card(328,y,304,13,selChest?'#fc4':'#4c6170',selChest);scItemIcon(id,10,y+.5,12);scItemIcon(id,330,y+.5,12);T(names?m.en:m.name,25,y+10,'#fff',9);T(String(+S.gather.items[id]||0),294,y+10,'#cde',9,'right');T(String(+S.materialStorage.items[id]||0),613,y+10,'#fc4',9,'right');});
 const am=scAmountMode==='all'?scLang('SEMUA','ALL'):scAmountMode==='half'?scLang('½ TUMPUK','HALF'):scLang('1','1');btn(8,274,42,27,scLang('1','1'),scAmountMode==='one');btn(54,274,70,27,scLang('SETENGAH','HALF'),scAmountMode==='half');btn(128,274,64,27,scLang('SEMUA','ALL'),scAmountMode==='all');T(scLang('Pilih','Selected')+': '+(SC_MATERIALS.find(m=>m.id===scSelectedId)?.[names?'en':'name']||'-')+' · '+am,267,291,'#cde',9,'center');btn(338,274,132,27,scLang('SIMPAN → PETI','STORE → CHEST'),1);btn(476,274,148,27,scLang('← AMBIL TAS','TAKE → BAG'),1);
 btn(8,307,148,28,scLang('SIMPAN CEPAT','QUICK STORE'),1);btn(162,307,148,28,scLang('AMBIL CEPAT','QUICK TAKE'),1);btn(316,307,152,28,scLang('HADIAH TERTUNDA ','PENDING REWARDS ')+(S.overflowItems||[]).length,(S.overflowItems||[]).length>0);const level=S.materialStorage.level,req=level===1?{village:2,gold:160,wood:8,stone:4}:level===2?{village:4,gold:360,wood:16,stone:12}:null;btn(474,307,150,28,scLang(level>=3?'PETI MAKS':'UPGRADE PETI',level>=3?'CHEST MAX':'UPGRADE CHEST'),!!req);
 T(req?scLang('Upgrade: Desa '+req.village+' · '+req.gold+' emas · '+req.wood+' kayu · '+req.stone+' batu','Upgrade: Village '+req.village+' · '+req.gold+' gold · '+req.wood+' wood · '+req.stone+' stone'):scLang('Isi peti tetap aman saat kapasitas ditingkatkan.','Chest contents remain safe when capacity is upgraded.'),320,350,'#9cf',9,'center');
}
function lifeStorageClick(x,y){
 storagecraftEnsure();if(y<34&&x<85){scClose();return}if(y<34&&x>=480){lifeOpenWorkshop();return}
 if(y>=34&&y<57){if(x<105)scApplySort('category');else if(x<192)scApplySort('name');else if(x<282)scApplySort('qty');return;}
 if(y>=60&&y<88){if(x>=342&&x<434){scHotbarPage=scHotbarPage?0:1;return;}const k=Math.floor((x-56)/35),index=scHotbarPage*8+k;if(k<0||k>7)return;scAssignSlot(index);return;}
 if(y>=100&&y<268){const i=Math.floor((y-100)/14),m=SC_MATERIALS.find(q=>q.id===scOrder[i]);if(!m)return;scSelectedId=m.id;scSelectedSide=x<320?'bag':'chest';sfx('click');return;}
 if(y>=274&&y<303){if(x<52)scAmountMode='one';else if(x<126)scAmountMode='half';else if(x<198)scAmountMode='all';else if(x>=338&&x<470){if(!scIsMaterial(scSelectedId)){say(scLang('Pilih material lebih dulu.','Select a material first.'));return;}if(scSelectedSide!=='bag'){say(scLang('Pilih bahan di panel tas lebih dulu.','Select a material in the bag panel first.'));return;}scMove('store',scSelectedId,scSelectedAmount());}else if(x>=476&&x<624){if(!scIsMaterial(scSelectedId)){say(scLang('Pilih material lebih dulu.','Select a material first.'));return;}if(scSelectedSide!=='chest'){say(scLang('Pilih bahan di panel peti lebih dulu.','Select a material in the chest panel first.'));return;}scMove('take',scSelectedId,scSelectedAmount());}return;}
 if(y>=307&&y<337){if(x<158){scQuickMove('store');return;}if(x<312){scQuickMove('take');return;}if(x<470){if((S.overflowItems||[]).length)openOverflow('storage');else say(scLang('Tidak ada hadiah tertunda.','No pending rewards.'));return;}if(x>=474){scUpgradeChest();return;}}
}
function lifeDrawWorkshop(){
 storagecraftEnsure();scSyncQueue();ov(.95);btn(6,5,76,28,'KEMBALI');T(scLang('BENGKEL & PENGOLAHAN','WORKSHOP & PROCESSING'),270,24,'#fc4',15,'center');btn(488,5,140,27,'GUDANG',1);
 T(scLang('ANTREAN (maks. 3)','QUEUE (max 3)'),20,45,'#b9d7e7',9);
 for(let i=0;i<3;i++){const job=S.workshop.queue[i],y=49+i*25;card(16,y,608,23,job&&job.done?'#477d5b':'#394957',1);if(!job){T(scLang('Slot kosong','Empty slot'),28,y+15,'#788b96',9);continue}const r=SC_RECIPES.find(q=>q.id===job.recipeId),m=SC_MATERIALS.find(q=>q.id===job.output),done=job.done||Date.now()>=job.readyAt;T((r?(S.set?.lang==='en'?r.en:r.name):'Craft')+' → '+(m?(S.set?.lang==='en'?m.en:m.name):job.output),27,y+15,'#fff',9);T(done?scLang('SELESAI','READY'):Math.max(1,Math.ceil((job.readyAt-Date.now())/1000))+'s',438,y+15,done?'#a8f0aa':'#fc4',9,'center');btn(500,y+1,112,21,scLang('AMBIL HASIL','CLAIM'),!!done);}
 T(scLang('RESEP','RECIPES'),20,132,'#b9d7e7',9);
 SC_RECIPES.forEach((r,i)=>{const y=136+i*43,ok=scCanCraft(r);card(16,y,608,39,ok?'#496b5a':'#3c4652',1);T(S.set?.lang==='en'?r.en:r.name,28,y+14,'#fff',10);T(r.desc+' · '+r.time+'s',28,y+29,'#b9d7e7',8);T(Object.keys(r.needs).map(k=>k+': '+r.needs[k]+' (stok '+scMaterialCount(k)+')').join(' · '),260,y+23,'#cde',8,'center');btn(506,y+4,106,30,scLang('BUAT','CRAFT'),ok)});
 T(scLang('Hasil tetap berada di antrean jika belum diklaim. Ruang tas dicadangkan saat proses dimulai.','Unclaimed results remain queued. Bag space is reserved when processing starts.'),320,325,'#9cf',8,'center');T(scLang('Tas bahan','Material bag')+' '+scBagUsed()+'/'+scBagCap()+' · '+scLang('Slot proses','Jobs')+' '+S.workshop.queue.length+'/3',320,346,'#fc4',9,'center');
}
function lifeWorkshopClick(x,y){storagecraftEnsure();scSyncQueue();if(y<34&&x<85){scClose();return}if(y<34&&x>=480){lifeOpenStorage();return}if(y>=49&&y<124&&x>=490){const i=Math.floor((y-49)/25),job=S.workshop.queue[i];if(job)scClaimCraft(job.jobId);return}if(y>=136&&y<308&&x>=500){const i=Math.floor((y-136)/43);if(SC_RECIPES[i])scStartCraft(SC_RECIPES[i].id);}}
const _scPreviousLifeInputState=lifeInputState;
lifeInputState=function(x,y){if(st==='storage'){lifeStorageClick(x,y);return true}if(st==='workshop'){lifeWorkshopClick(x,y);return true}return _scPreviousLifeInputState(x,y);};
const _scOldDraw=draw;
draw=function(){_scOldDraw();if(st!=='storage'&&st!=='workshop')return;g.save();g.translate(OX,0);if(st==='storage')lifeDrawStorage();else lifeDrawWorkshop();g.restore();};
const _scWorldUpdate=lifeWorldUpdate;
lifeWorldUpdate=function(dt){_scWorldUpdate(dt);if(st==='workshop')scSyncQueue();};
// The material-gathering source remains in the world; workbench buildings open the new processing UI.
const _scWorldInteract=wInteract;
wInteract=function(){if(st==='world'&&!wDlg&&!wTalk&&wPlace&&wPlace.type==='workshop'){const lv=+(wPlace.unlockLevel||1);if((S.village?.level||1)<lv){say(scLang('Bangunan terkunci. Perlu level desa '+lv+'.','Building locked. Requires Village Level '+lv+'.'));return;}lifeOpenWorkshop();return;}_scWorldInteract();};
storagecraftEnsure();
