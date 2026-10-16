/* Hero Battle — Journal, focus objective, biome discovery and resident bonds.
 Safe save migration: every field is optional in older saves and is normalized here. */
let jrSubtab = 0;
const JR_THRESHOLDS = [0, 10, 25, 45, 70, 100];
const JR_TIER_NAMES = [
  ['Baru dikenal', 'New face'], ['Kenalan', 'Acquaintance'], ['Teman', 'Friend'],
  ['Sahabat', 'Close friend'], ['Tepercaya', 'Trusted'], ['Keluarga desa', 'Village family']
];
const JR_REWARDS = {
  1: {gold:20, essence:0}, 2: {gold:30, essence:0}, 3: {gold:35, essence:1},
  4: {gold:45, essence:1}, 5: {gold:60, essence:2}
};
const JR_NPC_NAMES = {
  guard:['Penjaga Gerbang','Gate Guard'], merchant:['Pedagang','Merchant'], farmer:['Petani','Farmer'],
  elder:['Tetua Desa','Village Elder'], builder:['Tukang Bangun','Builder'], cook:['Koki Desa','Village Cook'],
  woodcutter:['Penebang Kayu','Woodcutter']
};
const JR_STORIES = {
  guard:{2:['Aku mulai percaya padamu. Gerbang ini aman ketika orang sepertimu menjaganya.','I am beginning to trust you. This gate is safer with someone like you around.'],4:['Dulu aku menjaga gerbang sendirian. Sekarang aku tahu desa ini punya banyak pelindung.','I used to guard this gate alone. Now I know the village has many protectors.']},
  merchant:{2:['Aku menyimpan beberapa kabar baik untuk teman yang dapat dipercaya.','I keep a few useful tips for friends I can trust.'],4:['Kau bukan sekadar pelanggan lagi. Aku akan memberitahumu saat ada barang istimewa.','You are more than a customer now. I will tell you when something special arrives.']},
  farmer:{2:['Tanah yang dirawat dengan sabar selalu membalas kebaikan. Terima kasih sudah membantu.','Patiently tended soil always gives something back. Thank you for helping.'],4:['Aku akan berbagi resep keluarga yang membuat hasil panen sederhana terasa istimewa.','I will share a family recipe that makes a simple harvest feel special.']},
  elder:{2:['Desa ini tumbuh bukan hanya dari batu dan kayu, tetapi juga dari kepercayaan.','This village grows not only from stone and wood, but also from trust.'],4:['Kau sudah menjadi bagian penting desa ini. Cerita kita akan terus berlanjut.','You have become an important part of this village. Our story will continue.']},
  builder:{2:['Bangunan yang kuat dimulai dari orang yang mau saling membantu.','Strong buildings begin with people willing to help one another.'],4:['Aku akan mengajarimu trik memilih bahan agar pekerjaan bengkel lebih efisien.','I will teach you a trick for choosing materials to make workshop work more efficient.']},
  cook:{2:['Bahan terbaik datang dari warga yang saling berbagi. Aku punya resep khusus untukmu.','The best ingredients come from neighbors who share. I have a special recipe for you.'],4:['Anggap dapur ini rumahmu. Aku akan mengajarkan resep andalanku.','Consider this kitchen your home. I will teach you my signature recipe.']},
  woodcutter:{2:['Aku bisa menunjukkan tempat mengumpulkan bahan yang lebih baik jika kita terus bekerja sama.','I can show you a better gathering spot if we keep working together.'],4:['Kau sudah menguasai dasar hutan. Gunakan bahan langka dengan bijak.','You have mastered the basics of the forest. Use rare materials wisely.']}
};
function jrLang(id,en){return S.set&&S.set.lang==='en'?en:id;}
function jrEnsure(){
  if(!S.journal||typeof S.journal!=='object')S.journal={};
  const j=S.journal;
  if(!j.focus||typeof j.focus!=='object')j.focus={type:'stage'};
  if(!['stage','daily','order','story'].includes(j.focus.type))j.focus={type:'stage'};
  if(!j.relationships||typeof j.relationships!=='object')j.relationships={};
  if(!j.seenBiomes||typeof j.seenBiomes!=='object')j.seenBiomes={};
  if(!Array.isArray(j.storySeen))j.storySeen=[];
  if(j.version!==1)j.version=1;
  jrNpcList().forEach(n=>{
    let r=j.relationships[n.id];
    if(!r||typeof r!=='object')r=j.relationships[n.id]={points:0,lastTalkDay:'',claimedTiers:[]};
    r.points=Math.max(0,Math.min(100,Math.floor(+r.points||0)));
    r.lastTalkDay=typeof r.lastTalkDay==='string'?r.lastTalkDay:'';
    // Older versions did not have tier reward ledger. Treat existing tiers as already granted.
    if(!Array.isArray(r.claimedTiers))r.claimedTiers=Array.from({length:jrTierRaw(r.points)},(_,i)=>i+1);
    r.claimedTiers=r.claimedTiers.filter(k=>Number.isInteger(k)&&k>=1&&k<=5);
  });
  return j;
}
function jrNpcList(){
  const base=[
    {id:'guard',n:JR_NPC_NAMES.guard},{id:'merchant',n:JR_NPC_NAMES.merchant},
    {id:'farmer',n:JR_NPC_NAMES.farmer},{id:'elder',n:JR_NPC_NAMES.elder},
    {id:'builder',n:JR_NPC_NAMES.builder},{id:'cook',n:JR_NPC_NAMES.cook},
    {id:'woodcutter',n:JR_NPC_NAMES.woodcutter}
  ];
  if(typeof NPCS!=='undefined')NPCS.forEach(o=>{if(!base.some(n=>n.id===o.id))base.push({id:o.id,n:[o.n&&o.n[0]||o.id,o.n&&o.n[1]||o.id]});});
  return base;
}
function jrTierRaw(points){let out=0;for(let i=1;i<JR_THRESHOLDS.length;i++)if(points>=JR_THRESHOLDS[i])out=i;return out;}
function jrTier(id){jrEnsure();const r=S.journal.relationships[id];return jrTierRaw(r?r.points:0);}
function jrBondPoints(id){jrEnsure();return S.journal.relationships[id]?.points||0;}
function jrNpcName(id){const n=jrNpcList().find(o=>o.id===id);return n?(S.set&&S.set.lang==='en'?n.n[1]:n.n[0]):id;}
function jrRelationshipGain(id,amount,reason){
  jrEnsure();if(!id)return false;
  if(!S.journal.relationships[id])S.journal.relationships[id]={points:0,lastTalkDay:'',claimedTiers:[]};
  const r=S.journal.relationships[id],before=jrTierRaw(r.points);
  r.points=Math.min(100,r.points+Math.max(0,Math.floor(+amount||0)));
  const after=jrTierRaw(r.points);let gold=0,ess=0,levels=0;
  for(let tier=1;tier<=after;tier++)if(!r.claimedTiers.includes(tier)){
    r.claimedTiers.push(tier);const reward=JR_REWARDS[tier]||{gold:0,essence:0};gold+=reward.gold;ess+=reward.essence;levels++;
  }
  if(gold)S.g=(+S.g||0)+gold;if(ess)S.es=(+S.es||0)+ess;
  if(r.points>0){S.journal.relationships[id]=r;sv();}
  if(after>before){
    sfx('clear');
    const idMessage='Hubungan '+jrNpcName(id)+' naik: '+JR_TIER_NAMES[after][0]+(gold?' · +'+gold+' emas':'')+(ess?' +'+ess+' Esensi':'');
    const enMessage=jrNpcName(id)+' relationship increased: '+JR_TIER_NAMES[after][1]+(gold?' · +'+gold+' gold':'')+(ess?' +'+ess+' Essence':'');
    say(jrLang(idMessage,enMessage));
  }else if(reason&&gold){say('+'+gold+' emas');}
  return r.points>before;
}
function jrTalkFinish(id){
  if(!id)return false;jrEnsure();const r=S.journal.relationships[id],day=typeof today==='function'?today():new Date().toDateString();
  if(r.lastTalkDay===day){say(jrLang('Obrolan hari ini sudah dihitung. Datang lagi kapan saja; hubungan tidak akan menurun.','Today’s conversation already counted. Return anytime; friendship never decays.'));return false;}
  r.lastTalkDay=day;jrRelationshipGain(id,3,'talk');sv();return true;
}
function jrOrderRecipient(order){const text=((order&&order.npcEn)|| (order&&order.npc)||'').toLowerCase();if(text.includes('builder')||text.includes('bangun'))return'builder';if(text.includes('cook')||text.includes('koki'))return'cook';if(text.includes('farmer')||text.includes('petani'))return'farmer';if(text.includes('merchant')||text.includes('pedagang'))return'merchant';return'elder';}
function jrDiscoverBiome(id){if(!id)return false;jrEnsure();if(S.journal.seenBiomes[id])return false;S.journal.seenBiomes[id]=Date.now();sv();const names={meadow:['Padang & Ladang','Meadow & Farms'],forest:['Hutan Rimbun','Deep Forest'],lake:['Tepi Sungai & Danau','River & Lake'],coast:['Pantai & Dermaga','Coast & Pier'],mountain:['Kaki Gunung','Mountain Foothills']};const n=names[id]||[String(id),String(id)];if(typeof wSay==='function')wSay(jrLang('Wilayah ditemukan: '+n[0],'Area discovered: '+n[1]),3,'discovery');return true;}
function jrDiscoveredNames(){jrEnsure();const names={meadow:['Padang & Ladang','Meadow & Farms'],forest:['Hutan Rimbun','Deep Forest'],lake:['Tepi Sungai & Danau','River & Lake'],coast:['Pantai & Dermaga','Coast & Pier'],mountain:['Kaki Gunung','Mountain Foothills']};return Object.keys(S.journal.seenBiomes).map(k=>(names[k]||[k,k])[S.set&&S.set.lang==='en'?1:0]);}
function jrFocus(type,id){jrEnsure();S.journal.focus={type,id:id===undefined?null:id};sv();sfx('click');}
function jrCurrentFocus(){
  jrEnsure();const f=S.journal.focus||{type:'stage'};
  if(f.type==='daily'&&typeof qList==='function'){const q=qList().find(v=>v.q.k===f.id);if(q)return{title:q.q.t,detail:q.v+'/'+q.q.n+(q.cl?' · '+jrLang('sudah diklaim','claimed'):q.done?' · '+jrLang('siap diklaim','ready to claim'):''),done:q.done,kind:'daily'};}
  if(f.type==='order'&&typeof lifeOrderList==='function'){const q=lifeOrderList().find(v=>v.id===f.id&&!S.orders.done.includes(v.id));if(q)return{title:S.set.lang==='en'?q.en:q.name,detail:jrLang('Kumpulkan '+q.n+' '+q.item,'Gather '+q.n+' '+q.item),done:false,kind:'order'};}
  if(f.type==='story'&&typeof LIFE_STORY!=='undefined'){const q=LIFE_STORY[S.village&&S.village.story||0];if(q)return{title:S.set.lang==='en'?q.en:q.title,detail:S.set.lang==='en'?q.enDesc:q.desc,done:false,kind:'story'};}
  const target=S.run&&!S.run.cleared?Math.max(1,+S.run.stage||1):Math.max(1,(+best||0)+1);
  return{title:jrLang('Main Stage '+target,'Main Stage '+target),detail:jrLang('Pergi ke gerbang dan mulai Stage '+target,'Go to the gate and start Stage '+target),done:false,kind:'stage',target};
}
function jrFocusMatches(type,id){const f=S.journal&&S.journal.focus;return !!f&&f.type===type&&(id===undefined||f.id===id);}
function jrRecipeUnlocked(recipe){const req=recipe&&recipe.jrNeed;return !req||jrTier(req.npc)>=req.tier;}
const jrOldCanCook=lifeCanCook;
lifeCanCook=function(recipe){return jrRecipeUnlocked(recipe)&&jrOldCanCook(recipe);};
const jrOldCook=lifeCook;
lifeCook=function(recipe){if(recipe&&!jrRecipeUnlocked(recipe)){const req=recipe.jrNeed;say(jrLang('Resep terbuka pada hubungan '+jrNpcName(req.npc)+' tingkat '+req.tier+'.','Recipe unlocks at '+jrNpcName(req.npc)+' relationship tier '+req.tier+'.'));return false;}if(recipe&&jrRecipeUnlocked(recipe))return jrOldCook(recipe);return false;};
if(typeof LIFE_RECIPES!=='undefined'){
  if(!LIFE_RECIPES.some(r=>r.id==='village_feast'))LIFE_RECIPES.push({id:'village_feast',name:'Pesta Warga',en:'Village Feast',needs:{fish:1,egg:1,fruit:1},atk:.10,hp:.10,stages:3,desc:'ATK +10% / HP +10%',jrNeed:{npc:'cook',tier:2}});
  if(!LIFE_RECIPES.some(r=>r.id==='herbal_broth'))LIFE_RECIPES.push({id:'herbal_broth',name:'Kaldu Herba Sahabat',en:'Friendship Herb Broth',needs:{herb:2,mushroom:1,milk:1},atk:.08,hp:.10,stages:3,desc:'ATK +8% / HP +10%',jrNeed:{npc:'farmer',tier:2}});
}
/* Compact kitchen layout accommodates relationship-unlocked recipes without pushing buttons off-screen. */
lifeDrawKitchen=function(){
  lifeEnsure();ov(.94);btn(6,5,76,28,'KEMBALI');T(jrLang('DAPUR DESA','VILLAGE KITCHEN'),95,25,'#fc4',17);
  T(jrLang('Bahan panen: wortel ','Farm crops: carrots ')+S.kitchen.food.carrot+' · '+jrLang('labu ','pumpkin ')+S.kitchen.food.pumpkin+' · '+jrLang('bunga bulan ','moonflower ')+S.kitchen.food.moonflower,320,44,'#cde',8,'center');
  T(jrLang('Ternak: telur ','Ranch: eggs ')+lifeFoodCount('egg')+' · '+jrLang('susu ','milk ')+lifeFoodCount('milk')+' | '+jrLang('Ikan: ','Fish: ')+lifeFoodCount('fish'),320,57,'#9cf',8,'center');
  LIFE_RECIPES.forEach((r,i)=>{const y=64+i*42,unlocked=jrRecipeUnlocked(r),ok=unlocked&&lifeCanCook(r);card(18,y,604,39,ok?'#66bd87':unlocked?'#4f4a5b':'#393345',1);T(S.set.lang==='en'?r.en:r.name,30,y+14,unlocked?'#fff':'#b7a8c9',11);if(unlocked){T(r.desc,200,y+14,'#fc4',9);let nx=30;Object.keys(r.needs).forEach(k=>{const have=lifeFoodCount(k)>=r.needs[k],t=lifeItemName(k)+' ×'+r.needs[k];itemIcon(k,nx,y+21,13);T(t,nx+16,y+32,have?'#9fe8b4':'#ff9a9a',9);nx+=16+t.length*5.5+14})}else{T(jrLang('Butuh hubungan '+jrNpcName(r.jrNeed.npc)+' tingkat '+r.jrNeed.tier,'Requires '+jrNpcName(r.jrNeed.npc)+' relationship tier '+r.jrNeed.tier),30,y+30,'#c7a5df',9);T(jrLang('Resep khusus penduduk','Resident recipe'),200,y+14,'#9a8aae',9)}btn(500,y+6,108,27,unlocked?jrLang('MASAK','COOK'):jrLang('TERKUNCI','LOCKED'),ok);});
  if(S.buff){card(18,320,604,29,'#f7c45c',1);T(jrLang('Buff aktif: ','Active meal: ')+S.buff.name+' · ATK +'+Math.round(S.buff.atk*100)+'% HP +'+Math.round(S.buff.hp*100)+'% · '+S.buff.stages+' stage',320,338,'#fff4d1',8,'center');}else T(jrLang('Masakan mengganti buff sebelumnya, maksimal +10% ATK/HP.','Meals replace the previous buff, capped at +10% ATK/HP.'),320,341,'#9cf',8,'center');
};
lifeKitchenClick=function(x,y){if(y<34&&x<85){goBack();return}for(let i=0;i<LIFE_RECIPES.length;i++){const yy=64+i*42;if(y>=yy&&y<=yy+39&&x>=490){const r=LIFE_RECIPES[i];if(!jrRecipeUnlocked(r)){const q=r.jrNeed;say(jrLang('Butuh hubungan '+jrNpcName(q.npc)+' tingkat '+q.tier+'.','Requires '+jrNpcName(q.npc)+' relationship tier '+q.tier+'.'));return}lifeCook(r);return;}}};
/* Journal UI is added as a fourth tab to the existing quest/achievement/village-order page. */
function jrDrawTopTabs(){btn(6,5,76,28,'KEMBALI');btn(96,8,110,24,'MISI HARIAN',qTab===0);btn(212,8,120,24,'PENCAPAIAN',qTab===1);btn(340,8,138,24,'PESANAN DESA',qTab===2);btn(486,8,138,24,jrLang('JURNAL','JOURNAL'),qTab===3);}
function jrDrawJournal(){jrEnsure();ov(.94);jrDrawTopTabs();btn(20,39,150,23,jrLang('PETUALANGAN','ADVENTURE'),jrSubtab===0);btn(178,39,150,23,jrLang('PENDUDUK','RESIDENTS'),jrSubtab===1);T(jrLang('JURNAL PETUALANGAN','ADVENTURE JOURNAL'),470,55,'#fc4',13,'center');
  if(jrSubtab===0){
    const f=jrCurrentFocus(),target=jrCurrentFocus().target||Math.max(1,(+best||0)+1);card(16,62,608,39,'#6af',1);T(jrLang('TUJUAN UTAMA','MAIN OBJECTIVE')+' · '+f.title,28,77,'#fff',10);T(f.detail.slice(0,76),28,91,'#9cf',8);btn(526,68,88,25,jrFocusMatches('stage')?'FOKUS ✓':'FOKUS',!jrFocusMatches('stage'));
    T(jrLang('MISI HARIAN','DAILY QUESTS'),24,113,'#fc4',9);const L=typeof qList==='function'?qList():[];
    L.slice(0,3).forEach((x,i)=>{const y=117+i*38;card(18,y,604,34,x.cl?'#555':x.done?'#56845e':'#40576d',1);T(x.q.t.slice(0,48),28,y+13,x.cl?'#aaa':'#fff',9);T(x.v+'/'+x.q.n,28,y+26,'#bcd',8);btn(523,y+5,91,24,jrFocusMatches('daily',x.q.k)?'FOKUS ✓':'FOKUS',!x.cl);g.fillStyle='#17212a';g.fillRect(100,y+21,360,5);g.fillStyle=x.done?'#6c6':'#6396cf';g.fillRect(100,y+21,360*x.v/x.q.n,5);});
    const v=S.village||{story:0},story=typeof LIFE_STORY!=='undefined'?LIFE_STORY[v.story||0]:null,sy=234;card(18,sy,604,42,'#a47b4b',1);T(jrLang('CERITA DESA','VILLAGE STORY'),29,sy+14,'#fc4',9);T(story?(S.set.lang==='en'?story.en:story.title):jrLang('Rantai cerita selesai','Story chain completed'),29,sy+29,'#fff',9);T(story?Object.keys(story.need).map(k=>k+' '+story.need[k]).join(' · '):'',285,sy+29,'#cde',8);btn(523,sy+8,91,25,jrFocusMatches('story')?'FOKUS ✓':'FOKUS',!!story&&!jrFocusMatches('story'));
    const orders=typeof lifeOrderList==='function'?lifeOrderList():[],pending=orders.find(o=>!(S.orders&&S.orders.done||[]).includes(o.id)),oy=282;card(18,oy,604,39,'#4c6573',1);T(jrLang('PESANAN DESA','VILLAGE REQUEST'),29,oy+14,'#fc4',9);T(pending?(S.set.lang==='en'?pending.en:pending.name):jrLang('Tidak ada pesanan tersisa hari ini','No remaining requests today'),29,oy+28,'#fff',9);btn(523,oy+7,91,25,pending&&jrFocusMatches('order',pending.id)?'FOKUS ✓':'FOKUS',!!pending&&!jrFocusMatches('order',pending.id));
    const biomeNames=jrDiscoveredNames();T(jrLang('Wilayah ditemukan','Areas discovered')+': '+(biomeNames.length?biomeNames.join(' · '):jrLang('Belum ada','None yet')),320,341,'#9cf',8,'center');
  }else{
    T(jrLang('Hubungan tidak menurun saat kamu offline. Bicara sekali per hari atau bantu pesanan penduduk.','Bonds never decay offline. Talk once per day or complete resident requests.'),320,76,'#9cf',8,'center');
    const list=jrNpcList().slice(0,8);list.forEach((n,i)=>{const col=i%2,row=Math.floor(i/2),x=16+col*306,y=85+row*66,w=296,h=61,r=S.journal.relationships[n.id]||{points:0},tier=jrTierRaw(r.points),next=tier>=5?100:JR_THRESHOLDS[tier+1],prev=JR_THRESHOLDS[tier],prog=tier>=5?1:Math.max(0,Math.min(1,(r.points-prev)/Math.max(1,next-prev)));card(x,y,w,h,tier>=3?'#64916d':'#506575',1);T((S.set.lang==='en'?n.n[1]:n.n[0]).slice(0,24),x+9,y+14,'#fff',9);T(JR_TIER_NAMES[tier][S.set.lang==='en'?1:0],x+w-8,y+14,tier>=3?'#9f9':'#fc4',8,'right');g.fillStyle='#16212b';g.fillRect(x+9,y+23,w-18,6);g.fillStyle='#55b878';g.fillRect(x+9,y+23,(w-18)*prog,6);T(r.points+'/100 '+jrLang('poin','points'),x+9,y+40,'#cde',8);T(tier>=5?jrLang('Hubungan maksimum','Max bond'):jrLang('Berikutnya: ','Next: ')+JR_TIER_NAMES[Math.min(5,tier+1)][S.set.lang==='en'?1:0],x+9,y+53,'#9cf',8);});
    T(jrLang('Bonus tier dibayar satu kali. Hadiah: emas/Esensi kecil; cerita terbuka di tier 2 dan 4.','Tier bonuses are paid once. Small gold/Essence rewards; stories unlock at tiers 2 and 4.'),320,355,'#9cf',8,'center');
  }
}
function jrJournalClick(x,y){if(y<34){if(x<85){st='menu';sfx('click');return}if(x>=96&&x<206){qTab=0;return}if(x>=212&&x<332){qTab=1;return}if(x>=340&&x<480){qTab=2;return}if(x>=486&&x<=630){qTab=3;return}}
 if(y>=39&&y<=62){if(x>=20&&x<=170)jrSubtab=0;else if(x>=178&&x<=328)jrSubtab=1;return;}
 if(jrSubtab!==0)return;
 if(y>=62&&y<=101&&x>=523){jrFocus('stage');return;}
 const L=typeof qList==='function'?qList():[];for(let i=0;i<Math.min(3,L.length);i++){const yy=117+i*38;if(y>=yy&&y<=yy+34&&x>=523){if(L[i].cl)return;jrFocus('daily',L[i].q.k);return;}}
 if(y>=234&&y<=276&&x>=523){if(typeof LIFE_STORY!=='undefined'&&LIFE_STORY[S.village?.story||0])jrFocus('story');return;}
 if(y>=282&&y<=321&&x>=523){const o=typeof lifeOrderList==='function'?lifeOrderList().find(q=>!(S.orders&&S.orders.done||[]).includes(q.id)):null;if(o)jrFocus('order',o.id);return;}
}
const jrBaseDrawQuests=drawQuests;
drawQuests=function(){if(qTab===3){jrDrawJournal();return;}jrBaseDrawQuests();btn(486,8,138,24,jrLang('JURNAL','JOURNAL'),0);};
const jrBaseQuestClick=questClick;
questClick=function(x,y){if(y<34&&x>=486&&x<=630){qTab=3;jrEnsure();sfx('click');return;}if(qTab===3){jrJournalClick(x,y);return;}jrBaseQuestClick(x,y);};
/* Add relationship progress only after a complete, voluntary NPC conversation. */
const jrBaseNpcLines=npcLines;
npcLines=function(o){const lines=jrBaseNpcLines(o);jrEnsure();const id=o&&o.id,tier=jrTierRaw(S.journal.relationships[id]?.points||0),seen=S.journal.storySeen;const stories=JR_STORIES[id]||{};let milestone=0;
 if(tier>=2&&!seen.includes(id+':2')&&stories[2])milestone=2;else if(tier>=4&&!seen.includes(id+':4')&&stories[4])milestone=4;
 if(milestone){lines.push(stories[milestone][S.set.lang==='en'?1:0]);lines.jrStoryTier=milestone;}return lines;};
const jrBaseNpcStart=npcStart;
npcStart=function(o){jrBaseNpcStart(o);if(wTalk&&wTalk.o===o)wTalk.jrNpcId=o.id;};
const jrBaseNpcAdv=npcAdv;
npcAdv=function(){const d=wTalk;jrBaseNpcAdv();if(d&&!wTalk){const id=d.jrNpcId||(d.o&&d.o.id);if(d.ls&&d.ls.jrStoryTier){const key=id+':'+d.ls.jrStoryTier;if(!S.journal.storySeen.includes(key))S.journal.storySeen.push(key);sv();}if(id)jrTalkFinish(id);}};
const jrBaseOrderDeliver=lifeOrderDeliver;
lifeOrderDeliver=function(i){lifeEnsure();const order=lifeOrderList()[i],before=(S.orders&&S.orders.done||[]).slice();jrBaseOrderDeliver(i);if(order&&S.orders.done.includes(order.id)&&!before.includes(order.id))jrRelationshipGain(jrOrderRecipient(order),5,'order');};
const jrBaseStoryDeliver=lifeStoryDeliver;
lifeStoryDeliver=function(){const before=S.village&&S.village.story||0;jrBaseStoryDeliver();if((S.village&&S.village.story||0)>before)jrRelationshipGain('elder',8,'story');};
const jrBaseUpgradeVillage=lifeUpgradeVillage;
lifeUpgradeVillage=function(){const before=S.village&&S.village.level||1;jrBaseUpgradeVillage();if((S.village&&S.village.level||1)>before)jrRelationshipGain('builder',3,'upgrade');};
const jrBaseLifeWorldUpdate=lifeWorldUpdate;
lifeWorldUpdate=function(dt){jrBaseLifeWorldUpdate(dt);if(st==='world'&&S.world&&typeof lifeBiome==='function'){const id=lifeBiome(Math.floor(S.world.x/WS),Math.floor(S.world.y/WS));jrDiscoverBiome(id);}};
const jrBaseDrawWorld=drawWorld;
/* Panel FOKUS: tepat di bawah minimap; ketuk untuk meminimalkan/membuka (S.journal.fmin disimpan). */
function jrFocusRect(){const sc=[.9,1,1.1][Math.max(0,Math.min(2,Math.round(Number(S&&S.set&&S.set.ui)||0)))]||1,y=Math.round(4+76*sc+8),mn=!!(S.journal&&S.journal.fmin);return mn?{x:4,y:y,w:92,h:20,mn:1}:{x:4,y:y,w:236,h:34,mn:0}}
function jrToggleFocus(){jrEnsure();S.journal.fmin=S.journal.fmin?0:1;sv()}
function jrDrawFocus(){const f=jrCurrentFocus(),r=jrFocusRect();g.fillStyle='rgba(8,16,24,.86)';g.fillRect(r.x,r.y,r.w,r.h);g.strokeStyle='#6b9db8';g.lineWidth=1;g.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);
 if(r.mn)T(jrLang('FOKUS','FOCUS')+'  ▸',r.x+8,r.y+14,'#fc4',10);
 else{T(jrLang('FOKUS: ','FOCUS: ')+f.title.slice(0,22),r.x+8,r.y+13,'#fc4',10);T(f.detail.slice(0,38),r.x+8,r.y+26,'#cde',9);T('▾',r.x+r.w-12,r.y+13,'#9cf',10)}}
drawWorld=function(){jrBaseDrawWorld();if(st!=='world'||wTalk||wDlg)return;jrEnsure();jrDrawFocus()};
jrEnsure();
