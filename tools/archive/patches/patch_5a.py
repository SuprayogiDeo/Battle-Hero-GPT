#!/usr/bin/env python3
"""Tahap 5A: sambungkan Anim ke dunia. Tiap penggantian harus cocok TEPAT 1 kali, kalau tidak berhenti tanpa menulis apa pun.
Pakai: python3 tools/patch_5a.py [folder proyek]"""
import sys, os
R = sys.argv[1] if len(sys.argv) > 1 else '.'
EDITS = {
 'index.html': [
  ('<script src="js/world.js"></script>', '<script src="js/anim.js"></script>\n<script src="js/world.js"></script>'),
 ],
 'sw.js': [
  ("const VERSION = 'v25';", "const VERSION = 'v26';"),
  ("  './js/world.js',", "  './js/anim.js',\n  './js/world.js',"),
  ("const ART_OPT = ['adv','plants'].map(n => './assets/tiles/' + n + '.png');",
   "const ART_OPT = ['adv','plants'].map(n => './assets/tiles/' + n + '.png')\n  .concat(['atlas.json','avatar.png','props.png'].map(n => './assets/world/' + n)); // Sunnyside World (anim.js; ada cadangan bila hilang)"),
 ],
 'js/world.js': [
  # 1) aktor animasi (anim.js dimuat sebelum world.js)
  ("let wjx=0,wjy=0,wjid=null,", "const wAct=self.Anim?new Anim.Actor('avatar'):null; /* Tahap 5A: avatar Sunnyside */\nlet wjx=0,wjy=0,wjid=null,"),
  # 2) mesin keadaan idle/walk mengikuti gerak NYATA (mv), bukan sekadar input
  ("wwalk=mv?wwalk+dt:0;if(mv)qDirty=1;", "wwalk=mv?wwalk+dt:0;if(mv)qDirty=1;if(wAct)wAct.update(mv?dx:0,mv?dy:0);"),
  # 3) gambar avatar + bayangan; sprite hero lama jadi cadangan bila atlas belum/tidak termuat
  ("g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px,py-1,10,4,0,0,7);g.fill();\ng.save();g.translate(px,py);if(wface<0)g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore();",
   "if(wAct&&Anim.has('avatar_'+wAct.state)){Anim.shadow(g,px,py-1,9,3,.3);wAct.draw(g,px,py,performance.now(),WZ)}\nelse{g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px,py-1,10,4,0,0,7);g.fill();\ng.save();g.translate(px,py);if(wface<0)g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore()}"),
 ],
}
new = {}
for f, eds in EDITS.items():
    s = open(os.path.join(R, f), encoding='utf-8').read()
    for i, (a, b) in enumerate(eds):
        n = s.count(a)
        if n != 1: sys.exit(f'GAGAL {f} #{i+1}: cocok {n}x (harus 1). Tidak ada file diubah.')
        s = s.replace(a, b)
    new[f] = s
for f, s in new.items(): open(os.path.join(R, f), 'w', encoding='utf-8').write(s)
print('OK:', ', '.join(new))
