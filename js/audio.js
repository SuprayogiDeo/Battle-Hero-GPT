/* ===== AUDIO ===== */
let AC,MG,MB,SB,DL,muted=false,inMus=0;function applyVol(){if(MB){MB.gain.value=S.set.bgm?S.set.mv/10:0;SB.gain.value=S.set.sv/10}}const SMP={},MUS={};let curM='',mSrc=null;
const SN=['arrow','arrowhit','fire','explode','sword','slash','spear','ice','dark','poison','heal','shield','magic','hurt','kill','portal','coin','click','hit','cast','clear','slam','parry','limit','boss'];
function ld(n,s2,u){fetch(u).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(b=>AC.decodeAudioData(b)).then(d=>{s2[n]=d;if(s2===MUS&&n==curM){curM='';playM(n)}}).catch(()=>{})}
function au(){if(AC)return AC;AC=new(window.AudioContext||webkitAudioContext)();MG=AC.createGain();MG.gain.value=muted?0:.8;MB=AC.createGain();SB=AC.createGain();MB.connect(MG);SB.connect(MG);applyVol();const cp=AC.createDynamicsCompressor();MG.connect(cp);cp.connect(AC.destination);DL=AC.createDelay();DL.delayTime.value=.24;const fb=AC.createGain();fb.gain.value=.3;DL.connect(fb);fb.connect(DL);const w=AC.createGain();w.gain.value=.28;DL.connect(w);w.connect(MG);SN.forEach(n=>ld(n,SMP,'audio/'+n+'.ogg'));['title','battle'].forEach(n=>ld(n,MUS,'audio/'+n+'.ogg'));return AC}
let mGain=null;
function playM(n){if(curM==n&&mSrc)return;curM=n;if(!AC)return;const t0=AC.currentTime,old=mSrc,og=mGain,b=MUS[n];
if(old){try{og.gain.cancelScheduledValues(t0);og.gain.setValueAtTime(og.gain.value,t0);og.gain.linearRampToValueAtTime(0,t0+.9);old.stop(t0+1)}catch(e){try{old.stop()}catch(_){}}mSrc=null;mGain=null}
if(!b)return;mSrc=AC.createBufferSource();mSrc.buffer=b;mSrc.loop=true;const q=AC.createGain();q.gain.setValueAtTime(0,t0);q.gain.linearRampToValueAtTime(.45,t0+(old?.9:.3));mSrc.connect(q);q.connect(MB);mSrc.start();mGain=q}
function tone(f,d,ty,v,o){o=o||{};const c=au(),n=c.currentTime+(o.at||0),os=c.createOscillator(),a=c.createGain(),fl=c.createBiquadFilter();os.type=ty;os.frequency.setValueAtTime(f,n);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,n+d);fl.type='lowpass';fl.frequency.value=o.lp||5000;a.gain.setValueAtTime(.0001,n);a.gain.linearRampToValueAtTime(v,n+(o.atk||.005));a.gain.exponentialRampToValueAtTime(.0001,n+d);os.connect(fl);fl.connect(a);a.connect(inMus?MB:SB);if(o.dl){const sg=c.createGain();sg.gain.value=(inMus?S.set.mv:S.set.sv)/10;a.connect(sg);sg.connect(DL)}os.start(n);os.stop(n+d+.05)}
function nz(d,v,fr,q,o){o=o||{};const c=au(),n=c.currentTime+(o.at||0),b=c.createBuffer(1,(c.sampleRate*d|0)||1,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(fr,n);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,n+d);const g2=c.createGain();g2.gain.setValueAtTime(v,n);g2.gain.exponentialRampToValueAtTime(.0001,n+d);s.connect(f);f.connect(g2);g2.connect(SB);s.start(n)}
const crk=(n,a,b)=>{for(let i=0;i<n;i++)nz(.03,.3,rnd(1800,7000),3,{at:rnd(a,b)})};
const lastS={};
function sfx(n){if(muted||S.set.sv==0)return;try{const c=au();if(lastS[n]>c.currentTime-.05)return;lastS[n]=c.currentTime;
if(SMP[n]){const s=c.createBufferSource();s.buffer=SMP[n];s.playbackRate.value=rnd(.94,1.06);s.connect(SB);s.start();return}
switch(n){
case'hit':nz(.1,.25,1200,1);tone(140,.12,'sine',.35,{to:55});break;
case'slash':nz(.15,.3,3000,1.2,{to:7500});tone(2600,.3,'sine',.03,{dl:1});break;
case'sword':nz(.14,.25,2500,1.2,{to:6000});nz(.06,.3,2800,2,{at:.08});tone(1500,.4,'square',.03,{to:1440,lp:5000,dl:1,at:.08});tone(150,.1,'sine',.3,{to:60,at:.08});break;
case'spear':nz(.1,.25,1800,1.5,{to:4500});tone(130,.1,'sine',.3,{to:60,at:.07});nz(.04,.2,2400,2,{at:.07});break;
case'arrow':nz(.25,.22,2200,1.4,{to:700});tone(300,.16,'triangle',.12,{to:150});tone(600,.1,'sine',.05,{to:300});break;
case'arrowhit':tone(190,.07,'square',.1,{to:80,lp:900});nz(.05,.2,1800,2);tone(900,.08,'triangle',.04,{to:700});break;
case'fire':nz(.6,.32,350,.7,{to:1700});tone(80,.7,'sawtooth',.14,{lp:260});crk(10,0,.55);break;
case'ice':tone(1400,.35,'triangle',.08,{to:2600,dl:1});nz(.25,.12,6000,2);tone(2200,.4,'sine',.04,{dl:1,at:.05});break;
case'dark':tone(130,.45,'sawtooth',.1,{to:60,lp:500});nz(.35,.12,500,1,{to:150});break;
case'poison':nz(.35,.16,900,1.5,{to:300});tone(320,.25,'sine',.05,{to:140});break;
case'boomS':tone(110,.28,'sine',.35,{to:42});nz(.25,.25,700,1,{to:200});crk(4,0,.2);break;
case'explode':tone(70,1,'sine',.75,{to:24});nz(1,.55,380,.5,{to:70});tone(120,.6,'sawtooth',.15,{to:40,lp:400});crk(14,0,.9);break;
case'magic':tone(500,.4,'sine',.1,{to:960,dl:1});tone(1000,.4,'triangle',.05,{to:1900,dl:1,at:.05});nz(.3,.06,4000,2,{to:8000});break;
case'heal':[880,1175,1568,2093].forEach((f,i)=>tone(f,.55,'sine',.09,{at:i*.07,dl:1}));break;
case'shield':tone(220,.5,'triangle',.18,{to:340});nz(.4,.16,1200,1,{to:3200});tone(1760,.6,'sine',.05,{dl:1});break;
case'hurt':tone(110,.12,'sawtooth',.1,{to:70,lp:600});nz(.06,.15,900,1);break;
case'kill':tone(280,.18,'triangle',.16,{to:70});nz(.08,.14,900,1);break;
case'cast':nz(.4,.2,500,1,{to:3000});[392,523,659].forEach((f,i)=>tone(f,.5,'triangle',.07,{at:i*.04,dl:1}));break;
case'clear':[523,659,784,1047].forEach((f,i)=>tone(f,.7,'triangle',.12,{at:i*.11,dl:1}));break;
case'slam':tone(80,.6,'sine',.6,{to:28});nz(.5,.3,300,1);break;
case'parry':tone(1800,.25,'square',.05,{to:2400,lp:6000,dl:1});tone(900,.3,'triangle',.1,{dl:1});nz(.05,.3,3000,2);break;
case'limit':nz(1,.3,300,1,{to:5000});[262,330,392,523,659,784].forEach((f,i)=>tone(f,1.2,'sawtooth',.06,{at:i*.05,lp:2000,dl:1}));tone(60,1,'sine',.5,{to:30});break;
case'boss':tone(55,1.5,'sawtooth',.2,{to:45,lp:300});tone(58,1.5,'sawtooth',.2,{lp:300});break;
case'portal':nz(1.1,.25,300,2,{to:3500});tone(200,1.1,'sine',.14,{to:900,dl:1});break;
case'coin':tone(1568,.14,'sine',.05,{dl:1});tone(2093,.2,'sine',.04,{at:.06,dl:1});break;
case'click':tone(660,.08,'triangle',.1);tone(990,.1,'triangle',.08,{at:.05})}}catch(e){}}
const CH=[[50,53,57],[46,50,53],[53,57,60],[48,52,55]],mf=m=>440*2**((m-69)/12);let ms=0,mt=0;
function mus(){inMus=1;try{mus0()}finally{inMus=0}}
function mus0(){try{if(!AC||muted||mSrc||AC.state!='running')return;const c=AC.currentTime,fi=st=='fight',bt=60/(fi?(stage%5==0?132:112):80)/2;if(mt<c)mt=c+.05;
while(mt<c+.35){const s=ms%32,ch=CH[s>>3],k=s&7,at=mt-c;
if(k==0)ch.forEach(m=>tone(mf(m+12),bt*8,'triangle',.04,{at,atk:.7,lp:900,dl:1}));
if(k==0||k==4)tone(mf(ch[0]-12),bt*3,'sine',.22,{at,atk:.02});
if(fi||k%2==0)tone(mf(ch[[0,1,2,1,2,1,0,2][k]]+24),.4,'triangle',.05,{at,dl:1,lp:3000});
if(fi){if(k==0||k==4)tone(120,.15,'sine',.3,{at,to:40});if(k==2||k==6)nz(.12,.1,1800,1,{at});if(k&1)nz(.04,.04,8000,2,{at})}
mt+=bt;ms++}}catch(e){}}
setInterval(mus,120);
