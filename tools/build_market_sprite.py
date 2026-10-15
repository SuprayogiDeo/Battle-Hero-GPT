from PIL import Image, ImageDraw
import random
def C(h,a=255): h=h.lstrip('#'); return (int(h[0:2],16),int(h[2:4],16),int(h[4:6],16),a)
OL=C('#2b1a12'); W1,W2,W3,W4=C('#d79b55'),C('#b87340'),C('#8c5330'),C('#5a331d')
CR1,CR2,CR3=C('#f3e6c4'),C('#e0cfa3'),C('#bfa97b'); RED1,RED2,RED3=C('#d4535c'),C('#b03a45'),C('#7d2631')
RT1,RT2,RT3=C('#c9484f'),C('#a93842'),C('#862b36'); GOLD,GOLD2=C('#f6cf5a'),C('#c3922c')
GL1,GL2=C('#a9d7e8'),C('#6fa8c4'); ST1,ST2,ST3=C('#aeb3bd'),C('#868c99'),C('#5c6270')
W,H=160,120
im=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
def R(x,y,w,h,c): d.rectangle([x,y,x+w-1,y+h-1],fill=c)
def box(x,y,w,h,f,o=OL,hl=None,sh=None):
    R(x,y,w,h,o); R(x+1,y+1,w-2,h-2,f)
    if hl: R(x+1,y+1,w-2,1,hl)
    if sh: R(x+1,y+h-2,w-2,1,sh)
# ---- font 3x5
F={'P':['###','#.#','###','#..','#..'],'A':['.#.','#.#','###','#.#','#.#'],'S':['.##','#..','.#.','..#','##.'],
   'R':['##.','#.#','##.','#.#','#.#'],'D':['##.','#.#','#.#','#.#','##.'],'E':['###','#..','##.','#..','###'],' ':['.','.','.','.','.']}
def text(x,y,s,col,sh=None):
    cx=x
    for ch in s:
        g=F[ch]
        for r,row in enumerate(g):
            for c,v in enumerate(row):
                if v=='#':
                    if sh: im.putpixel((cx+c,y+r+1),sh)
                    im.putpixel((cx+c,y+r),col)
        cx+=len(g[0])+1
    return cx-x-1
# ---- roof (y 14..62)
roof_top=16; roof_bot=64
# gable sign board raised on roof center
# main roof body: trapezoid look using stepped edges
for y in range(roof_top,roof_bot):
    t=(y-roof_top)/(roof_bot-roof_top); inset=int(10*(1-t)); x0=2+inset; x1=W-3-inset
    d.line([(x0,y),(x1,y)],fill=OL)
    d.line([(x0+1,y),(x1-1,y)],fill=RT1 if ((y-roof_top)//5)%2==0 else RT2)
# tile rows detail
rnd=random.Random(5)
for y in range(roof_top+3,roof_bot-2,5):
    t=(y-roof_top)/(roof_bot-roof_top); inset=int(10*(1-t)); x0=3+inset; x1=W-4-inset
    for x in range(x0,x1,8):
        off=4 if ((y-roof_top)//5)%2 else 0
        xx=x+off
        if x0<xx<x1: d.line([(xx,y),(xx,y+3)],fill=RT3)
    d.line([(x0,y+4),(x1,y+4)],fill=RT3)
# ridge highlight
for y in range(roof_top+1,roof_top+3): d.line([(14,y),(W-15,y)],fill=C('#e56b70'))
# side ridge posts / roof edge caps
for x in (4,W-8): box(x,roof_bot-12,6,12,W3,hl=W1)
# central sign gable on top
sx=48; sw=64; sy=1
box(sx,sy,sw,22,W2,hl=W1,sh=W3)
R(sx+3,sy+3,sw-6,16,OL); R(sx+4,sy+4,sw-8,14,C('#4a2c1a'))
tw=0
for ch in 'PASAR': tw+=len(F[ch][0])+1
tw-=1
tx=sx+(sw-tw)//2; text(tx,sy+8,'PASAR',GOLD,sh=OL)
for x in (sx+6,sx+sw-8): R(x,sy+6,2,2,GOLD2)
# banners hanging from roof ends
for bx in (14,W-22):
    box(bx,roof_top+8,8,20,RED2,hl=RED1)
    d.polygon([(bx,roof_top+28),(bx+7,roof_top+28),(bx+3,roof_top+32)],fill=OL); d.polygon([(bx+1,roof_top+28),(bx+6,roof_top+28),(bx+3,roof_top+31)],fill=RED3)
    R(bx+2,roof_top+13,4,4,GOLD)
# ---- eave beam
box(0,roof_bot,W,8,W3,hl=W2,sh=W4)
for x in range(6,W,12): R(x,roof_bot+2,2,3,W4)
# ---- facade wall
wy=roof_bot+8; wh=H-wy-4
box(2,wy,W-4,wh,CR2,hl=CR1,sh=CR3)
# timber framing
for x in (2,W-5): R(x,wy,3,wh,W3)
for x in (30,W-33): R(x,wy,3,wh,W3)
# ---- awning stripes across facade top
ay=wy+1; ah=11
for x in range(4,W-4):
    stripe=((x-4)//8)%2
    R(x,ay,1,ah-3,RED1 if stripe==0 else CR1)
    # scallop
    sc=(x-4)%8
    depth=[2,3,3,3,3,3,3,2][sc]
    R(x,ay+ah-3,1,depth,RED2 if stripe==0 else CR2)
d.line([(4,ay),(W-5,ay)],fill=OL); 
for x in range(4,W-4):
    sc=(x-4)%8; depth=[2,3,3,3,3,3,3,2][sc]
    im.putpixel((x,ay+ah-3+depth),OL)
for x in (4,32,W-34,W-6): R(x,ay,2,ah+2,OL)
# ---- windows (2 each side)
def window(x,y):
    box(x,y,18,14,W3)
    R(x+2,y+2,14,10,GL2); R(x+2,y+2,14,4,GL1); R(x+8,y+2,2,10,W3); R(x+2,y+6,14,2,W3)
    for k in range(3): d.line([(x+3+k*4,y+10),(x+6+k*4,y+3)],fill=C('#e8f5fa'))
    R(x-3,y,3,14,W2); R(x+18,y,3,14,W2)       # shutters
    R(x-3,y,1,14,W1); R(x+20,y,1,14,W1)
    R(x-1,y+14,20,2,W2); R(x-1,y+14,20,1,W1)   # sill
wy2=wy+14
window(10,wy2); window(W-28,wy2)
window(38,wy2); window(W-56,wy2)
# ---- double door (center)
dx=W//2-16; dw=32; dy=wy+14; dh=H-dy-4
box(dx-3,dy-3,dw+6,dh+3,W3,hl=W2)
R(dx,dy,dw,dh,OL)
for k,xx in enumerate((dx+1,dx+dw//2+1)):
    R(xx,dy+1,dw//2-2,dh-1,W2)
    R(xx+1,dy+2,dw//2-4,5,W1)
    for r in range(3): R(xx+2,dy+9+r*10,dw//2-6,8,W3); R(xx+3,dy+10+r*10,dw//2-8,6,W2)
R(dx+dw//2-1,dy+1,2,dh-1,OL)
R(dx+dw//2-5,dy+dh//2,3,3,GOLD); R(dx+dw//2+2,dy+dh//2,3,3,GOLD)
# lamps by the door
for lx in (dx-9,dx+dw+6):
    R(lx,dy+2,3,6,OL); R(lx,dy+3,3,4,GOLD); R(lx+1,dy+3,1,2,C('#fff3b0'))
# ---- produce crates at the base (left & right of door)
def crate(x,y,fruit,w=22):
    box(x,y,w,12,W2,hl=W1,sh=W3)
    R(x+2,y+4,w-4,1,W4)
    for i in range(3,w-3,4):
        R(x+i,y-2+(i//4)%2,3,3,fruit[(i//4)%len(fruit)]); R(x+i,y-2+(i//4)%2,3,1,C('#ffffff',90))
crate(8,H-16,[C('#d94a3a'),C('#e8452f')]); crate(30,H-16,[C('#f2a22a'),C('#f6bd4a')])
crate(W-52,H-16,[C('#78b840'),C('#5ca33a')]); crate(W-30,H-16,[C('#9f4fc2'),C('#b668d4')])
# ---- foundation
R(2,H-5,W-4,5,ST2); R(2,H-5,W-4,1,ST1); R(2,H-1,W-4,1,ST3)
for x in range(8,W-4,14): R(x,H-4,1,3,ST3)
# steps at door
box(dx-4,H-6,dw+8,5,ST1,hl=C('#ced2da'),sh=ST2)
# ---- final outline of bottom corners
R(0,H-1,2,1,OL)
im.save('assets/world/market_hall.png')
