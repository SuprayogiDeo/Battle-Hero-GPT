#!/usr/bin/env python3
"""Tahap 8A: pasang HUD + interior ke js/world.js, life.js, journal.js, index.html, sw.js. Setiap penggantian harus tepat 1 kecocokan.
Jalankan dari akar proyek SEKALI pada pohon v4 asli (kode 0.4.0-rc.1). Idempotensi tidak dijamin."""
import re
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s): open(p, 'w', encoding='utf-8').write(s)
def rep(s, a, b):
    assert s.count(a) == 1, ('kecocokan != 1', a[:70], s.count(a)); return s.replace(a, b)
def span(s, a, b, new):
    i = s.index(a); assert s.count(a) == 1, ('awal != 1', a[:60]); j = s.index(b, i); assert s.count(b) >= 1
    return s[:i] + new + s[j + len(b):]
w = rd('js/world.js')
w = rep(w, "Tmap.tall(g,cx,cy,OX,VW,wSn,wLock)", "Tmap.tall(g,cx,cy,OX,VW,wSn,()=>false)")
w = span(w, "if(lk){if(b.c=='F'||b.c=='Q')", "T('STAGE '+WUN[b.c],sx,ly+12,'#f88',10,'center')}", "if(lk){T(WNAME[b.c],sx,ly,'#99a',11,'center')}")
w = span(w, "if(!wDlg&&!wTalk){if(wNpc)btn(220,296", "!wLock(wNear.c))}", "")
w = rep(w, "T(wL('PETA ↗','MAP ↗'),OX+12,22,'#fc4',10);btn(500,6,130,28,'MENU CEPAT',1);", "btn(500,6,58,26,wL('MENU','MENU'),1);")
w = rep(w, "g.fillRect(60,44,520,24);g.strokeStyle='#fc4';g.lineWidth=1;g.strokeRect(60.5,44.5,519,23);", "g.fillRect(106,44,428,24);g.strokeStyle='#fc4';g.lineWidth=1;g.strokeRect(106.5,44.5,427,23);")
w = rep(w, "T('Geser joystick kiri atau WASD untuk berjalan',320,342,", "T('Geser joystick kiri atau WASD untuk berjalan',320,296,")
w = rep(w, "if(x>=4&&x<=112&&y>=24&&y<=108){hbOpenWorldMap();return}", "")
w = rep(w, "if((wNear||wNpc||wPlace)&&x>=220&&x<=420&&y>=296&&y<=324){wInteract();return}", "")
w = rep(w, "if(x>=500&&x<=630&&y>=6&&y<=34){worldLeave();return}", "if(x>=500&&x<=558&&y>=6&&y<=32){worldLeave();return}")
wr('js/world.js', w)
l = rd('js/life.js')
l = rep(l, "x>=500&&x<=630&&y>=6&&y<=34){lifeWorldQuick=true", "x>=500&&x<=558&&y>=6&&y<=32){lifeWorldQuick=true")
l = rep(l, "if(st==='world'&&x>=220&&x<=420&&y>=296&&y<=324&&(lifeNearResource()||lifeFishingSpot())){wInteract();return}", "")
l = rep(l, "T(String(Math.floor(lifeHour())).padStart(2,'0')+':00',", "T((self.hudClock?hudClock():String(Math.floor(lifeHour())).padStart(2,'0')+':00'),")
l = rep(l, "function lifeDrawLockedPlaces(){const d=lifeAssetData();", "function lifeDrawLockedPlaces(){return;const d=lifeAssetData();")
wr('js/life.js', l)
j = rd('js/journal.js')
j = rep(j, "g.fillRect(10,yy,236,31);g.strokeStyle='#6b9db8';g.lineWidth=1;g.strokeRect(10.5,yy+.5,235,30);T(jrLang('FOKUS: ','FOCUS: ')+f.title.slice(0,25),18,yy+12,'#fc4',8);T(f.detail.slice(0,38),18,yy+24,'#cde',7);",
            "g.fillRect(108,yy,236,31);g.strokeStyle='#6b9db8';g.lineWidth=1;g.strokeRect(108.5,yy+.5,235,30);T(jrLang('FOKUS: ','FOCUS: ')+f.title.slice(0,25),116,yy+12,'#fc4',8);T(f.detail.slice(0,38),116,yy+24,'#cde',7);")
wr('js/journal.js', j)
h = rd('index.html')
h = rep(h, '<script src="js/input.js"></script>', '<script src="js/interior.js"></script>\n<script src="js/hud.js"></script>\n<script src="js/input.js"></script>')
wr('index.html', h)
s = rd('sw.js')
s = rep(s, "const VERSION = 'v47';", "const VERSION = 'v48';")
s = rep(s, "  './js/input.js',", "  './js/interior.js',\n  './js/hud.js',\n  './js/input.js',")
s = rep(s, "'nature.png','village.json']", "'nature.png','village.json','interior.png','interior.json','hud.png','hud.json']")
wr('sw.js', s)
print('patch_8a selesai')
