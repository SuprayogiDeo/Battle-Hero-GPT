const inL=(a,b)=>S.set&&S.set.lang==='en'?b:a;
/* INPUT */
cv.addEventListener('pointerdown',ev=>{if(ev.cancelable)ev.preventDefault();au();AC.resume();const r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)*VW/r.width-OX,y=(ev.clientY-r.top)*360/r.height;
if(showStat){showStat=0;sfx('click');return}
if(st=='worldmap'){hbWorldMapClick(x,y);return}
if(st=='dungeonres'){hbDungeonResultClick(x,y);return}
if(st=='storage'||st=='workshop'){lifeInputState(x,y);return}
if(st=='world'){worldDown(ev.pointerId,x,y);return}
if(st=='howto'){howClick(x,y);return}
if(st=='quests'){questClick(x,y);return}
if(st=='ranch'){ranchClick(x,y);return}
if(st=='market'){marketClick(x,y);return}
if((st=='perk'||st=='bossres'||st=='arenares'||st=='eventres')&&x>8&&x<108&&y>(st=='perk'?8:330)&&y<(st=='perk'?32:354)){showStat=1;sfx('click');return}
if(st=='menu'){menuB().forEach(m=>{if(x>m[2]&&x<m[2]+m[4]&&y>m[3]&&y<m[3]+m[5]){sfx('click');wFrom=0;const k=m[1];if(k=='play')newRun(1);else if(k=='howto'){howP=0;st='howto'}else if(k=='cont')contRun();else if(k=='daily'){if(S.day!=today()){S.day=today();S.g+=80;sv();sfx('coin');say(inL('+80 emas','+80 gold'))}else say('Sudah diambil hari ini')}else if(k=='world')worldEnter();else{wbCheck();st=k}}});return}
if(st=='summon'){if(sumT<0){sumT=0;sumR=0;return}if(sumT<=sumL.length/8+.3){sumT=99;sumR=0;return}if(sumR>.8&&x>230&&x<410&&y>318&&y<352){st='shop';sfx('click')}return}
if(st=='arena'){if(y<34&&x<80){st='menu';sfx('click');return}S.ar.opp.forEach((o,i)=>{const bx=20+i*205+37;if(x>bx&&x<bx+120&&y>168&&y<192)newArena(i)});if(x>230&&x<410&&y>228&&y<250){if(S.g>=20){S.g-=20;genOpps();sv();sfx('click')}else say('Emas tidak cukup')}ART.forEach((r,i)=>{const px=10+i*126;if(x>px&&x<px+120&&y>274&&y<350)claimAr(i)});return}
if(st=='arenares'){if(resT>1.2&&resBtnHit(x,y,250)){st='arena';sfx('click')}return}
if(st=='event'){if(y<34&&x<80){st='menu';sfx('click');return}for(let i=0;i<5;i++)if(x>560&&x<624&&y>92+i*36&&y<116+i*36)claimEv(i);if(x>40&&x<260&&y>278&&y<318)newEvent();return}
if(st=='eventres'){if(resT>1.2&&resBtnHit(x,y,275)){st='event';sfx('click')}return}
if(st=='tower'){if(y<34&&x<80){goBack();sfx('click');return}if(x>190&&x<450&&y>214&&y<264){newTower();sfx('click')}return}
if(st=='boss'){if(y<34&&x<80){st='menu';sfx('click');return}for(let i=0;i<5;i++)if(x>560&&x<624&&y>92+i*36&&y<116+i*36)claimTier(i);if(x>40&&x<260&&y>266&&y<306)newBoss();return}
if(st=='bossres'){if(resT>1.2&&resBtnHit(x,y,260)){st='boss';sfx('click')}return}
if(st=='overflow'){overflowClick(x,y);return}
if(st=='gear'){if(y<34&&x<80){st=gearBack||'heroes';gearBack='heroes';sfx('click');return}if(y>=34&&y<=60&&x>=80&&x<270){openOverflow('gear');return}if(sellDlg){if(y>232&&y<260){if(x>170&&x<310){const c=sellList(sellDlg.r),tot=c.reduce((a,i)=>a+iSell(i),0);if(c.length){c.forEach(i=>S.items.splice(S.items.indexOf(i),1));S.g+=tot;gsel=null;sv();sfx('coin');say('Terjual '+c.length+' item (+'+tot+' emas)')}sellDlg=null}else if(x>330&&x<470){sellDlg=null;sfx('click')}}else if(y>150&&y<176&&x>230&&x<410){sellDlg.r=(sellDlg.r+1)%3;sfx('click')}return}
if(y>=34&&y<=60&&x>=320&&x<436){sellDlg={r:0};sfx('click');return}
if(y>=34&&y<=60&&x>=440){const n=autoEquip();say(n?'Auto pasang: '+n+' perubahan':'Gear sudah yang terbaik');sfx(n?'shield':'click');return}const L=gearList();
if(y>66&&y<234){const c=Math.floor((x-10)/52),r=Math.floor((y-66)/56),i=gpage*36+r*12+c;if(c>=0&&c<12&&L[i]){gsel=L[i].u;sfx('click')}return}
const it=S.items.find(q=>q.u==gsel);
if(y>304&&y<334){if(x>560&&x<590&&gpage>0)gpage--;else if(x>596&&x<626&&(gpage+1)*36<L.length)gpage++;
else if(it&&x>130&&x<228){const e=S.eq[selH]=S.eq[selH]||{};if(e[gslot]==it.u)delete e[gslot];else{Object.keys(S.eq).forEach(q=>{if(S.eq[q][gslot]==it.u)delete S.eq[q][gslot]});e[gslot]=it.u}sv();sfx('shield')}
else if(it&&x>232&&x<372){const c=iUp(it);if(it.lv>=10)say('Level maks');else if(S.g>=c){S.g-=c;it.lv++;sv();sfx('heal')}else say('Emas tidak cukup')}
else if(it&&x>468&&x<552){it.lk=!it.lk;sv();sfx('click');say(it.lk?'Item dikunci: aman dari jual & auto pasang':'Kunci dibuka')}
else if(it&&x>378&&x<464){if(it.lk)say('Buka kunci dulu sebelum dijual');else if(equippedBy(it.u))say('Lepas dulu sebelum dijual');else{S.g+=iSell(it);S.items.splice(S.items.indexOf(it),1);gsel=null;sv();sfx('coin')}}}
return}
if(st=='shop'&&fullDlg){fullClick(x,y);return}
if(st=='heroes'||st=='shop'||st=='stages'){if(y<34&&x<80){goBack();sfx('click');return}
if(st=='heroes'){if(y>=36&&y<=56&&x>=400){if(x<514){const a=autoSquad(),b=autoEquip();say(a||b?'Pasukan & gear dioptimalkan':'Sudah susunan terbaik')}else S.ad=S.ad?0:1;sv();sfx('click');return}for(let i=0;i<5;i++){const sx=150+i*46;if(x>sx&&x<sx+40&&y>22&&y<60&&S.deck[i]){if(S.deck.length>1){S.deck.splice(i,1);sv();sfx('click')}else say('Minimal 1 pahlawan di pasukan')}}
if(x>=564&&y>=66&&y<=232){const k=Math.floor((y-66)/24);if(k>=0&&k<=6&&y-66-k*24<=22){setHF(k-1);sfx('click');return}}
{const L=hLay();L.cols.forEach((c,k)=>{if(!c.op&&x>c.x&&x<c.x+c.w&&y>58&&y<236){setHF(k);sfx('click')}else if(c.op&&hf>=0&&x>c.x&&x<c.x+c.w&&y>58&&y<76){setHF(-1);sfx('click')}});HEROES.forEach(d=>{const q=L.pos[d.id];if(q&&x>q[0]&&x<q[0]+q[2]&&y>q[1]&&y<q[1]+q[3]){selH=d.id;sfx('click')}})}const o=S.own[selH];
if(o&&y>328&&y<358){if(x>130&&x<248){const c=lvc(selH);if(S.g>=c&&o.lv<30){S.g-=c;o.lv++;stat('ups');sv();sfx('heal')}else say(o.lv>=30?'Level maks':'Emas tidak cukup')}
else if(x>254&&x<372){const c=skUp(selH);if((o.sk||1)>=skcap(selH))say(inL('Skill maks. Naikkan Evolusi untuk batas lebih tinggi.','Skill maxed. Raise Evolution for a higher cap.'));else if(S.g>=c){S.g-=c;o.sk=(o.sk||1)+1;stat('ups');sv();sfx('cast')}else say('Emas tidak cukup')}else if(x>378&&x<496){const r=evoReq(selH);if(!r)say('Evolusi maksimal');else if(evoOK(selH)){S.g-=r.g;S.es-=r.es;o.evo=(o.evo||0)+1;stat('ups');sv();sfx('limit');flash=.6;say(inL('Evolusi berhasil. Stat dan skill naik.','Evolution done. Stats and skills went up.'))}else say('Butuh Lv'+r.lv+', Bintang '+r.st+', '+r.g+' emas, '+r.es+' Esensi')}else if(x>502&&x<620){const k=S.deck.indexOf(selH);if(k>=0){if(S.deck.length>1)S.deck.splice(k,1);else say('Minimal 1 pahlawan di pasukan')}else if(S.deck.length<5)S.deck.push(selH);else say('Pasukan penuh (maks 5)');sv();sfx('click')}}}
if(st=='heroes'&&S.own[selH]&&y>262&&y<316)for(let i=0;i<3;i++){const sx=455+i*60;if(x>sx&&x<sx+54){gslot=['w','a','x'][i];gsel=null;gpage=0;gearBack='heroes';st='gear';sfx('click');return}}
if(st=='shop'){if(y>36&&y<64)[0,1,2,3].forEach(i=>{if(x>20+i*105&&x<118+i*105){shopTab=i;sfx('click')}});if(shopTab<2&&y>64&&y<84&&x>448&&x<630){if(shopTab)gcatOpen=!gcatOpen;else catOpen=!catOpen;sfx('click');return}if(shopTab==0&&catOpen&&y>70&&y<286&&x>=110){const hr=catRows()[Math.floor((y-70)/54)],hc=hr&&hr[Math.floor((x-110)/56)];if(hc){catSel=hc.id;sfx('click')}}if(shopTab==1&&!gcatOpen&&y>298&&y<346){if(x>20&&x<205)pullE(1);else if(x>213&&x<398)pullE(10);else if(x>406&&x<620){S.ad=S.ad?0:1;sv();sfx('click')}}
if(shopTab==0&&!catOpen&&y>190&&y<260){if(x>80&&x<300)pull(1);else if(x>340&&x<560)pull(10)}
if(shopTab==2&&y>105&&y<305)offers().forEach((id,i)=>{const px=40+i*190;if(x>px&&x<px+170&&!S.bought.includes(id)){const pr=PRICE[HEROES[HID[id]].rar];if(S.g>=pr){S.g-=pr;S.bought.push(id);say(giveHero(id));sv();sfx('clear')}else say('Emas tidak cukup')}});
if(shopTab==3&&y>90&&y<260)SH.forEach((s,i)=>{const px=20+i*150;if(x>px&&x<px+140&&S.g>=shc(i)&&S.sh[i]<10){S.g-=shc(i);S.sh[i]++;sv();sfx('heal')}})}
if(st=='stages'&&y>316&&y<344){[0,1,2].forEach(i=>{if(x>60+i*190&&x<240+i*190){if((i==1&&best<5)||(i==2&&best<15))say('Capai stage '+(i==1?5:15)+' dulu');else{S.diff=i;sv();sfx('click')}}});return}
if(st=='stages')STG().forEach((v,i)=>{const px=40+(i%5)*110,py=80+Math.floor(i/5)*70;if(x>px&&x<px+100&&y>py&&y<py+56&&(v==1||v<=best)){newRun(v);sfx('click')}});return}
if(st=='settings'){setClick(x,y);return}
if(st=='over'){if(resT<1.6)return;if(y>252&&y<280){const rt=mode=='main'||mode=='tower'||mode=='dungeon';if(rt&&x>140&&x<310){sfx('click');if(mode=='tower')newTower();else if(mode=='dungeon')hbRetryDungeon();else newRun(stage)}else if((rt&&x>330&&x<500)||(!rt&&x>220&&x<420)){if(mode==='dungeon')worldResume();else goBack();sfx('click')}}return}
if(st=='pause'){if(x>220&&x<420){if(y>116&&y<152){st='fight';sfx('click')}else if(y>156&&y<192){showStat=1;sfx('click')}else if(y>196&&y<232){setBack='pause';st='settings';sfx('click')}else if(y>236&&y<272){if(pcf>0){stageG=0;pendI=[];pendE=0;pcf=0;goBack()}else pcf=2.5;sfx('click')}}return}
if(st=='perk'){if(resT<.9)return;ch.forEach((p,i)=>{const px=45+i*190;if(x>px&&x<px+170&&y>110&&y<230){p[2]();resT=0;sfx('click');if(!phase){phase=1;ch=RT.slice().sort(()=>Math.random()-.5).slice(0,3)}else{phase=0;stage++;if(mode==='dungeon'){if(stage<=3)startStage();else hbFinishDungeon()}else startStage()}}});return}
if(st!='fight')return;
if(y<30&&x>384&&x<452){MAN=!MAN;Save.writeMan(MAN);jid=aid=null;jx=jy=atkH=0;sfx('click');return}
if(MAN&&y>=30&&y<316&&ctlDown(ev.pointerId,x,y))return;
if(y<30&&x>250&&x<380){limit();return}
if(y<32&&x>484&&x<538){st='pause';sfx('click');return}
if(y<32&&x>=538){if(x<600)auto=!auto;else spdm=spdm==1?2:1;return}
if(y>316){const n=hs.length,bw=Math.min(118,Math.floor(620/n)-8),i=Math.floor((x-10)/(bw+8)),h=hs[i];if(h){const cx=10+i*(bw+8)+bw-11;if(lb>=100&&!h.dead&&Math.hypot(x-cx,y-329)<17)limit(h);else cast(h)}return}
for(const k of tele)if(k.k=='row'?Math.abs(y-k.y)<k.r:Math.hypot(x-k.x,y-k.y)<k.r){k.dead=1;ring(k.x,k.y,'#6f8',k.r);burst(k.x,k.y,12,'#6f8',120,.5,0,3);txt(k.x,k.y-20,'TANGKIS!','#6f8',1);sfx('parry');stat('parries');if(lbLock<=0)lb=Math.min(100,lb+4);return}
const c=es.filter(e=>Math.hypot(e.x-x,e.y-14-y)<10+e.d.sc*5);if(c.length){const e=c[0];focus=focus===e?null:e}});
/* Profiling ring buffer is opt-in (?perf=1); no timing/UI overhead in normal sessions. */
const HB_PERF_ENABLED=/(?:^|[?&])perf=1(?:&|$)/.test(location.search||'');
const HB_PERF_STATE={enabled:HB_PERF_ENABLED,fps:null,avgFPS:null,heapMB:null,heapLimitMB:null,frames:0,windowFrames:0,windowStart:0,lastFrame:0,samples:[]};
function hbPerfSample(now){if(!HB_PERF_ENABLED)return;const p=HB_PERF_STATE;p.frames++;p.windowFrames++;if(p.lastFrame){const d=Math.max(.01,now-p.lastFrame);p.samples.push(d);if(p.samples.length>300)p.samples.shift();}p.lastFrame=now;if(!p.windowStart)p.windowStart=now;if(now-p.windowStart>=1000){p.fps=Math.max(0,(p.windowFrames-1)*1000/(now-p.windowStart));const mean=p.samples.length?p.samples.reduce((a,b)=>a+b,0)/p.samples.length:0;p.avgFPS=mean?1000/mean:p.fps;p.windowFrames=0;p.windowStart=now;try{const m=performance.memory;if(m&&Number.isFinite(m.usedJSHeapSize)){p.heapMB=m.usedJSHeapSize/1048576;p.heapLimitMB=Number.isFinite(m.jsHeapSizeLimit)?m.jsHeapSizeLimit/1048576:null;}}catch(e){p.heapMB=null;p.heapLimitMB=null;}}}
function hbPerfStats(){const p=HB_PERF_STATE;return{enabled:p.enabled,fps:p.fps,avgFPS:p.avgFPS,heapMB:p.heapMB,heapLimitMB:p.heapLimitMB,frames:p.frames};}
let last=performance.now();function loop(n){let dt=Math.min(.05,(n-last)/1000);const rdt=dt;last=n;hbPerfSample(n);if(st!='pause'&&ucut.t>0){ucut.t-=dt;const el=ucut.m-ucut.t,hh=ucut.h;if(!ucut.fired){if(hh)hh.lift=Math.sin(Math.min(1,el/ucut.rel)*1.57)*16;if(hh&&Math.random()<.85){const an=rnd(0,6.28),r=rnd(50,95);pt.push({x:hh.x+Math.cos(an)*r,y:hh.y-14+Math.sin(an)*r*.7,vx:-Math.cos(an)*r*2.6,vy:-Math.sin(an)*r*1.8,l:.32,m:.32,c:ucut.c,s:rnd(2,4),g:0})}if(el>=ucut.rel){ucut.fired=1;if(hh)hh.lift=0;ultFire(hh)}}}flushT-=dt;if(qDirty&&flushT<=0){qDirty=0;flushT=6;sv()}if(freeze>0){freeze-=dt;dt*=.15}dt*=spdm;t+=dt;sumT+=dt;
if(st=='fight')upd(dt);else if(st=='walk')updWalk(dt);else if(st=='enter')updEnter(dt);else if(st=='world')updWorld(rdt);else if(st=='ranch')ranchUpdate(rdt);if(st!='pause')common(dt);pcf=Math.max(0,pcf-rdt);sumR=(st=='summon'&&sumT>=0)?sumR+rdt:0;resT=(st=='over'||st=='perk'||st=='bossres'||st=='arenares'||st=='eventres')?resT+rdt:0;
if(AC){const w=(st=='fight'||st=='walk'||st=='enter'||st=='perk'||st=='pause')?'battle':'title';if(w!=curM)playM(w)}
draw();requestAnimationFrame(loop)}
