/* NPC DUNIA 
 4 NPC berdialog di dunia. Dimuat setelah farm.js. Semua hook di world.js dijaga (self.npcXxx&&...), jadi bila file ini
 tidak dimuat dunia tetap jalan tanpa NPC. Teks 2 bahasa langsung di kode lewat wL(id,en) (tanpa kamus i18n.js).
 Tambah NPC: tambah entri di NPCS (h = id hero untuk sprite, tx/ty = tile rumput kosong) dan satu cabang di npcLines(). */
const NPCS=[
{id:'guard',h:'knight',tx:22,ty:3,n:['Penjaga Gerbang','Gate Guard']},
{id:'merchant',h:'cleric',tx:12,ty:9,n:['Pedagang','Merchant']},
{id:'farmer',h:'clubber',tx:13,ty:22,n:['Petani','Farmer']},
{id:'elder',h:'oracle',tx:26,ty:12,n:['Tetua Desa','Village Elder']}];
const NB={R:['Barak','the Barracks'],F:['Ladang','the Field'],Q:['Papan Misi','the Quest Board']};
/* posisi runtime (px,py) = rumah (tx,ty) + berkeliling pendek. wUseV() menimpa tx,ty -> npcSync mereset posisi. */
function npcSync(o){const k=o.tx+','+o.ty;if(o._k!==k){o._k=k;o.px=o.tx*WS+WS/2;o.py=o.ty*WS+26;o.mode='wait';o.wt=1+Math.random()*3;o.vx=o.vy=0;o.gx=o.gy=0}}
const npcX=o=>(npcSync(o),o.px),npcY=o=>(npcSync(o),o.py);
const NPCR=WS*2,NPCSP=28;
function npcAc(o){if(o.ac===undefined)o.ac=typeof Anim!='undefined'?new Anim.Actor('npc_'+o.id):null;return o.ac}
const npcOk=(x,y)=>!(wSolid(x-WFH,y-WFV)||wSolid(x+WFH,y-WFV)||wSolid(x-WFH,y)||wSolid(x+WFH,y));
function npcUpdate(dt){const w=S.world;if(!w)return;NPCS.forEach(o=>{npcSync(o);const ac=npcAc(o),hx=o.tx*WS+WS/2,hy=o.ty*WS+26;let vx=0,vy=0;
const talk=wTalk&&wTalk.o===o,near=Math.abs(w.x-o.px)<44&&Math.abs(w.y-o.py)<34;
if(talk||wDlg){o.mode='wait';o.wt=Math.max(o.wt,1.5)}
else if(o.mode=='wait'){o.wt-=dt;if(o.wt<=0){if(near){o.wt=1}else{const a=Math.random()*7,r=(.4+Math.random()*.6)*NPCR,gx=hx+Math.cos(a)*r,gy=hy+Math.sin(a)*r*.7;let ok=npcOk(gx,gy)&&Math.hypot(gx-w.x,gy-w.y)>40;
for(let i=1;ok&&i<=8;i++)ok=npcOk(o.px+(gx-o.px)*i/8,o.py+(gy-o.py)*i/8);if(ok){o.mode='go';o.gx=gx;o.gy=gy}else o.wt=.6}}}
else{const dx=o.gx-o.px,dy=o.gy-o.py,l=Math.hypot(dx,dy);if(l<2||near&&Math.hypot(w.x-o.px,w.y-o.py)<40){o.mode='wait';o.wt=1.5+Math.random()*3.5}
else{const sx=dx/l,sy=dy/l,nx=o.px+sx*NPCSP*dt,ny=o.py+sy*NPCSP*dt;
if(npcOk(nx,ny)&&!(Math.abs(nx-w.x)<19&&Math.abs(ny-w.y)<13)){o.px=nx;o.py=ny;vx=sx;vy=sy}else{o.mode='wait';o.wt=1+Math.random()*2}}}
if(ac){ac.update(vx,vy);if(talk)ac.face(w.x-o.px,w.y-o.py)}})}
function npcHit(x,y){for(const o of NPCS)if(Math.abs(x-npcX(o))<15&&Math.abs(y-npcY(o))<10)return true;return false}
function npcNear(px,py){let b=null,bd=34;for(const o of NPCS){const d=Math.hypot(px-npcX(o),py-npcY(o));if(d<bd){bd=d;b=o}}return b}
function npcLines(o){const b=best,r=[];
if(o.id=='guard'){r.push(wL('Halo, selamat datang. Gerbang ini menuju medan pertempuran.','Hi, welcome. This gate leads to the battlefield.'));
r.push(b>0?wL('Rekormu stage '+b+'. Teruslah maju!','Your record is stage '+b+'. Keep going!'):wL('Belum pernah bertarung? Mulai dari Stage 1.','Not fought yet? Start from Stage 1.'));
r.push(wL('Menara Harian juga lewat sini. Aturannya berganti tiap hari.','The Daily Tower is through here too. Its rules change every day.'))}
else if(o.id=='merchant'){r.push(wL('Selamat datang. Tokonya buka terus, dan ada panggilan hero gratis tiap hari.','Welcome in. The shop stays open, and there is a free hero summon every day.'));
r.push(wL('Perlengkapan bagus ada di tab Liontin. Tapi naikkan level hero dulu, baru belanja.','Good gear is in the Pendant tab. Level up your heroes first, then shop.'));
r.push(S.ft>0||S.fe>0?wL('Panggilan gratis hari ini masih ada.','Your free summon is still available today.'):wL('Panggilan gratis hari ini sudah terpakai. Kembali besok.','Today\'s free summon is used. Come back tomorrow.'))}
else if(o.id=='farmer'){if(b<WUN.F){r.push(wL('Ladangku belum bisa dipakai. Capai stage '+WUN.F+' dan akan kubukakan.','My field is not ready yet. Reach stage '+WUN.F+' and I will open it.'));r.push(wL('Rekormu sekarang stage '+b+'. Sedikit lagi!','Your record is stage '+b+' now. Almost there!'))}
else{r.push(wL('Gemburkan tanahnya, tanam benih, lalu tinggalkan. Tanamannya tetap tumbuh saat kamu istirahat.','Loosen the soil, plant the seeds, then leave them. Crops keep growing while you rest.'));
r.push(typeof farmReady=='function'&&farmReady()?wL('Eh, ada yang sudah matang. Yuk panen.','Oh, something is ripe. Come harvest.'):wL('Panen sepuasnya.','Harvest as much as you like.'))}}
else{r.push(wL('Desa ini tumbuh seiring langkahmu.','This village grows with every step you take.'));
let nx=null;for(const c in WUN)if(WUN[c]>b&&(!nx||WUN[c]<WUN[nx]))nx=c;
r.push(nx?wL('Capai stage '+WUN[nx]+' dan '+NB[nx][0]+' akan terbuka.','Reach stage '+WUN[nx]+' and '+NB[nx][1]+' will open.'):wL('Semua bangunan sudah terbuka. Nikmati desanya.','Every building is open. Enjoy the village.'));
r.push(wSn?wL('Salju turun. Hangatkan dirimu, ya.','Snow is falling. Stay warm.'):wL('Kalau musim dingin tiba, desa ini tertutup salju. Cantik sekali.','When winter comes, the village is covered in snow. It is lovely.'))}
return r}
function npcStart(o){wjid=null;wjx=wjy=0;wTalk={n:o.n[S.set.lang=='en'?1:0],ls:npcLines(o),i:0,o:o};const ac=npcAc(o);if(ac)ac.face(S.world.x-npcX(o),S.world.y-npcY(o));sfx('click')}
function npcAdv(){const d=wTalk;if(!d)return;sfx('click');if(d.i<d.ls.length-1)d.i++;else wTalk=null}
function npcDraw(cx,cy,py,pass){const w=S.world;NPCS.forEach((o,k)=>{const fy=npcY(o),back=fy<=py;if((pass==0)!=back)return;
const sx=npcX(o)-cx-OX,sy=fy-cy;if(sx<-40-OX||sx>VW+40||sy<-40||sy>400)return;
const ac=npcAc(o),nw=ac&&Anim.has('npc_'+o.id+'_'+ac.state);let bob=0;const nr=wNpc===o;
if(nw){Anim.shadow(g,sx,sy-1,9,3,.3);ac.draw(g,sx,sy,performance.now(),WZ)}
else{const d=HEROES[HID[o.h]],im=IM[d.s],ok=im&&im.complete&&im.naturalWidth>0;bob=Math.abs(Math.sin(t*2+k*1.7))*1.5;
g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(sx,sy-1,10,4,0,0,7);g.fill();
g.save();g.translate(sx,sy);if(w.x<npcX(o))g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore()}
const ly=nw?46:40;if(nr)T(o.n[S.set.lang=='en'?1:0],sx,sy-ly,'#fc4',10,'center');else T('...',sx,sy-(nw?42:34)-bob,'#fff',10,'center')})}
function npcUI(){const d=wTalk;if(!d)return;card(20,228,600,96,'#fc4',1);T(d.n,34,250,'#fc4',13);wr(d.ls[d.i],34,274,68,'#fff',11);
T((d.i<d.ls.length-1?wL('KETUK: lanjut','TAP: next'):wL('KETUK: tutup','TAP: close'))+'  '+(d.i+1)+'/'+d.ls.length,606,316,'#9cf',9,'right')}
