/* ===== KONTROL MANUAL: 1 hero pemimpin (analog, ATK, S1, S2, Limit Break). Hero lain AI / ketuk kartu ===== */
let MAN=true,jx=0,jy=0,jid=null,aid=null,atkH=0;const KD={};MAN=Save.readMan();
let JR=36;const JC=[66,258],BT0={atk:27,s1:20,s2:20,ult:28},BT={atk:[590,264,27],s1:[528,286,20],s2:[538,228,20],ult:[596,198,28]};function applyCS(){const k=[.85,1,1.2][S.set.cs==null?1:S.set.cs];JR=36*k;for(const n in BT)BT[n][2]=BT0[n]*k}
const ctlH=()=>{const a=hs.filter(h=>!h.dead);return a.find(h=>h.d.id==S.lead)||a[0]||null};
function ctlMove(x,y){let dx=(x-JC[0])/JR,dy=(y-JC[1])/JR;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}jx=l<.15?0:dx;jy=l<.15?0:dy}
function ctlDown(id,x,y){const c=ctlH();if(!c)return false;const n=b=>Math.hypot(x-b[0],y-b[1])<b[2]+7;
if(n(BT.atk)){aid=id;atkH=1;return true}if(n(BT.s1)){cast(c);return true}if(n(BT.s2)){cast2(c);return true}if(n(BT.ult)){limit();return true}
if(x>14&&x<68&&y>190&&y<210){const a=hs.filter(h=>!h.dead),i=a.indexOf(c),nx=a[(i+1)%a.length];S.lead=nx.d.id;sfx('click');ring(nx.x,nx.y,'#fc4',34);return true}
if(x<150&&y>214){jid=id;ctlMove(x,y);return true}return false}
function ctlRel(id){if(id===jid){jid=null;jx=jy=0}if(id===aid){aid=null;atkH=0}}
function updCtl(h,dt){h.cd2=Math.max(0,(h.cd2||0)-dt);h.inv=Math.max(0,(h.inv||0)-dt);h.critT=Math.max(0,(h.critT||0)-dt);
let dx=jx,dy=jy;const kx=(KD.d||KD.arrowright?1:0)-(KD.a||KD.arrowleft?1:0),ky=(KD.s||KD.arrowdown?1:0)-(KD.w||KD.arrowup?1:0);if(kx||ky){const l=Math.hypot(kx,ky);dx=kx/l;dy=ky/l}
const sp=(h.d.melee?105:92)*(h.slow>0?.5:1);h.mv=0;
if(dx||dy){h.x+=dx*sp*dt;h.y+=dy*sp*dt*.85;h.mv=1;if(Math.random()<dt*9)pt.push({x:h.x-6,y:h.y,vx:-20*dx,vy:-10,l:.35,m:.35,c:'#887',s:3,g:0})}
h.x=Math.max(24,Math.min(616,h.x));h.y=Math.max(185,Math.min(312,h.y));
if((atkH||KD.j||KD[' '])&&h.at<=0){const d=h.d,rg=d.rng+(d.melee?12:0),L=es.filter(e=>Math.hypot(e.x-h.x,e.y-h.y)<rg);if(L.length){h.at=d.it/(P.as*h.asm);fire(h,nearest(L,h.x,h.y))}}}
function cast2(h){if(!h||h.dead||(h.cd2||0)>0||st!='fight')return;const d=h.d,a=d.dm*h.lm*A(),L=es.slice(),nr=r=>L.filter(e=>Math.hypot(e.x-h.x,e.y-h.y)<r);
let dx=jx,dy=jy;if(!dx&&!dy)dx=1;const l=Math.hypot(dx,dy);dx/=l;dy/=l;const x0=h.x,y0=h.y;
const mv=D=>{burst(h.x,h.y-10,8,'#cba',80,.4,0,3);h.x=Math.max(24,Math.min(616,h.x+dx*D));h.y=Math.max(185,Math.min(312,h.y+dy*D*.85))};
const ds=e=>{const vx=h.x-x0,vy=h.y-y0,w=vx*vx+vy*vy||1;let u=((e.x-x0)*vx+(e.y-y0)*vy)/w;u=Math.max(0,Math.min(1,u));return Math.hypot(e.x-(x0+vx*u),e.y-(y0+vy*u))};
switch(d.role){
case'tank':ring(h.x,h.y,'#6af',95);burst(h.x,h.y-12,18,['#6af','#fff'],140,.5,100,3);sfx('slam');shake=Math.max(shake,.35);nr(95).forEach(e=>{hit(e,a*1.6,h,0);e.stun=1.3});h.shield=3;doCut(S2N[h.d.id],'#6af',h.d.id,2);break;
case'fighter':mv(105);L.filter(e=>ds(e)<30).forEach(e=>{hit(e,a*2.4,h,0);burst(e.x,e.y-12,6,'#fff',100,.3,0,3)});fx.push({k:'slash',x:h.x+12,y:h.y-14,c:'#fff',t:0,d:.3});sfx(d.w=='spear'?'spear':'sword');doCut(S2N[h.d.id],'#fc8',h.d.id,2);break;
case'assassin':mv(95);h.inv=.7;h.critT=3.5;ring(h.x,h.y,'#f6a',40);sfx('slash');doCut(S2N[h.d.id],'#f6a',h.d.id,2);break;
case'archer':{const q=L.slice().sort((p,r)=>Math.hypot(p.x-h.x,p.y-h.y)-Math.hypot(r.x-h.x,r.y-h.y)).slice(0,5);if(!q.length)return;for(let i=0;i<7;i++)after(i*.07,()=>{const e=q[i%q.length];if(e&&!e.dead){ps.push(mkP('arrow',h.x+8,h.y-20,e,a*.85,h,0,{dur:.22,arc:8}));sfx('arrow')}});doCut(S2N[h.d.id],'#8f8',h.d.id,2);break}
case'mage':ring(h.x,h.y,'#8cf',110);burst(h.x,h.y-10,20,['#8cf','#fff'],160,.6,40,3);sfx('ice');nr(110).forEach(e=>{hit(e,a*1.5,h,0,1);e.slow=3;e.x+=Math.sign(e.x-h.x||1)*26});h.shield=2;doCut(S2N[h.d.id],'#8cf',h.d.id,2);break;
default:hs.forEach(x=>{if(!x.dead){heal(x,x.mh*.2);fx.push({k:'pillar',x:x.x,y:x.y,t:0,d:.7})}});{const w=lowest();if(w)heal(w,w.mh*.25)}sfx('heal');doCut(S2N[h.d.id],'#6f8',h.d.id,2)}
h.cd2=7*P.cd*(h.cdm||1)}
function drawCtl(){if(!MAN)return;const c=ctlH();if(!c)return;const d=c.d;g.save();
g.globalAlpha=.35;g.fillStyle='#000';g.beginPath();g.arc(JC[0],JC[1],JR,0,7);g.fill();g.globalAlpha=.8;g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
g.globalAlpha=.85;g.fillStyle='#9cf';g.beginPath();g.arc(JC[0]+jx*JR*.6,JC[1]+jy*JR*.6,14,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1;g.stroke();g.globalAlpha=1;
const cb=(b,lb,fr,col,on,ik,ic)=>{g.globalAlpha=.9;g.fillStyle='#2b2545';g.beginPath();g.arc(b[0],b[1],b[2],0,7);g.fill();if(fr>0){g.fillStyle='rgba(0,0,0,.6)';g.beginPath();g.moveTo(b[0],b[1]);g.arc(b[0],b[1],b[2],-1.5708,-1.5708+6.283*Math.min(1,fr));g.closePath();g.fill()}
g.strokeStyle=on?col:'#555';g.lineWidth=on?3:2;g.beginPath();g.arc(b[0],b[1],b[2],0,7);g.stroke();g.globalAlpha=1;if(ik!=null)hico(c.d.id,ik,b[0],b[1],Math.max(1,Math.round(b[2]*.2)/2),on?1:.5)};
cb(BT.atk,'ATK',c.at>0?c.at/(d.it/(P.as*c.asm)):0,'#fff',c.at<=0,0);
cb(BT.s1,'S1',c.cd/(d.cd*P.cd*c.cdm),RC[d.rar],c.cd<=0,1);
cb(BT.s2,'S2',(c.cd2||0)/(7*P.cd*c.cdm),'#6cf',(c.cd2||0)<=0,2);
const r=lb>=100;cb(BT.ult,'',0,'#fc4',r,3);T('LIMIT',BT.ult[0],BT.ult[1]-BT.ult[2]-4,r?'#fc4':'#999',8,'center');if(r){g.save();g.translate(BT.ult[0],BT.ult[1]);g.rotate(t*1.5);g.strokeStyle='#fc4';g.globalAlpha=.6;g.lineWidth=2;for(let i=0;i<8;i++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(BT.ult[2]+8,0);g.lineTo(BT.ult[2]+16,0);g.stroke()}g.restore()}if(!r){g.strokeStyle='#fc4';g.lineWidth=3;g.beginPath();g.arc(BT.ult[0],BT.ult[1],BT.ult[2],-1.5708,-1.5708+6.283*lb/100);g.stroke()}else{g.strokeStyle='#fc4';g.globalAlpha=.5+.4*Math.sin(t*8);g.lineWidth=2;g.beginPath();g.arc(BT.ult[0],BT.ult[1],BT.ult[2]+5,0,7);g.stroke()}
g.restore();btn(14,190,54,20,'GANTI',0);T(d.n,14,222,'#fc4',9)}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.repeat)return;KD[k]=1;if(st=='fight'&&MAN){const c=ctlH();if(k=='1')cast(c);else if(k=='2')cast2(c);else if(k=='3')limit();if(' wasd'.includes(k)||k.startsWith('arrow'))e.preventDefault()}});
addEventListener('keyup',e=>{delete KD[e.key.toLowerCase()]});addEventListener('blur',()=>{for(const k in KD)delete KD[k];jid=aid=null;jx=jy=atkH=0});
addEventListener('pointermove',e=>{if(e.pointerId===jid){const r=cv.getBoundingClientRect();ctlMove((e.clientX-r.left)*VW/r.width-OX,(e.clientY-r.top)*360/r.height)}});
addEventListener('pointerup',e=>ctlRel(e.pointerId));addEventListener('pointercancel',e=>ctlRel(e.pointerId));


