#!/usr/bin/env python3
"""Patch Tahap 7C onto the Stage 7B project. All replacements require exactly one source match."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]

def replace_once(rel, old, new):
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{rel}: expected exactly one match, found {count}; refusing patch")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"patched {rel}")

# Install the new classic script first; it is loaded after farm.js and before npc.js.
ranch_src = ROOT / "tools" / "ranch_7c.js"
ranch_dst = ROOT / "js" / "ranch.js"
if ranch_dst.exists():
    raise RuntimeError("js/ranch.js already exists; patch is intended for a clean Stage 7B source")
ranch_dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(ranch_src, ranch_dst)

replace_once("index.html", '<script src="js/farm.js"></script>\n<script src="js/npc.js"></script>', '<script src="js/farm.js"></script>\n<script src="js/ranch.js"></script>\n<script src="js/npc.js"></script>')
replace_once("sw.js", "const VERSION = 'v35';", "const VERSION = 'v36';")
replace_once("sw.js", "  './js/farm.js',\n  './js/npc.js',", "  './js/farm.js',\n  './js/ranch.js',\n  './js/npc.js',")
replace_once("js/farm.js", "S.g+=gg;S.es+=ee;f.p[i]={s:1};return{g:gg,e:ee}", "S.g+=gg;S.es+=ee;f.p[i]={s:1};if(typeof ranchFeedAdd==='function')ranchFeedAdd(1);return{g:gg,e:ee}")
replace_once("js/farm.js", "T('Tanaman tetap tumbuh walau game ditutup. Panen dibatasi per hari.',12,323,'#9cf',9)", "T('Tanaman tumbuh saat game ditutup. Setiap panen memberi +1 pakan ternak.',12,323,'#9cf',9)")
replace_once("js/screens.js", "if(st=='farm')drawFarm();if(st=='quests')drawQuests();if(st=='howto')drawHow();if(showStat)statOverlay();", "if(st=='farm')drawFarm();if(st=='ranch')drawRanch();if(st=='market')drawMarket();if(st=='quests')drawQuests();if(st=='howto')drawHow();if(showStat)statOverlay();")
replace_once("js/input.js", "if(st=='farm'){farmClick(x,y);return}", "if(st=='farm'){farmClick(x,y);return}\nif(st=='ranch'){ranchClick(x,y);return}\nif(st=='market'){marketClick(x,y);return}")
replace_once("js/input.js", "if(st=='fight')upd(dt);else if(st=='walk')updWalk(dt);else if(st=='enter')updEnter(dt);else if(st=='world')updWorld(rdt);if(st!='pause')common(dt);", "if(st=='fight')upd(dt);else if(st=='walk')updWalk(dt);else if(st=='enter')updEnter(dt);else if(st=='world')updWorld(rdt);else if(st=='ranch')ranchUpdate(rdt);if(st!='pause')common(dt);")
replace_once("js/world.js", "let wjx=0,wjy=0,wjid=null,wcx=null,wcy=0,wface=1,wwalk=0,wHint=0,wFrom=0,wDlg=0,wNear=null;", "let wjx=0,wjy=0,wjid=null,wcx=null,wcy=0,wface=1,wwalk=0,wHint=0,wFrom=0,wDlg=0,wNear=null,wPlace=null;")
replace_once("js/world.js", "function wNearB(){const w=S.world;let b=null,bd=WNR;WBLD.forEach(o=>{const dx=Math.max(o.x0*WS-w.x,0,w.x-(o.x1+1)*WS),dy=Math.max(o.y0*WS-w.y,0,w.y-(o.y1+1)*WS),d=Math.hypot(dx,dy);if(d<bd){bd=d;b=o}});return b}\n", "function wNearB(){const w=S.world;let b=null,bd=WNR;WBLD.forEach(o=>{const dx=Math.max(o.x0*WS-w.x,0,w.x-(o.x1+1)*WS),dy=Math.max(o.y0*WS-w.y,0,w.y-(o.y1+1)*WS),d=Math.hypot(dx,dy);if(d<bd){bd=d;b=o}});return b}\nfunction wFindPlace(){if(!wVon||!self.Tmap||!Tmap.data())return null;const w=S.world,ps=Tmap.data().places||[];let bestP=null,bd=48;ps.forEach(p=>{if(p.type!=='animal_pen'&&p.type!=='market')return;const sz=p.footprint||[p.fence&&p.fence.w||1,p.fence&&p.fence.h||1],x0=p.x*WS,y0=p.y*WS,x1=x0+sz[0]*WS,y1=y0+sz[1]*WS,dx=Math.max(x0-w.x,0,w.x-x1),dy=Math.max(y0-w.y,0,w.y-y1),d=Math.hypot(dx,dy);if(d<bd){bd=d;bestP=p}});return bestP}\n")
replace_once("js/world.js", "if(wNpc){npcStart(wNpc);return}if(!wNear)return;sfx('click');\nif(wLock(wNear.c))", "if(wNpc){npcStart(wNpc);return}if(wPlace){sfx('click');if(wPlace.type==='animal_pen')wGo('ranch');else if(wPlace.type==='market'){marketFrom='world';wGo('market')}return}if(!wNear)return;sfx('click');\nif(wLock(wNear.c))")
replace_once("js/world.js", "if((wNear||wNpc)&&x>=220&&x<=420&&y>=296&&y<=324){wInteract();return}", "if((wNear||wNpc||wPlace)&&x>=220&&x<=420&&y>=296&&y<=324){wInteract();return}")
replace_once("js/world.js", "wNear=wNearB();wNpc=self.npcNear?npcNear(w.x,w.y):null;wFx(dt)", "wNear=wNearB();wPlace=wFindPlace();wNpc=self.npcNear?npcNear(w.x,w.y):null;wFx(dt)")
replace_once("js/world.js", "if(!wDlg&&!wTalk){if(wNpc)btn(220,296,200,28,wL('E / KETUK: ','E / TAP: ')+wNpc.n[S.set.lang=='en'?1:0],1);else if(wNear)btn(220,296,200,28,wLock(wNear.c)?wL('TERKUNCI: STAGE ','LOCKED: STAGE ')+WUN[wNear.c]:'E / KETUK: '+WNAME[wNear.c],!wLock(wNear.c))}", "if(!wDlg&&!wTalk){if(wNpc)btn(220,296,200,28,wL('E / KETUK: ','E / TAP: ')+wNpc.n[S.set.lang=='en'?1:0],1);else if(wPlace)btn(220,296,200,28,wL('E / KETUK: ','E / TAP: ')+(S.set.lang==='en'?(wPlace.name_en||wPlace.name):(wPlace.name||'KANDANG')),1);else if(wNear)btn(220,296,200,28,wLock(wNear.c)?wL('TERKUNCI: STAGE ','LOCKED: STAGE ')+WUN[wNear.c]:'E / KETUK: '+WNAME[wNear.c],!wLock(wNear.c))}")

# Add new UI translations before ENK is generated so the lookup map sees them.
replace_once("js/i18n.js", r'''/* Satu lintas: hasil terjemahan tidak dicocokkan ulang oleh kunci lain (mencegah mis. "Legendaryry"). Kunci terpanjang diprioritaskan. */''', '''Object.assign(EN,{"KANDANG":"RANCH","PASAR DESA":"VILLAGE MARKET","Belum memiliki kandang":"No ranch yet","Beli kandang untuk menampung 4 hewan.":"Buy a ranch to house 4 animals.","Biaya: ":"Cost: ","Kapasitas setelah dibeli: 4 hewan":"Capacity after purchase: 4 animals","Kandang dibeli! Kapasitas awal 4 hewan.":"Ranch purchased! Initial capacity: 4 animals.","Kandang ditingkatkan ke Lv ":"Ranch upgraded to Lv "," hewan)":" animals)","Kandang sudah level maksimal":"Ranch is already at maximum level","Kandang penuh. Tingkatkan kandang dahulu":"Ranch is full. Upgrade it first","Beli kandang terlebih dahulu":"Buy a ranch first","Pakan tersedia: ":"Feed available: ","PADANG KANDANG":"RANCH PADDOCK","Hewan: ":"Animals: ","Belum ada hewan. Beli hewan di bawah.":"No animals yet. Buy one below.","DIRAWAT":"CARED FOR","Belum ada hasil siap dikumpulkan":"No products ready to collect","Hasil dikumpulkan: ":"Products collected: "," produk":" products","Pakan diberikan kepada ":"Feed given to "," hewan":" animals","Semua hewan sudah diberi pakan hari ini":"All animals have been fed today","Belum ada hewan":"No animals yet","Pakan kurang: perlu ":"Not enough feed: need ",". Panen tanaman di Ladang untuk mendapat pakan.":". Harvest crops on the Farm to get feed.","Batas penjualan harian tercapai":"Daily sales limit reached","Belum ada hasil untuk dijual":"No products to sell yet","Terjual ":"Sold "," produk: +":" products: +","Pakan berasal dari panen ladang.":"Feed comes from farm harvests.","Batas jual: ":"Sales limit: "," emas/hari":" gold/day","HASIL TERTUNDA":"PENDING PRODUCTS","Produk siap: ":"Ready: ","  |  Hari ini: ":"  |  Today: ","Batas penjualan hari ini: ":"Today's sales limit: ","Hasil bisa diproduksi saat game ditutup jika hewan sudah diberi pakan.":"Products can be produced while the game is closed if animals were fed.","JUAL SEMUA HASIL (":"SELL ALL PRODUCTS ("," G TERSISA)":" G LEFT)","Telur":"Eggs","Susu":"Milk","Jamur truffle":"Truffles","Wol":"Wool","KE PASAR / JUAL HASIL":"TO MARKET / SELL PRODUCTS","BELI KANDANG - ":"BUY RANCH - ","TINGKATKAN - ":"UPGRADE - ","KANDANG Lv ":"RANCH Lv ","Kapasitas: ":"Capacity: ","BERI PAKAN SEMUA (":"FEED ALL (","KUMPULKAN HASIL":"COLLECT PRODUCTS","SIAP":"READY","KOSONG":"EMPTY","Setiap panen memberi +1 pakan ternak.":"Each harvest gives +1 ranch feed.","Tanaman tumbuh saat game ditutup.":"Crops keep growing while the game is closed.","Ayam":"Chicken","Sapi":"Cow","Babi":"Pig","Domba":"Sheep","LEVEL MAKS":"MAX LEVEL","Emas tidak cukup: perlu ":"Not enough gold: need ","Ayam dibeli":"Chicken bought","Sapi dibeli":"Cow bought","Babi dibeli":"Pig bought","Domba dibeli":"Sheep bought"});
/* Satu lintas: hasil terjemahan tidak dicocokkan ulang oleh kunci lain (mencegah mis. \\\"Legendaryry\\\"). Kunci terpanjang diprioritaskan. */''')
print("Stage 7C patch applied.")
