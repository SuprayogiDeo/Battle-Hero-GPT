#!/usr/bin/env node
'use strict';
/* Stage 8F–8G: door registry, physical services/signs/gates, night windows, and obstacle-aware map routing. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const smoke = fs.readFileSync(path.join(root, 'tools/test_browser_smoke.js'), 'utf8');
const marker = 'assert.ok(vm.runInContext("typeof Save.readMain';
const head = smoke.slice(0, smoke.indexOf(marker));
const mod = { exports: {} };
new Function('require', '__dirname', 'module', head + '\nmodule.exports={context,vm};')(require, path.join(root, 'tools'), mod);
const { context, vm } = mod.exports, ev = c => vm.runInContext(c, context, { timeout: 7000 });
const readJ = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const idx = readJ('assets/world/index.json'), interior = readJ('assets/world/interior.json'), design = readJ('tools/world_design.json');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// 1) Explicit entry/exit metadata matches every runtime building and reachable room doorway.
const buildings = ev('INT_B.map(b=>({id:b.id,tpl:b.tpl,x:b.x,y:b.y}))');
ok(interior.v === 2, 'interior.json schema upgraded to v2');
ok(interior.buildingDoors.length === buildings.length && buildings.length === 14, 'all 14 buildings have entry/exit registry data');
for (const b of buildings) {
  const d = interior.buildingDoors.find(q => q.id === b.id);
  ok(!!d, 'missing door registry for ' + b.id);
  ok(d.tpl === b.tpl && d.exterior.x === b.x && d.exterior.y === b.y, 'door registry matches runtime building ' + b.id);
  const room = ev(`intCompile(INT_B.find(b=>b.id===${JSON.stringify(b.id)}))`), w = room.w, h = room.h;
  ok(d.room.w === w && d.room.h === h && d.entry.x === room.dx && d.exit.x === room.dx, 'interior template doorway metadata valid: ' + b.id);
  ok(d.entry.y === h-2 && d.exit.y === h-1 && !room.sol[d.entry.y*w+d.entry.x] && !room.sol[d.exit.y*w+d.exit.x], 'entry and exit cells are walkable: ' + b.id);
  const start = d.entry.x + ',' + d.entry.y, seen = new Set([start]), q = [[d.entry.x,d.entry.y]];
  for (let hq=0; hq<q.length; hq++) { const [x,y] = q[hq]; for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const xx=x+dx, yy=y+dy, k=xx+','+yy; if(xx<0||yy<0||xx>=w||yy>=h||room.sol[yy*w+xx]||seen.has(k))continue;seen.add(k);q.push([xx,yy]); } }
  ok(seen.has(d.exit.x+','+d.exit.y), 'entry can reach exit: ' + b.id);
  const obj = idx.objects.find(o => o.x === b.x && o.y === b.y && (o.k||'').startsWith('b_'));
  ok(!!obj, 'exterior building sprite exists: ' + b.id);
  const spr = idx.spr[obj.k]; ok(!!spr && Array.isArray(spr.door) && spr.door.length === 4, 'exterior door rectangle exists: ' + b.id);
  const [dx,dy,dw,dh] = spr.door; ok(dx>=0&&dy>=0&&dw>0&&dh>0&&dx+dw<=spr.w&&dy+dh<=spr.h, 'exterior door rectangle in sprite bounds: ' + b.id);
  const gx=b.x>>4, gy=b.y>>4, ch=idx.grid[gy]&&idx.grid[gy][gx]; ok(ch!==undefined&&!['~','T','X','S','R','G','Q','F'].includes(ch), 'outside door approach is not blocked: ' + b.id);
}

// 2) Every house window is in sprite bounds and must never overlap its door; builder has same guard.
const houseKeys = Object.keys(idx.spr).filter(k => k.startsWith('b_'));
ok(houseKeys.length >= 14, 'new house sprite metadata retained by world rebuild');
let windowCount=0;
for (const key of houseKeys) {
  const s=idx.spr[key]; ok(Array.isArray(s.win)&&s.win.length>0, 'night-window metadata present: '+key); windowCount += s.win.length;
  const [dx,dy,dw,dh]=s.door;
  for (const [x,y,w,h] of s.win) {
    ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=s.w&&y+h<=s.h, 'window rectangle fits '+key);
    ok(!(x<dx+dw&&x+w>dx&&y<dy+dh&&y+h>dy), 'window does not cover door '+key);
  }
}
ok(fs.readFileSync(path.join(root,'tools/build_lights.py'),'utf8').includes("Jendela menimpa area pintu"), 'lights builder explicitly rejects window/door overlap');

// 3) Biome names are physical sign objects, major borders use visual-only arches, and services are objects.
const regionIds = new Set(idx.biomeRegions.map(b => b.id));
ok(idx.biomeSigns.length===5 && design.biomeSigns.length===5, 'five physical biome signs are authored');
ok(!!idx.spr.sign && !!idx.spr.board && !!idx.spr.stall_red, 'physical sign, mission board and cashier stall sprites exist in atlas');
for(const sign of idx.biomeSigns){
  ok(regionIds.has(sign.id), 'sign biome matches a region: '+sign.id);
  const o=idx.objects.find(q=>q.biomeSign===sign.id&&q.k==='sign');ok(!!o&&o.signName===sign.name&&o.signNameEn===sign.name_en, 'physical sign carries localized name: '+sign.id);
  const gx=sign.x,gy=sign.y;ok(!['~','T','X','S','R','G','Q','F'].includes(idx.grid[gy][gx]), 'sign stands on a passable tile: '+sign.id);
}
ok(idx.biomeGates.length===0 && idx.objects.filter(o=>o.k==='gate_arch').length===0, 'no border gate arches (removed in 9A: they faced the viewer, not the road)');
for(const gate of idx.biomeGates){const o=idx.objects.find(q=>q.gateId===gate.id&&q.k==='gate_arch');ok(!!o, 'gate object exists: '+gate.id);ok(!['~','T','X','S','R','G','Q','F'].includes(idx.grid[gate.y][gate.x]), 'gate does not block its crossing tile: '+gate.id);}
const expectedServices={quest_board:'board',animal_trough:'feed_trough'};   /* 9F: kasir pindah ke interior Pasar */
ok(idx.serviceObjects.length===2 && !idx.serviceObjects.some(s=>s.type==='market_cashier'), 'two physical service descriptors exist (cashier lives inside the Market)');
for(const s of idx.serviceObjects){const o=idx.objects.find(q=>q.serviceId===s.id&&q.serviceType===s.type);ok(!!o&&o.k===expectedServices[s.type], 'physical service object exists: '+s.id);ok(!['~','T','X','S','R','G','Q','F'].includes(idx.grid[s.y][s.x]), 'service base tile is open: '+s.id);}
const tilemapSrc=fs.readFileSync(path.join(root,'js/tilemap.js'),'utf8');
ok(tilemapSrc.includes('o.biomeSign')&&tilemapSrc.includes('signNameEn')&&tilemapSrc.includes('nearService'), 'runtime binds fade/name/service proximity to physical objects');
ok(tilemapSrc.includes('function drawGate')&&tilemapSrc.includes('function drawFeedTrough'), 'gate and trough procedural visuals are present');

// 4) Proximity does not open a service panel automatically; explicit action activates only its physical object.
ev("sfx=function(){};say=function(){};wSay=function(){};st='world';wI=null;wFade=null;wDlg=0;wTalk=null;wNpc=null;wPlace=null;wNear=null;S.world={x:70*WS+16,y:70*WS+16,disc:'*'};lifeNearWorldDrop=()=>null;lifeFishingSpot=()=>null;lifeNearResource=()=>null;hudWaterNear=()=>false;best=10;wGo=function(d){__serviceDest=d;st=d};Tmap.nearService=function(){return {type:__testServiceType}};__serviceDest='';__testServiceType='quest_board';");
let ctx=ev('hudCtx()');ok(ev("st==='world'&&__serviceDest===''"), 'nearby service does not auto-open its screen');ok(ctx.l==='MISI', 'service context label targets physical object');
// Invoke inside the VM so the physical service closure remains in its original context.
ev("st='world';__serviceDest='';__testServiceType='quest_board';hudCtx().f();");ok(ev("__serviceDest==='quests'"), 'physical quest board opens quest screen');
ev("st='world';__serviceDest='';__testServiceType='animal_trough';hudCtx().f();");ok(ev("__serviceDest==='ranch'"), 'physical feed trough opens animal service');

// 5) Enter/exit preserves outdoor door position and selected tool for every room.
ev("S.hb={sel:4,pg:0,water:0,slots:{}};wI=null;wFade=null;");
for (const b of buildings) {
  ev(`S.world={x:${b.x*2+4},y:${b.y*2+16}};S.hb.sel=4;wI=null;wFade=null;intEnter(INT_B.find(b=>b.id===${JSON.stringify(b.id)}));intFadeStep(.21);intFadeStep(.21);`);
  ok(ev('!!wI&&wI.b.id')===b.id, 'enters room: '+b.id);
  const cam=ev('intCam()'), room=ev('wI.room');
  if(room.w*32<=640)ok(cam[0]===-(640-room.w*32)/2, 'small interior camera centers width: '+b.id);else ok(cam[0]>=0&&cam[0]<=room.w*32-640, 'wide interior camera stays bounded: '+b.id);
  if(room.h*32<=312)ok(cam[1]===-(312-room.h*32)/2, 'short interior camera centers height: '+b.id);else ok(cam[1]>=0&&cam[1]<=room.h*32-312, 'tall interior camera stays bounded: '+b.id);
  ev('intExit();intFadeStep(.21);intFadeStep(.21)');
  ok(ev('wI===null&&S.hb.sel===4'), 'exits room with selected tool intact: '+b.id);
  ok(ev(`S.world.x===${b.x*2+4}&&S.world.y===${b.y*2+16}`), 'returns to exterior door position: '+b.id);
}

// 6) A waypoint must use a connected walkable path; it may not point through a blocked tile or across a disconnected wall.
const openWithWall={w:7,h:5,grid:['.......','.......','...X...','.......','.......'],biomeRegions:[],places:[]};
const field=ev(`hbMapRouteField(5,2,${JSON.stringify(openWithWall)})`), origin=2*7+1, target=2*7+5;
ok(field && field.dist[origin] > 4, 'route distance accounts for detour around a wall');
let at=origin,steps=0;const visited=new Set();
while(at!==target&&steps<50){ok(!visited.has(at), 'route has no cycle');visited.add(at);const nx=field.next[at];ok(nx>=0, 'reachable route has a next step');const x=nx%openWithWall.w,y=Math.floor(nx/openWithWall.w);ok(openWithWall.grid[y][x]!=='X', 'route step never enters an obstacle');at=nx;steps++;}
ok(at===target && steps===field.dist[origin], 'waypoint route terminates at target along its computed path');
ev("S.world={x:1*WS+16,y:1*WS+16,disc:'*'};");
const disconnected={w:5,h:3,grid:['..X..','..X..','..X..'],biomeRegions:[],places:[]};
const unreachable=ev(`hbMapRouteField(4,1,${JSON.stringify(disconnected)})`);ok(unreachable.dist[1*5+1]===-1, 'route reports disconnected target as unreachable');
ok(ev(`hbMapSafeTile(4,1,${JSON.stringify(disconnected)})`)===null, 'cannot redirect waypoint to wrong side of a blocked boundary');
ok(fs.readFileSync(path.join(root,'js/adventure.js'),'utf8').includes('hbMapRouteField'), 'world compass uses obstacle-aware route field');

console.log(`PASS: Stage 8F–8G (${n} checks; ${buildings.length} building doors, ${windowCount} house windows).`);
