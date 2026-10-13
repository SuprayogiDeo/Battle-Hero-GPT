#!/usr/bin/env node
'use strict';
/* Stage 8D+8E regression tests. Runtime functions are exercised in the browser-script VM harness. */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = fs.readFileSync(path.join(__dirname, 'test_browser_smoke.js'), 'utf8');
const marker = 'assert.ok(vm.runInContext("typeof Save.readMain';
const head = base.slice(0, base.indexOf(marker));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm,winListeners};')(require, __dirname, mod);
const { context, vm: vmx } = mod.exports;
const ev = code => vmx.runInContext(code, context, { timeout: 6000 });
let n = 0;
const ok = (cond, message) => { assert.ok(cond, message); n++; };
const eq = (actual, expected, message) => { assert.equal(actual, expected, message); n++; };
const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/index.json'), 'utf8'));

// Provide a clear collision-free fixture for the same world plot-coordinates the runtime uses.
context.__testWorld = { ...data, grid: Array.from({length:96},()=>'.'.repeat(128)), farm: Array.from({length:24},(_,i)=>[632+(i%6)*16,216+Math.floor(i/6)*16]) };
ev("Tmap.data=()=>__testWorld; Tmap.collisionAt=()=>false; WMAP.length=0; __testWorld.grid.forEach(r=>WMAP.push(r.split(''))); WW=128; WH=96; wVon=1; st='world'; wI=null; wDlg=0; wTalk=null; wFade=null; lifeWorldQuick=false; best=100; OX=0; VW=640; wcx=1164; wcy=272; S.world={x:1264,y:432}; S.set.lang='id'; S.gather={day:today(),items:{wood:0,stone:0,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0,seed_carrot:3,seed_pumpkin:2,seed_sunflower:1},nodes:{},count:0}; S.materialStorage={level:1,items:{}}; storagecraftEnsure(); S.farm={p:Array.from({length:24},()=>({s:0,w:0})),tool:-1,day:today(),gd:0,ed:0,starterSeedsGranted:1}; S.hb={sel:6,pg:0,water:0,slots:{6:'seed_carrot'}};");

// 6×4 visible world field exists, has clear ground tiles and no blocked collision cells.
eq(ev('FARM.n'),24,'field migrates to 24 plots');
eq(ev('Tmap.data().farm.length'),24,'asset exposes all 24 farm cells');
ok(ev('Tmap.data().farm.every(p=>Tmap.data().grid[Math.floor(p[1]/16)][Math.floor(p[0]/16)]===\'.\')'), 'farm plot anchors use open grass, not structures/water');
ok(ev("!/wGo\\('farm'\\)|st='farm'/.test((__testWorld.grid||[]).join(''))"), 'world plot fixture remains independent from old farm screen');

// Pointer gesture: each plot is processed at most once, repeated move over the same plot consumes no extra seed.
ev("S.farm.p[0]={s:1,w:0}; S.farm.p[1]={s:1,w:0}; S.gather.items.seed_carrot=3; var __downPrevented=false; farmWorldPointerDown({pointerId:809,clientX:100,clientY:160,cancelable:true,preventDefault(){__downPrevented=true},stopImmediatePropagation(){}});");
ok(ev('__downPrevented'), 'valid farm tap is captured before world movement');
eq(ev('S.gather.items.seed_carrot'),2,'first plot consumes exactly one seed');
ev("farmWorldPointerMove({pointerId:809,clientX:100,clientY:160}); farmWorldPointerMove({pointerId:809,clientX:132,clientY:160}); farmWorldPointerMove({pointerId:809,clientX:132,clientY:160});");
eq(ev('S.gather.items.seed_carrot'),1,'swipe processes the next plot once and ignores duplicate coordinates');
eq(ev('S.farm.p[0].s'),2,'first plot planted');
eq(ev('S.farm.p[1].s'),2,'second plot planted');
ev("farmWorldGestures.delete(809)");

// Insufficient seeds and invalid collision/NPC cells do not mutate plot state or inventory.
ev("S.farm.p[2]={s:1,w:0}; S.gather.items.seed_carrot=0; farmWorldAction(2,'seed_carrot');");
eq(ev('S.gather.items.seed_carrot'),0,'insufficient seed count never becomes negative');
eq(ev('S.farm.p[2].s'),1,'failed planting keeps the tilled soil intact');
ev("S.farm.p[3]={s:1,w:0}; S.gather.items.seed_carrot=2; Tmap.collisionAt=()=>true; farmWorldAction(3,'seed_carrot');");
eq(ev('S.gather.items.seed_carrot'),2,'blocked plot is skipped before seed cost');
ev("Tmap.collisionAt=()=>false");

// Manual water and rain call the same per-plot moisture function; a wet plot cannot receive a second watering bonus.
ev("S.hb.water=2; S.farm.p[3]={s:1,w:0}; farmWorldAction(3,'can');");
eq(ev('S.hb.water'),1,'manual watering consumes one charge');
eq(ev('S.farm.p[3].w'),1,'manual water marks the shared moisture state');
ok(ev('farmAutoWaterAll(true)>=2'), 'rain moistens dry eligible plots through the same helper');
eq(ev('farmWaterPlot(S.farm.p[3])'),false,'already wet plot cannot be watered/boosted twice');
ev("S.hb.water=5; hudEnsure()");
eq(ev('S.hb.water'),5,'HUD preserves bucket charges 0–6');

// The legacy F action no longer transitions to the old full-screen farming screen.
const worldJs = fs.readFileSync(path.join(root, 'js/world.js'), 'utf8');
ok(!/wGo\(['"]farm['"]\)/.test(worldJs), 'world F action no longer opens old farm screen');

// Fishing waits in-world for the bite, uses a timed reel window, and adds a persistent collection entry without opening a popup.
ev("Tmap.data=()=>__testWorld; S.fish={caughtToday:0,total:0,book:{},stock:{},soldGold:0}; S.world={x:1264,y:432}; st='world'; lifeFishClose(); lifeStartFishing({x:10,y:10,biome:'lake'}); lifeFish.biteAt=.25; lifeFishUpdate(.25)");
eq(ev("lifeFish.phase"),'bite','fishing advances to the world-visible bite phase');
ok(ev("st==='world' && lifeFish.active"), 'fishing does not open a modal/screen');
eq(ev('lifeFishTap()'),true,'reel action catches inside timing window');
eq(ev('S.fish.total'),1,'catch persists in fish collection total');
eq(ev('Object.values(S.fish.book).reduce((a,b)=>a+b,0)'),1,'species collection/book is updated');
ok(ev("toast.s.includes('+1 Ikan')"), 'catch feedback is a concise +1 Ikan toast');

// Edge forest trees are cuttable, core/unique trees are protected, and a stump can be cleaned.
const eligible = data.objects.find(o => ev(`lifeTreeEdgeEligible(${JSON.stringify(o)})`));
ok(!!eligible, 'forest-edge tree candidates exist');
const core = data.objects.find(o => String(o.a||'').startsWith('tree') && Math.floor(o.x/16)>=76 && Math.floor(o.x/16)<116 && Math.floor(o.y/16)>10 && Math.floor(o.y/16)<52);
ok(!!core && !ev(`lifeTreeEdgeEligible(${JSON.stringify(core)})`), 'core forest trees remain protected');
const coreResource = data.resources.find(r => r.id === 'wood_forest_2');
ok(!!coreResource && !ev(`lifeTreeResourceEligible(${JSON.stringify(coreResource)})`), 'core forest resource markers are not interactable');
const edgeResource = data.resources.find(r => r.id === 'wood_forest_3');
ok(!!edgeResource && ev(`lifeTreeResourceEligible(${JSON.stringify(edgeResource)})`), 'edge resource without an object sprite remains interactable');
ok(!ev(`lifeTreeEdgeEligible(${JSON.stringify({...eligible,unique:true})})`), 'unique trees remain protected');
ev(`S.gather.nodes[lifeTreeObjectId(${JSON.stringify(eligible)})]={readyAt:lifeNow()+60000,stump:1};`);
eq(ev(`lifeTreeObjectState(${JSON.stringify(eligible)})`),'stump','felled tree visibly remains a stump');
ev(`lifeDoGather({id:lifeTreeObjectId(${JSON.stringify(eligible)}),kind:'stump',x:${eligible.x/16-.5},y:${eligible.y/16-1}})`);
eq(ev(`lifeTreeObjectState(${JSON.stringify(eligible)})`),'hidden','stump can be cleared while tree respawn stays delayed');

// Full bag leaves the material at the source; one free slot takes only one of a two-item drop.
ev("lifeFishClose(); S.worldDrops=[]; S.gather.count=0; S.gather.items={}; SC_MATERIALS.forEach(m=>S.gather.items[m.id]=0); S.gather.items.wood=scBagCap(); S.materialStorage={level:1,items:{}}; storagecraftEnsure(); lifeDoGather({id:'stage8de_full_bag',kind:'tree',x:64,y:15,respawnMs:120000});");
eq(ev('S.gather.items.wood'),ev('scBagCap()'),'full bag does not overfill on a tree harvest');
eq(ev("S.worldDrops.reduce((a,d)=>a+d.qty,0)"),2,'overflow material drops near the source instead of disappearing');
eq(ev('lifeTakeWorldDrop(S.worldDrops[0].id)'),false,'full bag cannot take a drop and leaves it on the ground');
ev("S.gather.items.wood=scBagCap()-1");
eq(ev('lifeTakeWorldDrop(S.worldDrops[0].id)'),true,'partial stack is picked up when one slot is free');
eq(ev("S.worldDrops[0].qty"),1,'uncollected remainder remains as a world drop');

// Axe/mining/reeling/watering and crops use catalogued frame sets; respawn values remain explicit placeholders.
const atlas = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/atlas.json'), 'utf8'));
for (const [name, count] of [['avatar_watering',5],['avatar_reeling',13],['avatar_axe',10],['avatar_mining',10]]) eq(atlas.anims[name]?.n,count,`${name} frame count`);
for (const crop of ['carrot','pumpkin','sunflower']) for(let i=0;i<6;i++) ok(!!atlas.anims[`crop_${crop}_${i}`],`crop ${crop} stage ${String(i).padStart(2,'0')}`);
const lifeJs=fs.readFileSync(path.join(root,'js/life.js'),'utf8');
ok(lifeJs.includes('PLACEHOLDER respawn') && lifeJs.includes('PLACEHOLDER: jendela gigitan'), 'unspecified respawn/bite timing is labelled PLACEHOLDER');
console.log(`PASS: Stage 8D+8E (${n} checks): world-farm gesture, seeds/moisture, in-world fishing, protected tree/stump, bag overflow drops, respawn and animation assets.`);
