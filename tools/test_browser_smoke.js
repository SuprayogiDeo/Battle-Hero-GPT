const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.join(__dirname, '..');
const store = new Map();
const noop = () => {};
function makeCtx() {
  const target = {
    canvas: null,
    measureText: t => ({ width: String(t).length * 7 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    getImageData: (x,y,w,h) => ({ data: new Uint8ClampedArray(Math.max(4,w*h*4)), width:w, height:h }),
    createImageData: (w,h) => ({ data: new Uint8ClampedArray(Math.max(4,w*h*4)), width:w, height:h }),
    isPointInPath: () => false,
  };
  return new Proxy(target, {
    get(o,k) { if (k in o) return o[k]; if (typeof k === 'string' && (k.startsWith('create') || k.startsWith('get'))) return noop; return noop; },
    set(o,k,v) { o[k]=v; return true; }
  });
}
function makeCanvas() {
  const ctx = makeCtx();
  const c = { width:640, height:360, style:{}, tabIndex:0,
    getContext: () => ctx,
    getBoundingClientRect: () => ({left:0,top:0,width:640,height:360}),
    addEventListener: noop, removeEventListener: noop, toDataURL: ()=>'data:image/png;base64,',
  };
  ctx.canvas = c;
  return c;
}
const canvas = makeCanvas();
const elements = {};
const genericElement = () => ({style:{},textContent:'',onclick:null,addEventListener:noop,removeEventListener:noop,appendChild:noop,setAttribute:noop,click:noop,querySelector:()=>genericElement()});
elements.pwa=genericElement();elements.pwa.querySelector=(q)=>{const k='pwa'+q;if(!elements[k])elements[k]=genericElement();return elements[k]};
const document = {
  title: 'Hero Battle', hidden:false, visibilityState:'visible',
  documentElement:{style:{}, requestFullscreen:noop},
  head:{appendChild:noop}, body:{appendChild:noop},
  getElementById(id){return id==='c'?canvas:(elements[id]||(elements[id]=genericElement()));}, querySelector(){return null;}, querySelectorAll(){return [];},
  createElement(tag){ if(tag==='canvas')return makeCanvas(); return {style:{},addEventListener:noop,appendChild:noop,setAttribute:noop,click:noop}; },
  addEventListener:noop, removeEventListener:noop,
};
class FakeImage {
  constructor(){this.complete=true;this.width=512;this.height=512;this.naturalWidth=512;this.naturalHeight=512;this.onload=null;this.onerror=null;}
  set src(v){this._src=v;if(typeof this.onload==='function')this.onload();}
  get src(){return this._src||'';}
}
const localStorage = {
  getItem(k){return store.has(k)?store.get(k):null;},
  setItem(k,v){store.set(k,String(v));}, removeItem(k){store.delete(k);}
};
const winListeners = {};
const context = vm.createContext({
  console, document, navigator:{vibrate:noop,userAgent:'test'}, location:{search:'',reload:noop,href:'http://localhost/index.html'},
  localStorage, Image:FakeImage, innerWidth:1280, innerHeight:720, devicePixelRatio:1,
  performance:{now:()=>1000}, requestAnimationFrame:()=>1, cancelAnimationFrame:noop,
  addEventListener:(name,fn)=>{(winListeners[name] ||= []).push(fn);}, removeEventListener:noop,
  setTimeout:()=>1, clearTimeout:noop, setInterval:()=>1, clearInterval:noop,
  fetch:()=>Promise.reject(new Error('fetch not expected in static smoke test')),
  URL, URLSearchParams, Date, Math, JSON, console, Uint8Array, Uint8ClampedArray, ArrayBuffer,
});
context.window=context;
context.self=context;
context.globalThis=context;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
for (const src of scripts) {
  const full=path.join(root,src);
  try { vm.runInContext(fs.readFileSync(full,'utf8'),context,{filename:src,timeout:5000}); }
  catch(e){ console.error('FAIL script load:',src, e.stack||e); process.exit(1); }
}
assert.ok(vm.runInContext("typeof Save.readMain === 'function'", context));
assert.ok(vm.runInContext("typeof contRun === 'function'", context));
assert.ok(vm.runInContext("typeof overflowClick === 'function'", context));
assert.ok(vm.runInContext("typeof hapticPulse === 'function'", context));
console.log(`PASS: ${scripts.length} browser scripts loaded in declared order; save, checkpoint, inbox, and settings hooks are present.`);
// Functional regression checks against the loaded game source.
function gameEval(code) { return vm.runInContext(code, context, { timeout: 5000 }); }
gameEval("sfx=function(){}; S.ad=0; S.deck=['recruit']; S.own.recruit={lv:1,st:1}; S.items=[]; S.overflowItems=[]; S.stageClaims=[]; S.g=1000; S.es=0; S.fday=today(); mode='main'; stage=2; stageG=100; runG=0; pendI=[]; pendE=0; P={atk:1,cd:1,crit:.1,burn:1,ls:0,as:1,hpm:1}; R={}; hs=[mkH('recruit')]; best=0;");
const gold0 = gameEval('S.g');
gameEval('clearStage()');
const firstGold = gameEval('S.g');
assert.strictEqual(firstGold - gold0, 116, 'first stage clear should grant full reward');
assert.ok(gameEval('S.stageClaims.includes(2)'), 'first clear should be recorded');
assert.strictEqual(gameEval('S.run.cleared'), true, 'clear checkpoint should be recorded');
gameEval("stageG=100; runG=0; pendI=[]; pendE=0; clearStage()");
const replayGold = gameEval('S.g') - firstGold;
assert.strictEqual(replayGold, 41, 'repeat stage should pay the reduced 35% reward');
assert.strictEqual(gameEval('S.stageClaims.length'), 1, 'repeat clear must not duplicate primary reward claim');
gameEval('contRun()');
assert.strictEqual(gameEval("st==='perk'"), true, 'continue after a clear should return to reward selection rather than replay the completed stage');

// Full inventory must not auto-sell equipment; extra earned gear is retained in the pending-reward inbox.
gameEval("S.items=Array.from({length:120},(_,i)=>({u:i+1,rar:'N',lv:1,lk:0})); S.overflowItems=[]; soldAuto={n:0,g:0}; const keepGold=S.g; const keepUid=S.items[0].u; addItem({u:999,rar:'SSR',lv:1,lk:0});");
assert.strictEqual(gameEval('S.items.length'), 120, 'main inventory stays within capacity');
assert.strictEqual(gameEval('S.items[0].u'), 1, 'existing item must not be sold implicitly');
assert.strictEqual(gameEval('S.overflowItems.length'), 1, 'extra loot should be retained in pending rewards');
assert.strictEqual(gameEval('S.g'), gameEval('keepGold'), 'overflow must not generate silent sale gold');

// Gear pulls validate capacity before currency, free ticket, or pity changes.
gameEval("S.fday=today(); S.items=Array.from({length:120},(_,i)=>({u:i+1,rar:'N',lv:1,lk:0})); S.overflowItems=[]; S.g=777; S.fe=0; S.epity=9; fullDlg=null; st='shop'; pullE(1)");
assert.strictEqual(gameEval('S.g'), 777, 'full bag purchase must not deduct gold');
assert.strictEqual(gameEval('S.fe'), 0, 'full bag purchase must not consume a free ticket');
assert.strictEqual(gameEval('S.epity'), 9, 'full bag purchase must not change pity counter');
assert.strictEqual(gameEval('fullDlg.need'), 1, 'capacity dialog should explain the number of slots needed');

// Defeat retry recovers at half HP and starts a clean stage checkpoint.
gameEval("S.g=777; S.fday=today(); S.deck=['recruit']; S.own.recruit={lv:1,st:1}; S.run={stage:3,P:{atk:1,cd:1,crit:.1,burn:1,ls:0,as:1,hpm:1},R:{},runG:0,hs:[{id:'recruit',hp:0,mh:220}],defeated:true,cleared:false}; contRun()");
assert.strictEqual(gameEval("st==='enter'"), true, 'defeat checkpoint should restart the same stage');
assert.ok(Math.abs(gameEval('hs[0].hp/hs[0].mh') - 0.5) < 0.01, 'defeat retry should restore the party at half HP');
console.log('PASS: stage reward idempotency/replay, post-clear recovery, safe loot overflow, purchase capacity validation, and defeat checkpoint recovery.');

// Material chest + workshop queue regression tests.
assert.strictEqual(gameEval("typeof lifeOpenStorage==='function' && typeof lifeOpenWorkshop==='function'"), true, 'storage and workbench screens are registered');
gameEval("sfx=function(){}; say=function(){}; S.village={level:1,story:0}; S.gather={day:'test',items:{wood:8,stone:0,herb:0,mushroom:0,fruit:0},nodes:{},count:0}; S.materialStorage={level:1,items:{}}; S.workshop={queue:[],nextId:1,totalCrafted:0}; storagecraftEnsure();");
gameEval("scMove('store','wood',5)");
assert.strictEqual(gameEval("S.gather.items.wood"), 3, 'deposit removes exactly the requested amount from the material bag');
assert.strictEqual(gameEval("S.materialStorage.items.wood"), 5, 'deposit puts materials into chest');
assert.strictEqual(gameEval("lifeFoodCount('wood')"), 8, 'recipes and village orders can see bag + chest materials');
gameEval("lifeConsume('wood',4)");
assert.strictEqual(gameEval("S.gather.items.wood"), 0, 'material consumption uses bag first');
assert.strictEqual(gameEval("S.materialStorage.items.wood"), 4, 'consumption continues into chest only for the remaining amount');
gameEval("scMove('take','wood','all')");
assert.strictEqual(gameEval("S.materialStorage.items.wood"), 0, 'take-all empties only the selected material in chest');
assert.strictEqual(gameEval("S.gather.items.wood"), 4, 'take-all returns material to the bag');
const upgradeGold = gameEval('S.g=1000; S.gather.items.wood=20; S.gather.items.stone=10; S.g;');
gameEval('scUpgradeChest()');
assert.strictEqual(gameEval('S.materialStorage.level'), 1, 'chest upgrade is locked before required village level');
assert.strictEqual(gameEval('S.g'), upgradeGold, 'failed chest upgrade does not deduct gold');
assert.strictEqual(gameEval('S.gather.items.wood'), 20, 'failed chest upgrade does not consume materials');
gameEval('S.village.level=2; scUpgradeChest()');
assert.strictEqual(gameEval('S.materialStorage.level'), 2, 'chest upgrade succeeds when requirements are met');
assert.strictEqual(gameEval('scChestCap()'), 180, 'tier 2 chest has configured capacity');
assert.strictEqual(gameEval('S.g'), 840, 'chest upgrade deducts the agreed price exactly once');
// Queue reserves one output-space unit and consumes no ingredients on failed validation.
gameEval("S.village.level=5; S.gather.items={wood:3,stone:3,herb:4,mushroom:1,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0}; S.materialStorage.items={wood:0,stone:0,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0}; S.workshop={queue:[],nextId:1,totalCrafted:0}; storagecraftEnsure(); scStartCraft('planks');");
assert.strictEqual(gameEval("S.workshop.queue.length"), 1, 'valid recipe starts a persistent job');
assert.strictEqual(gameEval("S.gather.items.wood"), 0, 'recipe ingredients are consumed when job starts');
assert.strictEqual(gameEval("scReservedOutputs()"), 1, 'each job reserves output capacity before processing');
gameEval("S.workshop.queue[0].readyAt=Date.now()-1; scSyncQueue(); scClaimCraft(S.workshop.queue[0].jobId)");
assert.strictEqual(gameEval("S.gather.items.plank"), 1, 'completed output is claimable into material bag');
assert.strictEqual(gameEval("S.workshop.queue.length"), 0, 'claim removes exactly the finished job');
const savedStone = gameEval('S.gather.items.stone');
assert.strictEqual(gameEval("scStartCraft('stone_bricks')"), true, 'second valid recipe can start');
gameEval("S.workshop.queue=[]; S.gather.items={wood:3,stone:0,herb:0,mushroom:0,fruit:57,plank:0,stone_brick:0,rope:0,forest_tonic:0}; S.village.level=1; storagecraftEnsure();");
assert.strictEqual(gameEval("scStartCraft('planks')"), false, 'crafting is blocked before start when output capacity is full');
assert.strictEqual(gameEval("S.gather.items.wood"), 3, 'blocked craft does not consume ingredients');
assert.strictEqual(gameEval("S.workshop.queue.length"), 0, 'blocked craft does not create a job');
gameEval("S.village.level=5; S.gather.items={wood:3,stone:3,herb:4,mushroom:1,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0}; S.workshop={queue:[],nextId:1,totalCrafted:0}; storagecraftEnsure(); scStartCraft('planks'); scStartCraft('stone_bricks'); scStartCraft('fiber_rope');");
const tonicBefore = gameEval("S.gather.items.herb+S.gather.items.mushroom");
assert.strictEqual(gameEval("scStartCraft('forest_tonic')"), false, 'fourth job is blocked when three queue slots are occupied');
assert.strictEqual(gameEval("S.workshop.queue.length"), 3, 'workshop queue never exceeds three jobs');
assert.strictEqual(gameEval("S.gather.items.herb+S.gather.items.mushroom"), tonicBefore, 'full queue does not consume recipe ingredients');
console.log('PASS: material chest transfers, bag/chest material availability, guarded chest upgrade, crafting reservation, timed output claim, no-consumption validation failure, and queue capacity.');
// Screen entry paths for the new world quick-menu actions and cross-navigation.
gameEval("st='world'; lifeWorldQuick=true; lifeQuickClick(300,216)");
assert.strictEqual(gameEval("st==='storage'"), true, 'world quick menu opens material storage');
gameEval('lifeStorageClick(550,10)');
assert.strictEqual(gameEval("st==='workshop'"), true, 'storage screen can navigate to workshop');
gameEval('lifeWorkshopClick(550,10)');
assert.strictEqual(gameEval("st==='storage'"), true, 'workshop screen can navigate back to storage');
gameEval('lifeStorageClick(40,10)');
assert.strictEqual(gameEval("st==='world'"), true, 'storage closes back to the originating world screen');
console.log('PASS: world quick menu storage entry, storage/workshop navigation, and return to origin.');

// Combat-stage regression checks: armor mitigation, non-stacking timed buffs, boss phases, and boss reward idempotency.
gameEval("sfx=function(){}; S.set.fx=1; S.set.dmg=1; S.own.recruit={lv:1,st:1}; S.items=[{u:91001,slot:'a',rar:'SSR',lv:0,nm:'Armor Test',ic:101}]; S.eq={recruit:{a:91001}};");
const armorDR = gameEval("eqStat('recruit').dr");
assert.ok(Math.abs(armorDR - 0.125) < 0.0001, 'SSR armor should provide a bounded 12.5% damage reduction at level 0');
gameEval("const defenseHero=mkH('recruit'); defenseHero.dead=0; defenseHero.inv=0; defenseHero.shield=0; defenseHero.hp=defenseHero.mh; hs=[defenseHero]; dmgH(defenseHero,40,null); S.__damageTaken=defenseHero.mh-defenseHero.hp;");
assert.strictEqual(gameEval('S.__damageTaken'), 35, 'armor reduction is applied to incoming damage');
gameEval("applyTimedBuff(1.35,6); applyTimedBuff(1.6,10);");
assert.strictEqual(gameEval('bf.m'), 1.6, 'new timed attack buff replaces rather than stacks with previous buff');
assert.strictEqual(gameEval('bf.t'), 10, 'refresh uses the new effect duration');
gameEval("S.__realDoCut=doCut; S.__phaseCuts=0; doCut=(s,c,id,sl)=>{S.__phaseCuts++;cut={s,c,t:1.1,id,sl}}; S.__phaseBoss={d:ED.boss,hp:1000,mh:2000,x:320,y:230,dead:0}; bossPhaseCheck(S.__phaseBoss); bossPhaseCheck(S.__phaseBoss); doCut=S.__realDoCut;");
assert.strictEqual(gameEval('bossPhase(S.__phaseBoss)'), 2, 'boss at or below 50% HP is in phase 2');
assert.strictEqual(gameEval('S.__phaseCuts'), 1, 'crossing into phase 2 is announced once');
gameEval("st='fight'; mode='main'; es=[S.__phaseBoss]; drawBossHealthBar();");
assert.strictEqual(gameEval("typeof drawBossHealthBar==='function'"), true, 'boss health bar renderer is registered');

// Old saves migrate a one-time boss reward ledger from already-cleared main stages.
gameEval("S.stageClaims=[5,10]; delete S.bossClaims; ensureBossClaims();");
assert.strictEqual(gameEval("S.bossClaims.join(',')"), '5,10', 'legacy boss-stage claims are migrated without granting old rewards again');
// First clear records both ledgers; stage replay grants only reduced gold and no second main boss bonus.
gameEval("S.stageClaims=[]; S.bossClaims=[]; S.items=[]; S.overflowItems=[]; S.ad=0; S.g=0; S.es=0; S.deck=['recruit']; S.own.recruit={lv:1,st:1}; mode='main'; stage=5; stageG=100; runG=0; pendI=[]; pendE=0; hs=[mkH('recruit')]; best=0; S.run=null; dropItem=(q)=>true;");
gameEval('clearStage()');
assert.strictEqual(gameEval('S.g'), 140, 'first boss-stage completion grants full stage gold');
assert.strictEqual(gameEval("S.stageClaims.includes(5) && S.bossClaims.includes(5)"), true, 'first clear persists both main-stage and boss reward ledgers');
const bossFirstEssence = gameEval('S.es');
gameEval("mode='main'; stage=5; stageG=100; runG=0; pendI=[]; pendE=0; hs=[mkH('recruit')]; clearStage();");
assert.strictEqual(gameEval('S.g'), 189, 'boss-stage replay grants only 35% of the stage gold reward');
assert.strictEqual(gameEval('S.es'), bossFirstEssence, 'boss-stage replay does not duplicate the primary boss essence bonus');
assert.strictEqual(gameEval('S.bossClaims.length'), 1, 'boss claim ledger does not grow on replay');
console.log('PASS: armor mitigation, timed-buff refresh, single boss phase transition, boss health bar, legacy boss-claim migration, and one-time boss rewards with reduced replay gold.');


// Journal/friendship integration tests (Batch 5).
gameEval("S.journal={version:1,focus:{type:'stage'},relationships:{},seenBiomes:{},storySeen:[]}; S.g=0; S.es=0; jrEnsure(); jrRelationshipGain('farmer',10,'test');");
assert.strictEqual(gameEval("jrBondPoints('farmer')"), 10, 'relationship points persist in the journal');
assert.strictEqual(gameEval("jrTier('farmer')"), 1, '10 points unlock the first relationship tier');
assert.strictEqual(gameEval('S.g'), 20, 'first bond tier grants its small one-time gold reward');
gameEval("jrRelationshipGain('farmer',0,'test'); jrEnsure();");
assert.strictEqual(gameEval('S.g'), 20, 'relationship tier rewards cannot be claimed twice');
gameEval("S.journal.relationships.cook.points=24; S.journal.relationships.cook.claimedTiers=[1]; jrEnsure();");
assert.strictEqual(gameEval("jrRecipeUnlocked(LIFE_RECIPES.find(r=>r.id==='village_feast'))"), false, 'resident feast recipe stays locked before relationship tier 2');
gameEval("S.journal.relationships.cook.points=25; jrEnsure();");
assert.strictEqual(gameEval("jrRecipeUnlocked(LIFE_RECIPES.find(r=>r.id==='village_feast'))"), true, 'resident feast recipe unlocks at cook relationship tier 2');
assert.strictEqual(gameEval("jrRecipeUnlocked(LIFE_RECIPES.find(r=>r.id==='herbal_broth'))"), false, 'herb broth stays locked before the farmer bond threshold');
gameEval("S.journal.relationships.farmer.points=25; jrEnsure();");
assert.strictEqual(gameEval("jrRecipeUnlocked(LIFE_RECIPES.find(r=>r.id==='herbal_broth'))"), true, 'herb broth unlocks when the farmer relationship reaches tier 2');
assert.strictEqual(gameEval("ACH.length>=14 && ACH.some(a=>a.id==='artisan') && ACH.some(a=>a.id==='explorer')"), true, 'village, crafting and exploration achievements are integrated');
gameEval("st='quests'; qTab=3; jrSubtab=0; drawQuests(); jrFocus('daily',qList()[0].q.k);");
assert.strictEqual(gameEval("qTab===3 && S.journal.focus.type==='daily'"), true, 'journal tab and focused daily quest are wired into quest screen');
assert.ok(gameEval('jrCurrentFocus().title.length>0'), 'focused objective produces a current-world label');
assert.strictEqual(gameEval("jrDiscoverBiome('meadow')"), true, 'first biome visit is recorded');
assert.strictEqual(gameEval("jrDiscoverBiome('meadow')"), false, 'biome discovery is idempotent');
console.log('PASS: journal focus, relationship tiers/reward idempotency, friendship-gated resident recipes, and first-time biome discovery.');


// Batch 6: dungeon loop, persistent one-time primary rewards, world map and safe waypoint.
assert.strictEqual(gameEval("typeof hbStartDungeon==='function' && typeof hbOpenWorldMap==='function' && typeof hbDungeonClearRoom==='function'"), true, 'dungeon and world map controllers are wired');
gameEval("S.dungeons={version:1,claims:[],rooms:[],active:true,checkpoint:1,clears:0,bestRoom:0,runs:0,losses:0,currentGold:0,currentEssence:0,lastResult:null}; S.village={level:1,story:0}; S.tut=1; best=3; mode='dungeon'; stage=1; S.g=0; S.es=0; runG=0; stageG=100; pendI=[]; pendE=0; S.stageClaims=[]; hs=[mkH('recruit')]; clearStage();");
assert.strictEqual(gameEval("S.dungeons.rooms.includes(1) && S.dungeons.checkpoint===2 && S.dungeons.active"), true, 'a cleared room is persisted and checkpoint advances to next room');
assert.strictEqual(gameEval('S.g'), 108, 'first room clear receives full room reward');
assert.strictEqual(gameEval('S.stageClaims.length'), 0, 'dungeon rooms do not mutate the main-stage reward ledger');
const dungeonGoldFirstRoom = gameEval('S.g');
gameEval("mode='dungeon'; stage=1; S.g=0; stageG=100; pendI=[]; pendE=0; S.dungeons.active=true; S.dungeons.checkpoint=1; hs=[mkH('recruit')]; clearStage();");
assert.strictEqual(gameEval('S.g'), 38, 'replaying a previously cleared dungeon room gives reduced room gold');
// The final room grants the dungeon primary reward only once and stores a persistent result.
gameEval("mode='dungeon'; stage=3; S.g=0; S.es=0; S.dungeons.active=true; S.dungeons.checkpoint=3; S.dungeons.currentGold=0; S.dungeons.currentEssence=0; stageG=100; runG=0; pendI=[]; pendE=1; hs=[mkH('recruit')]; clearStage();");
assert.strictEqual(gameEval("S.dungeons.claims.includes('forest_ruins') && !S.dungeons.active && S.dungeons.checkpoint===1"), true, 'final room completes the dungeon and records the primary reward claim');
assert.strictEqual(gameEval('S.es'), 3, 'first dungeon clear grants its primary essence reward plus earned elite essence');
assert.strictEqual(gameEval("S.dungeons.lastResult && S.dungeons.lastResult.firstClear===true && S.dungeons.lastResult.gold===S.dungeons.currentGold"), true, 'dungeon completion result persists total run rewards');
const dungeonFirstFinalGold=gameEval('S.dungeons.lastResult.gold');
gameEval("hbFinishDungeon(); S.dungeons.active=true; S.dungeons.checkpoint=3; S.dungeons.currentGold=0; S.dungeons.currentEssence=0; mode='dungeon'; stage=3; S.g=0; S.es=3; stageG=100; runG=0; pendI=[]; pendE=1; hs=[mkH('recruit')]; clearStage();");
assert.strictEqual(gameEval('S.es'), 3, 'replaying a completed dungeon does not grant the primary essence twice');
assert.strictEqual(gameEval("S.dungeons.lastResult.firstClear===false"), true, 'repeat dungeon clear is identified as a reduced-reward replay');
assert.ok(gameEval('S.dungeons.lastResult.gold < '+dungeonFirstFinalGold), 'repeat dungeon primary-room rewards are reduced');
gameEval("S.world={x:80,y:48,disc:'*'}; S.journal={version:1,focus:{type:'stage'},relationships:{},seenBiomes:{},storySeen:[]}; st='world'; const wx=S.world.x,wy=S.world.y; hbOpenWorldMap(); draw(); hbMapSelect(10,10);");
assert.strictEqual(gameEval("st==='worldmap' && !!S.journal.waypoint"), true, 'world map can set a waypoint on a known tile');
assert.strictEqual(gameEval('S.world.x===80 && S.world.y===48'), true, 'selecting a waypoint does not teleport the player');
gameEval("hbCloseWorldMap(); S.world.disc=''; hbMapSig=''; hbMapCanvas=null;");
assert.strictEqual(gameEval("hbMapSelect(10,10)"), false, 'undiscovered locations cannot be marked as known waypoints');
console.log('PASS: dungeon checkpoints/replay reward reductions/one-time primary reward, persistent result, non-teleport waypoint and discovery-gated world-map navigation.');

// Dungeon unlock requirements and defeat checkpoint retry are enforced by the UI-facing controller.
gameEval("S.dungeons={version:1,claims:[],rooms:[],active:false,checkpoint:1,clears:0,bestRoom:0,runs:0,losses:0,currentGold:0,currentEssence:0,lastResult:null}; S.tut=0; best=0; S.village={level:1,story:0}; S.deck=['recruit']; S.own.recruit={lv:1,st:1}; st='world'; const blocked=hbStartDungeon();");
assert.strictEqual(gameEval('blocked'), false, 'dungeon remains locked before tutorial and Main Stage requirements');
assert.strictEqual(gameEval("st==='world' && !S.dungeons.active"), true, 'locked dungeon attempt does not start or mutate a run');
gameEval("S.tut=1; best=3; const allowed=hbStartDungeon();");
assert.strictEqual(gameEval('allowed'), true, 'tutorial and Main Stage requirements unlock the dungeon');
assert.strictEqual(gameEval("mode==='dungeon' && stage===1 && st==='enter' && S.dungeons.active"), true, 'new dungeon run begins at room 1 with an active save checkpoint');
gameEval("stage=2; S.dungeons.checkpoint=2; S.dungeons.active=true; hs=[mkH('recruit')]; hs[0].dead=1; es=[]; ps=[]; tele=[]; sch=[]; mode='dungeon'; st='fight'; const lossesBefore=S.dungeons.losses; upd(.016);");
assert.strictEqual(gameEval("st==='over' && S.dungeons.checkpoint===2 && S.dungeons.losses===lossesBefore+1"), true, 'defeat preserves the current dungeon room as the retry checkpoint');
gameEval('hbRetryDungeon()');
assert.strictEqual(gameEval("mode==='dungeon' && stage===2 && st==='enter' && hs.length>0 && hs.every(h=>!h.dead)"), true, 'dungeon retry restores the party at the saved room');
console.log('PASS: gate unlock requirements, dungeon start, defeat checkpoint persistence and retry restoration.');
