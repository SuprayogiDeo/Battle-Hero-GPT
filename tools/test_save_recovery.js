const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync(require('path').join(__dirname, '..', 'js', 'save.js'), 'utf8');
const mem = Object.create(null);
let rejectMainWrites = false;
const localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
  setItem(k, v) { if (rejectMainWrites && (k === 'hb_s4' || k === 'hb_s4_dev')) throw new Error('quota'); mem[k] = String(v); },
  removeItem(k) { delete mem[k]; }
};
const context = vm.createContext({ location: { search: '' }, localStorage, JSON, Math, Date, first: { own: { recruit: { lv: 1 } }, g: 100 } });
vm.runInContext(source, context);
function ev(code) { return vm.runInContext(code, context); }
const first = context.first;
assert.strictEqual(ev('Save.writeMain(first, 1)'), true);
assert.strictEqual(ev('Save.writeMain(first, 1)'), true);
const updated = { own: { recruit: { lv: 2 } }, g: 250 };
context.updated = updated;
assert.strictEqual(ev('Save.writeMain(updated, 2)'), true);
assert.ok(mem.hb_s4_backup, 'a previous valid save should be backed up');
assert.strictEqual(JSON.parse(mem.hb_s4_backup).g, 100, 'backup should contain the previous valid save');
mem.hb_s4 = '{broken';
const restored = ev('Save.readMain()');
assert.strictEqual(restored.g, 100, 'corrupt main save should restore the valid backup');
assert.strictEqual(ev('Save.recoveredFromBackup'), true);
// A failed write must report failure and leave the previous primary save intact.
mem.hb_s4 = JSON.stringify(updated);
rejectMainWrites = true;
assert.strictEqual(ev('Save.writeMain(first, 3)'), false);
assert.strictEqual(JSON.parse(mem.hb_s4).g, 250);
rejectMainWrites = false;
ev('Save.wipe()');
assert.strictEqual(mem.hb_s4, undefined);
assert.strictEqual(mem.hb_s4_backup, undefined);
console.log('PASS: valid save backup, corrupted-save recovery, failed-write preservation, and wipe behavior.');
