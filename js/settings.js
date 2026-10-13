/* PENGATURAN */
let setBack='menu',resetArm=0,lastDevicePulse=0,setPage=0;S.set.ui=Math.max(0,Math.min(2,Math.round(Number.isFinite(+S.set.ui)?+S.set.ui:1))); /* PLACEHOLDER presets 0.9/1.0/1.1; tune after HP validation. */
const SET_UI_IM=new Image();SET_UI_IM.src='assets/world/ui.png';
const SET_UI_FR={panel_tl:[0,0,3,3],panel_tc:[5,0,3,3],panel_tr:[10,0,3,3],panel_lc:[0,5,3,3],panel_c:[5,5,3,3],panel_rc:[10,5,3,3],panel_bl:[0,10,3,3],panel_bc:[5,10,3,3],panel_br:[10,10,3,3],confirm:[0,18,12,11],cancel:[14,18,11,11],bar_empty:[27,18,15,7],bar_fill:[44,18,15,7],cursor:[61,18,11,19]};
function setUIImage(name,x,y,w,h){const f=SET_UI_FR[name];if(!f||!SET_UI_IM.complete||!SET_UI_IM.naturalWidth)return false;g.imageSmoothingEnabled=false;g.drawImage(SET_UI_IM,f[0],f[1],f[2],f[3],x,y,w==null?f[2]:w,h==null?f[3]:h);return true}
function setUIPanel(x,y,w,h){g.fillStyle='rgba(9,13,22,.95)';g.fillRect(x,y,w,h);if(!SET_UI_IM.complete||!SET_UI_IM.naturalWidth)return;g.save();g.globalAlpha=.55;const c=6;setUIImage('panel_tl',x,y,c,c);setUIImage('panel_tc',x+c,y,w-2*c,c);setUIImage('panel_tr',x+w-c,y,c,c);setUIImage('panel_lc',x,y+c,c,h-2*c);setUIImage('panel_rc',x+w-c,y+c,c,h-2*c);setUIImage('panel_bl',x,y+h-c,c,c);setUIImage('panel_bc',x+c,y+h-c,w-2*c,c);setUIImage('panel_br',x+w-c,y+h-c,c,c);g.globalAlpha=.07;setUIImage('panel_c',x+c,y+c,w-2*c,h-2*c);g.restore()}
function hapticPulse(pattern){if(!S.set||!S.set.vib||!navigator.vibrate)return;const now=performance.now?performance.now():Date.now();if(now-lastDevicePulse<110)return;lastDevicePulse=now;try{navigator.vibrate(pattern==null?12:pattern)}catch(e){}}
const fsEl=document.documentElement,fsOn=()=>document.fullscreenElement||document.webkitFullscreenElement,fsOK=!!(fsEl.requestFullscreen||fsEl.webkitRequestFullscreen);
/* Fullscreen otomatis: browser hanya mengizinkan lewat sentuhan/klik, jadi diminta di sentuhan pertama
 dan diulang di sentuhan berikutnya bila pemain keluar dari layar penuh. */
function fsReq(){if(!fsOK||fsOn())return;try{const r=(fsEl.requestFullscreen||fsEl.webkitRequestFullscreen).call(fsEl,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}catch(e){}}
addEventListener('pointerup',fsReq,true);addEventListener('keydown',fsReq,true);
/* Hentikan semua audio saat aplikasi ke latar belakang / layar mati, lanjut saat kembali. */
function aPause(){if(AC&&AC.state=='running')AC.suspend().catch(()=>{})}
function aResume(){if(AC&&AC.state!='running'&&!document.hidden)AC.resume().catch(()=>{})}
function bgOff(){aPause();if(st=='fight')st='pause';if(qDirty){qDirty=0;sv()}}
document.addEventListener('visibilitychange',()=>document.hidden?bgOff():aResume());
addEventListener('pagehide',bgOff);addEventListener('pageshow',aResume);addEventListener('freeze',aPause);addEventListener('resume',aResume);
function setVol(k,d){S.set[k]=Math.max(0,Math.min(10,S.set[k]+d));applyVol();sv();sfx('click')}
function setRows(){const q=S.set,r=[];let y=Math.max(80,53+settingTouchUnit()+8-18);const nx=()=>{const v=y;y+=Math.max(45,settingTouchUnit()+4);return v};
const seg=(lab,opts,sel,fn)=>{const yy=nx(),w=Math.floor(320/opts.length);r.push({y:yy,h:36,lab,o:opts.map((p,i)=>({x:300+i*w,w:w-6,t:p,on:sel==i,f:()=>{fn(i);sv();sfx('click')}}))})};
const vol=(lab,k)=>{const yy=nx();r.push({y:yy,h:36,lab,bar:k,o:[{x:294,w:44,t:'-',f:()=>setVol(k,-1)},{x:530,w:44,t:'+',f:()=>setVol(k,1)}]})};
if(setPage===0){seg('Bahasa',['INDONESIA','ENGLISH'],q.lang=='en'?1:0,i=>{q.lang=i?'en':'id';TC.clear();applyLang()});seg('Musik latar (BGM)',['ON','OFF'],q.bgm?0:1,i=>{q.bgm=i?1:0;applyVol()})}
else if(setPage===1){vol('Musik','mv');vol('Efek suara','sv')}
else if(setPage===2){seg('Kontrol hero manual',['ON','OFF'],MAN?0:1,i=>{MAN=!i;jid=aid=null;jx=jy=atkH=0;Save.writeMan(MAN)});seg('Ukuran kontrol sentuh',['KECIL','SEDANG','BESAR'],q.cs,i=>{q.cs=i;applyCS()})}
else if(setPage===3){seg('Ukuran UI',['KECIL','SEDANG','BESAR'],q.ui,i=>{q.ui=i});seg('Getar layar',['ON','OFF'],q.shake?0:1,i=>q.shake=i?0:1);seg('Getar perangkat',['ON','OFF'],q.vib?0:1,i=>q.vib=i?0:1)}
else if(setPage===4){seg('Angka damage',['ON','OFF'],q.dmg?0:1,i=>q.dmg=i?0:1);seg('Kurangi efek visual',['NORMAL','KURANG'],q.fx?0:1,i=>q.fx=i?0:1)}
else if(setPage===5){seg(q.lang=='en'?'Season (world)':'Musim (dunia)',q.lang=='en'?['AUTO','NORMAL','SNOW']:['OTOMATIS','NORMAL','SALJU'],q.season|0,i=>q.season=i);seg('Siang-malam (dunia)',['SIKLUS CEPAT','JAM PERANGKAT','SIANG TETAP'],q.dn|0,i=>q.dn=i)}
else {r.push({y:nx(),h:36,lab:'Hapus data',o:[{x:300,w:200,t:t<resetArm?'YAKIN? KETUK LAGI':'HAPUS DATA',on:t<resetArm,f:()=>{if(t<resetArm){Save.wipe();location.reload()}else{resetArm=t+3;sfx('click')}}}]})}
return r}
function settingTouchUnit(){const r=cv&&cv.getBoundingClientRect?cv.getBoundingClientRect():null,s=r&&r.height?r.height/360:1;return Math.max(44,44/Math.max(.1,s))}
function drawSet(){ov(.92);setUIPanel(2,2,636,356);btn(6,5,76,36,'KEMBALI');T('PENGATURAN',320,25,'#fc4',16,'center');
const tabs=[{x:85,w:75,t:'UMUM'},{x:161,w:75,t:'AUDIO'},{x:237,w:75,t:'KONTROL'},{x:313,w:75,t:'LAYAR'},{x:389,w:75,t:'EFEK'},{x:465,w:75,t:'DUNIA'},{x:541,w:75,t:'DATA'}];tabs.forEach((p,i)=>{g.fillStyle=setPage===i?'#53466f':'#2d2940';g.fillRect(p.x,36,p.w,34);g.strokeStyle=setPage===i?'#fc4':'#69617e';g.strokeRect(p.x+.5,36.5,p.w-1,33);if(setPage===i)setUIImage('cursor',p.x+5,44,7,12);T(p.t,p.x+p.w/2+2,58,'#fff',9,'center')});
setRows().forEach(r=>{T(r.lab,24,r.y+23,'#cde',11);if(r.note)T(r.note,300,r.y+23,'#fa8',9);if(r.bar){if(!setUIImage('bar_empty',342,r.y+9,188,18)){g.fillStyle='#000';g.fillRect(342,r.y+10,188,16)}if(S.set[r.bar]>0&&!setUIImage('bar_fill',344,r.y+12,184*S.set[r.bar]/10,12)){g.fillStyle='#4a9';g.fillRect(344,r.y+12,184*S.set[r.bar]/10,12)}T(S.set[r.bar]*10+'%',583,r.y+23,'#fff',10)}
r.o.forEach(b=>{g.fillStyle=b.on?'#2a7a4a':'#3a3560';g.fillRect(b.x,r.y,b.w,36);g.strokeStyle=b.on?'#6f8':'#000';g.lineWidth=2;g.strokeRect(b.x,r.y,b.w,36);T(b.t,b.x+b.w/2,r.y+23,'#fff',10,'center');if(/HAPUS DATA|YAKIN|DELETE DATA|SURE/.test(b.t))setUIImage(b.on?'confirm':'cancel',b.x+b.w-17,r.y+12,12,11)})});
T('Sunnyside World · Pengaturan tersimpan otomatis',320,350,'#667',9,'center')}
function setClick(x,y){const unit=settingTouchUnit();if(y<=23+unit/2&&x<=82){st=setBack;setBack='menu';sv();sfx('click');return}
const tabs=[{x:85,w:75},{x:161,w:75},{x:237,w:75},{x:313,w:75},{x:389,w:75},{x:465,w:75},{x:541,w:75}];if(y>=53-unit/2&&y<=53+unit/2){for(let i=0;i<tabs.length;i++){const b=tabs[i],targetW=Math.max(b.w,unit);if(x>=b.x+b.w/2-targetW/2&&x<=b.x+b.w/2+targetW/2){setPage=i;sfx('click');return}}}
for(const r of setRows())for(const b of r.o){const targetW=Math.max(b.w,unit);if(x>=b.x+b.w/2-targetW/2&&x<=b.x+b.w/2+targetW/2&&y>=r.y+r.h/2-unit/2&&y<=r.y+r.h/2+unit/2){b.f();return}}}
applyLang();applyCS();

