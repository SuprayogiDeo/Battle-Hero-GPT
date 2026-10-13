#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const src=fs.readFileSync(require('node:path').join(__dirname,'../js/progress.js'),'utf8');
let checks=0;
function setup({state=null,stage=1,screen='menu',shopTab=0,saveOK=true}={}){
 const S=state||{set:{lang:'id'},tutorials:{active:null,topics:{}}};
 let writes=0,lastSaved=null,allow=saveOK;
 const c={S,best:stage,st:screen,shopTab,sv(){writes++;if(!allow)return false;lastSaved=JSON.stringify(S);return true;},say(){},wSay(){},Date,Math,Number,Object,Array,String,JSON,console};
 vm.createContext(c);vm.runInContext(src,c,{filename:'progress.js'});
 return {c,get writes(){return writes},get saved(){return lastSaved},set saveOK(v){allow=v}};
}
function check(name,fn){fn();checks++;console.log('PASS '+name);}
const ids=['shop','gacha','farming','fishing','orchard','gather','cook'];
check('every topic exposes the three requested statuses',()=>{
 const h=setup({stage:2});for(const id of ids)assert.equal(h.c.hbTutorialStatus(id),'belum');
 h.c.hbTutorialStart('shop');assert.equal(h.c.hbTutorialStatus('shop'),'berjalan');
});
check('stage milestones gate topics before starting',()=>{
 const h=setup({stage:1});assert.equal(h.c.hbTutorialStart('shop'),false);assert.equal(h.c.S.tutorials.active,null);
 h.c.best=2;assert.equal(h.c.hbTutorialStart('shop'),true);
});
check('seven-phase flow waits for a real action and then saves completion',()=>{
 const h=setup({stage:2});assert.equal(h.c.hbTutorialStart('shop'),true);
 assert.equal(h.c.hbTutorialActive().state.phase,'penanda');
 assert.equal(h.c.hbTutorialAdvance(),true);assert.equal(h.c.hbTutorialActive().state.phase,'instruksi');
 assert.equal(h.c.hbTutorialAdvance(),true);assert.equal(h.c.hbTutorialActive().state.phase,'sorot');
 assert.equal(h.c.hbTutorialAction('shop','menu_shop'),false,'action is rejected before wait phase');
 assert.equal(h.c.hbTutorialAdvance(),true);assert.equal(h.c.hbTutorialActive().state.phase,'tunggu');
 assert.equal(h.c.hbTutorialAction('shop','menu_shop'),true);assert.equal(h.c.hbTutorialActive().state.phase,'konfirmasi');
 assert.equal(h.c.hbTutorialAdvance(),true);assert.equal(h.c.hbTutorialActive().state.phase,'lanjut');
 h.c.hbTutorialObserve();assert.equal(h.c.hbTutorialStatus('shop'),'berjalan','continue phase remains active until Save is pressed');assert.equal(h.c.hbTutorialActive().state.phase,'lanjut');assert.equal(h.c.hbTutorialAdvance(),true,'explicit Save action completes the topic');assert.equal(h.c.hbTutorialStatus('shop'),'selesai');assert.equal(h.c.S.tutorials.topics.shop.phase,'simpan');assert.equal(h.c.S.tutorials.active,null);
 assert.ok(h.writes>=6,'phases/completion go through Save-backed sv');
});
check('completed topic never restarts',()=>{
 const h=setup({stage:2});h.c.hbTutorialStart('shop');h.c.hbTutorialSkip();h.c.st='menu';h.c.hbTutorialObserve();assert.equal(h.c.hbTutorialStatus('shop'),'selesai');assert.notEqual(h.c.S.tutorials.active,'shop');
});
check('active topic phase survives save/reload',()=>{
 const h=setup({stage:5});h.c.hbTutorialStart('farming');h.c.hbTutorialAdvance();h.c.hbTutorialAdvance();
 const restored=JSON.parse(h.saved);const h2=setup({state:restored,stage:5,screen:'world'});
 assert.equal(h2.c.hbTutorialActive().id,'farming');assert.equal(h2.c.hbTutorialActive().state.phase,'sorot');assert.equal(h2.c.hbTutorialStatus('farming'),'berjalan');
});
check('shop → gacha → farming → fishing → orchard → gather → cook prerequisite order',()=>{
 const h=setup({stage:6,screen:'menu'}),c=h.c;
 c.hbTutorialObserve();assert.equal(c.S.tutorials.active,'shop');
 const screenFor=id=>id==='shop'?'menu':id==='gacha'?'shop':id==='cook'?'kitchen':'world';
 for(let i=0;i<ids.length;i++){
  const id=ids[i];if(i>0){c.st=screenFor(id);c.shopTab=0;c.hbTutorialObserve();}
  const a=c.hbTutorialActive();assert.ok(a,`active for ${id}`);assert.equal(a.id,id);
  while(c.hbTutorialActive().state.phase!=='tunggu')c.hbTutorialAdvance();
  assert.equal(c.hbTutorialAction(id,'test-action'),true);c.hbTutorialAdvance();c.hbTutorialObserve();assert.equal(c.hbTutorialActive().state.phase,'lanjut');assert.equal(c.hbTutorialAdvance(),true,'the visible Save button completes the topic');assert.equal(c.hbTutorialStatus(id),'selesai');
 }
 assert.equal(c.S.tutorials.lastCompleted,'cook');assert.equal(c.S.tutorials.active,null);
});
check('failed save rolls back completion without falsely marking done',()=>{
 const h=setup({stage:2});h.c.hbTutorialStart('shop');while(h.c.hbTutorialActive().state.phase!=='tunggu')h.c.hbTutorialAdvance();h.c.hbTutorialAction('shop','x');h.c.hbTutorialAdvance();h.saveOK=false;
 assert.equal(h.c.hbTutorialAdvance(),false,'failed Save action must not complete the tutorial');assert.equal(h.c.hbTutorialStatus('shop'),'berjalan');assert.equal(h.c.S.tutorials.active,'shop');assert.equal(h.c.hbTutorialActive().state.phase,'lanjut');
});
check('tutorial remains non-modal and never changes player position',()=>{
 const hud=fs.readFileSync(require('node:path').join(__dirname,'../js/hud.js'),'utf8');
 const a=hud.indexOf('/* ===== Tutorial persistence + highlight overlay (Stage 8H) =====');
 const b=hud.indexOf('/* Count only successful, real player actions. Wrappers preserve the original return values. */',a);
 assert.ok(a>=0&&b>a,'tutorial UI block is present');const ui=hud.slice(a,b);
 assert.doesNotMatch(ui,/S\.world\.(?:x|y)\s*=|\bw\.(?:x|y)\s*=/,'tutorial must not teleport the player');
 assert.doesNotMatch(ui,/st\s*=\s*['"]pause['"]|freeze\s*=|spdm\s*=/,'tutorial must not pause the simulation or change game speed');
 assert.match(ui,/Pilih SIMPAN untuk menyimpan tutorial\./);assert.match(ui,/p==='lanjut'\?'SIMPAN'/,'the final continue phase exposes an explicit Save action');
});
check('locked requirements use short toasts and no large lock overlay',()=>{
 const hud=fs.readFileSync(require('node:path').join(__dirname,'../js/hud.js'),'utf8');
 const world=fs.readFileSync(require('node:path').join(__dirname,'../js/world.js'),'utf8');
 const interior=fs.readFileSync(require('node:path').join(__dirname,'../js/interior.js'),'utf8');
 const life=fs.readFileSync(require('node:path').join(__dirname,'../js/life.js'),'utf8');
 assert.match(hud,/wSay\(wL\(t\.n\[0\]\+' terbuka di stage '\+unlock[^;]*,2\.5\)/);
 assert.match(hud,/Papan misi terkunci untuk sementara\.'[^;]*,2\.5\)/);
 assert.match(world,/Terkunci\. Capai stage '\+WUN\[wNear\.c\][^;]*,3\)/,'world locked requirement uses a short 3 second toast');
 assert.match(interior,/function intTryEnter\(b\)\{const m=intLockMsg\(b\);if\(m\)\{wSay\(m,3\)/,'interior lock feedback remains a short 3 second toast');
 assert.match(life,/function lifeDrawLockedPlaces\(\)\{return;/,'large locked-place overlay is disabled');
});
check('runtime profiler is opt-in and calculates FPS plus exposed JS heap',()=>{
 const hud=fs.readFileSync(require('node:path').join(__dirname,'../js/hud.js'),'utf8');
 const input=fs.readFileSync(require('node:path').join(__dirname,'../js/input.js'),'utf8');
 assert.match(input,/\?&?perf=1|\[?\?&\]perf=1/);assert.match(input,/performance\.memory/);assert.match(input,/hbPerfSample\(n\)/);assert.match(hud,/function hbPerfDraw\(/);assert.match(hud,/JS heap/);
 const snippet=input.match(/const HB_PERF_ENABLED=[\s\S]*?(?=let last=performance\.now\(\))/);
 assert.ok(snippet,'extractable profiler declarations/functions');
 const perf={memory:{usedJSHeapSize:8*1048576,jsHeapSizeLimit:128*1048576}};
 const on={location:{search:'?perf=1'},performance:perf,Number,Math};vm.createContext(on);vm.runInContext(snippet[0],on);
 for(let t=0;t<=1040;t+=16)on.hbPerfSample(t);
 const measured=on.hbPerfStats();assert.equal(measured.enabled,true);assert.ok(measured.fps>50&&measured.fps<70,`FPS should reflect 60-ish fps: ${measured.fps}`);assert.equal(measured.heapMB,8);assert.equal(measured.heapLimitMB,128);
 const off={location:{search:''},performance:perf,Number,Math};vm.createContext(off);vm.runInContext(snippet[0],off);off.hbPerfSample(1000);assert.equal(off.hbPerfStats().enabled,false);assert.equal(off.hbPerfStats().frames,0,'profiling disabled in regular session');
});
console.log(`PASS: ${checks} tutorial/profiling regression groups completed.`);
