/* DUNIA (bangunan terbuka sesuai progres, musim salju, NPC di npc.js, tileset town.png opsional) 
 st='world'. Peta tile 40x30 (tile data 16 px, tampil x2 = 32 px), kamera mengikuti pemain,
 joystick virtual (gaya kontrol manual), tabrakan tile, pemain = sprite hero.
 Aset sementara: kotak berwarna. Bangunan baru penanda (belum membuka layar; itu ).
 Posisi pemain: S.world={x,y} (piksel dunia, titik kaki), disimpan lewat sv(). Penyimpanan tetap via Save.*. */
const WT=16,WZ=2,WS=WT*WZ;let WW=40,WH=30;
const WROWS=[
'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
'TT................GGGG..............T..T',
'T..T..............GGGG....T.........T..T',
'TTT................dd..................T',
'T.......SSSS.......,,.......RRRR.....T.T',
'TT......SSSS.......,,.......RRRR....T..T',
'T.T.....SSSS.......,,.......RRRR....T.TT',
'T..T....SSSS.......,,.......RRRR.......T',
'T..T....SSSS.......,,.......RRRR.......T',
'T..T.....dd........,,........dd........T',
'T........,,........,,........,,........T',
'TT.......,,........,,...QQ...,,........T',
'T........,,........,,...QQ...,,.....TT.T',
'T........,,........,,........,,........T',
'T.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.T',
'TT,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,.T',
'TT.................,,..................T',
'T..................,,..................T',
'TT.T...............,,..................T',
'TT...FFFFFFFF......,,.....~~~~~~~~~...TT',
'TT.T.FppppppF......,,.....~~~~~~~~~..T.T',
'TT...FppppppF......,,.....~~~~~~~~~..T.T',
'T....FppppppF......,,.....~~~~~~~~~..T.T',
'T....FppppppF......,,.....~~~~~~~~~....T',
'T.T..FFFddFFF......,,.....~~~~~~~~~..T.T',
'TT......,,,,,,,,,,,,,.....~~~~~~~~~..T.T',
'T.T.....,,,,,,,,,,,,,..................T',
'T..................,,................TTT',
'TT.......T.........,,................TTT',
'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'];
/* legenda: . rumput , jalan d pintu/celah T pohon ~ air S toko (rumah 4x5) R barak (rumah 4x5) G gerbang Q papan misi F pagar ladang p petak ladang */
const WMAP=WROWS.map(r=>r.split('')),WSOL={T:1,'~':1,S:1,R:1,G:1,Q:1,F:1,X:1},WNAME={S:'TOKO',R:'BARAK',G:'GERBANG',Q:'PAPAN MISI',F:'LADANG'},WSPAWN=[19,15];
const WBLD=(()=>{const b={};WMAP.forEach((r,y)=>r.forEach((c,x)=>{if(!WNAME[c])return;const o=b[c]||(b[c]={c,x0:x,y0:y,x1:x,y1:y});o.x0=Math.min(o.x0,x);o.y0=Math.min(o.y0,y);o.x1=Math.max(o.x1,x);o.y1=Math.max(o.y1,y)}));return Object.values(b)})();
const wAct=self.Anim?new Anim.Actor('avatar'):null; /* avatar Sunnyside */
/* desa Sunnyside (Tmap). Bila village.json belum siap, peta lama tetap dipakai. */
let wVon=0;
function wUseV(){if(wVon||!self.Tmap||!Tmap.ready())return;const V=Tmap.data();WW=V.w;WH=V.h;WMAP.length=0;V.grid.forEach(r=>WMAP.push(r.split('')));WBLD.length=0;for(const c in WBM)delete WBM[c];
for(const c in V.bld){const b=V.bld[c],o={c,x0:b[0],y0:b[1],x1:b[2],y1:b[3]};WBLD.push(o);WBM[c]=o}
WSPAWN[0]=V.spawn[0];WSPAWN[1]=V.spawn[1];if(typeof NPCS!='undefined')NPCS.forEach(o=>{const p=V.npcs[o.id];if(p){o.tx=p[0];o.ty=p[1]}});if(S.world&&S.world.disc==='*'&&isFinite(S.world.x)&&isFinite(S.world.y)){S.world.disc=Tmap.explore(S.world.x/WS,S.world.y/WS,'');sv()}wVon=1}
let wjx=0,wjy=0,wjid=null,wcx=null,wcy=0,wface=1,wwalk=0,wHint=0,wFrom=0,wDlg=0,wNear=null,wPlace=null;

let wNpc=null,wTalk=null,wMsg={t:0,s:''},wSn=0;
const wL=(a,b)=>S.set.lang=='en'?b:a; /* teks 2 bahasa langsung di kode (tanpa kamus i18n) */
const WUN={R:3,F:5,Q:8}; /* stage tertinggi (best) untuk membuka bangunan; tidak tercantum = selalu terbuka (Toko, Gerbang) */
const wLock=c=>best<(WUN[c]||0);
function wSay(s,tm,kind){wMsg={t:tm||3,s,kind:kind||'toast'}}
/* Musim: S.set.season 0=otomatis (Des-Feb = salju), 1=normal, 2=salju */
function wSnow(){const m=S.set.season|0;return m==2||(m==0&&[11,0,1].includes(new Date().getMonth()))}
function wUnlockCheck(){const sn=S.wseen=(S.wseen&&typeof S.wseen=='object')?S.wseen:{},nw=[];for(const c in WUN)if(best>=WUN[c]&&!sn[c]){sn[c]=1;nw.push(WNAME[c])}if(nw.length){sv();wSay(wL('Bangunan baru terbuka: ','New building unlocked: ')+nw.join(', '),5);sfx('clear')}}
/* Aset (CC0): "Adventure Awaits Asset Pack" oleh Ishtar Pixels -> assets/tiles/adv.png (tanah, rumput, air, rumah, pohon, pagar).
 Tanaman: "16x16 RPG Tileset" oleh hilau (OpenGameArt) -> assets/tiles/plants.png. Bila gambar belum termuat/tidak ada, dunia memakai warna polos. */
const ADV=new Image();ADV.src='assets/tiles/adv.png';const PLT=new Image();PLT.src='assets/tiles/plants.png';
const wArt=()=>ADV.complete&&ADV.naturalWidth>0;
const WSP={t1:[99,16,42,54],t2:[174,21,52,49],S:[205,73,54,80],R:[68,73,54,80]}; /* x,y,w,h pada adv.png (S rumah merah, R rumah biru) */
const wVC={};
function wVar(k,md){const id=k+md;if(wVC[id])return wVC[id];const r=WSP[k],c=document.createElement('canvas');c.width=r[2];c.height=r[3];const x=c.getContext('2d');x.drawImage(ADV,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);x.globalCompositeOperation='source-atop';
if(md=='s'){const gr=x.createLinearGradient(0,0,0,r[3]*.55);gr.addColorStop(0,'rgba(248,251,255,.92)');gr.addColorStop(1,'rgba(248,251,255,0)');x.fillStyle=gr}else x.fillStyle='rgba(14,14,30,.62)';x.fillRect(0,0,r[2],r[3]);return wVC[id]=c}
const WSPEED=96,WFH=9,WFV=8; // kecepatan px/detik; kotak kaki: setengah lebar 9, tinggi 8 (lebih kecil dari 1 tile)
function wSolid(px,py){const tx=Math.floor(px/WS),ty=Math.floor(py/WS);if(!(tx>=0&&ty>=0&&tx<WW&&ty<WH))return true;const c=WMAP[ty][tx],gridSolid=!!WSOL[c]||(c=='p'&&wLock('F'));if(c=='p')return gridSolid;if(self.Tmap&&Tmap.collisionAt){const cs=Tmap.collisionAt(tx,ty);if(cs===true)return true;if(cs===false)return gridSolid}return gridSolid}
const wBlocked=(x,y)=>wSolid(x-WFH,y-WFV)||wSolid(x+WFH,y-WFV)||wSolid(x-WFH,y)||wSolid(x+WFH,y)||!!(self.npcHit&&npcHit(x,y));
function worldEnter(){wUseV();const w=S.world;if(!w||!isFinite(w.x)||!isFinite(w.y)||wBlocked(w.x,w.y))S.world={x:WSPAWN[0]*WS+WS/2,y:WSPAWN[1]*WS+WS/2+8};/* Keep exploration per save; do not reveal every tile when entering the world. */wjx=wjy=0;wjid=null;wcx=null;wHint=6;wFrom=0;wDlg=0;wTalk=null;st='world';wUnlockCheck();sv();sfx('click')}
function worldLeave(){wjid=null;wjx=wjy=0;wFrom=0;wDlg=0;wTalk=null;st='menu';sv();sfx('click')}
function wMove(x,y){let dx=(x-JC[0])/JR,dy=(y-JC[1])/JR;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}wjx=l<.15?0:dx;wjy=l<.15?0:dy}
/* bangunan = pintu ke layar lama. wFrom=1 berarti layar dibuka dari dunia, jadi KEMBALI -> goBack() -> dunia. */
const WGO={S:'shop',R:'heroes',Q:'quests'},WGD=[['MAIN STAGE',190,104,260,30],['DUNGEON',190,142,260,30],['MENARA HARIAN',190,180,260,30],['BATAL',190,218,260,30]],WNR=22;
function wNearB(){const w=S.world;let b=null,bd=WNR;WBLD.forEach(o=>{const dx=Math.max(o.x0*WS-w.x,0,w.x-(o.x1+1)*WS),dy=Math.max(o.y0*WS-w.y,0,w.y-(o.y1+1)*WS),d=Math.hypot(dx,dy);if(d<bd){bd=d;b=o}});return b}
function wFindPlace(){if(!wVon||!self.Tmap||!Tmap.data())return null;const w=S.world,ps=Tmap.data().places||[];let bestP=null,bd=48;ps.forEach(p=>{const sz=p.footprint||[p.platform&&p.platform.w||p.fence&&p.fence.w||1,p.platform&&p.platform.h||p.fence&&p.fence.h||1],x0=p.x*WS,y0=p.y*WS,x1=x0+sz[0]*WS,y1=y0+sz[1]*WS,dx=Math.max(x0-w.x,0,w.x-x1),dy=Math.max(y0-w.y,0,w.y-y1),d=Math.hypot(dx,dy);if(d<bd){bd=d;bestP=p}});return bestP}
function wGo(s){wbCheck();wFrom=1;wDlg=0;wTalk=null;wjid=null;wjx=wjy=0;sv();st=s}
function wInteract(){if(st!='world'||wDlg)return;if(wTalk){npcAdv();return}wjid=null;wjx=wjy=0;
if(wNpc){npcStart(wNpc);return}if(wPlace){sfx('click');if(wPlace.type==='animal_pen')wGo('ranch');else if(wPlace.type==='market'){marketFrom='world';wGo('market')}return}if(!wNear)return;sfx('click');
if(wLock(wNear.c)){wSay(wL('Terkunci. Capai stage '+WUN[wNear.c]+' dulu (rekormu: '+best+')','Locked. Reach stage '+WUN[wNear.c]+' first (your best: '+best+')'),3);return}
if(wNear.c=='G'){wDlg=1;return}if(wNear.c=='F'){say(wL('Ladangnya di petak rumput terbuka. Pilih cangkul, benih, atau ember di hotbar.','The field is on the open grass plots. Pick the hoe, seeds, or bucket on the hotbar.'));return}if(WGO[wNear.c])wGo(WGO[wNear.c])}
function worldResume(){wjid=null;wjx=wjy=0;wDlg=0;wTalk=null;wHint=0;st='world';wUnlockCheck();sv()}
function goBack(){if(wFrom)worldResume();else st='menu'}
function worldDown(id,x,y){if(wTalk){npcAdv();return}if(wDlg){WGD.forEach((b,i)=>{if(x>=b[1]&&x<=b[1]+b[3]&&y>=b[2]&&y<=b[2]+b[4]){sfx('click');if(i==0)wGo('stages');else if(i==1)hbStartDungeon();else if(i==2)wGo('tower');else wDlg=0}});return}


if(x>=500&&x<=558&&y>=6&&y<=32){worldLeave();return}if(x<170&&y>180){wjid=id;wMove(x,y)}}
function updWorld(dt){if(!wVon&&self.Tmap&&Tmap.ready())wUseV();const w=S.world;let dx=wjx,dy=wjy;const kx=(KD.d||KD.arrowright?1:0)-(KD.a||KD.arrowleft?1:0),ky=(KD.s||KD.arrowdown?1:0)-(KD.w||KD.arrowup?1:0);if(kx||ky){const l=Math.hypot(kx,ky);dx=kx/l;dy=ky/l}
if(wDlg||wTalk)dx=dy=0;let mv=0;if(dx||dy){const nx=w.x+dx*WSPEED*dt,ny=w.y+dy*WSPEED*dt;if(!wBlocked(nx,w.y)){w.x=nx;mv=1}if(!wBlocked(w.x,ny)){w.y=ny;mv=1}if(dx)wface=dx>0?1:-1}
wwalk=mv?wwalk+dt:0;if(mv)qDirty=1;if(wAct)wAct.update(mv?dx:0,mv?dy:0);if(wVon)Tmap.update(dt);if(self.npcUpdate)npcUpdate(dt);
const tx=Math.max(0,Math.min(WW*WS-VW,w.x-VW/2)),ty=Math.max(0,Math.min(WH*WS-360,w.y-14-180));
if(wcx==null){wcx=tx;wcy=ty}else{const k=1-Math.exp(-10*dt);wcx+=(tx-wcx)*k;wcy+=(ty-wcy)*k}if(wVon&&Tmap.explore){const oldDisc=w.disc||'';w.disc=Tmap.explore(w.x/WS,w.y/WS,oldDisc);if(w.disc!==oldDisc)sv()}if(wHint>0)wHint-=dt;if(wMsg.t>0)wMsg.t-=dt;wNear=wNearB();wPlace=wFindPlace();wNpc=self.npcNear?npcNear(w.x,w.y):null;wFx(dt)}
/* siklus siang-malam (tint kanvas), pintu terbuka, jendela & lentera menyala (cahaya digambar di tilemap.js) 
 S.set.dn: 0 = siklus cepat (6 menit/hari, mulai pagi), 1 = jam perangkat, 2 = siang tetap. Jam game tidak disimpan (sengaja, tanpa ubah save). */
const WCROP=['carrot','pumpkin','sunflower']; /* Sunnyside Crops tahap 00..05; bunga legacy memakai sprite sunflower. */
let wHr=9,wTn=[0,0,0,0,0];const wDoor={S:0,R:0};
const WTK=[[0,10,16,64,.6],[5,18,24,70,.54],[6.5,255,140,70,.2],[8,255,205,150,0],[16.5,255,205,150,0],[18,255,120,50,.2],[19.5,60,40,100,.38],[21,10,16,64,.6],[24,10,16,64,.6]];
function wTone(h){let i=1;while(i<WTK.length-1&&WTK[i][0]<h)i++;const a=WTK[i-1],b=WTK[i],k=(h-a[0])/(b[0]-a[0]),m=j=>a[j]+(b[j]-a[j])*k,al=m(4);return[m(1)|0,m(2)|0,m(3)|0,al,Math.max(0,Math.min(1,(al-.1)/.25))]}
function wFx(dt){const m=S.set.dn|0;let h=-1;if(m==0){wHr=(wHr+dt*24/360)%24;h=wHr}else if(m==1){const d=new Date();h=d.getHours()+d.getMinutes()/60}wTn=h<0?[0,0,0,0,0]:wTone(h);
for(const c in wDoor){const tg=(wNear&&wNear.c==c&&!wLock(c)&&!wDlg&&!wTalk)?1:0;wDoor[c]+=(tg-wDoor[c])*Math.min(1,dt*9)}}
function wTint(){if(wTn[3]>.01){g.fillStyle='rgba('+wTn[0]+','+wTn[1]+','+wTn[2]+','+wTn[3].toFixed(3)+')';g.fillRect(-OX,0,VW,360)}if(wVon&&self.Tmap&&Tmap.lights)Tmap.lights(g)}
const WBM={};WBLD.forEach(b=>WBM[b.c]=b);
const WGR=[[5,13],[5,13],[5,13],[5,13],[5,13],[3,11],[4,11],[5,11],[3,12],[4,12],[5,12],[3,13],[4,13]];
const roadOK=r=>r===undefined||',dSRGFp'.includes(r),watOK=r=>r===undefined||r=='~';
function wEdge(tx,ty,ok,b){const f=(x,y)=>ok(WMAP[y]&&WMAP[y][x]),mn=!f(tx,ty-1),ms=!f(tx,ty+1),mw=!f(tx-1,ty),me=!f(tx+1,ty);
const c=(mw&&me)?1:mw?0:me?2:1,r=(mn&&ms)?1:mn?0:ms?2:1;return[b[0]+c,b[1]+r]}
function aT(c,r,sx,sy){g.drawImage(ADV,c*16,r*16,16,16,sx,sy,WS,WS)}
function wTile(c,sx,sy,tx,ty){const n=hh(ty*WW+tx,2),sn=wSn,rd=c==','||c=='d',wt=c=='~';
if(!wArt()){g.fillStyle=wt?'#2a5a9a':rd?'#8b7650':c=='p'?'#5a3d22':'#2f5f36';g.fillRect(sx,sy,WS,WS);return}
if(rd){const e=wEdge(tx,ty,roadOK,[7,10]);aT(e[0],e[1],sx,sy)}
else if(wt){const e=wEdge(tx,ty,watOK,[15,14]);aT(e[0],e[1],sx,sy)}
else{const q=WGR[n*WGR.length|0];aT(q[0],q[1],sx,sy)}
if(c=='p'){g.fillStyle='#5a3d22';g.fillRect(sx,sy,WS,WS);g.fillStyle='#46301a';g.fillRect(sx+2,sy+8,WS-4,5);g.fillRect(sx+2,sy+20,WS-4,5)}
else if(c=='F'){const b=WBM.F,r=ty==b.y0?0:ty==b.y1?2:1,k=tx==b.x0?0:tx==b.x1?2:1;aT(1+k,6+r,sx,sy)}
else if(c=='G'){const b=WBM.G,r=ty-b.y0;aT(5+(tx&1),16+r,sx,sy);if(r==1&&tx>=19&&tx<=20){g.fillStyle='#241a38';g.fillRect(tx==19?sx+6:sx,sy+4,WS-6,WS-4);g.fillStyle='#000';g.fillRect(tx==19?sx+6:sx,sy+4,WS-6,2)}}
else if(c=='Q')aT(4,18,sx,sy);
if(sn&&c!='F'&&c!='G'&&c!='p'){g.fillStyle=wt?'rgba(215,235,250,.55)':rd?'rgba(228,236,244,.5)':'rgba(236,243,250,.78)';g.fillRect(sx,sy,WS,WS)}}
function wSprite(k,cxp,by,z,md){const r=WSP[k],w=r[2]*z,h=r[3]*z;if(md)g.drawImage(wVar(k,md),cxp-w/2,by-h,w,h);else g.drawImage(ADV,r[0],r[1],r[2],r[3],cxp-w/2,by-h,w,h)}
function wPlant(k,cx,cy,sc,rp){if(!(PLT.complete&&PLT.naturalWidth>0)||k==1)return false;const t=k==0?(rp?[26,3]:[27,1]):(rp?[24,4]:[25,6]),s=32*sc;g.drawImage(PLT,t[0]*16,t[1]*16,16,16,cx-s/2,cy+10*sc-s,s,s);return true}
function drawWorld(){const w=S.world;wSn=wSnow();g.fillStyle=wSn?'#c8d6e4':'#2f5f36';g.fillRect(-OX,0,VW,360);if(wcx==null){wcx=Math.max(0,Math.min(WW*WS-VW,w.x-VW/2));wcy=Math.max(0,Math.min(WH*WS-360,w.y-194))}
g.imageSmoothingEnabled=false;
const cx=Math.round(wcx),cy=Math.round(wcy),x0=Math.max(0,Math.floor(cx/WS)),x1=Math.min(WW-1,Math.floor((cx+VW)/WS)),y0=Math.max(0,Math.floor(cy/WS)),y1=Math.min(WH-1,Math.floor((cy+360)/WS)),tall=[];
if(wVon){if(Tmap.farm&&typeof farmGet!='undefined')Tmap.farm(farmGet().p,Date.now(),WCROP,FC);Tmap.draw(g,cx,cy,OX,VW,wSn);if(Tmap.fx)Tmap.fx(wTn[4],wDoor);tall.push(...Tmap.tall(g,cx,cy,OX,VW,wSn,()=>false))}else{for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)wTile(WMAP[ty][tx],tx*WS-cx-OX,ty*WS-cy,tx,ty);
if(wArt()){for(let ty=y0;ty<=Math.min(WH-1,y1+3);ty++)for(let tx=Math.max(0,x0-2);tx<=Math.min(WW-1,x1+2);tx++)if(WMAP[ty][tx]=='T')tall.push({y:ty*WS+WS-2,k:hh(ty*WW+tx,6)>.5?'t1':'t2',x:tx*WS+WS/2-cx-OX,b:ty*WS+WS-2-cy,z:1.5,md:wSn?'s':0});
for(const c of'SR'){const b=WBM[c];if(!b)continue;tall.push({y:(b.y1+1)*WS,k:c,x:(b.x0+b.x1+1)*WS/2-cx-OX,b:(b.y1+1)*WS-cy,z:2,md:wLock(c)?'l':wSn?'s':0})}}}
tall.sort((a,b)=>a.y-b.y);const dT=l=>l.forEach(o=>{if(o.x>-90-OX&&o.x<VW+90)(o.f?o.f():wSprite(o.k,o.x,o.b,o.z,o.md))});
if(wNear&&!wDlg&&!wTalk&&!wNpc){const o=wNear;g.strokeStyle=wLock(o.c)?'#f88':'#fc4';g.globalAlpha=.6+.4*Math.sin(t*6);g.lineWidth=2;g.strokeRect(o.x0*WS-cx-OX+1,o.y0*WS-cy+1,(o.x1-o.x0+1)*WS-2,(o.y1-o.y0+1)*WS-2);g.globalAlpha=1}
if(self.lifeDrawResourceNodes)lifeDrawResourceNodes(cx,cy);
const id=S.own[S.lead]?S.lead:(S.deck[0]||'recruit'),d=HEROES[HID[id]],px=w.x-cx-OX,py=w.y-cy,bob=wwalk?Math.abs(Math.sin(wwalk*10))*3:0,im=IM[d.s],ok=im&&im.complete&&im.naturalWidth>0;
dT(tall.filter(o=>o.y<=w.y));if(self.npcDraw)npcDraw(cx,cy,w.y,0);
if(wAct&&Anim.has('avatar_'+wAct.state)){Anim.shadow(g,px,py-1,9,3,.3);wAct.draw(g,px,py,performance.now(),WZ)}
else{g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px,py-1,10,4,0,0,7);g.fill();
g.save();g.translate(px,py);if(wface<0)g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore()}
if(self.npcDraw)npcDraw(cx,cy,w.y,1);dT(tall.filter(o=>o.y>w.y));wTint();
WBLD.forEach(b=>{const sx=(b.x0+b.x1+1)*WS/2-cx-OX,ly=(b.y1+1)*WS-cy+13,my=(b.y0+b.y1+1)*WS/2-cy;if(!(sx>-90-OX&&sx<VW+90))return;const lk=wLock(b.c),rd=b.c=='F'&&!lk&&farmReady();
if(lk){T(WNAME[b.c],sx,ly,'#99a',11,'center')}
else T(WNAME[b.c]+(rd?' (!)':''),sx,ly,rd?'#fc4':'#fff',11,'center')});
if(wSn){g.fillStyle='rgba(190,210,240,.08)';g.fillRect(-OX,0,VW,360);const nf=S.set.fx?70:30;g.fillStyle='#fff';for(let i=0;i<nf;i++){const x=(((hh(i,1)*VW+Math.sin(t*.8+i)*14-t*5)%VW)+VW)%VW-OX,y=(((hh(i,2)*380+t*(18+hh(i,3)*30))%380)+380)%380-10,z=(i%3)?1:2;g.fillRect(x|0,y|0,z,z)}}
if(self.lifeDrawWeather)lifeDrawWeather();
if(!wTalk){g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.arc(JC[0],JC[1],JR,0,7);g.fill();g.globalAlpha=.8;g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.globalAlpha=.85;g.fillStyle='#9cf';g.beginPath();g.arc(JC[0]+wjx*JR*.6,JC[1]+wjy*JR*.6,14,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();g.globalAlpha=1}
btn(500,6,58,26,wL('MENU','MENU'),1);
if(wHint>0){g.globalAlpha=Math.min(1,wHint);T('Geser joystick kiri atau WASD untuk berjalan',320,296,'#9cf',11,'center');g.globalAlpha=1}
if(wMsg.t>0){g.globalAlpha=Math.min(1,wMsg.t);g.fillStyle='rgba(0,0,0,.78)';g.strokeStyle='#fc4';g.lineWidth=1;if(wMsg.kind==='discovery'){g.fillRect(122,44,396,24);g.strokeRect(122.5,44.5,395,23);T(wMsg.s,320,61,'#fe8',11,'center')}else{g.fillRect(152,286,336,24);g.strokeStyle='#76678c';g.strokeRect(152.5,286.5,335,23);T(wMsg.s,320,302,'#cde',10,'center')}g.globalAlpha=1}

if(wDlg){ov(.65);card(160,62,320,232,'#fc4',1);T('GERBANG PETUALANGAN',320,88,'#fc4',15,'center');T('Pilih tujuan',320,101,'#cde',10,'center');WGD.forEach((b,i)=>btn(b[1],b[2],b[3],b[4],b[0],i<3))}
if(self.npcUI)npcUI();if(wVon&&Tmap.hud)Tmap.hud(g,S.world.disc||'',w.x/WS,w.y/WS,OX,VW,1/60)}
addEventListener('pointermove',e=>{if(st=='world'&&e.pointerId===wjid){const r=cv.getBoundingClientRect();wMove((e.clientX-r.left)*VW/r.width-OX,(e.clientY-r.top)*360/r.height)}});
const wRel=e=>{if(e.pointerId===wjid){wjid=null;wjx=wjy=0}};addEventListener('pointerup',wRel);addEventListener('pointercancel',wRel);addEventListener('blur',()=>{wjid=null;wjx=wjy=0});
addEventListener('keydown',e=>{if(st!='world'||e.repeat)return;const k=e.key.toLowerCase();if(k=='e'||k==' '||k=='enter'){wInteract();e.preventDefault()}else if(k=='escape'){if(wDlg)wDlg=0;else wTalk=null}});
