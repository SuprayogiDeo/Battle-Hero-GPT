import struct, zlib, sys
from PIL import Image
def parse(path):
    d=open(path,'rb').read()
    fs,magic,nf,w,h,depth=struct.unpack_from('<IHHHHH',d,0)
    assert magic==0xA5E0
    off=128; layers=[]; tags=[]; frames=[]
    for fi in range(nf):
        sz,fm,oc,dur=struct.unpack_from('<IHHH',d,off); nch=struct.unpack_from('<I',d,off+12)[0]
        if nch==0: nch=oc
        p=off+16; cels=[]
        for c in range(nch):
            csz,ct=struct.unpack_from('<IH',d,p); b=p+6
            if ct==0x2004:
                flags,lt,child,_,_,bm,op=struct.unpack_from('<HHHHHHB',d,b); b+=16
                nl=struct.unpack_from('<H',d,b)[0]; name=d[b+2:b+2+nl].decode()
                layers.append(dict(name=name,flags=flags,type=lt,child=child,op=op,bm=bm))
            elif ct==0x2005:
                li,x,y,op,cty=struct.unpack_from('<HhhBH',d,b); b+=16
                if cty==2:
                    cw,ch=struct.unpack_from('<HH',d,b); raw=zlib.decompress(d[b+4:p+csz])
                    im=Image.frombytes('RGBA',(cw,ch),raw); cels.append((li,x,y,op,im))
                elif cty==0:
                    cw,ch=struct.unpack_from('<HH',d,b); im=Image.frombytes('RGBA',(cw,ch),d[b+4:b+4+cw*ch*4]); cels.append((li,x,y,op,im))
                elif cty==1:
                    cels.append((li,x,y,op,('link',struct.unpack_from('<H',d,b)[0])))
            elif ct==0x2018:
                n=struct.unpack_from('<H',d,b)[0]; q=b+10
                for i in range(n):
                    f0,f1,dr=struct.unpack_from('<HHB',d,q); q+=17
                    nl=struct.unpack_from('<H',d,q)[0]; nm=d[q+2:q+2+nl].decode(); q+=2+nl
                    tags.append((nm,f0,f1,dr))
            p+=csz
        frames.append((dur,cels)); off+=sz
    return w,h,layers,tags,frames
if __name__=='__main__':
    w,h,L,T,F=parse(sys.argv[1])
    print(w,h,len(F)); 
    for i,l in enumerate(L): print(i,l)
    for t in T: print(t)
    print(set(f[0] for f in F))
