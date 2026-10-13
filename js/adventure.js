/* Hero Battle — map navigation + checkpointed 3-room dungeon.
 Classic-script module; extends existing world/combat flow rather than replacing the source systems. */
const HB_DUNGEON_ID='forest_ruins';
function hbEnsureAdventure(){
  if(!S.dungeons||typeof S.dungeons!=='object')S.dungeons={};
  const d=S.dungeons;
  if(!Array.isArray(d.claims))d.claims=[];
  if(!Array.isArray(d.rooms))d.rooms=[];
  d.version=1;d.clears=Math.max(0,+d.clears||0);d.bestRoom=Math.max(0,Math.min(3,+d.bestRoom||0));
  d.checkpoint=Math.max(1,Math.min(3,+d.checkpoint||1));d.active=!!d.active;
  d.runs=Math.max(0,+d.runs||0);d.losses=Math.max(0,+d.losses||0);
  if(!d.lastResult||typeof d.lastResult!=='object')d.lastResult=null;
  if(!S.journal||typeof S.journal!=='object')S.journal={version:1,focus:{type:'stage'},relationships:{},seenBiomes:{},storySeen:[]};
  return d;
}
function hbDungeonCanEnter(){const d=hbEnsureAdventure(),vl=Math.max(1,+(S.village&&S.village.level)||1);return d.active||((+best||0)>=3&&!!S.tut&&vl>=1)}
function hbDungeonLockText(){const d=hbEnsureAdventure(),vl=Math.max(1,+(S.village&&S.village.level)||1),r=[];if((+best||0)<3)r.push(jrLang('Selesaikan Main Stage 3','Clear Main Stage 3'));if(!S.tut)r.push(jrLang('Selesaikan tutorial awal','Finish the opening tutorial'));if(vl<1)r.push(jrLang('Naikkan Village Level ke 1','Reach Village Level 1'));return r.join(' · ')}
function hbStartDungeon(forceResume){
  const d=hbEnsureAdventure();
  if(!hbDungeonCanEnter()){if(typeof wSay==='function')wSay(jrLang('Dungeon terkunci: ','Dungeon locked: ')+hbDungeonLockText(),4);else say(jrLang('Dungeon terkunci: ','Dungeon locked: ')+hbDungeonLockText());wDlg=0;return false;}
  wFrom=1;wDlg=0;wTalk=null;wHint=0;wjid=null;wjx=wjy=0;
  const resume=d.active||!!forceResume;mode='dungeon';TM={};tutT=0;stage=resume?d.checkpoint:1;combo=0;lb=0;runG=0;stageG=0;R={};bf={t:0,m:1};
  P={atk:1,cd:1-.03*S.sh[2],crit:.1+.02*S.sh[1],burn:1,ls:0,as:1};
  hs=S.deck.filter(id=>S.own[id]).map(mkH);if(!hs.length)hs=[mkH('recruit')];layout();
  if(!resume){d.active=true;d.checkpoint=1;d.currentRun=(+d.currentRun||0)+1;d.runs++;d.currentStarted=Date.now();}
  d.active=true;d.checkpoint=stage;if(!resume){d.currentGold=0;d.currentEssence=0;d.lastResult=null;}
  sv();startStage();return true;
}
function hbRetryDungeon(){const d=hbEnsureAdventure();d.active=true;d.checkpoint=Math.max(1,Math.min(3,d.checkpoint||stage||1));hbStartDungeon(true)}
const hbBaseStartStage=startStage;
startStage=function(){hbBaseStartStage();if(mode==='dungeon'){const d=hbEnsureAdventure();d.active=true;d.checkpoint=Math.max(1,Math.min(3,stage));d.updatedAt=Date.now();sv();}};
const hbBaseClearStage=clearStage;
clearStage=function(){if(mode!=='dungeon')return hbBaseClearStage();hbDungeonClearRoom()};
function hbDungeonClearRoom(){
  const d=hbEnsureAdventure(),room=Math.max(1,Math.min(3,stage)),roomFirst=!d.rooms.includes(room),isFinal=room===3,firstPrimary=isFinal&&!d.claims.includes(HB_DUNGEON_ID);
  stat('dungeonRooms');
  hs.forEach(h=>{if(h.dead){h.dead=0;h.hp=h.mh*.3}else h.hp=Math.min(h.mh,h.hp+h.mh*BAL.heal);h.fade=0});
  ch=PK.slice().sort(()=>Math.random()-.5).slice(0,3);
  const rawGold=Math.max(0,stageG+room*8),roomGold=Math.max(0,Math.round(rawGold*(roomFirst?1:.35)));
  const eliteEss=roomFirst?pendE:Math.floor(pendE*.35);
  let primaryGold=0,primaryEss=0;
  if(firstPrimary){primaryGold=80;primaryEss=2;d.claims.push(HB_DUNGEON_ID);d.clears++;d.bestRoom=3;}
  else if(isFinal){primaryGold=20;d.clears=Math.max(1,d.clears);}
  const gn=roomGold+primaryGold;S.g+=gn;runG+=gn;d.currentGold=(+d.currentGold||0)+gn;stageG=0;
  essGot=eliteEss+primaryEss;S.es+=essGot;d.currentEssence=(+d.currentEssence||0)+essGot;pendE=0;
  if(roomFirst){d.rooms.push(room);d.bestRoom=Math.max(d.bestRoom,room);}
  if(roomFirst&&Math.random()<.38)dropItem(isFinal?2:0);else if(!roomFirst&&Math.random()<.08)dropItem(0);
  soldAuto={n:0,g:0};pendI.forEach(addItem);itemRes=pendI.slice();pendI=[];
  if(S.ad&&itemRes.length&&autoEquip())say(jrLang('Auto pasang: gear baru dipakai','Auto-equipped new gear'));
  if(soldAuto.n)say(jrLang('Gudang penuh: hadiah masuk penyimpanan aman.','Storage full: rewards moved to safe pending storage.'));
  phase=0;pendE=0;
  if(isFinal){
    d.active=false;d.checkpoint=1;d.lastResult={id:HB_DUNGEON_ID,firstClear:firstPrimary,rooms:3,gold:d.currentGold||gn,essence:d.currentEssence||essGot,at:Date.now()};
    S.run=null;
    if(typeof jrDiscoverBiome==='function')jrDiscoverBiome('forest');
    if(typeof hapticPulse==='function')hapticPulse(22);
    sv();st='walk';wk=0;wend=0;sfx('clear');sfx('portal');return;
  }
  d.active=true;d.checkpoint=room+1;d.lastRoomGold=roomGold;d.lastRoomEssence=essGot;
  if(typeof hapticPulse==='function')hapticPulse(16);sv();st='walk';wk=0;wend=0;sfx('clear');sfx('portal');
}
const hbBaseUpd=upd;
upd=function(dt){const was=st;hbBaseUpd(dt);if(mode==='dungeon'&&st==='over'&&was!=='over'){const d=hbEnsureAdventure();d.active=true;d.checkpoint=Math.max(1,Math.min(3,stage));d.losses++;d.lastResult={id:HB_DUNGEON_ID,defeated:true,room:stage,at:Date.now()};sv();}};
function hbFinishDungeon(){const d=hbEnsureAdventure();d.active=false;d.checkpoint=1;if(!d.lastResult)d.lastResult={id:HB_DUNGEON_ID,firstClear:d.claims.includes(HB_DUNGEON_ID),rooms:d.bestRoom,gold:d.currentGold||0,essence:d.currentEssence||0,at:Date.now()};d.lastResult.finished=true;sv();st='dungeonres';sfx('clear');}
function hbDungeonResultClick(x,y){if(y<42&&x<100){worldResume();return;}if(y>=272&&y<=318){if(x>=48&&x<=300){hbStartDungeon(false);return;}if(x>=334&&x<=610){worldResume();return;}}if(y>=320&&x>=500){worldResume();}}

/* World map — major biome silhouettes appear from the start; tile detail and POIs require exploration. */
let hbMapCanvas=null,hbMapDiscRef=null,hbMapW=0,hbMapH=0,hbMapPick=null;
const HB_BIOME_COLORS={meadow:'#78ad58',forest:'#326b42',lake:'#438fb3',coast:'#c7b36e',mountain:'#858e7b'};
function hbMapData(){return self.Tmap&&Tmap.data&&Tmap.data()||null;}
function hbMapDimensions(){const v=hbMapData();return v&&v.grid?{w:v.w||128,h:v.h||96,grid:v.grid,regions:v.biomeRegions||[],places:v.places||[]}: {w:WW||40,h:WH||30,grid:WMAP.map(r=>r.join('')),regions:[],places:[]};}
function hbIsExplored(x,y,v){const disc=S.world&&S.world.disc||'';if(disc==='*')return true;if(!disc)return false;const ix=y*v.w+x;return disc.charAt(ix)==='1';}
function hbBiomeAt(x,y,regions){return regions.find(b=>x>=b.x&&y>=b.y&&x<b.x+b.w&&y<b.y+b.h)||null;}
function hbMakeMap(){
  const v=hbMapDimensions(),disc=S.world&&S.world.disc||'';
  if(hbMapCanvas&&disc===hbMapDiscRef&&v.w===hbMapW&&v.h===hbMapH)return hbMapCanvas;
  const c=document.createElement('canvas');c.width=v.w*3;c.height=v.h*3;const cx=c.getContext('2d');cx.imageSmoothingEnabled=false;
  for(let y=0;y<v.h;y++)for(let x=0;x<v.w;x++){
    const ch=(v.grid[y]||'').charAt(x)||'.',b=hbBiomeAt(x,y,v.regions),seen=hbIsExplored(x,y,v),base=b&&b.color||HB_BIOME_COLORS[b&&b.id]||'#6e9955';
    let col=base;
    if(seen){if(ch==='~')col='#3b8fbe';else if(ch===',')col='#b7a071';else if(ch==='X'||ch==='T')col='#3c4c36';else if(ch==='S'||ch==='R'||ch==='G'||ch==='Q'||ch==='F'||ch==='p'||ch==='f')col='#d8c78b';else if(ch==='+')col='#b9a9c8';}
    else col=base;
    cx.fillStyle=col;cx.fillRect(x*3,y*3,3,3);
    if(!seen){cx.fillStyle='rgba(20,29,28,.55)';cx.fillRect(x*3,y*3,3,3);}
  }
  hbMapCanvas=c;hbMapDiscRef=disc;hbMapW=v.w;hbMapH=v.h;return c;
}
function hbOpenWorldMap(){if(st!=='world')return;st='worldmap';hbMapPick=null;sfx('click');}
function hbCloseWorldMap(){st='world';sfx('click');}
function hbMapWalkable(x,y,v){
  if(x<0||y<0||x>=v.w||y>=v.h)return false;
  const ch=(v.grid[y]||'').charAt(x)||'.';
  if('~TXSRGQF'.includes(ch))return false;
  if(ch==='p')return !(typeof wLock==='function'&&wLock('F'));
  const live=self.Tmap&&Tmap.data&&Tmap.data();if(live&&live.grid===v.grid&&live.w===v.w&&live.h===v.h&&Tmap.collisionAt){const collision=Tmap.collisionAt(x,y);if(collision===true)return false;}
  return true;
}
function hbMapReachableField(sx,sy,v){
  if(sx<0||sy<0||sx>=v.w||sy>=v.h)return null;
  const n=v.w*v.h,dist=new Int32Array(n);dist.fill(-1);const q=new Int32Array(n);let h=0,t=0,si=sy*v.w+sx;
  dist[si]=0;q[t++]=si;
  while(h<t){const cur=q[h++],x=cur%v.w,y=Math.floor(cur/v.w);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!hbMapWalkable(nx,ny,v))continue;const ni=ny*v.w+nx;if(dist[ni]>=0)continue;dist[ni]=dist[cur]+1;q[t++]=ni;}}
  return dist;
}
let hbRouteCache=null;
function hbMapRouteField(tx,ty,v){
  const key=[v.w,v.h,tx,ty].join(':');if(hbRouteCache&&hbRouteCache.key===key)return hbRouteCache;
  if(!hbMapWalkable(tx,ty,v))return null;
  const n=v.w*v.h,dist=new Int32Array(n),next=new Int32Array(n);dist.fill(-1);next.fill(-1);const q=new Int32Array(n);let h=0,t=0,ti=ty*v.w+tx;dist[ti]=0;q[t++]=ti;
  while(h<t){const cur=q[h++],x=cur%v.w,y=Math.floor(cur/v.w);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(!hbMapWalkable(nx,ny,v))continue;const ni=ny*v.w+nx;if(dist[ni]>=0)continue;dist[ni]=dist[cur]+1;next[ni]=cur;q[t++]=ni;}}
  hbRouteCache={key,dist,next};return hbRouteCache;
}
function hbMapSafeTile(tx,ty,v){
  const sx=Math.floor(S.world.x/WS),sy=Math.floor(S.world.y/WS),reach=hbMapReachableField(sx,sy,v);if(!reach)return null;
  if(hbMapWalkable(tx,ty,v))return reach[ty*v.w+tx]>=0?{x:tx,y:ty}:null;
  const candidates=[];
  for(let r=0;r<=5;r++)for(let y=Math.max(0,ty-r);y<=Math.min(v.h-1,ty+r);y++)for(let x=Math.max(0,tx-r);x<=Math.min(v.w-1,tx+r);x++){
    if(Math.abs(x-tx)+Math.abs(y-ty)!==r||!hbIsExplored(x,y,v)||!hbMapWalkable(x,y,v))continue;
    const d=reach[y*v.w+x];if(d>=0)candidates.push({x,y,r,d});
  }
  candidates.sort((a,b)=>a.r-b.r||a.d-b.d||a.y-b.y||a.x-b.x);
  return candidates.length?{x:candidates[0].x,y:candidates[0].y}:null;
}
function hbMapSelect(tx,ty){const v=hbMapDimensions();tx=Math.max(0,Math.min(v.w-1,tx|0));ty=Math.max(0,Math.min(v.h-1,ty|0));if(!hbIsExplored(tx,ty,v)){say(jrLang('Jelajahi area itu dulu untuk memasang penanda.','Explore that area first to place a waypoint.'));return false;}
  const p=hbMapSafeTile(tx,ty,v);if(!p){say(jrLang('Tidak ada jalur aman yang diketahui di sekitar titik itu.','No known safe path near that point.'));return false;}
  if(typeof jrEnsure==='function')jrEnsure();S.journal.waypoint={x:p.x,y:p.y,label:(hbBiomeAt(p.x,p.y,v.regions)||{}).name||jrLang('Tujuan','Waypoint'),at:Date.now()};hbMapPick=p;sv();sfx('click');say(jrLang('Penanda tujuan dipasang. Ikuti kompas di dunia.','Waypoint set. Follow the compass in the world.'));return true;
}
function hbWorldMapClick(x,y){
  if(y<42&&x>=530){hbCloseWorldMap();return;}
  if(x>=416&&x<=620&&y>=300&&y<=328){if(S.journal)delete S.journal.waypoint;hbMapPick=null;sv();sfx('click');return;}
  if(x>=20&&x<=405&&y>=50&&y<=332){const v=hbMapDimensions(),mx=x-24,my=y-50,scale=Math.min(375/v.w,278/v.h),tx=Math.floor(mx/scale),ty=Math.floor(my/scale);if(mx>=0&&my>=0&&tx>=0&&ty>=0&&tx<v.w&&ty<v.h)hbMapSelect(tx,ty);return;}
  if(x>=426&&x<=624){const v=hbMapDimensions(),regions=v.regions||[],idx=Math.floor((y-79)/43);if(idx>=0&&idx<regions.length){const b=regions[idx],cx=Math.floor(b.x+b.w/2),cy=Math.floor(b.y+b.h/2);if(!hbIsExplored(cx,cy,v)){say(jrLang('Jelajahi wilayah ini di dunia untuk membuka penanda.','Explore this region in the world to unlock a waypoint.'));return;}hbMapSelect(cx,cy);return;}}
  if(y>=320&&x<150){if(S.journal)delete S.journal.waypoint;sv();sfx('click');return;}
}
function hbDrawWorldMap(){
  const v=hbMapDimensions(),en=S.set&&S.set.lang==='en';g.save();g.translate(OX,0);ov(.96);card(10,8,620,344,'#6fbd8a',1);
  T(en?'WORLD MAP':'PETA DUNIA',22,29,'#fc4',17);T(en?'Main regions are visible; details reveal as you explore.':'Wilayah utama terlihat; detail terbuka saat dijelajahi.',22,43,'#cde',8);btn(538,12,78,25,en?'CLOSE':'TUTUP',1);
  const x0=24,y0=50,w=375,h=278;g.fillStyle='#263a35';g.fillRect(x0-2,y0-2,w+4,h+4);const c=hbMakeMap();g.imageSmoothingEnabled=false;g.drawImage(c,x0,y0,w,h);
  const scale=Math.min(w/v.w,h/v.h);(v.regions||[]).forEach(b=>{const bx=x0+b.x*scale,by=y0+b.y*scale,bw=b.w*scale,bh=b.h*scale;g.strokeStyle=b.color||'#dce9bd';g.lineWidth=1;g.strokeRect(bx+.5,by+.5,bw-1,bh-1);});
  const places=(v.places||[]).filter(p=>hbIsExplored(p.x,p.y,v));places.slice(0,18).forEach(p=>{const px=x0+(p.x+.5)*scale,py=y0+(p.y+.5)*scale;g.fillStyle=p.type==='mushroom_grove'?'#f8a4f0':'#fff2a8';g.beginPath();g.arc(px,py,2.2,0,Math.PI*2);g.fill();});
  if(S.world){const px=x0+(S.world.x/WS+.5)*scale,py=y0+(S.world.y/WS+.5)*scale;g.fillStyle='#fff';g.beginPath();g.arc(px,py,4,0,Math.PI*2);g.fill();g.strokeStyle='#342c18';g.lineWidth=1;g.stroke();}
  card(416,48,202,280,'#507c61',1);T(en?'REGIONS':'WILAYAH',430,67,'#fc4',11);(v.regions||[]).slice(0,5).forEach((b,i)=>{const y=79+i*43,seen=!!(S.journal&&S.journal.seenBiomes&&S.journal.seenBiomes[b.id]);g.fillStyle=b.color||'#6a8';g.fillRect(430,y,12,12);T(en?(b.name_en||b.id):(b.name||b.id),449,y+10,seen?'#fff':'#aab8b1',8);T(seen?(en?'DISCOVERED':'DITEMUKAN'):(en?'EXPLORE':'JELAJAHI'),449,y+23,seen?'#9f9':'#8ca39a',7);});
  const wp=S.journal&&S.journal.waypoint;if(wp){btn(416,300,202,27,en?'CLEAR WAYPOINT':'HAPUS PENANDA',1);}else{card(416,300,202,27,'#405b4f',0);T(en?'No waypoint set':'Belum ada penanda',517,317,'#afc7b4',8,'center');}
  T(en?'Tap a discovered tile to set a waypoint.':'Ketuk petak yang ditemukan untuk memasang penanda.',220,343,'#cde',8,'center');g.restore();
}
function hbDrawWaypoint(){
  const wp=S.journal&&S.journal.waypoint;if(!wp||!S.world)return;const v=hbMapDimensions(),px=Math.floor(S.world.x/WS),py=Math.floor(S.world.y/WS),field=hbMapRouteField(wp.x|0,wp.y|0,v),pi=py*v.w+px;
  if(!field||field.dist[pi]<0){g.save();g.fillStyle='rgba(14,23,38,.78)';g.fillRect(180,4,280,25);g.strokeStyle='#f4cf6a';g.strokeRect(180.5,4.5,279,24);T((S.set.lang==='en'?'NO SAFE ROUTE':'JALUR AMAN TIDAK ADA')+' · '+(wp.label||'Tujuan'),300,20,'#ffd39b',9,'center');g.restore();return;}
  const dist=field.dist[pi];if(dist<=1){delete S.journal.waypoint;sv();if(typeof wSay==='function')wSay(jrLang('Tujuan tercapai.','Waypoint reached.'),2);return;}
  const ni=field.next[pi];if(ni<0)return;const nx=ni%v.w,ny=Math.floor(ni/v.w),ang=Math.atan2(ny-py,nx-px);g.save();g.fillStyle='rgba(14,23,38,.78)';g.fillRect(180,4,280,25);g.strokeStyle='#f4cf6a';g.strokeRect(180.5,4.5,279,24);T((S.set.lang==='en'?'GO TO ':'MENUJU ')+(wp.label||'Tujuan')+' · '+dist+' '+jrLang('petak','tiles'),300,20,'#ffe29a',9,'center');g.save();g.translate(442,16);g.rotate(ang+Math.PI/2);g.fillStyle='#fc4';g.beginPath();g.moveTo(0,-7);g.lineTo(5,5);g.lineTo(0,2);g.lineTo(-5,5);g.closePath();g.fill();g.restore();g.restore();
}
const hbBaseDrawWorld=drawWorld;drawWorld=function(){hbBaseDrawWorld();hbDrawWaypoint();};
const hbBaseDraw=draw;draw=function(){hbBaseDraw();if(st==='worldmap')hbDrawWorldMap();else if(st==='dungeonres')hbDrawDungeonResult();};
function hbDrawDungeonResult(){const d=hbEnsureAdventure(),r=d.lastResult||{},en=S.set&&S.set.lang==='en';g.save();g.translate(OX,0);ov(.93);card(112,52,416,262,'#76c896',1);T(en?'DUNGEON CLEARED':'DUNGEON SELESAI',320,83,'#fc4',22,'center');T(en?'Forest Ruins · 3 rooms':'Reruntuhan Hutan · 3 ruangan',320,108,'#d8e9df',11,'center');T(r.firstClear?(en?'Primary reward unlocked!':'Hadiah utama berhasil dibuka!'):(en?'Repeat rewards are reduced.':'Hadiah pengulangan lebih kecil.'),320,140,r.firstClear?'#8f9':'#cde',12,'center');T((en?'Gold earned: ':'Emas didapat: ')+(r.gold||d.currentGold||0),320,167,'#fc4',12,'center');T((en?'Essence earned: ':'Esensi didapat: ')+(r.essence||d.currentEssence||0),320,187,'#9cf',11,'center');btn(48,272,252,32,en?'REPLAY DUNGEON':'ULANGI DUNGEON',1);btn(334,272,258,32,en?'RETURN TO VILLAGE':'KEMBALI KE DESA',0);g.restore();}
addEventListener('keydown',e=>{if(e.repeat)return;if(st==='worldmap'&&e.key==='Escape'){hbCloseWorldMap();e.preventDefault();}else if(st==='dungeonres'&&e.key==='Escape'){worldResume();e.preventDefault();}});
