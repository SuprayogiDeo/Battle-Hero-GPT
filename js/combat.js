/* ===== FX ===== */
function burst(x,y,n,c,sp,life,gr,sz){n=S.set.fx?n:Math.ceil(n*.35);for(let i=0;i<n;i++){const a=rnd(0,6.28),v=rnd(.2,1)*sp;pt.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*.3,l:rnd(.5,1)*life,m:life,c:Array.isArray(c)?c[Math.random()*c.length|0]:c,s:rnd(.6,1)*(sz||3),g:gr||0})}}
function after(d,fn){sch.push({t:d,fn})}
function ring(x,y,c,r){fx.push({k:'ring',x,y,c,r:r||40,t:0,d:.45})}
function txt(x,y,s,c,big){if(!S.set.dmg&&/^[-+]?\d/.test(String(s)))return;tx.push({x,y,s,c,big,t:0})}
function doCut(s,c,id,sl){cut={s,c,t:1.1,id,sl}}
// Timed combat buffs replace/refresh the previous timed buff; modifiers never multiply-stack.
function applyTimedBuff(multiplier,seconds){bf={t:Math.max(0,Number(seconds)||0),m:Math.max(1,Number(multiplier)||1)};return bf}
/* ===== FLOW ===== */
function mkH(id){RSX[id]={dmg:0,taken:0,heal:0,ult:0,par:0};const d=HEROES[HID[id]],q=eqStat(id),o=S.own[id],sk=o.sk||1,ev=o.evo||0,m=mult(id),hp=d.hp*m*(1+.04*S.sh[3])*(1+q.hp);return{d,i:0,x:0,y:0,hx:0,hy:0,mh:hp,hp,lm:m*(1+q.atk),cb:q.crit+.05*ev,cdm:(1-q.cd)*(1-.02*(sk-1))*(1-.1*ev),skm:(1+.12*(sk-1))*(1+.25*ev),evo:ev,ls:q.ls,asm:1+q.as,dr:q.dr||0,cd:0,at:0,lunge:0,hurt:0,shield:0,poison:0,dead:0,fade:0}}
function layout(){const FR=[[215,245],[195,295],[205,200]],BK=[[110,205],[70,250],[115,295],[80,300],[60,205]];hs.sort((a,b)=>b.d.melee-a.d.melee);let f=0,b=0;hs.forEach((h,i)=>{h.i=i;const p=h.d.melee&&f<3?FR[f++]:BK[b++%5];h.hx=p[0];h.hy=p[1]})}
function saveRun(){if(mode!='main')return;S.run={stage,P,R,runG,hs:hs.map(h=>({id:h.d.id,hp:h.hp,mh:h.mh})),cleared:false,defeated:false};sv()}
function newRun(s0){{const n=S.items.length;if(n>=110)say(n>=ITEM_STORAGE.bag?'Gudang penuh - hadiah baru akan masuk daftar tertunda':'Gudang '+n+'/'+ITEM_STORAGE.bag+' - hampir penuh')}mode='main';TM={};tutT=0;stage=s0||1;combo=0;lb=0;runG=0;stageG=0;R={};bf={t:0,m:1};P={atk:1,cd:1-.03*S.sh[2],crit:.1+.02*S.sh[1],burn:1,ls:0,as:1};hs=S.deck.map(mkH);layout();startStage()}
function contRun(){const r=S.run;if(!r)return;mode='main';TM={};stage=r.stage;P=r.P;R=r.R||{};runG=r.runG||0;stageG=0;combo=0;lb=0;bf={t:0,m:1};const old={};(r.hs||[]).forEach(o=>old[o.id]=o);
if(P.hpm==null){const rt=(r.hs||[]).filter(o=>S.own[o.id]&&o.mh>0).map(o=>o.mh/mkH(o.id).mh).sort((a,b)=>a-b);P.hpm=rt.length?Math.max(.5,Math.min(3,rt[rt.length>>1])):1}
hs=S.deck.map(id=>{const h=mkH(id);h.mh*=P.hpm;const o=old[id];if(r.defeated)h.hp=Math.max(1,h.mh*.5);else h.hp=o&&o.mh>0?Math.max(1,Math.min(h.mh,o.hp/o.mh*h.mh)):h.mh;return h});layout();
if(r.cleared){ch=PK.slice().sort(()=>Math.random()-.5).slice(0,3);phase=0;stageG=0;pendI=[];pendE=0;itemRes=[];essGot=0;st='perk';resT=1;sv();return}
startStage()}
function mkWave(w,boss){if(boss)return[['boss','borc','blich','bslime','bspider','bcyc','bghost'][(stage/5-1)%7|0]];const p=['slime','bat'];if(stage>=2)p.push('spider','goblin');if(stage>=3)p.push('ghost');if(stage>=4)p.push('dmage','gbow');if(stage>=5)p.push('orc');if(stage>=6)p.push('cyclops');const n=Math.min(22,Math.ceil((4+Math.floor(stage*BAL.cnt)+w)*(.3+.7*hs.length/5)*(TM.cnt||1)*[1,1.2,1.4][dif()])),a=[];for(let i=0;i<n;i++)a.push(p[Math.random()*p.length|0]);return a}
function startStage(){stageLootWarned=false;const b=mode==='dungeon'?stage===3:stage%5==0,n=b?2:3;waves=[];for(let w=0;w<n;w++)waves.push(mkWave(w,b&&w==n-1));if(mode=='boss')waves=[[WBL[wkId()%7]]];if(mode=='arena')waves=[arW];if(mode=='event')waves=[];wi=0;es=[];ps=[];tele=[];fx=[];tx=[];sch=[];st='enter';wt=.5;focus=null;tauntT=0;tauntH=null;stageG=0;pendI=[];pendE=0;corps=[];cut={t:0};hs.forEach((h,k)=>{h.x=-30-k*26;h.y=h.hy;h.poison=0;h.fade=0;h.shield=0;h.cd=0});saveRun()}
function spawn(k,x,y,o){const d=Object.assign({},ED[k],o),hm=(1+BAL.hp*(stage-1))*BAL.ex**(stage-1)*BAL.m*(.35+.65*hs.length/5)*DM[dif()]*(TM.hp||1);return{k,d,x,y,mh:d.hp*hm*1.1,hp:d.hp*hm*1.1,am:(1+BAL.at*(stage-1))*Math.sqrt(BAL.ex**(stage-1))*1.2*Math.sqrt(BAL.m)*(.35+.65*hs.length/5)*Math.sqrt(DM[dif()])*(TM.atk||1),cd:Math.random(),burn:0,hurt:0,lunge:0,sk:4,hc:3,stun:0,slow:0,psn:0}}
function spawnWave(l){l.forEach((k,i)=>es.push(spawn(k,ED[k].boss?600:680+i%4*30+rnd(0,30),ED[k].boss?245:rnd(190,310))));if(mode=='arena')es.forEach(e=>{if(e.d.abs){e.mh=e.hp=e.d.abs;e.am=1}});
if(ED[l[0]].boss){if(mode=='boss')es.forEach(e=>{if(e.d.boss)e.mh=e.hp=1e12});sfx('boss');doCut(ED[l[0]].n,'#f55')}else if(stage>=3&&(R.el||Math.random()<.5)){const e=es[es.length-1-(Math.random()*l.length|0)];e.el=['berserk','shield','boom'][Math.random()*3|0];e.mh*=2.5;e.hp=e.mh;e.d=Object.assign({},e.d,{sc:e.d.sc+1,atk:e.d.atk*1.4});if(e.el=='shield')e.sh=e.mh*.5}}
const nearest=(l,x,y)=>l.reduce((a,b)=>Math.hypot(a.x-x,a.y-y)<Math.hypot(b.x-x,b.y-y)?a:b);
const lowest=()=>{const a=hs.filter(h=>!h.dead);return a.length?a.reduce((p,q)=>p.hp/p.mh<q.hp/q.mh?p:q):null};
function heal(h,a){a=Math.round(a*(TM.heal==null?1:TM.heal));const b0=h.hp;h.hp=Math.min(h.mh,h.hp+a);RX(h.d.id).heal+=Math.max(0,h.hp-b0);txt(h.x,h.y-40,'+'+a,'#6f8')}
function dmgH(h,a,e){if(h.dead||h.inv>0)return;if(h.dr>0)a*=1-Math.max(0,Math.min(.25,h.dr));if(h.shield>0)a*=.4;a=Math.max(1,Math.round(a));RX(h.d.id).taken+=a;h.hp-=a;h.hurt=.12;txt(h.x,h.y-40,'-'+a,'#f55');if(typeof hapticPulse==='function')hapticPulse(9);sfx('hurt');burst(h.x,h.y-16,4,'#c33',70,.3,200,2);lb=Math.min(100,lb+1);if(e&&e.d.poison)h.poison=4;if(h.hp<=0){h.dead=1;h.hp=0}}
function hit(e,a,src,crit,magic){if(e.dead)return;if(e.inv>0){txt(e.x,e.y-34,'KEBAL','#a4f');return}if(e.d.evade&&!magic&&Math.random()<.5){txt(e.x,e.y-34,'MISS','#999');return}if(e.d.kind=='lich'&&es.some(x=>x.k=='ghost'&&!x.dead))a*=.35;a=Math.round(a);if(e.el=='shield'&&e.sh>0){e.sh-=a;if(e.sh>0){txt(e.x,e.y-34,'BLOK','#6af');return}a=-e.sh;e.sh=0}if(src&&src.d)RX(src.d.id).dmg+=Math.min(a,Math.max(0,e.hp));if(mode=='boss'&&e.d.boss)wbDmg+=a;e.hp-=a;e.hurt=.12;txt(e.x+rnd(-8,8),e.y-30-e.d.sc*4,a+(crit?'!':''),crit?'#fa3':'#fff',crit);burst(e.x,e.y-14,crit?10:5,crit?'#fd6':'#fff',90,.3,200,2);if(crit){freeze=Math.max(freeze,.05);shake=Math.max(shake,.12)}if(src&&(P.ls+(src.ls||0))>0&&!src.dead)src.hp=Math.min(src.mh,src.hp+a*(P.ls+(src.ls||0)));if(e.hp<=0)kill(e)}
function kill(e){if(e.dead)return;e.dead=1;corps.push({d:e.d,x:e.x,y:e.y,t:0});ring(e.x,e.y,'#fff',22);burst(e.x,e.y-12,12,['#fff','#fc6','#888'],120,.5,250,3);sfx('kill');combo++;ct=3;stat('kills');if(e.d.boss)stat('bossKills');statMax('maxCombo',combo);if(mode=='event')evKills++;if(lbLock<=0)lb=Math.min(100,lb+4+Math.min(combo,10));const gg=Math.round((1+stage/3)*(e.el?5:1)*(R.g||1)*DG[dif()]*(1+.1*S.sh[0])*(1+combo/25));stageG+=gg;txt(e.x,e.y-20,'+'+gg,'#fc4');sfx('coin');if(e.el=='boom'){ring(e.x,e.y,'#f40',70);burst(e.x,e.y,20,['#f80','#fc4'],180,.6,0,4);hs.forEach(q=>{if(Math.hypot(q.x-e.x,q.y-e.y)<70)dmgH(q,40*e.am)})}if(e.d.split)for(let i=0;i<2;i++)es.push(spawn('slime',e.x+rnd(-16,16),e.y+rnd(-14,14),{hp:26,sc:2,split:0}));if(e.d.boss||e.el){freeze=Math.max(freeze,.12);shake=Math.max(shake,.4)}const lootChance=(mode==='dungeon'&&S.dungeons&&Array.isArray(S.dungeons.rooms)&&S.dungeons.rooms.includes(stage))?.1:.35;if(e.el&&Math.random()<lootChance){dropItem(0);say('Item elit dijatuhkan!')}if(e.el)pendE++}
/* ===== PROJECTILES ===== */
function mkP(k,sx,sy,tg,a,h,cr,o){return Object.assign({k,sx,sy,x:sx,y:sy,tg,a,h,cr,t:0,tx:tg?tg.x:0,ty:tg?tg.y-14:0,dur:.4,arc:0,ang:0,c:'#fff'},o)}
function boom(x,y,R2,a,h,big,main){ring(x,y,'#f80',R2);burst(x,y-6,big?34:14,['#ff8','#fb3','#f60','#a30'],big?230:120,.7,-40,big?5:3);burst(x,y-6,big?14:5,'#555',big?90:50,1,-20,big?6:4);sfx(big?'explode':'boomS');if(big){shake=Math.max(shake,.55);freeze=Math.max(freeze,.06);fx.push({k:'fire',x,y,t:0,d:2.2,r:R2*.6})}es.slice().forEach(e=>{if(Math.hypot(e.x-x,e.y-y)<R2){hit(e,e===main?a:a*(big?1:.6),h,0,1);e.burn=(big?4:3)*P.burn}})}
function impact(p){const tg=p.tg,a=p.a;if(p.k=='earrow'||p.k=='eorb'){if(tg)dmgH(tg,a,null);burst(p.tx,p.ty,4,p.k=='eorb'?'#a4f':'#ddd',60,.25,150,2);return}
if(p.k=='arrow'){if(tg){hit(tg,a*(tg.burn>0?1.5:1),p.h,p.cr);sfx('arrowhit');burst(p.tx,p.ty,p.big?12:4,'#ddd',70,.25,150,2)}else{fx.push({k:'stuck',x:p.tx,y:p.ty,t:0,d:1.4});sfx('arrowhit')}}
else if(p.k=='fire')boom(p.tx,p.ty,40,a,p.h,0,tg);
else if(p.k=='meteor')boom(p.tx,p.ty,p.r,a,p.h,p.big,null);
else if(p.k=='orb'){burst(p.tx,p.ty,8,p.c,90,.4,60,3);ring(p.tx,p.ty,p.c,20);sfx('hit');if(tg){hit(tg,a,p.h,p.cr,1);if(p.el=='ice')tg.slow=2.5;if(p.el=='poison'||p.el=='dark'){tg.psn=4;tg.pd=7*(p.h?p.h.lm:1)}}}
else if(p.k=='bolt'){burst(p.tx,p.ty,10,['#fe8','#fff'],110,.4,100,3);ring(p.tx,p.ty,'#fe8',22);sfx('hit');if(tg)hit(tg,a,p.h,p.cr,1)}}
function updP(p,dt){if(p.tg&&p.tg.dead)p.tg=null;if(p.tg){p.tx=p.tg.x;p.ty=p.tg.y-14}p.t+=dt/p.dur;let q=Math.min(1,p.t);if(p.k=='meteor')q=q*q;const nx=p.sx+(p.tx-p.sx)*q,ny=p.sy+(p.ty-p.sy)*q-p.arc*Math.sin(Math.PI*Math.min(1,p.t));if(Math.abs(nx-p.x)+Math.abs(ny-p.y)>.1)p.ang=Math.atan2(ny-p.y,nx-p.x);p.x=nx;p.y=ny;
if(p.k=='fire'||p.k=='meteor'||p.k=='orb'){const m=p.k=='meteor'?3:1;for(let i=0;i<m;i++)pt.push({x:p.x+rnd(-4,4),y:p.y+rnd(-4,4),vx:rnd(-20,20),vy:rnd(-30,10),l:.35,m:.35,c:p.k=='orb'?p.c:['#ff8','#fb3','#f60'][Math.random()*3|0],s:p.k=='meteor'?6:3,g:0})}
if(p.t>=1){p.dead=1;impact(p)}}
/* ===== COMBAT ===== */
function fire(h,tg){const d=h.d,cr=Math.random()<P.crit+h.cb+(d.role=='assassin'?.25:0)+(h.critT>0?1:0),a=d.dm*h.lm*A()*(cr?2:1),l=Math.hypot(tg.x-h.x,tg.y-h.y);h.lunge=1;sfx(d.w);
if(d.melee){fx.push({k:'slash',x:tg.x-8,y:tg.y-14,c:d.role=='assassin'?'#f6a':'#fff',t:0,d:.2});hit(tg,a,h,cr);sfx('hit');tg.x+=3}
else if(d.ty=='arrow')ps.push(mkP('arrow',h.x+8,h.y-20,tg,a,h,cr,{dur:l/480+.05,arc:14}));
else if(d.ty=='orb')ps.push(mkP(d.el=='fire'?'fire':'orb',h.x+10,h.y-24,tg,a,h,cr,{dur:l/300+.05,c:EC[d.el],el:d.el}));
else ps.push(mkP('bolt',tg.x,-20,tg,a,h,cr,{dur:.25}))}
function updH(h,dt){if(h.dead)return;const d=h.d;if(h.stun>0){h.stun-=dt;h.hurt=Math.max(0,h.hurt-dt);return}const slw=h.slow>0?(h.slow-=dt,.5):1;h.cd=Math.max(0,h.cd-dt);h.at-=dt*slw;h.lunge=Math.max(0,h.lunge-dt*4);h.hurt=Math.max(0,h.hurt-dt);h.shield=Math.max(0,h.shield-dt);
if(h.poison>0){h.poison-=dt;h.hp-=4*dt;if(h.hp<=0)h.dead=1}
if(MAN&&st=='fight'&&h===ctlH()){updCtl(h,dt);return}
if(h.dg==null)aiInit(h);h.rfcd=Math.max(0,h.rfcd-dt);if(aiDodge(h,dt))return;
if(!d.melee&&d.role!='tank'&&h.hp<h.mh*.9){const ne=es.find(e=>!e.dead&&!e.d.boss&&Math.hypot(e.x-h.x,e.y-h.y)<46);if(ne){const dx=h.x-ne.x,dy=h.y-ne.y,l=Math.hypot(dx,dy)||1;h.x=Math.max(30,Math.min(470,h.x+dx/l*70*dt));h.y=Math.max(186,Math.min(320,h.y+dy/l*70*dt))}}
if(d.heal&&h.at<=0){const w=healTarget();if(w){h.at=d.it/(P.as*h.asm);heal(w,16*h.lm*A());fx.push({k:'pillar',x:w.x,y:w.y,t:0,d:.6});burst(w.x,w.y-10,6,'#6f8',40,.8,-50,2);h.lunge=1;sfx('heal');return}}
let tg=focus&&!focus.dead?focus:null;if(!tg&&es.length)tg=d.role=='assassin'?es.reduce((a,b)=>a.hp<b.hp?a:b):nearest(es,h.x,h.y);
if(tg&&d.melee&&tg.x>480)tg=null;
if(!tg){if(d.melee){const l=Math.hypot(h.hx-h.x,h.hy-h.y);if(l>3)stepH(h,h.hx,h.hy,80,dt)}return}
const l=Math.hypot(tg.x-h.x,tg.y-h.y);
if(l>d.rng){if(d.melee)stepH(h,tg.x,tg.y,80,dt)}else if(h.at<=0){h.at=d.it/(P.as*h.asm);fire(h,tg)}}
function bossPhase(e){return e&&e.mh>0&&e.hp/e.mh<=.5?2:1}
function bossPhaseCheck(e){if(!e||!e.d||!e.d.boss||e.dead||e.hp<=0)return;const ph=bossPhase(e);e.bossPhase=ph;if(ph===2&&!e.phaseAnnounced){e.phaseAnnounced=true;doCut('FASE 2: '+(e.d.n||'BOSS'),'#f55');ring(e.x,e.y,'#f55',Math.max(52,e.d.sc*10));burst(e.x,e.y-12,18,['#f55','#fc4','#fff'],150,.7,10,4);txt(e.x,e.y-90,'FASE 2!','#f55',1);sfx('boss')}}
function updE(e,dt){const d=e.d;if(mode=='boss'&&d.boss)e.hp=e.mh*(wbT>45?.9:.45);bossPhaseCheck(e);e.lunge=Math.max(0,e.lunge-dt*4);e.hurt=Math.max(0,e.hurt-dt);
if(e.burn>0){e.burn-=dt;e.hp-=8*P.burn*dt;if(mode=='boss'&&d.boss)wbDmg+=8*P.burn*dt;if(Math.random()<dt*8)pt.push({x:e.x+rnd(-6,6),y:e.y-rnd(8,24),vx:0,vy:-40,l:.4,m:.4,c:'#f80',s:3,g:0});if(e.hp<=0){kill(e);return}}
if(e.psn>0){e.psn-=dt;e.hp-=(e.pd||7)*dt;if(Math.random()<dt*6)pt.push({x:e.x+rnd(-6,6),y:e.y-rnd(8,24),vx:0,vy:-30,l:.4,m:.4,c:'#7d3',s:3,g:0});if(e.hp<=0){kill(e);return}}
if(e.stun>0){e.stun-=dt;return}
const sl=e.slow>0?(e.slow-=dt,.5):1;e.cd-=dt*sl;
const al=hs.filter(h=>!h.dead);if(!al.length)return;
if(d.healer){e.hc-=dt;if(e.hc<=0){const w=es.filter(x=>x!==e&&x.hp<x.mh);if(w.length){const q=w.reduce((a,b)=>a.hp/a.mh<b.hp/b.mh?a:b);q.hp=Math.min(q.mh,q.hp+60);ring(q.x,q.y,'#6f8',24);txt(q.x,q.y-34,'+60','#6f8');e.hc=3}else e.hc=.5}}
if(d.boss){const kd=d.kind;
if(kd=='orc'){e.sk-=dt;if(!e.sm&&e.hp<e.mh*.5){e.sm=1;es.forEach(x=>x.rage=1.6);txt(e.x,e.y-90,'RAUNGAN!','#f66',1);doCut('RAUNGAN PERANG','#f55');sfx('boss')}if(e.sk<=0){e.sk=e.sm?3.8:5.5;const q=al[Math.random()*al.length|0];tele.push({k:'row',x:0,y:q.y,r:30,t:0,dur:1.3,a:45*e.am});if(e.sm)tele.push({k:'row',x:0,y:rnd(190,310),r:30,t:0,dur:1.3,a:45*e.am})}}
else if(kd=='slime'){e.sk-=dt;if(e.th==null)e.th=.75;if(e.th>0&&e.hp<e.mh*e.th){e.th-=.25;for(let i=0;i<4;i++)es.push(spawn('slime',e.x+rnd(-70,10),rnd(190,310),{hp:30,sc:2,split:0}));txt(e.x,e.y-90,'PECAH!','#6f8',1);sfx('boss')}if(e.sk<=0){e.sk=6;const q=al[Math.random()*al.length|0];tele.push({x:q.x,y:q.y,r:64,t:0,dur:1.4,a:60*e.am})}}
else if(kd=='spider'){e.sk-=dt;e.w=e.w==null?3:e.w-dt;if(e.w<=0){e.w=5;for(let i=0;i<2;i++)es.push(spawn('spider',e.x-rnd(20,60),rnd(190,310)));sfx('poison');txt(e.x,e.y-90,'LABA-LABA!','#7d3',1)}if(e.sk<=0){e.sk=6.5;for(let i=0;i<(e.hp<e.mh*.5?2:1);i++){const q=al[Math.random()*al.length|0];tele.push({x:q.x,y:q.y,r:60,t:0,dur:1.4,a:30*e.am,web:1})}}}
else if(kd=='cyc'){e.sk-=dt;if(!e.sm&&e.hp<e.mh*.5){e.sm=1;e.rage=1.5;doCut('FURIA','#f55');sfx('boss')}if(e.sk<=0){e.sk=e.sm?4:5.5;for(let i=0;i<(e.sm?4:3);i++){const q=al[Math.random()*al.length|0];tele.push({x:q.x+rnd(-20,20),y:q.y+rnd(-20,20),r:50,t:0,dur:1.3,a:55*e.am,stun:1.5})}}}
else if(kd=='ghostk'){e.sk-=dt;e.inv=Math.max(0,(e.inv||0)-dt);if(e.sk<=0){e.sk=8;e.inv=3;e.hp=Math.min(e.mh,e.hp+e.mh*.05);for(let i=0;i<3;i++)es.push(spawn('ghost',e.x-rnd(20,80),rnd(190,310)));txt(e.x,e.y-90,'MENGHILANG!','#a4f',1);sfx('dark')}}
else if(kd=='lich'){e.sk-=dt;if(e.sk<=0){e.sk=7.5;for(let i=0;i<2;i++)es.push(spawn('ghost',e.x-rnd(30,60),rnd(190,310)));txt(e.x,e.y-90,'ARWAH!','#a4f',1);sfx('dark')}if(!e.sm&&e.hp<e.mh*.5){e.sm=1;const q=al[Math.random()*al.length|0];tele.push({x:q.x,y:q.y,r:70,t:0,dur:1.4,a:60*e.am})}}
else{if(!e.sm&&e.hp<e.mh*.5){e.sm=1;for(let i=0;i<3;i++)es.push(spawn('bat',e.x+rnd(-30,0),rnd(190,310)));txt(e.x,e.y-80,'PANGGIL!','#f66',1)}e.sk-=dt;if(e.sk<=0){e.sk=e.hp<e.mh*.5?4.5:6;for(let i=0;i<(e.hp<e.mh*.5?2:1);i++){const q=al[Math.random()*al.length|0];tele.push({x:q.x,y:q.y,r:64,t:0,dur:1.4,a:70*e.am})}}}}
let tg=tauntT>0&&tauntH&&!tauntH.dead?tauntH:null;
if(!tg){if(d.fly){if(!e.tg||e.tg.dead){const b=al.filter(h=>!h.d.melee),l=b.length?b:al;e.tg=l[Math.random()*l.length|0]}tg=e.tg}else tg=nearest(al,e.x,e.y)}
const l=Math.hypot(tg.x-e.x,tg.y-e.y),sp=d.spd*(TM.spd||1)*sl*(e.rage||1)*(e.el=='berserk'&&e.hp<e.mh/2?1.8:1);
if(l>d.rng)e.x+=(tg.x-e.x)/l*sp*dt,e.y+=(tg.y-e.y)/l*sp*dt;else if(e.cd<=0){e.cd=d.it;e.lunge=1;if(d.rangedA||d.kind=='lich'){ps.push(mkP(d.kind=='lich'||d.orb?'eorb':'earrow',e.x-8,e.y-14,tg,d.atk*e.am,null,0,{dur:l/330+.05,c:d.oc||'#a4f',arc:d.kind=='lich'||d.orb?0:10}));sfx(d.kind=='lich'?'dark':d.orb?'magic':'arrow')}else dmgH(tg,d.atk*e.am,e)}}
function cast(h){if(h.dead||h.cd>0||st!='fight')return;const d=h.d,k=d.sk,pw=d.pw*h.skm,a=d.dm*h.lm*A()*pw,L=es.slice(),near=(r)=>L.filter(e=>Math.hypot(e.x-h.x,e.y-h.y)<r);
if(['dash','rain','meteor','chain','nova','cloud','snipe','smite'].includes(k)&&!L.length)return;if(['whirl','quake','nova'].includes(k)&&!near(150).length)return;
switch(k){
case'wall':tauntT=4.5;tauntH=h;h.shield=4.5;ring(h.x,h.y,'#6af',80);burst(h.x,h.y-16,16,['#6af','#fff'],110,.6,0,3);sfx('shield');break;
case'whirl':ring(h.x,h.y,'#fff',85);burst(h.x,h.y-12,14,'#fff',160,.4,0,3);sfx(d.w=='spear'?'spear':'sword');fx.push({k:'slash',x:h.x+10,y:h.y-14,c:'#fff',t:0,d:.3},{k:'slash',x:h.x-10,y:h.y-14,c:'#fff',t:0,d:.3,f:1});near(90).forEach(e=>hit(e,a*2.8,h,0));break;
case'dash':{const e=L.reduce((p,q)=>p.hp<q.hp?p:q);burst(h.x,h.y-12,10,'#f6a',90,.5,0,4);sfx('slash');h.x=e.x-26;h.y=e.y;burst(h.x,h.y-12,10,'#f6a',90,.5,0,4);fx.push({k:'slash',x:e.x,y:e.y-14,c:'#f6a',t:0,d:.3},{k:'slash',x:e.x+4,y:e.y-10,c:'#fff',t:0,d:.3,f:1});after(.08,()=>{if(!e.dead){hit(e,a*4.5,h,1);sfx('sword')}});break}
case'rain':sfx('arrow');L.forEach(e=>{for(let j=0;j<2;j++)after(rnd(0,.7),()=>{if(!e.dead)ps.push(mkP('arrow',e.x-rnd(40,110),-rnd(40,120),e,a*.85,h,0,{dur:.42}));sfx('arrow')})});for(let i=0;i<12;i++){const e=L[i%L.length],x=e.x+rnd(-60,60),y=e.y+rnd(-30,30);after(rnd(0,.8),()=>ps.push(mkP('arrow',x-rnd(40,100),-rnd(40,120),null,0,h,0,{tx:x,ty:y,dur:.42})))}break;
case'meteor':{sfx('magic');const c=L.reduce((p,q)=>L.filter(z=>Math.hypot(z.x-p.x,z.y-p.y)<80).length>=L.filter(z=>Math.hypot(z.x-q.x,z.y-q.y)<80).length?p:q);[[c.x,c.y,85,a*4,1],[c.x-60,c.y-30,50,a*1.6,0],[c.x+55,c.y+30,50,a*1.6,0],[c.x+20,c.y-50,50,a*1.6,0],[c.x-30,c.y+45,50,a*1.6,0]].forEach((q,i)=>after(i*.22,()=>{fx.push({k:'warn',x:q[0],y:q[1],r:q[2],t:0,d:.75});sfx('fire');ps.push(mkP('meteor',q[0]+240,-50,null,q[3],h,0,{tx:q[0],ty:q[1],dur:.75,r:q[2],big:q[4]}))}));break}
case'heal':hs.forEach(x=>{if(!x.dead){heal(x,x.mh*.4*pw);x.poison=0;fx.push({k:'pillar',x:x.x,y:x.y,t:0,d:.9});burst(x.x,x.y-10,10,['#fe8','#fff'],50,1,-70,2)}});sfx('heal');break;
case'chain':L.sort(()=>Math.random()-.5).slice(0,5).forEach((e,i)=>after(i*.09,()=>{if(!e.dead)ps.push(mkP('bolt',e.x,-20,e,a*2,h,0,{dur:.15}))}));sfx('magic');break;
case'nova':ring(h.x,h.y,'#8cf',130);burst(h.x,h.y-10,24,['#8cf','#fff'],200,.7,60,3);sfx('ice');near(130).forEach(e=>{hit(e,a*2.2,h,0,1);e.slow=3.5});break;
case'cloud':sfx('poison');L.forEach(e=>{e.psn=6;e.pd=10*pw*h.lm;burst(e.x,e.y-10,8,'#7d3',50,.8,-20,3);hit(e,a*.6,h,0,1)});break;
case'cry':applyTimedBuff(1+.35*pw,6);ring(h.x,h.y,'#f84',100);burst(h.x,h.y-12,18,['#f84','#fc4'],130,.7,0,3);sfx('magic');break;
case'snipe':{const e=L.reduce((p,q)=>p.hp>q.hp?p:q);ps.push(mkP('arrow',h.x+8,h.y-20,e,a*6,h,1,{dur:.18,big:1}));sfx(d.melee?'sword':'arrow');if(d.melee){h.x=e.x-26;h.y=e.y}break}
case'barrier':hs.forEach(x=>{if(!x.dead){x.shield=3.5*pw;ring(x.x,x.y,'#8cf',40);if(d.role=='healer')heal(x,x.mh*.15)}});sfx('shield');break;
case'revive':{const dd=hs.find(x=>x.dead);if(dd){dd.dead=0;dd.hp=dd.mh*.5;dd.fade=0;fx.push({k:'pillar',x:dd.x,y:dd.y,t:0,d:1});txt(dd.x,dd.y-40,'BANGKIT!','#6f8',1);sfx('heal')}else{const w=lowest();if(w)heal(w,w.mh*.6);sfx('heal')}break}
case'smite':{const e=L.reduce((p,q)=>p.hp>q.hp?p:q);ps.push(mkP('bolt',e.x,-20,e,a*4,h,1,{dur:.2}));const w=lowest();if(w)heal(w,w.mh*.3);sfx('magic');break}
case'quake':ring(h.x,h.y,'#a85',140);burst(h.x,h.y,20,['#a85','#fc8'],160,.6,200,4);shake=.6;sfx('slam');near(140).forEach(e=>{hit(e,a*1.6,h,0);e.stun=1.8});break}
doCut(d.skn,RC[d.rar],d.id,1);h.cd=d.cd*P.cd*h.cdm;sfx('cast');shake=Math.max(shake,.2)}
