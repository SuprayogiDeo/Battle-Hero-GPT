#!/usr/bin/env node
/* Isolated logic smoke tests for js/life.js. UI/rendering is mocked; this does not replace in-browser tests. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const world = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/index.json'), 'utf8'));
const messages = [];
const S = { set: {lang:'id', season:1, fx:1}, g:0, es:0, ft:0,
  world:{x:30*16,y:26*16}, own:{}, deck:[],
  worldEarn:{day:new Date().toDateString(),gold:0,essence:0,tickets:0} };
const g = {save(){},restore(){},fillRect(){},strokeRect(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},closePath(){},ellipse(){}};
const ctx = {
  S, NPCS:[{id:'elder',tx:26,ty:19}], today:()=> '2026-10-12', sv(){}, say:s=>messages.push(s), sfx(){},
  performance, Date, Math, JSON, console, VW:640, OX:0, t:0, WS:16, st:'world', wFrom:0,
  wDlg:0, wTalk:null, wNpc:null, wPlace:null, wNear:null, qTab:0, stage:1, hs:[],
  Tmap:{data:()=>world,hasTag:(x,y,tag)=>tag==='fishing_spot'&&world.grid[y]?.[x]==='~'},
  wInteract(){}, worldDown(){}, drawWorld(){}, updWorld(){}, wSnow(){return false}, draw(){},
  drawQuests(){}, questClick(){}, drawMarket(){}, marketClick(){}, mkH(){return {mh:100,hp:100,lm:1}},
  startStage(){}, farmHarvest(){return true}, npcStart(){}, cv:{addEventListener(){}}, addEventListener(){},
  Anim:{Actor:function(){this.face=()=>{};this.play=()=>{};this.state='idle';this.action=null;this.update=()=>{}},has:()=>true},
  wAct:{face(){},play(){},state:'idle',action:null,t0:0}, g,
  goBack(){},wGo(){},worldLeave(){},marketFrom:'world',FC:[],farmGet:()=>({p:[]}),lifeDummy:0
};
ctx.self=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/life.js'),'utf8'),ctx,{timeout:3000});
const run = code => vm.runInContext(code,ctx,{timeout:3000});

// One-tap bite edge case, species book, and daily fishing cap.
run("lifeStartFishing({x:10,y:10,biome:'lake'}); lifeFish.biteAt=.5; lifeFishUpdate(.5); lifeFishTap();");
assert.equal(run('S.fish.caughtToday'),1);
assert.equal(run('S.fish.total'),1);
assert.equal(run('Object.keys(S.fish.book).length'),1);
run('lifeFishClose(); S.fish.caughtToday=50; lifeStartFishing({x:10,y:10,biome:"lake"});');
assert.ok(run('lifeFish&&lifeFish.active'),'fishing has no daily cap: cast must still start');
run("lifeFish.biteAt=.1; lifeFishUpdate(.2); lifeFishTap();");
assert.equal(run('lifeFish.phase'),'caught');
run('lifeFishUpdate(1.0);');
assert.equal(run('lifeFish'),null,'after a catch the fishing state closes automatically (no CONTINUE step)');
// Gather output and one resource action is counted once toward daily limit.
run("S.gather.count=0; lifeDoGather({id:'test_tree',kind:'tree',x:2,y:2,respawnMs:1000});");
assert.equal(run('S.gather.items.wood'),2);
assert.equal(run('S.gather.count'),1);
assert.ok(run("S.gather.nodes.test_tree.readyAt") > run('lifeNow()'));

// Cooking consumes ingredients and applies bounded buffs; only one buff persists.
run("S.kitchen.food.carrot=1; S.ranch={stock:{egg:1,milk:1,truffle:0,wool:0}}; lifeCook(LIFE_RECIPES[0]);");
assert.deepEqual(Array.from(run('[S.buff.atk,S.buff.hp,S.buff.stages]')),[.08,.05,3]);
run("S.kitchen.food.pumpkin=1; S.gather.items.herb=1; S.ranch.stock.milk=1; lifeCook(LIFE_RECIPES[1]);");
assert.equal(run('S.buff.id'),'farm_stew');
assert.ok(run('S.buff.atk<=.10 && S.buff.hp<=.10'));

// Daily world reward caps and village upgrade materials.
run('S.worldEarn.gold=119; lifeDailyGrant(50,0,0);');
assert.equal(run('S.worldEarn.gold'),120);
assert.equal(run('S.g'),1);
run('S.g=1000; S.gather.items.wood=99; S.gather.items.stone=99; lifeUpgradeVillage();');
assert.equal(run('S.village.level'),2);
assert.equal(run('lifeOrderList().length'),3);
assert.equal(run("lifeOrderList().every(o=>o.npc&&o.npcEn)"),true);
run("S.atmo.weather='snow'; S.atmo.changedAt=Date.now();");
assert.equal(run("lifeWeather()==='snow'"),true);
// The saved monotonic clock must not roll daily world limits backwards.
run('S.lifeClock=Date.now()+86400000*2; lifeEnsure();');
const protectedDay=run('S.worldEarn.day');
run('lifeEnsure();');
assert.equal(run('S.worldEarn.day'),protectedDay,'daily reward epoch must follow the monotonic saved clock');
console.log('PASS: fishing/cap/book, gather cooldown, recipes/buff cap, world income cap, village level, NPC orders, snow state.');
