/* HUD DUNIA 
 Dimuat TERAKHIR sebelum input.js. Minimap kiri-atas (tanpa judul), hotbar 8 slot tengah-bawah (geser horizontal = halaman),
 satu tombol aksi kontekstual (ikon tangan) kanan-bawah, dan pembungkus updWorld/drawWorld/worldDown/wInteract/worldEnter
 agar interior (interior.js) berjalan di st='world'. Jam digital digambar life.js (hudClock). Posisi/ukuran: joystick JC=[66,258],
 hotbar x 174-467 y 316-350, tombol aksi pusat (592,298) r 30, minimap 6-102 x 6-78.
 Tool terpilih disimpan di S.hb.sel (diselamatkan sv()); angka stage pembuka alat = sementara (TBD, perlu balancing). */
const HUD_IM=new Image();HUD_IM.src='assets/world/hud.png';
const HB_TOOLS=[
 {id:'hand',i:0,n:['Tangan','Hand']},{id:'hoe',i:1,n:['Cangkul','Hoe']},{id:'can',i:2,n:['Ember','Bucket']},
 {id:'axe',i:3,n:['Kapak','Axe']},{id:'pick',i:4,n:['Beliung','Pickaxe']},{id:'rod',i:5,n:['Pancing','Fishing rod']}];
const HB_X=174,HB_Y=316,HB_W=34,HB_G=3,HB_AX=592,HB_AY=298,HB_AR=30;
let hudNameT=0,hudSw=null,hudMM=null;
function hudUiScale(){return [.9,1,1.1][Math.max(0,Math.min(2,Math.round(Number(S.set.ui)||0))) ]||1}
function hudTouchUnit(){const r=cv&&cv.getBoundingClientRect?cv.getBoundingClientRect():null,s=r&&r.width?r.width/VW:1;return Math.max(44,44/Math.max(.1,s))}
function hudLayout(){const z=hudUiScale(),slot=HB_W*z,hit=hudTouchUnit(),step=Math.max((HB_W+HB_G)*z,hit),left=(640-(7*step+slot))/2,y=333-slot/2;return{z,slot,hit,step,left,y,centerY:333}}
function hudEnsure(){
 if(!S.hb||typeof S.hb!=='object'||Array.isArray(S.hb))S.hb={sel:0,pg:0,water:0,slots:{}};
 if(!S.hb.slots||typeof S.hb.slots!=='object'||Array.isArray(S.hb.slots))S.hb.slots={};
 S.hb.sel=Math.max(0,Math.min(15,S.hb.sel|0));S.hb.pg=S.hb.pg?1:0;S.hb.water=Math.max(0,Math.min(6,Math.floor(+S.hb.water||0)));
 const t=HB_TOOLS[S.hb.sel];if(S.hb.sel<HB_TOOLS.length&&!hbUnlocked(t)){S.hb.sel=0}
 return S.hb;
}
const hbUnlocked=t=>!!t&&best>=(HB_STARTER_TOOL_CONFIG?.unlockAt?.[t.id]??999);
function hudTool(){const h=hudEnsure();return HB_TOOLS[h.sel]||null}
function hudToolId(){const h=hudEnsure(),t=HB_TOOLS[h.sel];return t?t.id:(SC_MATERIALS&&SC_MATERIALS.some(m=>m.id===h.slots[h.sel])?h.slots[h.sel]:'hand')}
function hudAssignQuickSlot(index,id){const h=hudEnsure();index=Math.floor(+index);if(index<6||index>15||!SC_MATERIALS||!SC_MATERIALS.some(m=>m.id===id)){wSay(wL('Enam alat dasar tetap di tempatnya.','The six basic tools stay where they are.'),2);return false;}storagecraftEnsure();if((+S.gather.items[id]||0)<1){wSay(wL('Bahan itu tidak ada di tas.','That material is not in your bag.'),2);return false;}h.slots[index]=id;sv();hudNameT=0;wSay(wL('Slot '+(index+1)+' diatur: '+(SC_MATERIALS.find(m=>m.id===id)?.name||id)+'.','Slot '+(index+1)+' set: '+(SC_MATERIALS.find(m=>m.id===id)?.en||id)+'.'),2);sfx('click');return true}
function hudClearQuickSlot(index){const h=hudEnsure();index=Math.floor(+index);if(index<6||index>15){wSay(wL('Enam alat dasar tetap di tempatnya.','The six basic tools stay where they are.'),2);return false;}if(!h.slots[index])return true;delete h.slots[index];sv();sfx('click');return true}
function hudSelect(i){
 const h=hudEnsure(),t=HB_TOOLS[i];
 if(!t){h.sel=i;hudNameT=0;sv();return}
 if(!hbUnlocked(t)){const unlock=HB_STARTER_TOOL_CONFIG.unlockAt[t.id];wSay(wL(t.n[0]+' terbuka di stage '+unlock+' (rekormu: '+best+')',t.n[1]+' unlocks at stage '+unlock+' (your best: '+best+')'),2.5);sfx('click');return}
 h.sel=i;hudNameT=1.6;sv();sfx('click');
}
function hudClock(){const h=typeof wHr==='number'?wHr:9,hh_=Math.floor(h)%24,mm=Math.floor((h%1)*60/5)*5;return String(hh_).padStart(2,'0')+':'+String(mm).padStart(2,'0')}
function hudWaterNear(){
 if(!S.world||typeof WMAP==='undefined'||!WMAP.length)return false;const tx=Math.floor(S.world.x/WS),ty=Math.floor(S.world.y/WS);
 for(let y=ty-1;y<=ty+1;y++)for(let x=tx-1;x<=tx+1;x++)if(WMAP[y]&&WMAP[y][x]=='~')return true;return false;
}
const HB_KIND={tree:'axe',stump:'axe',rock:'pick',stone:'pick',ore:'pick'};
/* konteks aksi di luar ruangan; prioritas: pintu > sumber daya/pancing sesuai alat > NPC > fasilitas > objek lain */
const HUD_BLD={kitchen:1,workshop:1,village_hall:1,woodcutter_hut:1};
function hudServiceAct(service){
 if(!service)return false;
 if(service.type==='quest_board'){
  if(wLock('Q')){wSay(wL('Papan misi sedang terkunci. Coba lagi nanti.','The quest board is locked for now. Try again later.'),2.5);return false;}
  wGo('quests');return true;
 }
 if(service.type==='market_cashier'){marketFrom='world';wGo('market');return true;}
 if(service.type==='animal_trough'){wGo('ranch');return true;}
 return false;
}
function hudCtx(){
 if(st!=='world'||wDlg||wTalk||wFade)return null;
 if(self.lifeFish&&lifeFish.active){const f=lifeFish;if(f.phase==='bite')return{l:wL('TARIK!','REEL!'),on:1,f:()=>lifeFishTap()};return{l:wL('TUNGGU','WAIT'),on:0,f:()=>{}};}
 if(wI)return intCtx();
 const door=intDoorNear();if(door)return{l:wL('MASUK','ENTER'),on:1,f:()=>intTryEnter(door)};
 const tool=hudToolId(),drop=self.lifeNearWorldDrop?lifeNearWorldDrop():null;if(drop)return{l:wL('AMBIL','PICK UP'),on:1,f:()=>lifeTakeWorldDrop(drop.id)};
 const spot=self.lifeFishingSpot?lifeFishingSpot():null;
 if(tool==='rod'&&spot)return{l:wL('LEMPAR','CAST'),on:1,f:()=>lifeStartFishing(spot)};
 const r=self.lifeNearResource?lifeNearResource():null;
 if(r){const need=HB_KIND[r.kind]||'hand',lab=need=='axe'?wL('TEBANG','CHOP'):need=='pick'?wL('GALI','MINE'):wL('PETIK','PICK');
  return{l:lab,on:tool==need,f:()=>{if(tool==need)lifeDoGather(r);else{const t=HB_TOOLS.find(q=>q.id==need);wSay(wL('Pilih '+t.n[0]+' di hotbar dulu.','Select the '+t.n[1]+' on the hotbar first.'),3);sfx('click')}}}}
 if(spot){return{l:wL('LEMPAR','CAST'),on:tool=='rod',f:()=>{if(tool=='rod')lifeStartFishing(spot);else wSay(wL('Pilih Pancing di hotbar dulu (terbuka di stage 6).','Pick the fishing rod on the hotbar first (unlocks at stage 6).'),3)}}}
 if(tool=='can'&&hudWaterNear()&&Math.max(0,+S.hb.water||0)<6)return{l:wL('ISI AIR','FILL'),on:1,f:()=>{S.hb.water=6;sv();wSay(wL('Ember terisi penuh, cukup untuk enam kali siram.','Bucket filled, enough for six waterings.'),2);sfx('click')}};
 if(wNpc)return{l:wL('BICARA','TALK'),on:1,f:()=>_hudInteract()};
 const pen=self.Tmap&&Tmap.nearPen&&S.world?Tmap.nearPen(S.world.x/WS,S.world.y/WS):null;
 if(pen&&self.ranchPenInfo){const info=ranchPenInfo(pen.animal);
  if(info.pending>0)return{l:wL(info.label[0],info.label[1]),on:1,f:()=>ranchCollectType(pen.animal)};
  return{l:wL('KANDANG','PEN'),on:1,f:()=>wGo('ranch')}}
 const service=self.Tmap&&Tmap.nearService&&S.world?Tmap.nearService(S.world.x/WS,S.world.y/WS):null;
 if(service){const labels={quest_board:['MISI','QUEST'],market_cashier:['PASAR','MARKET'],animal_trough:['PAKAN','FEED']},q=labels[service.type]||['GUNAKAN','USE'];return{l:wL(q[0],q[1]),on:1,f:()=>hudServiceAct(service)}}
 if(wPlace){const t=wPlace.type;if(t==='market')return{l:wL('CARI KASIR','FIND CASHIER'),on:0,f:()=>wSay(wL('Transaksi lewat kasir di kios.','Trade at the kiosk cashier.'),2.5)};if(t==='animal_pen')return{l:wL('CARI PALUNG','FIND TROUGH'),on:0,f:()=>wSay(wL('Pakan ada di palung samping kandang.','Feed is at the trough beside the pen.'),2.5)};if(t==='orchard'||t==='mushroom_grove')return{l:wL('LIHAT','LOOK'),on:1,f:()=>_hudInteract()}}
 if(wNear){if(wNear.c=='G')return{l:wL('GERBANG','GATE'),on:1,f:()=>_hudInteract()};if(wNear.c=='Q')return{l:wL('PAPAN MISI','QUEST BOARD'),on:0,f:()=>wSay(wL('Papan misinya ada di dekat jalur.','The quest board is near the path.'),2.5)};}
 return null;
}
const hudIcon=(i,x,y,z,a)=>{if(HUD_IM.complete&&HUD_IM.naturalWidth>0){g.globalAlpha=a==null?1:a;g.drawImage(HUD_IM,i*16,0,16,16,Math.round(x),Math.round(y),16*z,16*z);g.globalAlpha=1}};
function hudMini(){
 const V=self.Tmap&&Tmap.data&&Tmap.data();if(!V||!V.grid||!S.world)return;
 if(!hudMM){hudMM=document.createElement('canvas');hudMM.width=V.w;hudMM.height=V.h;const x=hudMM.getContext('2d');
 const col={'~':'#3f86c4',',':'#d3b27a','T':'#2e6a3a','.':'#6fb552','p':'#8a5a38','F':'#b08a52','f':'#b08a52','X':'#7e9a62','d':'#d3b27a','S':'#e0a050','R':'#e0a050','G':'#c0c8d8','Q':'#e0a050'};
 for(let yy=0;yy<V.h;yy++){const row=V.grid[yy];for(let xx=0;xx<V.w;xx++){x.fillStyle=col[row[xx]]||'#6fb552';x.fillRect(xx,yy,1,1)}}
 INT_B.forEach(b=>{x.fillStyle='#c9784a';x.fillRect((b.x>>4)-2,(b.y>>4)-3,4,3);x.fillStyle='#f0c48a';x.fillRect((b.x>>4)-2,(b.y>>4)-3,4,1)});
 (V.places||[]).forEach(p=>{x.fillStyle='#ffd24a';x.fillRect(p.x,p.y,1,1)});
 }
 const z=hudUiScale(),mw=100*z,mh=76*z,tx=S.world.x/WS,ty=S.world.y/WS,sx=Math.max(0,Math.min(V.w-64,tx-32)),sy=Math.max(0,Math.min(V.h-48,ty-24));
 g.fillStyle='rgba(10,8,18,.9)';g.fillRect(4,4,mw,mh);g.strokeStyle='#e6c45a';g.lineWidth=1;g.strokeRect(4.5,4.5,mw-1,mh-1);
 g.imageSmoothingEnabled=false;g.drawImage(hudMM,sx,sy,64,48,6,6,mw-4,mh-4);
 const px=6+(tx-sx)*(mw-4)/64,py=6+(ty-sy)*(mh-4)/48;g.fillStyle='#000';g.fillRect(px-3*z,py-3*z,6*z,6*z);g.fillStyle=Math.sin(performance.now()/220)>0?'#ffe44a':'#fff';g.fillRect(px-2*z,py-2*z,4*z,4*z);
}
function hudBar(){
 const h=hudEnsure(),L=hudLayout();
 for(let k=0;k<8;k++){
  const i=h.pg*8+k,t=HB_TOOLS[i],id=!t?h.slots[i]:null,x=L.left+k*L.step,y=L.y,slot=L.slot,on=h.sel==i,lock=!!t&&!hbUnlocked(t);
  g.fillStyle='rgba(20,16,30,.8)';g.fillRect(x,y,slot,slot);g.strokeStyle=on?'#fc4':'#6b5a8a';g.lineWidth=on?3:1.5;g.strokeRect(x+.5,y+.5,slot-1,slot-1);
  if(t){hudIcon(t.i,x+(slot-32*L.z)/2,y+(slot-32*L.z)/2,2*L.z,lock?.3:1);if(t.id=='can'&&h.water&&!lock){g.fillStyle='#4ab0ff';g.fillRect(x+slot-12*L.z,y+slot-9*L.z,9*L.z,6*L.z);g.strokeStyle='#000';g.lineWidth=1;g.strokeRect(x+slot-11.5*L.z,y+slot-8.5*L.z,8*L.z,5*L.z);T(String(h.water),x+slot-7*L.z,y+slot-3*L.z,'#fff',9,'center')}if(lock){g.fillStyle='#aab';g.fillRect(x+slot-9*L.z,y+3*L.z,5*L.z,2*L.z)}}
  else if(id&&typeof scItemIcon==='function'){scItemIcon(id,x+(slot-28*L.z)/2,y+(slot-28*L.z)/2,28*L.z);const count=Math.max(0,+S.gather?.items?.[id]||0);T(String(count),x+slot-2*L.z,y+slot-2*L.z,'#fff',9,'right');}
  else if(i>=6){g.strokeStyle='#788';g.strokeRect(x+slot*.31,y+slot*.31,slot*.38,slot*.38)}
  if(on){g.fillStyle='#fc4';g.beginPath();g.moveTo(x+slot/2-4*L.z,y+slot+5*L.z);g.lineTo(x+slot/2+4*L.z,y+slot+5*L.z);g.lineTo(x+slot/2,y+slot+L.z);g.fill()}
 }
 g.fillStyle=h.pg?'#555':'#fc4';g.fillRect(314,L.y-5,4,3);g.fillStyle=h.pg?'#fc4':'#555';g.fillRect(322,L.y-5,4,3);
 if(hudNameT>0){const t=HB_TOOLS[h.sel],m=!t&&SC_MATERIALS.find(q=>q.id===h.slots[h.sel]);if(t||m){g.globalAlpha=Math.min(1,hudNameT);T(t?wL(t.n[0],t.n[1]):(S.set?.lang==='en'?m.en:m.name),320,L.y-10,'#fe8',10,'center');g.globalAlpha=1}}
}
function hudAct(){
 const c=hudCtx(),on=c&&c.on,z=hudUiScale(),r=HB_AR*z;
 g.fillStyle='rgba(30,24,50,.88)';g.beginPath();g.arc(HB_AX,HB_AY,r,0,7);g.fill();g.lineWidth=on?3:2;g.strokeStyle=on?'#fc4':'#777';g.stroke();
 hudIcon(0,HB_AX-16*z,HB_AY-27*z,2*z,on?1:.5);
 T(c?c.l:wL('TANGAN','HAND'),HB_AX,HB_AY+22*z,on?'#fe8':'#99a',9,'center');
}
function hudDraw(){
 if(st!=='world')return;
 if(wFade){const a=wFade.t<.2?wFade.t/.2:Math.max(0,(.4-wFade.t)/.2);g.fillStyle='rgba(0,0,0,'+a.toFixed(3)+')';g.fillRect(-OX,0,VW,360)}
 if(lifeWorldQuick||wDlg||wTalk)return;
 hudEnsure();if(hudNameT>0)hudNameT-=1/60;
 if(!wI&&!wVon)hudMini();hudBar();hudAct();
}
function hudDown(id,x,y){
 const L=hudLayout(),r=Math.max(HB_AR*L.z,L.hit/2);
 if((x-HB_AX)*(x-HB_AX)+(y-HB_AY)*(y-HB_AY)<=r*r){const c=hudCtx();if(c&&c.on)c.f();else if(c)c.f();else sfx('click');return true}
 const first=L.left+L.slot/2,last=first+7*L.step;
 if(y>=L.centerY-L.hit/2&&y<=L.centerY+L.hit/2&&x>=first-L.hit/2&&x<=last+L.hit/2){const slot=Math.max(0,Math.min(7,Math.round((x-first)/L.step)));hudSw={id:id,x0:x,slot,moved:0};return true}
 const z=hudUiScale();if(!wI&&x>=4&&x<=4+100*z&&y>=4&&y<=4+76*z){if(self.hbOpenWorldMap)hbOpenWorldMap();return true}
 if(!wI&&self.jrFocusRect){const f=jrFocusRect();if(x>=f.x&&x<=f.x+f.w&&y>=f.y-2&&y<=f.y+f.h+2){jrToggleFocus();sfx('click');return true}}
 return false;
}
const hudPtr=e=>{const r=cv.getBoundingClientRect();return(e.clientX-r.left)*VW/r.width-OX};
addEventListener('pointermove',e=>{if(!hudSw||e.pointerId!==hudSw.id)return;if(!hudSw.moved&&Math.abs(hudPtr(e)-hudSw.x0)>28){hudSw.moved=1;const h=hudEnsure();h.pg=h.pg?0:1;sv();sfx('click')}});
const hudUp=e=>{if(!hudSw||e.pointerId!==hudSw.id)return;const s=hudSw;hudSw=null;if(!s.moved)hudSelect(hudEnsure().pg*8+s.slot)};
addEventListener('pointerup',hudUp);addEventListener('pointercancel',()=>{hudSw=null});
/* pembungkus (dimuat terakhir; urutan rantai: world.js -> life.js -> storagecraft/journal/adventure -> hud.js) */
const _hudInteract=wInteract,_hudUpd=updWorld,_hudDraw=drawWorld,_hudDown=worldDown,_hudEnter=worldEnter;
wInteract=function(){
 if(st!=='world'||wDlg||wTalk||wFade){_hudInteract();return}
 if(self.lifeWorldQuick)return;
 const c=hudCtx();if(c){c.f();return}
 if(!wI&&wPlace&&(wPlace.type==='market'||wPlace.type==='animal_pen')){wSay(wPlace.type==='market'?wL('Transaksi lewat kasir di kios.','Trade at the kiosk cashier.'):wL('Pakan ada di palung samping kandang.','Feed is at the trough beside the pen.'),2.5);return}
 if(!wI&&wPlace&&HUD_BLD[wPlace.type]){wSay(wL('Pintunya ada di sisi depan bangunan.','The door is on the front of the building.'),2.5);return}
 if(wI)return;_hudInteract();
};
updWorld=function(dt){if(wFade)intFadeStep(dt);if(wI&&!lifeWorldQuick){intUpdate(dt);return}_hudUpd(dt)};
drawWorld=function(){if(wI){intDraw();if(self.lifeWorldAfterRender)lifeWorldAfterRender()}else _hudDraw();hudDraw()};
worldDown=function(id,x,y){
 if(st==='world'&&wFade)return;
 if(st==='world'&&!lifeWorldQuick&&!wDlg&&!wTalk&&hudDown(id,x,y))return;
 _hudDown(id,x,y);
};
worldEnter=function(){wI=null;wFade=null;hudSw=null;_hudEnter()};

/* Tutorial persistence + highlight overlay */
function hbTutLayout(id){
 if(id==='shop')return{x:12,y:136,w:350,h:124};
 if(id==='gacha')return{x:324,y:82,w:300,h:124};
 if(id==='cook')return{x:12,y:168,w:330,h:124};
 return{x:130,y:20,w:380,h:124};
}
function hbTutTargetRect(topic){
 if(!topic)return null;
 if(topic.target==='menu_shop'&&typeof menuB==='function'){const b=menuB().find(q=>q[1]==='shop');return b?[b[2],b[3],b[4],b[5]]:null;}
 if(topic.target==='shop_pull')return[76,186,228,78];
 if(topic.target==='cook_recipe')return[488,64,122,31];
 if(topic.target==='farm_tool'||topic.target==='fishing_tool'){
  const wanted=topic.target==='farm_tool'?'hoe':'rod',idx=HB_TOOLS.findIndex(q=>q.id===wanted),h=hudEnsure(),L=hudLayout();
  if(idx>=0&&Math.floor(idx/8)===(h.pg||0))return[L.left+(idx%8)*L.step,L.y,L.slot,L.slot];
  return[HB_AX-31,HB_AY-31,62,62];
 }
 return[HB_AX-31,HB_AY-31,62,62];
}
function hbTutDraw(){
 if(typeof hbTutorialObserve!=='function'||typeof g==='undefined'||typeof T!=='function')return;
 const a=hbTutorialActive();if(!a||!a.topic||a.state.status!=='berjalan')return;
 const t=a.topic,q=a.state,p= q.phase,L=hbTutLayout(a.id),en=S.set&&S.set.lang==='en';
 if(p==='sorot'||p==='tunggu'){
  const r=hbTutTargetRect(t);if(r){g.save();g.fillStyle='rgba(255,210,74,.12)';g.fillRect(r[0],r[1],r[2],r[3]);g.strokeStyle='#ffe16a';g.lineWidth=3;g.strokeRect(r[0]+.5,r[1]+.5,r[2]-1,r[3]-1);g.restore();}
 }
 g.save();g.fillStyle='rgba(10,14,23,.96)';g.fillRect(L.x,L.y,L.w,L.h);g.strokeStyle='#f4d36f';g.lineWidth=2;g.strokeRect(L.x+1,L.y+1,L.w-2,L.h-2);
 g.fillStyle='#f4d36f';g.beginPath();g.arc(L.x+13,L.y+17,4,0,Math.PI*2);g.fill();
 T(tr('TUTORIAL')+' · '+tr(t.title),L.x+24,L.y+20,'#ffe39a',10,'left');
 let msg='Ikuti petunjuknya. Posisimu tidak dipindah.';
 if(p==='instruksi'||p==='sorot'||p==='tunggu')msg=t.instruction;
 else if(p==='konfirmasi')msg='Aksimu tercatat.';
 else if(p==='lanjut')msg='Pilih SIMPAN.';else if(p==='simpan')msg='Menyimpan panduan…';
 T(tr(msg),L.x+10,L.y+43,'#eef4ff',9,'left');
 const by=L.y+74,bx=L.x+L.w-164;
 if(p==='tunggu'){
  g.fillStyle='#31465a';g.fillRect(bx,by,88,44);g.strokeStyle='#9bb7ca';g.strokeRect(bx+.5,by+.5,87,43);T(tr('TUNGGU AKSI'),bx+44,by+25,'#fff',8,'center');
 }else if(p!=='simpan'){
  const label=p==='penanda'?'LIHAT':p==='instruksi'?'SOROT KONTROL':p==='sorot'?'MULAI':p==='lanjut'?'SIMPAN':'LANJUT';
  g.fillStyle='#286d52';g.fillRect(bx,by,88,44);g.strokeStyle='#9de0ac';g.strokeRect(bx+.5,by+.5,87,43);T(tr(label),bx+44,by+25,'#fff',9,'center');
 }
 if(p!=='simpan'){
  const sx=L.x+L.w-72;g.fillStyle='#4b3c48';g.fillRect(sx,by,64,44);g.strokeStyle='#b59cab';g.strokeRect(sx+.5,by+.5,63,43);T(tr('LEWATI'),sx+32,by+25,'#fff',8,'center');
 }
 g.restore();
}
function hbTutorialPointerDown(ev){
 const a=hbTutorialActive();if(!a||!cv||a.state.status!=='berjalan')return;
 const r=cv.getBoundingClientRect();if(!r.width||!r.height)return;
 const x=(ev.clientX-r.left)*VW/r.width-OX,y=(ev.clientY-r.top)*360/r.height,L=hbTutLayout(a.id),by=L.y+74,sx=L.x+L.w-72;
 const hit=(x>=sx&&x<=sx+64&&y>=by&&y<=by+44);
 if(hit){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();hbTutorialSkip();return;}
 const bx=L.x+L.w-164;
 if(a.state.phase!=='tunggu'&&a.state.phase!=='simpan'&&x>=bx&&x<=bx+88&&y>=by&&y<=by+44){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();hbTutorialAdvance();return;}
 if(a.id==='shop'&&a.state.phase==='tunggu'&&st==='menu'&&typeof menuB==='function'){
  const b=menuB().find(q=>q[1]==='shop');if(b&&x>=b[2]&&x<=b[2]+b[4]&&y>=b[3]&&y<=b[3]+b[5])hbTutorialAction('shop','menu_shop');
 }
}
addEventListener('pointerdown',hbTutorialPointerDown,true);

/* Count only successful, real player actions. Wrappers preserve the original return values. */
if(typeof pull==='function'&&!pull.hbTutWrapped){const hbPullBase=pull;pull=function(n){const before=+(S.st&&S.st.pulls)||0,r=hbPullBase(n);if((+(S.st&&S.st.pulls)||0)>before)hbTutorialAction('gacha','summon');return r;};pull.hbTutWrapped=true;}
if(typeof pullE==='function'&&!pullE.hbTutWrapped){const hbPullEBase=pullE;pullE=function(n){const before=+(S.st&&S.st.pulls)||0,r=hbPullEBase(n);if((+(S.st&&S.st.pulls)||0)>before)hbTutorialAction('gacha','gear_summon');return r;};pullE.hbTutWrapped=true;}
if(typeof farmWorldAction==='function'&&!farmWorldAction.hbTutWrapped){const hbFarmActBase=farmWorldAction;farmWorldAction=function(i,tool){const ok=hbFarmActBase(i,tool);if(ok)hbTutorialAction('farming',tool||'farm');return ok;};farmWorldAction.hbTutWrapped=true;}
if(typeof lifeStartFishing==='function'&&!lifeStartFishing.hbTutWrapped){const hbFishStartBase=lifeStartFishing;lifeStartFishing=function(spot){const ok=hbFishStartBase(spot);if(ok)hbTutorialAction('fishing','cast');return ok;};lifeStartFishing.hbTutWrapped=true;}
if(typeof lifeDoGather==='function'&&!lifeDoGather.hbTutWrapped){const hbGatherBase=lifeDoGather;lifeDoGather=function(r){const ok=hbGatherBase(r),a=hbTutorialActive();if(ok&&a&&a.id==='orchard'&&r&&r.kind==='fruit')hbTutorialAction('orchard','fruit');else if(ok&&a&&a.id==='gather')hbTutorialAction('gather','resource');return ok;};lifeDoGather.hbTutWrapped=true;}
if(typeof lifeCook==='function'&&!lifeCook.hbTutWrapped){const hbCookBase=lifeCook;lifeCook=function(recipe){const before=+(S.kitchen&&S.kitchen.cooked)||0,r=hbCookBase(recipe);if((+(S.kitchen&&S.kitchen.cooked)||0)>before)hbTutorialAction('cook','cook');return r;};lifeCook.hbTutWrapped=true;}

/* Optional runtime FPS/JS-heap HUD; activated only with ?perf=1. */
function hbPerfDraw(){if(typeof hbPerfStats!=='function')return;const p=hbPerfStats();if(!p.enabled)return;g.save();g.fillStyle='rgba(7,10,15,.84)';g.fillRect(4,83,154,39);g.strokeStyle='#8ea9b7';g.strokeRect(4.5,83.5,153,38);T('FPS '+(p.fps==null?'…':p.fps.toFixed(1))+' · avg '+(p.avgFPS==null?'…':p.avgFPS.toFixed(1)),10,99,'#d9f4a8',9);T('JS heap '+(p.heapMB==null?'n/a':p.heapMB.toFixed(1)+' MB')+(p.heapLimitMB==null?'':' / '+p.heapLimitMB.toFixed(0)),10,114,'#c5d9e6',9);g.restore();}
const hbTutorialDrawBase=draw;draw=function(){hbTutorialDrawBase();hbTutorialObserve();hbTutDraw();hbPerfDraw();};
