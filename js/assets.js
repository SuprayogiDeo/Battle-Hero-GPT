
const SPK=["h0", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9", "h10", "h11", "h12", "h13", "h14", "h15", "h16", "h17", "h18", "h19", "h20", "h21", "h22", "h23", "h24", "h25", "g1", "g2", "g3", "g4", "108", "120", "122", "121", "111", "109", "110", "101", "102", "103", "104", "105", "106", "107", "113", "114", "115", "116", "117", "118", "119", "125", "126", "127", "128", "129", "130", "131"];
const cv=document.getElementById('c'),g=cv.getContext('2d');
let VW=640,OX=0,EX=0;
function fit(){const cs=typeof getComputedStyle==='function'?getComputedStyle(document.documentElement):null,sv=k=>cs?Math.max(0,parseFloat(cs.getPropertyValue('--safe-'+k))||0):0,L=sv('left'),R=sv('right'),T=sv('top'),B=sv('bottom'),aw=Math.max(1,innerWidth-L-R),ah=Math.max(1,innerHeight-T-B),a=aw/ah;VW=Math.max(640,Math.min(900,Math.round(360*a)));if(cv.width!=VW)cv.width=VW;OX=(VW-640)/2;EX=Math.ceil(OX/32);const s=Math.min(aw/VW,ah/360);cv.style.width=VW*s+'px';cv.style.height=360*s+'px';cv.style.left=(L+(aw-VW*s)/2)+'px';cv.style.top=(T+(ah-360*s)/2)+'px'}
addEventListener('resize',fit);fit();
const IM={};for(const k of SPK){const i=new Image();i.src='assets/sprites/'+k+'.png';IM[k]=i}
const rnd=(a,b)=>a+Math.random()*(b-a);
