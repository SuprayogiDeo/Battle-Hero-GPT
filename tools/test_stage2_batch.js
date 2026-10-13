const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.join(__dirname, '..');

// Storage bounds and manual claim path use the actual progress module.
const notices = [];
const pc = vm.createContext({
  S: { g: 0, es: 0, items: [], overflowItems: [], eq: {}, own: {}, stageClaims: [], set: {lang:'id'}, st:{}, ac:{}, q:{} },
  stage: 1, pendI: [],
  Date, Math, JSON, Object, Array, Number, String, isFinite,
  say: s => notices.push(String(s)), sv: () => true, sfx: () => {},
  mkItem: (slot, rar) => ({u: Math.random(), slot, rar, nm:'Item', lv:1, lk:0, ty:'atk'}),
  autoEquip: () => {},
  best: 0, HS: [],
});
vm.runInContext(fs.readFileSync(path.join(root, 'js/progress.js'), 'utf8'), pc, {filename:'js/progress.js'});
const pev = code => vm.runInContext(code, pc, {timeout:5000});
pev("S.items=Array.from({length:ITEM_STORAGE.bag},(_,i)=>({u:i+1,rar:'N',lv:1,lk:0})); S.overflowItems=[]; soldAuto={n:0,g:0}; pendI=[];");
for (let i = 0; i < 30; i++) pev(`addItem({u:${1000+i},rar:'R',lv:1,lk:0})`);
assert.strictEqual(pev('S.items.length'), 120, 'main bag cap stays fixed');
assert.strictEqual(pev('S.overflowItems.length'), 30, 'temporary reward storage cap is 30');
assert.strictEqual(pev('itemDeliveryRoom()'), 0, 'no reward space remains once both stores are full');
assert.strictEqual(pev("addItem({u:9999,rar:'SSR',lv:1,lk:0})"), false, 'full stores reject additional reward safely');
assert.strictEqual(pev('S.overflowItems.length'), 30, 'rejecting extra reward must not overflow capacity');
pev('S.items.pop(); openOverflow(\'gear\'); overflowClick(20,65); overflowClick(180,320)');
assert.strictEqual(pev('S.items.length'), 120, 'manual claim fills freed bag slot');
assert.strictEqual(pev('S.overflowItems.length'), 29, 'manual claim removes exactly one pending item');

// Farm watering has a per-cycle guard and visibly marks watered plots.
const fc = vm.createContext({
  S: {g:1000,es:0,set:{lang:'id'},farm:{p:[]},atmo:{weather:'rain'}},
  Date, Math, Array, Number, isFinite,
  today: () => 'test-day', sv: () => true, sfx: () => {}, say: () => {},
  goBack:()=>{}, ov:()=>{}, btn:()=>{}, T:()=>{}, g:{}, fmtN:()=>'', t:0,
});
vm.runInContext(fs.readFileSync(path.join(root, 'js/farm.js'), 'utf8'), fc, {filename:'js/farm.js'});
const fev = code => vm.runInContext(code, fc, {timeout:5000});
fev("const now=Date.now(); S.farm={p:[{s:1,w:0},{s:2,c:0,t:now,w:0},{s:0,w:0}]};");
assert.strictEqual(fev('farmAutoWaterAll(true)'), 2, 'rain waters soil and growing plots only');
assert.strictEqual(!!fev('S.farm.p[0].w'), true, 'soil retains water for next planting');
assert.strictEqual(!!fev('S.farm.p[1].w'), true, 'growing crop records watering');
assert.strictEqual(fev('S.farm.p[1].t < Date.now()-40000'), true, 'watering advances crop growth by 15%');
assert.strictEqual(fev('farmAutoWaterAll(true)'), 0, 'same weather cannot repeatedly apply water bonus');
assert.strictEqual(!!fev('S.farm.p[2].w'), false, 'grass is not watered before hoeing');

// Ranch uses a rolling 24-hour feeding window and caps offline catch-up to 24 hours.
const realDate = Date;
let nowMs = new realDate(2026, 9, 12, 12, 0, 0).getTime();
class FakeDate extends realDate {
  constructor(...args) { super(...(args.length ? args : [nowMs])); }
  static now() { return nowMs; }
}
const rc = vm.createContext({
  S: {g:0,set:{lang:'id'},ranch:null}, Date:FakeDate, Math, Array, Number, String, isFinite,
  sv:()=>true,say:()=>{},sfx:()=>{},performance:{now:()=>0},Anim:{},g:{},T:()=>{},ov:()=>{},btn:()=>{},card:()=>{},
});
vm.runInContext(fs.readFileSync(path.join(root, 'js/ranch.js'), 'utf8'), rc, {filename:'js/ranch.js'});
const rev = code => vm.runInContext(code, rc, {timeout:5000});
const day = new FakeDate(nowMs).toDateString();
rc.S.ranch = {level:1,animals:[{id:'a1',type:'chicken',x:.5,y:.5,tx:.5,ty:.5,fedDay:day,fedUntil:nowMs+2*3600000,nextAt:nowMs+12*60000,pending:0}],feed:1,stock:{egg:0,milk:0,truffle:0,wool:0},day,made:0,madeByDay:{},soldGold:0,clock:nowMs};
assert.strictEqual(rev('ranchNeedsFeed(ranchGet())'), 0, 'active feed period must not ask for a daily login feed');
nowMs += 3*3600000;
assert.strictEqual(rev('ranchNeedsFeed(ranchGet())'), 1, 'feed is requested after the 24-hour window expires');
rev('ranchFeedAll()');
assert.strictEqual(rev('ranchNeedsFeed(ranchGet())'), 0, 'feeding restores an active production window');
assert.ok(rev('S.ranch.animals[0].fedUntil') >= nowMs+24*3600000-100, 'feed window lasts 24 hours from the action');

// Feed expired over a day ago: no catch-up beyond the agreed 24-hour cap.
rc.S.ranch = {level:1,animals:[{id:'old',type:'chicken',x:.5,y:.5,tx:.5,ty:.5,fedDay:day,fedUntil:nowMs-30*3600000,nextAt:nowMs-45*3600000,pending:0}],feed:0,stock:{egg:0,milk:0,truffle:0,wool:0},day,made:0,madeByDay:{},soldGold:0,clock:nowMs};
rev('ranchSync(false)');
assert.strictEqual(rev('S.ranch.animals[0].pending'), 0, 'production expired beyond 24 hours does not get generated retroactively');
// A valid recent window can catch up, but no more than the per-day production cap.
rc.S.ranch.animals[0].fedUntil = nowMs - 3*3600000;
rc.S.ranch.animals[0].nextAt = nowMs - 30*3600000;
rev('ranchSync(false)');
assert.ok(rev('S.ranch.animals[0].pending') > 0, 'recent offline production catches up');
assert.ok(rev('S.ranch.animals[0].pending') <= 16, '24h catch-up can span two calendar days but remains bounded');
assert.ok(rev('Object.values(S.ranch.madeByDay).every(n=>n<=8)'), 'production is capped at eight products for each actual production date');


// A full pending queue must keep its next product timestamp instead of silently discarding it.
rc.S.ranch = {level:1,animals:[{id:'full',type:'chicken',x:.5,y:.5,tx:.5,ty:.5,fedDay:day,fedUntil:nowMs+3600000,nextAt:nowMs-10*60000,pending:99}],feed:0,stock:{egg:0,milk:0,truffle:0,wool:0},day,made:0,madeByDay:{},soldGold:0,clock:nowMs};
const blockedNext = rev('S.ranch.animals[0].nextAt');
rev('ranchSync(false)');
assert.strictEqual(rev('S.ranch.animals[0].nextAt'), blockedNext, 'full pending output queue must hold the next product instead of silently skipping it');

console.log('PASS: centralized bag cap, bounded pending rewards, manual reward claim, one-time watering, rain growth bonus, rolling 24h animal feeding, capped offline catch-up, and no silent product loss at capacity.');
