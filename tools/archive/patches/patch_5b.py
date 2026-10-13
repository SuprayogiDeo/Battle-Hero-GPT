#!/usr/bin/env python3
"""Tahap 5B: sambungkan Tmap (desa baru) ke dunia. Tiap penggantian harus cocok TEPAT 1 kali, kalau tidak berhenti tanpa menulis.
Pakai: python3 tools/patch_5b.py [folder proyek]   (butuh patch_5a sudah terpasang)"""
import sys, os
R = sys.argv[1] if len(sys.argv) > 1 else '.'
EDITS = {
 'index.html': [('<script src="js/anim.js"></script>', '<script src="js/anim.js"></script>\n<script src="js/tilemap.js"></script>')],
 'sw.js': [
  ("const VERSION = 'v26';", "const VERSION = 'v27';"),
  ("  './js/anim.js',", "  './js/anim.js',\n  './js/tilemap.js',"),
  (".concat(['atlas.json','avatar.png','props.png'].map(n => './assets/world/' + n));", ".concat(['atlas.json','avatar.png','props.png','village.json','tiles.png','sprites.png','sea.png'].map(n => './assets/world/' + n));"),
 ],
 'js/world.js': [
  ("const WT=16,WZ=2,WS=WT*WZ,WW=40,WH=30;", "const WT=16,WZ=2,WS=WT*WZ;let WW=40,WH=30;"),
  ("WSOL={T:1,'~':1,S:1,R:1,G:1,Q:1,F:1}", "WSOL={T:1,'~':1,S:1,R:1,G:1,Q:1,F:1,X:1}"),
  ("let wjx=0,wjy=0,wjid=null,",
   "/* Tahap 5B: desa Sunnyside (Tmap). Bila village.json belum siap, peta lama tetap dipakai. */\nlet wVon=0;\nfunction wUseV(){if(wVon||!self.Tmap||!Tmap.ready())return;const V=Tmap.data();WW=V.w;WH=V.h;WMAP.length=0;V.grid.forEach(r=>WMAP.push(r.split('')));WBLD.length=0;for(const c in WBM)delete WBM[c];\nfor(const c in V.bld){const b=V.bld[c],o={c,x0:b[0],y0:b[1],x1:b[2],y1:b[3]};WBLD.push(o);WBM[c]=o}\nWSPAWN[0]=V.spawn[0];WSPAWN[1]=V.spawn[1];if(typeof NPCS!='undefined')NPCS.forEach(o=>{const p=V.npcs[o.id];if(p){o.tx=p[0];o.ty=p[1]}});wVon=1}\nlet wjx=0,wjy=0,wjid=null,"),
  ("function worldEnter(){const w=S.world;", "function worldEnter(){wUseV();const w=S.world;"),
  ("if(wAct)wAct.update(mv?dx:0,mv?dy:0);", "if(wAct)wAct.update(mv?dx:0,mv?dy:0);if(wVon)Tmap.update(dt);"),
  ("for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)wTile(WMAP[ty][tx],tx*WS-cx-OX,ty*WS-cy,tx,ty);\nif(wArt()){",
   "if(wVon){Tmap.draw(g,cx,cy,OX,VW,wSn);tall.push(...Tmap.tall(g,cx,cy,OX,VW,wSn,wLock))}else{for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)wTile(WMAP[ty][tx],tx*WS-cx-OX,ty*WS-cy,tx,ty);\nif(wArt()){"),
  ("md:wLock(c)?'l':wSn?'s':0})}}\ntall.sort(", "md:wLock(c)?'l':wSn?'s':0})}}}\ntall.sort("),
  ("if(o.x>-90-OX&&o.x<VW+90)wSprite(o.k,o.x,o.b,o.z,o.md)});", "if(o.x>-90-OX&&o.x<VW+90)(o.f?o.f():wSprite(o.k,o.x,o.b,o.z,o.md))});"),
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
