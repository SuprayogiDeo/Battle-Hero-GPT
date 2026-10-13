#!/usr/bin/env python3
"""Tahap 6A: setiap penggantian harus tepat 1 kecocokan, kalau tidak berhenti tanpa menulis apa pun."""
import sys
def patch(path, reps):
    s = open(path, encoding='utf-8').read()
    for old, new in reps:
        c = s.count(old)
        if c != 1: sys.exit(f'GAGAL {path}: {c} kecocokan untuk: {old[:70]!r}')
        s = s.replace(old, new)
    open(path, 'w', encoding='utf-8').write(s); print('ok', path)

patch('js/anim.js', [
 ("this.flip = false; this.lastMove = -1e9;",
  "this.flip = false; this.dir = null; this.lastMove = -1e9;"),
 ("  function Actor(prefix) {",
  "  /* Tahap 6A: arah dari vektor gerak. null = samping (animasi kiri/kanan); 's','n','se','ne' = pose arah\n     (kiri = flip). Dipakai bila atlas punya <prefix>_idle_<arah>/<prefix>_walk_<arah>; kalau tidak -> samping. */\n  function dirOf(dx, dy) {\n    var ax = Math.abs(dx), ay = Math.abs(dy);\n    if (ay < ax * 0.414) return null;\n    if (ax < ay * 0.414) return dy > 0 ? 's' : 'n';\n    return dy > 0 ? 'se' : 'ne';\n  }\n  function Actor(prefix) {"),
 ("    if (moving) this.lastMove = now;",
  "    if (moving) { this.lastMove = now; this.dir = dirOf(dx, dy); }"),
 ("  /* Gambar di jangkar kaki (x,y). Mengembalikan false bila atlas belum siap (pakai fallback). */\n  Actor.prototype.draw = function (ctx, x, y, now, sc) {\n    now = now == null ? performance.now() : now;\n    return draw(ctx, this.prefix + '_' + this.state, now - this.t0, x, y, this.flip, sc);\n  };",
  "  /* Hadapkan ke vektor (dx,dy) tanpa bergerak (mis. NPC menghadap pemain). */\n  Actor.prototype.face = function (dx, dy) {\n    this.dir = dirOf(dx, dy);\n    if (dx < 0) this.flip = true; else if (dx > 0) this.flip = false;\n  };\n  /* Nama animasi yang akan digambar (pose arah bila ada, kalau tidak samping). */\n  Actor.prototype.name = function () {\n    var n = this.prefix + '_' + this.state;\n    if (this.dir && (this.state === 'idle' || this.state === 'walk')) { var nd = n + '_' + this.dir; if (has(nd)) return nd; }\n    return n;\n  };\n  /* Gambar di jangkar kaki (x,y). Mengembalikan false bila atlas belum siap (pakai fallback). */\n  Actor.prototype.draw = function (ctx, x, y, now, sc) {\n    now = now == null ? performance.now() : now;\n    return draw(ctx, this.name(), now - this.t0, x, y, this.flip, sc);\n  };"),
])

patch('js/npc.js', [
 ("const npcX=o=>o.tx*WS+WS/2,npcY=o=>o.ty*WS+26;",
  "/* Tahap 6A: posisi runtime (px,py) = rumah (tx,ty) + berkeliling pendek. wUseV() menimpa tx,ty -> npcSync mereset posisi. */\n"
  "function npcSync(o){const k=o.tx+','+o.ty;if(o._k!==k){o._k=k;o.px=o.tx*WS+WS/2;o.py=o.ty*WS+26;o.mode='wait';o.wt=1+Math.random()*3;o.vx=o.vy=0;o.gx=o.gy=0}}\n"
  "const npcX=o=>(npcSync(o),o.px),npcY=o=>(npcSync(o),o.py);\n"
  "const NPCR=WS*2,NPCSP=28;\n"
  "function npcAc(o){if(o.ac===undefined)o.ac=typeof Anim!='undefined'?new Anim.Actor('npc_'+o.id):null;return o.ac}\n"
  "const npcOk=(x,y)=>!(wSolid(x-WFH,y-WFV)||wSolid(x+WFH,y-WFV)||wSolid(x-WFH,y)||wSolid(x+WFH,y));\n"
  "function npcUpdate(dt){const w=S.world;if(!w)return;NPCS.forEach(o=>{npcSync(o);const ac=npcAc(o),hx=o.tx*WS+WS/2,hy=o.ty*WS+26;let vx=0,vy=0;\n"
  "const talk=wTalk&&wTalk.o===o,near=Math.abs(w.x-o.px)<44&&Math.abs(w.y-o.py)<34;\n"
  "if(talk||wDlg){o.mode='wait';o.wt=Math.max(o.wt,1.5)}\n"
  "else if(o.mode=='wait'){o.wt-=dt;if(o.wt<=0){if(near){o.wt=1}else{const a=Math.random()*7,r=(.4+Math.random()*.6)*NPCR,gx=hx+Math.cos(a)*r,gy=hy+Math.sin(a)*r*.7;let ok=npcOk(gx,gy)&&Math.hypot(gx-w.x,gy-w.y)>40;\n"
  "for(let i=1;ok&&i<=8;i++)ok=npcOk(o.px+(gx-o.px)*i/8,o.py+(gy-o.py)*i/8);if(ok){o.mode='go';o.gx=gx;o.gy=gy}else o.wt=.6}}}\n"
  "else{const dx=o.gx-o.px,dy=o.gy-o.py,l=Math.hypot(dx,dy);if(l<2||near&&Math.hypot(w.x-o.px,w.y-o.py)<40){o.mode='wait';o.wt=1.5+Math.random()*3.5}\n"
  "else{const sx=dx/l,sy=dy/l,nx=o.px+sx*NPCSP*dt,ny=o.py+sy*NPCSP*dt;\n"
  "if(npcOk(nx,ny)&&!(Math.abs(nx-w.x)<19&&Math.abs(ny-w.y)<13)){o.px=nx;o.py=ny;vx=sx;vy=sy}else{o.mode='wait';o.wt=1+Math.random()*2}}}\n"
  "if(ac){ac.update(vx,vy);if(talk)ac.face(w.x-o.px,w.y-o.py)}})}"),
 ("function npcStart(o){wjid=null;wjx=wjy=0;wTalk={n:o.n[S.set.lang=='en'?1:0],ls:npcLines(o),i:0};sfx('click')}",
  "function npcStart(o){wjid=null;wjx=wjy=0;wTalk={n:o.n[S.set.lang=='en'?1:0],ls:npcLines(o),i:0,o:o};const ac=npcAc(o);if(ac)ac.face(S.world.x-npcX(o),S.world.y-npcY(o));sfx('click')}"),
 ("NPCS.forEach((o,k)=>{const fy=o.ty*WS+26,back=fy<=py;",
  "NPCS.forEach((o,k)=>{const fy=npcY(o),back=fy<=py;"),
 ("const d=HEROES[HID[o.h]],im=IM[d.s],ok=im&&im.complete&&im.naturalWidth>0,bob=Math.abs(Math.sin(t*2+k*1.7))*1.5,nr=wNpc===o;\n"
  "g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(sx,sy-1,10,4,0,0,7);g.fill();\n"
  "g.save();g.translate(sx,sy);if(w.x<npcX(o))g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore();\n"
  "if(nr)T(o.n[S.set.lang=='en'?1:0],sx,sy-40,'#fc4',10,'center');else T('...',sx,sy-34-bob,'#fff',10,'center')})}",
  "const ac=npcAc(o),nw=ac&&Anim.has('npc_'+o.id+'_'+ac.state);let bob=0;const nr=wNpc===o;\n"
  "if(nw){Anim.shadow(g,sx,sy-1,9,3,.3);ac.draw(g,sx,sy,performance.now(),WZ)}\n"
  "else{const d=HEROES[HID[o.h]],im=IM[d.s],ok=im&&im.complete&&im.naturalWidth>0;bob=Math.abs(Math.sin(t*2+k*1.7))*1.5;\n"
  "g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(sx,sy-1,10,4,0,0,7);g.fill();\n"
  "g.save();g.translate(sx,sy);if(w.x<npcX(o))g.scale(-1,1);if(ok)spr(d.s,0,0,2,-bob);else{g.fillStyle=RC[d.rar];g.fillRect(-8,-30-bob,16,28)}g.restore()}\n"
  "const ly=nw?46:40;if(nr)T(o.n[S.set.lang=='en'?1:0],sx,sy-ly,'#fc4',10,'center');else T('...',sx,sy-(nw?42:34)-bob,'#fff',10,'center')})}"),
])

patch('js/world.js', [
 ("if(wVon)Tmap.update(dt);\nconst tx=", "if(wVon)Tmap.update(dt);if(self.npcUpdate)npcUpdate(dt);\nconst tx="),
])
patch('sw.js', [
 ("const VERSION = 'v27';", "const VERSION = 'v28';"),
 ("['atlas.json','avatar.png','props.png','village.json','tiles.png','sprites.png','sea.png']",
  "['atlas.json','avatar.png','props.png','chars.png','village.json','tiles.png','sprites.png','sea.png']"),
])
patch('CREDITS', [
 ("props.png, atlas.json) and are produced by tools/build_assets.py (cropped / recombined only).",
  "props.png, atlas.json) and are produced by tools/build_assets.py (cropped / recombined only).\nTahap 6A: assets/world/chars.png (avatar + 4 NPC, pose samping dan arah) dibuat tools/build_chars.py dari strip karakter dan file\n.aseprite paket yang sama (hanya digabung/dipotong; posisi rambut pada pose jalan arah dipetakan dari pose idle)."),
])
