/* GACHA */
function giveHero(id){const d=HEROES[HID[id]],o=S.own[id];if(!o){S.own[id]={lv:1,st:1};return'BARU!'}if(o.st<5){o.st++;return'BINTANG +1'}const c={N:30,R:80,SR:200,SSR:600}[d.rar];S.g+=c;return'+'+c+' emas'}
function pull(n){dayRefresh();const free=n==1&&S.ft>0,cost=free?0:n==1?100:900;if(S.g<cost){say('Emas tidak cukup');return}S.g-=cost;if(free)S.ft--;stat('pulls',n);const res=[];let hasR=0;for(let i=0;i<n;i++){S.pity++;let r=Math.random(),rar=r<.02?'SSR':r<.12?'SR':r<.40?'R':'N';if(S.pity>=50){rar='SSR'}if(rar=='SSR')S.pity=0;if(rar!='N')hasR=1;if(n==10&&i==9&&!hasR)rar='R';const pool=HEROES.filter(h=>h.rar==rar);res.push(pool[Math.random()*pool.length|0].id)}
sumW='';sumL=res.map(id=>{const r={id,msg:giveHero(id)};heroNote(r);return r});sumT=-GA;gDone=0;st='summon';sv();sfx('portal')}
function pullE(n){dayRefresh();const free=n==1&&S.fe>0,cost=free?0:n==1?120:1080;if(S.items.length+n>ITEM_STORAGE.bag){fullDlg={n,need:S.items.length+n-ITEM_STORAGE.bag};sfx('click');return}if(S.g<cost){say('Emas tidak cukup');return}S.g-=cost;if(free)S.fe--;stat('pulls',n);soldAuto={n:0,g:0};const res=[];let hasR=0;for(let i=0;i<n;i++){S.epity++;let rar=rollRar([55,30,12,3]);if(S.epity>=40)rar='SSR';if(rar=='SSR')S.epity=0;if(rar!='N')hasR=1;if(n==10&&i==9&&!hasR)rar='R';const it=mkItem(['w','a','x'][Math.random()*3|0],rar);addItem(it);res.push(it)}sumW='';sumL=res.map(it=>({it,msg:iDesc(it)}));if(S.ad)autoEquip();sumL.forEach(itemNote);sumT=-GA;gDone=0;st='summon';sv();sfx('portal')}
function offers(){if(S.bday!=today()){S.bday=today();S.bought=[];sv()}let h=0;for(const c of today())h=(h*31+c.charCodeAt(0))>>>0;const ids=HEROES.filter(x=>x.id!='recruit').map(x=>x.id),o=[];while(o.length<3){h=(h*1103515245+12345)>>>0;const id=ids[(h>>>8)%ids.length];if(!o.includes(id))o.push(id)}return o}
/* DRAW */
function spr(k,x,y,sc,b,sx,sy){const i=IM[k];if(!i||!i.complete)return;const w=16*sc,ww=w*(sx||1),hh=w*(sy||1);g.drawImage(i,x-ww/2,y-hh+b,ww,hh)}
function T(s,x,y,c,z,a){s=tr(s);g.font='bold '+(z||11)+'px monospace';g.textAlign=a||'left';g.lineWidth=3;g.lineJoin='round';g.miterLimit=2;g.strokeStyle='#000';g.strokeText(s,x,y);g.fillStyle=c||'#fff';g.fillText(s,x,y)}
function bar(x,y,w,r,c){g.fillStyle='#000';g.fillRect(x-w/2-1,y-1,w+2,5);g.fillStyle=c;g.fillRect(x-w/2,y,w*Math.max(0,r),3)}
/* BACKGROUNDS: tileset pixel-art 16px, 6 tema */
const TS=new Image();TS.src='assets/tiles/tileset.png';
const hh=(i,k)=>{const x=Math.sin(i*127.1+(k||0)*311.7)*43758.5453;return x-Math.floor(x)};
const B_G=['255,176,64','220,255,140','255,190,90','150,220,255','255,120,40','130,255,190'];
const B_A=[['220,220,255',-6,-3,1],['230,255,150',0,0,2],['255,220,160',-70,5,1],['255,255,255',-8,32,2],['255,150,50',3,-38,2],['170,255,200',-4,-12,2]];
/* Kenney "Tiny Dungeon" (CC0, kenney.nl): dinding, lantai, pintu, properti. Diwarnai ulang per tema. */
const KT=new Image();KT.src='assets/tiles/kenney.png';let KW=[],KF=[];
const K_W=[[0,1,.6],[-95,1.25,.55],[-170,1.5,.72],[-8,1.3,.74],[140,1.5,.58],[55,1.4,.5]],K_F=[[0,1,.6],[95,1.4,.8],[0,1,.9],[-8,1.4,1],[-6,1.3,.7],[55,1.6,.5]];
const K_FL=[[14,40,14,40],[0],[48,49,48,42],[14,40,14,40],[0],[14,40,14,40]],K_DC=[[],[12,24],[],[],[12,24],[]];
const K_PR=[[64,65,63],[66,82,89],[66,74,72],[82,63,89],[74,89,66],[65,64,82]];
function kTint(p){const c=document.createElement('canvas');c.width=192;c.height=176;const x=c.getContext('2d');x.drawImage(KT,0,0);let d;try{d=x.getImageData(0,0,192,176)}catch(e){return c}const a=d.data;
for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;let r=a[i]/255,gg=a[i+1]/255,b=a[i+2]/255;const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),df=mx-mn;let l=(mx+mn)/2,h=0,s=0;
if(df){s=l>.5?df/(2-mx-mn):df/(mx+mn);h=mx==r?(gg-b)/df+(gg<b?6:0):mx==gg?(b-r)/df+2:(r-gg)/df+4;h*=60}
h=((h+p[0])%360+360)%360;s=Math.min(1,s*p[1]);l=Math.min(1,l*p[2]);
if(!s){r=gg=b=l}else{const q=l<.5?l*(1+s):l+s-l*s,pp=2*l-q,f=u=>{u=((u%1)+1)%1;return u<1/6?pp+(q-pp)*6*u:u<.5?q:u<2/3?pp+(q-pp)*(2/3-u)*6:pp};r=f(h/360+1/3);gg=f(h/360);b=f(h/360-1/3)}
a[i]=r*255;a[i+1]=gg*255;a[i+2]=b*255}x.putImageData(d,0,0);return c}
KT.onload=()=>{KW=K_W.map(kTint);KF=K_F.map(kTint)};
/* Cache statis: overlay gradien & sprite glow dibuat sekali (bukan per frame) -> kurangi alokasi/GC & biaya fill di HP */
let _bgC=null,_bgK='';const _glowS={};
function bgCache(){const k=VW+'|'+OX;if(_bgC&&_bgK===k)return _bgC;_bgK=k;const mk=()=>{const c=document.createElement('canvas');c.width=VW;c.height=360;const x=c.getContext('2d');x.translate(OX,0);return[c,x]};const[pc,a]=mk(),[qc,b]=mk();a.fillStyle='rgba(10,8,22,.2)';a.fillRect(-OX,0,VW,160);let s=a.createLinearGradient(0,160,0,196);s.addColorStop(0,'rgba(0,0,0,.5)');s.addColorStop(1,'rgba(0,0,0,0)');a.fillStyle=s;a.fillRect(-OX,160,VW,36);s=b.createRadialGradient(320,170,150,320,170,420);s.addColorStop(0,'rgba(0,0,0,0)');s.addColorStop(1,'rgba(0,0,0,.45)');b.fillStyle=s;b.fillRect(-OX,0,VW,320);b.fillStyle='rgba(8,6,16,.62)';b.fillRect(-OX,320,VW,40);return _bgC={pre:pc,post:qc}}
function glowSprite(th){let c=_glowS[th];if(c)return c;c=document.createElement('canvas');c.width=c.height=240;const x=c.getContext('2d'),r=x.createRadialGradient(120,56,4,120,56,120);r.addColorStop(0,'rgba('+B_G[th]+',1)');r.addColorStop(1,'rgba('+B_G[th]+',0)');x.fillStyle=r;x.fillRect(0,0,240,240);return _glowS[th]=c}
function bg(){const th=(((stage-1)%6)+6)%6,o=((bgx%32)+32)%32,b=Math.floor(bgx/32),gl=[];g.imageSmoothingEnabled=false;
const tl=(c,x,y)=>g.drawImage(TS,c*16,th*16,16,16,x,y,32,32);
if(!KW.length){g.fillStyle='#14101e';g.fillRect(-OX,0,VW,360);return}
const W=KW[th],F=KF[th],kt=(sh,c,x,y)=>g.drawImage(sh,(c%12)*16,(c/12|0)*16,16,16,x,y,32,32),FL=K_FL[th],DC=K_DC[th];
for(let i=-1-EX;i<21+EX;i++){const a=i+b,x=i*32-o,m=((a%6)+6)%6,q=hh(a,th+9);
for(let r=0;r<4;r++){const p=hh(a*5+r,th);kt(W,(r==1&&p>.88)?28:40,x,r*32)}
kt(W,36+(((a%3)+3)%3),x,128);
if(m==1){tl(8+((t*8|0)%2),x,40);gl.push(x+16)}
else if(m==2){if(q>.35)kt(W,29,x,48);else kt(KT,45,x,96)}
else if(m==3)tl(12,x,32);
else if(m==5){tl(10,x,32);tl(11,x,64)}
else if(m==0||m==4){if(q>.5){const pr=K_PR[th];kt(KT,pr[(hh(a,3)*pr.length)|0],x,106)}}
for(let r=5;r<10;r++){const p=hh(a*7+r,th+3);kt(F,FL[(p*FL.length)|0],x,r*32);if(DC.length&&hh(a*3+r,th+5)>.78)kt(F,DC[(hh(a,r)*DC.length)|0],x,r*32)}}
const C=bgCache();g.imageSmoothingEnabled=true;g.drawImage(C.pre,-OX,0);g.imageSmoothingEnabled=false;
if(gl.length){const gs=glowSprite(th),ga=g.globalAlpha;g.globalCompositeOperation='lighter';for(const x of gl){g.globalAlpha=.2+.04*Math.sin(t*13+x);g.drawImage(gs,x-120,0)}g.globalAlpha=ga;g.globalCompositeOperation='source-over'}
const A=B_A[th];for(let i=0;i<30;i++){let x=(hh(i,7)*640+t*A[1]-bgx*(.4+hh(i,9)*.6)+Math.sin(t*1.5+i)*(th==1?14:3))%640;if(x<0)x+=640;let y=(hh(i,8)*330+t*A[2]+(th==1?Math.sin(t+i*2)*10:0))%330;if(y<0)y+=330;g.fillStyle='rgba('+A[0]+','+(.35+.45*Math.sin(t*2+i*4)**2)+')';g.fillRect(x|0,y|0,A[3],A[3])}
g.imageSmoothingEnabled=true;g.drawImage(C.post,-OX,0);g.imageSmoothingEnabled=false}

