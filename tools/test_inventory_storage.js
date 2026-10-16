#!/usr/bin/env node
'use strict';
/* Stage 8C regression tests: protected hotbar, split/partial transfer, capacity gating, pending rewards and chest migration. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const marker = 'assert.ok(vm.runInContext("typeof Save.readMain';
const head = src.slice(0, src.indexOf(marker));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm,winListeners};')(require, path.join(root, 'tools'), mod);
const { context, vm, winListeners } = mod.exports;
const ev = code => vm.runInContext(code, context, { timeout: 5000 });
let n = 0; const ok = (condition, message) => { assert.ok(condition, message); n++; };

// One source of truth for the starter-tool unlock placeholders; old saves still migrate.
ok(ev('HB_STARTER_TOOL_CONFIG.placeholder===true'), 'starter-tool numbers are explicitly PLACEHOLDER');
ok(ev("HB_TOOLS.length===6 && HB_TOOLS.every(t=>!Object.prototype.hasOwnProperty.call(t,'u'))"), 'unlock thresholds are not duplicated on each tool');
ev("delete S.hb;storagecraftEnsure();hudEnsure()");
ok(ev("S.hb && S.hb.slots && typeof S.hb.slots==='object' && S.hb.sel===0"), 'legacy save gets an empty configurable hotbar');

// The first six tools can neither be replaced nor cleared; extra slots bind materials without consuming them.
ev("S.gather.items={wood:3,stone:2,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0};S.hb={sel:0,pg:0,water:0,slots:{}};storagecraftEnsure();scSelectedId='wood';scSelectedSide='bag'");
ok(ev("hudAssignQuickSlot(4,'wood')===false && !S.hb.slots[4]"), 'a starter slot cannot be overwritten');
ok(ev('hudClearQuickSlot(0)===false'), 'a starter slot cannot be cleared');
ok(ev("hudAssignQuickSlot(6,'wood')===true && S.hb.slots[6]==='wood' && Save.readMain().hb.slots[6]==='wood'"), 'free slot can be assigned from a bag material and saved via Save.*');
ok(ev("S.gather.items.wood===3 && hudToolId()==='hand'"), 'binding a slot does not consume its item or change active selection');
ev('S.hb.sel=6'); ok(ev("hudToolId()==='wood'"), 'selecting a configured slot returns the assigned item ID');
ok(ev("hudClearQuickSlot(6)===true && !S.hb.slots[6] && S.gather.items.wood===3"), 'free slot can be cleared without deleting inventory');
const hud = fs.readFileSync(path.join(root, 'js/hud.js'), 'utf8');
/* v72: ukuran font hitungan kini adaptif lewat hudFs(9,...) (>= 9 logis; naik di layar kecil). Maksud tes sama: hitungan tumpukan tetap digambar di sudut slot. */
ok(hud.includes("T(String(count),x+slot-2*L.z,y+slot-2*L.z,'#fff',hudFs(9,12,slot-4,String(count)),'right')"), 'hotbar renders live stack counts');

// Swipe switches the world hotbar page without choosing a slot or sending input to the world.
ev("st='world';S.hb.pg=0;const __L=hudLayout();hudDown(987,__L.left+__L.slot/2,__L.centerY)");
const x0 = ev('hudSw.x0');
for (const fn of (winListeners.pointermove || [])) fn({pointerId:987, clientX:x0+35, clientY:333});
ok(ev('S.hb.pg===1 && hudSw.moved===1'), 'horizontal swipe changes to page two');
for (const fn of (winListeners.pointerup || [])) fn({pointerId:987, clientX:x0+35, clientY:333});
ok(ev('hudSw===null'), 'swipe end does not leave pointer capture state active');

// Full-bag gathering now keeps the material as a visible world drop; crafting still validates capacity before consuming materials or gold.
ev("S.village={level:1,story:0};S.workshop={queue:[],nextId:1,totalCrafted:0};S.gather.items={wood:60,stone:0,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0};S.materialStorage={level:1,items:{wood:0,stone:0,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0}};storagecraftEnsure();S.gather.count=0;S.g=777");
ok(ev('scBagUsed()===scBagCap()'), 'test fixture reaches exact bag capacity');
ok(ev("lifeDoGather({kind:'tree',id:'stage8c-full',x:5,y:7})===true && S.gather.items.wood===60 && S.gather.count===1 && S.worldDrops.length===1 && S.worldDrops[0].qty===2"), 'full bag keeps the entire gathered stack as a visible drop rather than losing it');
ok(ev("scStartCraft('planks')===false && S.gather.items.wood===60 && S.g===777 && S.workshop.queue.length===0"), 'full bag refuses crafting before consuming recipe materials');

// Store partial stack against almost-full chest; half means floor(stack/2), minimum one item.
ev("S.village.level=1;S.gather.items={wood:12,stone:0,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0};S.materialStorage={level:1,items:{wood:0,stone:95,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0}};storagecraftEnsure()");
ok(ev("scMove('store','wood','all')===true && S.gather.items.wood===7 && S.materialStorage.items.wood===5 && scChestUsed()===100"), 'store moves only five items into the final five chest slots');
ok(ev("scMove('take','wood','half')===true && S.gather.items.wood===9 && S.materialStorage.items.wood===3"), 'half split transfers two out of a stack of five');
ok(ev("scMove('take','wood',1)===true && S.gather.items.wood===10 && S.materialStorage.items.wood===2"), 'single-item split preserves remainder');

// Sort is a deliberate snapshot: quantities changing after transfer do not silently reshuffle rows.
ev("S.gather.items.wood=10;S.materialStorage.items.stone=2;scApplySort('qty');var __orderBefore=scOrder.join(',');S.gather.items.wood=0;S.materialStorage.items.stone=25");
ok(ev("scOrder.join(',')===__orderBefore"), 'inventory display order stays stable after counts change');
ev("scApplySort('qty')");
ok(ev("scOrder[0]==='stone'"), 'explicit quantity sort uses current counts');
ev("scApplySort('category')");ok(ev("SC_MATERIALS.find(m=>m.id===scOrder[0]).category==='raw' && SC_MATERIALS.find(m=>m.id===scOrder[scOrder.length-1]).category==='consumable'"), 'category sort orders raw, processed, then consumable materials');
ev("scApplySort('name');var __names=scOrder.map(id=>SC_MATERIALS.find(m=>m.id===id).name);scApplySort('category')");
ok(ev("__names[0]==='Bata batu'"), 'name sort uses item names');

// Exercise the actual select-then-destination controls and quick-transfer transaction.
ev("S.village={level:1,story:0};S.gather.items={wood:10,stone:0,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0};S.materialStorage={level:1,items:{wood:0,stone:0,herb:0,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0}};scOrder=SC_MATERIALS.map(m=>m.id);scSelectedId=null;scSelectedSide='bag';scAmountMode='all';st='storage';var __woodRow=scOrder.indexOf('wood')");
ev("scRowPage=Math.floor(__woodRow/SC_ROWS);lifeStorageClick(40,112+(__woodRow%SC_ROWS)*SC_ROWH+4)");ok(ev("scSelectedId==='wood'&&scSelectedSide==='bag'"), 'tap bag row selects without moving');
ev("lifeStorageClick(80,280);lifeStorageClick(400,280)");ok(ev("S.gather.items.wood===5&&S.materialStorage.items.wood===5"), 'split-half then destination button transfers the requested half');
ev("scRowPage=Math.floor(__woodRow/SC_ROWS);lifeStorageClick(400,112+(__woodRow%SC_ROWS)*SC_ROWH+4);lifeStorageClick(160,280);lifeStorageClick(550,280)");ok(ev("S.gather.items.wood===10&&S.materialStorage.items.wood===0"), 'take-all requires selecting the chest row then destination');
ev("S.gather.items.wood=2;S.gather.items.stone=1;scQuickMove('store')");ok(ev("S.gather.items.wood===0&&S.gather.items.stone===0&&S.materialStorage.items.wood===2&&S.materialStorage.items.stone===1"), 'quick-store moves several stacks without loss');
ev("scQuickMove('take')");ok(ev("S.gather.items.wood===2&&S.gather.items.stone===1&&S.materialStorage.items.wood===0&&S.materialStorage.items.stone===0"), 'quick-take transfers the stacks back');
ev("lifeDrawStorage()");ok(true, 'dual-panel storage draw path completes');

// Chest upgrade costs are validated first and must not truncate any pre-existing chest content, including legacy over-capacity saves.
ev("S.village={level:2,story:0};S.g=1000;S.gather.items={wood:8,stone:4,herb:1,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0};S.materialStorage={level:1,items:{wood:65,stone:45,herb:3,mushroom:0,fruit:0,plank:0,stone_brick:0,rope:0,forest_tonic:0}};storagecraftEnsure();var __chestBefore=JSON.stringify(S.materialStorage.items);var __goldBefore=S.g");
ok(ev("scUpgradeChest()===true && S.materialStorage.level===2 && JSON.stringify(S.materialStorage.items)===__chestBefore"), 'chest upgrade preserves all pre-existing chest counts');
ok(ev('S.g===__goldBefore-160 && S.gather.items.wood===0 && S.gather.items.stone===0'), 'upgrade cost is charged only after requirements validate');

// Gear overflow is visible and can be opened directly from the combined panel; UI pointer is routed centrally.
ev("S.items=Array.from({length:120},(_,i)=>({u:i+1,rar:'N',lv:0,lk:0}));S.overflowItems=[];soldAuto={n:0,g:0};var __extra={u:9999,slot:'w',rar:'SSR',lv:0,lk:0};addItem(__extra)");
ok(ev("S.items.length===120 && S.overflowItems.length===1 && S.overflowItems[0].u===9999 && /HADIAH TERTUNDA/.test(toast.s)"), 'special gear goes to visible temporary reward storage when the main bag is full');
ev("scOrigin='world';st='storage';lifeStorageClick(350,320)");
ok(ev("st==='overflow' && overflowBack==='storage'"), 'pending rewards are reachable from the bag/chest panel');
ev("overflowClick(40,10)");ok(ev("st==='storage'"), 'closing pending rewards returns to bag/chest panel');
const input = fs.readFileSync(path.join(root, 'js/input.js'), 'utf8');
ok(input.includes("if(st=='storage'||st=='workshop'){lifeInputState(x,y);return}"), 'storage/workshop input consumes the pointer before world input');
const storage = fs.readFileSync(path.join(root, 'js/storagecraft.js'), 'utf8');
ok(!storage.includes("{capture:true}"), 'no duplicate capture listener can race/forward storage taps');
ok(fs.existsSync(path.join(root, 'assets/world/items.png')), 'runtime inventory icon atlas exists');
console.log(`PASS: inventory/storage (${n} checks)`);
