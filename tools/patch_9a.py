#!/usr/bin/env python3
"""Tahap 9A: panel FOKUS bisa diminimalkan (di bawah minimap), minimap langsung terbuka penuh. Tiap penggantian tepat 1 kecocokan.
Jalankan dari akar proyek pada kode 0.4.6-rc.1."""
def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s): open(p, 'w', encoding='utf-8').write(s)
def rep(s, a, b):
    assert s.count(a) == 1, ('kecocokan != 1', a[:70], s.count(a)); return s.replace(a, b)
t = rd('js/tilemap.js')
t = rep(t, "Main biome silhouettes are visible from the start, but undiscovered tile detail stays muted.", "Minimap terbuka penuh sejak awal (tanpa penemuan); penemuan biome hanya memicu banner.")
t = rep(t, "seen=discKey==='*'||discKey.charAt(ty*V.w+tx)==='1';", "seen=true;")
wr('js/tilemap.js', t)
j = rd('js/journal.js'); a = "drawWorld=function(){jrBaseDrawWorld();if(st!=='world'||wTalk||wDlg)return;jrEnsure();const f=jrCurrentFocus(),xx=122,yy=92;"; b = "T(f.detail.slice(0,38),xx+8,yy+26,'#cde',9);};"
i = j.index(a); assert j.count(a) == 1; k = j.index(b, i) + len(b)
new = '''/* Panel FOKUS: tepat di bawah minimap; ketuk untuk meminimalkan/membuka (S.journal.fmin disimpan). */
function jrFocusRect(){const sc=[.9,1,1.1][Math.max(0,Math.min(2,Math.round(Number(S&&S.set&&S.set.ui)||0)))]||1,y=Math.round(4+76*sc+8),mn=!!(S.journal&&S.journal.fmin);return mn?{x:4,y:y,w:92,h:20,mn:1}:{x:4,y:y,w:236,h:34,mn:0}}
function jrToggleFocus(){jrEnsure();S.journal.fmin=S.journal.fmin?0:1;sv()}
function jrDrawFocus(){const f=jrCurrentFocus(),r=jrFocusRect();g.fillStyle='rgba(8,16,24,.86)';g.fillRect(r.x,r.y,r.w,r.h);g.strokeStyle='#6b9db8';g.lineWidth=1;g.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);
 if(r.mn)T(jrLang('FOKUS','FOCUS')+'  ▸',r.x+8,r.y+14,'#fc4',10);
 else{T(jrLang('FOKUS: ','FOCUS: ')+f.title.slice(0,22),r.x+8,r.y+13,'#fc4',10);T(f.detail.slice(0,38),r.x+8,r.y+26,'#cde',9);T('▾',r.x+r.w-12,r.y+13,'#9cf',10)}}
drawWorld=function(){jrBaseDrawWorld();if(st!=='world'||wTalk||wDlg)return;jrEnsure();jrDrawFocus()};'''
j = j[:i] + new + j[k:]
wr('js/journal.js', j)
h = rd('js/hud.js')
h = rep(h, " return false;\n}\nconst hudPtr", " if(!wI&&self.jrFocusRect){const f=jrFocusRect();if(x>=f.x&&x<=f.x+f.w&&y>=f.y-2&&y<=f.y+f.h+2){jrToggleFocus();sfx('click');return true}}\n return false;\n}\nconst hudPtr")
wr('js/hud.js', h)
print('patch_9a selesai')
