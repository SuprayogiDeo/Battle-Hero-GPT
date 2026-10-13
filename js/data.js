/* ===== HERO DATA ===== */
const RB={tank:[300,14,30,.9,1],fighter:[220,18,28,.7,1],assassin:[150,17,26,.5,1],archer:[135,16,200,.7,0],mage:[115,22,180,1.15,0],healer:[145,10,170,1,0]},RM={N:1,R:1.2,SR:1.45,SSR:1.8},RC={N:'#aaa',R:'#6af',SR:'#c8f',SSR:'#fc4'},RN={tank:'Penjaga',fighter:'Petarung',assassin:'Pembunuh',archer:'Pemanah',mage:'Penyihir',healer:'Penyembuh'};
const EC={fire:'#f80',ice:'#8cf',dark:'#a4f',poison:'#7d3',holy:'#fe8'};
// PLACEHOLDER PEMILIK: angka pembuka alat belum dibalans; jangan dianggap nilai final.
const HB_STARTER_TOOL_CONFIG={placeholder:true,unlockAt:{hand:0,hoe:5,can:5,axe:4,pick:4,rod:6}};
function H(id,n,rar,role,ty,el,w,sk,skn,desc,cd,pw){const b=RB[role],m=RM[rar];return{id,n,rar,role,ty,el,w,sk,skn,desc,cd,pw,hp:b[0]*m,dm:b[1]*m,rng:b[2],it:b[3],melee:b[4],heal:role=='healer'?1:0,s:'h'+HEROES.length}}
const HEROES=[];const A_=(...a)=>HEROES.push(H(...a));
A_('recruit','Rekrut','N','fighter','melee',0,'sword','whirl','Putaran Pedang','Tebas semua musuh di sekitar',8,1);
A_('squire','Pengawal','N','tank','melee',0,'sword','wall','Tembok Perisai','Pancing musuh dan kebal',9,.9);
A_('hunter','Pemburu','N','archer','arrow',0,'arrow','rain','Hujan Panah','Panah dari langit',9,.8);
A_('apprentice','Murid Sihir','N','mage','orb','fire','fire','meteor','Meteor Kecil','Meteor api ke kerumunan',11,.7);
A_('acolyte','Akolit','N','healer','bolt','holy','magic','heal','Doa Kecil','Sembuhkan seluruh tim',13,.7);
A_('thief','Pencopet','N','assassin','melee',0,'slash','dash','Tusukan Cepat','Loncat dan tusuk musuh terlemah',7,.8);
A_('spearman','Prajurit Tombak','N','fighter','melee',0,'spear','whirl','Sapuan Tombak','Sapu musuh di sekitar',8,.9);
A_('clubber','Pemukul','N','tank','melee',0,'hit','quake','Hentakan','Tanah bergetar, musuh pingsan',11,.8);
A_('knight','Ksatria','R','tank','melee',0,'sword','wall','Perisai Kehormatan','Pancing musuh dan kebal',9,1.2);
A_('ranger','Pemanah Elf','R','archer','arrow',0,'arrow','rain','Panah Rimba','Panah dari langit',8,1);
A_('pyro','Penyihir Api','R','mage','orb','fire','fire','meteor','Meteor','Hujan meteor api',10,1);
A_('cleric','Pendeta','R','healer','bolt','holy','magic','heal','Berkah','Sembuhkan seluruh tim',12,1);
A_('assassin','Bayangan','R','assassin','melee',0,'slash','dash','Tusukan Bayangan','Lompat, tusuk kritikal',7,1);
A_('axeman','Kapak Perang','R','fighter','melee',0,'sword','whirl','Pusaran Kapak','Putaran kapak mematikan',8,1.2);
A_('frost','Penyihir Es','R','mage','orb','ice','ice','nova','Ledakan Es','Ledakan es, musuh melambat',10,1);
A_('sniper','Penembak Jitu','R','archer','arrow',0,'arrow','snipe','Tembakan Jitu','Panah besar ke musuh terkuat',9,1);
A_('paladin','Paladin','SR','tank','melee',0,'sword','barrier','Cahaya Pelindung','Perisai untuk seluruh tim',11,1);
A_('stormmage','Penyihir Petir','SR','mage','orb','holy','magic','chain','Rantai Petir','Petir menyambar 5 musuh',9,1);
A_('druid','Druid Racun','SR','mage','orb','poison','poison','cloud','Awan Racun','Racuni semua musuh',11,1);
A_('berserker','Berserker','SR','fighter','melee',0,'sword','cry','Raungan Perang','ATK tim +35% selama 6 detik',12,1);
A_('necro','Pemanggil Maut','SR','healer','orb','dark','dark','revive','Bangkit','Hidupkan hero yang gugur',16,1);
A_('monk','Biksu','SR','fighter','melee',0,'hit','quake','Hentakan Bumi','Musuh sekitar pingsan',10,1.2);
A_('archmage','Penyihir Agung','SSR','mage','orb','fire','fire','meteor','Meteor Agung','Hujan meteor dahsyat',9,1.6);
A_('dragonslayer','Pembunuh Naga','SSR','fighter','melee',0,'sword','snipe','Tebasan Naga','Pukulan raksasa ke musuh terkuat',9,1.8);
A_('valkyrie','Valkyrie','SSR','assassin','melee',0,'spear','smite','Tombak Suci','Sambaran suci, sembuhkan tim',9,1.3);
A_('oracle','Peramal Suci','SSR','healer','bolt','holy','magic','barrier','Berkah Surga','Perisai dan pulihkan tim',12,1.5);
const HID={};HEROES.forEach((h,i)=>HID[h.id]=i);
const ED={
slime:{s:108,hp:70,atk:10,spd:36,rng:22,it:1,sc:3,split:1},
bat:{s:120,hp:45,atk:9,spd:80,rng:20,it:.8,sc:3,fly:1},
spider:{s:122,hp:80,atk:10,spd:44,rng:22,it:1,sc:3,poison:1},
ghost:{s:121,hp:95,atk:13,spd:34,rng:22,it:1.1,sc:3,evade:1},
dmage:{s:111,hp:105,atk:9,spd:26,rng:160,it:1.4,sc:3,healer:1},
cyclops:{s:109,hp:400,atk:36,spd:24,rng:30,it:1.7,sc:5},
boss:{s:110,hp:2600,atk:40,spd:20,rng:34,it:1.4,sc:8,boss:1,n:'IBLIS MERAH'},
goblin:{s:'g1',hp:50,atk:9,spd:72,rng:20,it:.7,sc:2.6},
orc:{s:'g2',hp:260,atk:24,spd:30,rng:26,it:1.4,sc:4},
gbow:{s:'g3',hp:60,atk:10,spd:30,rng:190,it:1.6,sc:2.8,rangedA:1},
borc:{s:'g4',hp:3100,atk:46,spd:24,rng:36,it:1.5,sc:7,boss:1,kind:'orc',n:'RAJA ORC'},
bslime:{s:108,hp:3800,atk:44,spd:22,rng:34,it:1.4,sc:9,boss:1,kind:'slime',n:'RAJA SLIME'},
bspider:{s:122,hp:2900,atk:36,spd:34,rng:30,it:1.1,sc:9,boss:1,kind:'spider',n:'RATU LABA-LABA',poison:1},
bcyc:{s:109,hp:4200,atk:52,spd:20,rng:40,it:1.8,sc:9,boss:1,kind:'cyc',n:'RAKSASA CYCLOPS'},
bghost:{s:121,hp:2800,atk:34,spd:30,rng:30,it:1.2,sc:9,boss:1,kind:'ghostk',n:'RAJA HANTU',evade:1},
blich:{s:111,hp:2600,atk:32,spd:16,rng:170,it:1.6,sc:7,boss:1,kind:'lich',n:'PENYIHIR KEGELAPAN'}};
const PK=[
['Kekuatan','ATK semua hero +20%',()=>P.atk*=1.2],
['Kecepatan','Kecepatan serang +15%',()=>P.as*=1.15],
['Fokus','Cooldown skill -15%',()=>P.cd*=.85],
['Baja','HP maks +25% dan pulih',()=>{P.hpm=(P.hpm||1)*1.25;hs.forEach(h=>{h.mh*=1.25;h.hp=Math.min(h.mh,h.hp*1.25+20)})}],
['Ketajaman','Peluang kritikal +12%',()=>P.crit+=.12],
['Api Abadi','Bakar +60% lebih kuat',()=>P.burn*=1.6],
['Hisap Darah','Heal 6% dari damage',()=>P.ls+=.06]];
const RT=[['Medan Biasa','Tanpa efek khusus',()=>R={}],['Sarang Elit','Musuh elit, emas x2',()=>R={el:1,g:2}],['Api Unggun','Pulihkan 60% HP semua',()=>{R={};hs.forEach(q=>{q.dead=0;q.hp=Math.min(q.mh,q.hp+q.mh*.6)})}],['Kuil Darah','ATK +30%, HP maks -15%',()=>{R={};P.atk*=1.3;P.hpm=(P.hpm||1)*.85;hs.forEach(q=>{q.mh*=.85;q.hp=Math.min(q.hp,q.mh)})}]];
const SH=[['Rejeki Emas','Emas +10% per level'],['Mata Elang','Kritikal +2% per level'],['Fokus Sihir','Cooldown skill -3% per level'],['Pelindung','HP semua hero +4% per level']];
const DM=[1,1.7,2.8],DG=[1,1.6,2.4];
const BAL={hp:.4,at:.18,cnt:.9,m:1,heal:.15,ov:.3,ex:1.085};
const TIPS=['Tips: naikkan level hero dan skill di menu Pahlawan','Tips: pasang equipment untuk menambah ATK dan HP','Tips: kumpulkan Esensi dari boss untuk evolusi hero','Tips: ketuk area merah untuk menangkis serangan boss','Tips: panggil hero baru gratis setiap hari di Toko','Tips: pakai Limit Break hero saat musuh menumpuk','Tips: padukan penjaga, penyembuh, dan penyerang jarak jauh'];
const PRICE={N:250,R:700,SR:2000,SSR:6000},LVM={N:1,R:1.3,SR:1.7,SSR:2.2};
let st='menu',stage=1,wi=0,waves=[],hs=[],es=[],ps=[],fx=[],tx=[],pt=[],sch=[],tele=[],auto=true,spdm=1,P={atk:1,cd:1,crit:.1,burn:1,ls:0,as:1},t=0,wt=1,focus=null,best=0,tauntT=0,tauntH=null,shake=0,ch=[],combo=0,ct=0,lb=0,runG=0,stageG=0,R={},phase=0,banner=0,freeze=0,flash=0,cut={t:0},bgx=0,wk=0,wend=0,bf={t:0,m:1},selH='recruit',shopTab=0,sumL=[],sumT=0,toast={t:0,s:''},pendI=[],gslot='w',gsel=null,gpage=0,corps=[],tutT=0,itemRes=[],pendE=0,essGot=0,wlast=0,mode='main',TM={},wbT=0,wbDmg=0,wbLast=0,evKills=0,evT=0,evSp=0,evBaseSt=3,evLast=0,arI=0,arW=[],arLast={};
best=Save.readBest();
let S={g:120,own:{recruit:{lv:1,st:1}},deck:['recruit'],sh:[0,0,0,0],day:'',pity:0,bday:'',bought:[],run:null,hb:{sel:0,pg:0,water:0,slots:{}},items:[],overflowItems:[],stageClaims:[],bossClaims:[],eq:{},iu:1,epity:0,fday:'',ft:1,fe:1,tut:0,diff:0,es:0,tw:{day:'',best:0},wb:{wk:-1,dmg:0,claimed:0,tries:0,tday:''},ar:{rt:0,tries:0,tday:'',cl:0,opp:[],w:0,l:0},ev:{wk:-1,score:0,claimed:0,tries:0,tday:'',base:0},tutorials:{active:null,topics:{}}};{const q=Save.readMain();if(q)S=Object.assign(S,q)}
S.set=Object.assign({lang:'id',bgm:1,mv:7,sv:8,shake:1,vib:1,dmg:1,fx:1,cs:1},S.set||{});if(!Array.isArray(S.items))S.items=[];if(!Array.isArray(S.stageClaims))S.stageClaims=[];if(!Array.isArray(S.overflowItems))S.overflowItems=[];function ensureBossClaims(){if(!Array.isArray(S.bossClaims))S.bossClaims=[];if(!S.bossClaims.length&&Array.isArray(S.stageClaims))S.bossClaims=S.stageClaims.filter(v=>Number(v)%5===0&&Number(v)>0).map(Number);return S.bossClaims}ensureBossClaims();S.set.lang=S.set.lang==='en'?'en':'id';['mv','sv'].forEach(k=>S.set[k]=Math.max(0,Math.min(10,Number.isFinite(+S.set[k])?+S.set[k]:8)));['bgm','shake','vib','dmg','fx'].forEach(k=>S.set[k]=S.set[k]?1:0);S.set.cs=Math.max(0,Math.min(2,Math.round(Number.isFinite(+S.set.cs)?+S.set.cs:1)));if(S.ad==null)S.ad=1;
S.st=S.st||{};S.ac=S.ac||{};S.q=S.q||{day:'',ids:[],p:{},cl:[0,0,0],bonus:0};if(S.coach==null)S.coach=S.tut?11:0;if(S.how==null)S.how=S.tut?1:0;if(!S.tutorials||typeof S.tutorials!=='object'||Array.isArray(S.tutorials))S.tutorials={active:null,topics:{}};if(!S.tutorials.topics||typeof S.tutorials.topics!=='object'||Array.isArray(S.tutorials.topics))S.tutorials.topics={};
const sv=()=>{const ok=Save.writeMain(S,best);if(!ok&&!Save.failureNotified){Save.failureNotified=true;say('Gagal menyimpan progres. Penyimpanan browser mungkin penuh atau diblokir.');}return ok};
const today=()=>new Date().toDateString(),lvc=id=>Math.round(25*S.own[id].lv**1.6*LVM[HEROES[HID[id]].rar]),shc=i=>Math.round(40*(S.sh[i]+1)**1.5),A=()=>P.atk*(bf.t>0?bf.m:1);
const mult=id=>(1+.12*(S.own[id].lv-1))*(1+.1*(S.own[id].st-1))*(1+.35*(S.own[id].evo||0));
function say(s){toast={t:2,s}}
const skcap=id=>[5,8,10][(S.own[id]||{}).evo||0],skUp=id=>Math.round(60*(S.own[id].sk||1)**1.7*LVM[HEROES[HID[id]].rar]);
function evoReq(id){const o=S.own[id],n=o.evo||0;if(n>=2)return null;const m=LVM[HEROES[HID[id]].rar];return{lv:n?20:10,st:n?4:2,g:Math.round((n?2000:500)*m),es:n?8:3}}
const evoOK=id=>{const r=evoReq(id),o=S.own[id];return r&&o.lv>=r.lv&&o.st>=r.st&&S.g>=r.g&&S.es>=r.es};
function sprG(k,x,y,sc,b,evo){if(evo){g.shadowColor=evo>1?'#fc4':'#6af';g.shadowBlur=8}spr(k,x,y,sc,b);g.shadowBlur=0}
function dayRefresh(){wbCheck();if(S.fday!=today()){S.fday=today();S.ft=1;S.fe=1;sv()}}
const SLOT={w:'Senjata',a:'Armor',x:'Jimat'},RAR=['N','R','SR','SSR'];
const IC={w:[103,104,105,106,107,117,118,119,129,130,131],a:[101,102,113,114],x:[115,116,125,126,127,128]};
const WN=['Pedang','Kapak','Palu','Tongkat','Belati'],AN=['Perisai','Zirah','Jubah','Pelindung'],XN=['Jimat','Cincin','Kalung','Medali'],RP={N:'Biasa',R:'Terasah',SR:'Mulia',SSR:'Legenda'};
const XT={crit:['Kritikal',[3,6,10,15]],cd:['Cooldown',[3,6,10,15]],ls:['Hisap Darah',[2,4,6,10]],as:['Kec. Serang',[4,8,12,20]]};
const WB={N:8,R:15,SR:25,SSR:40},AB={N:10,R:20,SR:35,SSR:55},SELL={N:20,R:60,SR:150,SSR:400};
