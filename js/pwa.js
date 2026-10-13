/* ===== PWA ===== */
if('serviceWorker' in navigator&&location.protocol!='file:'){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
(()=>{const box=document.getElementById('pwa');let dp=null,off=false;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e});
addEventListener('appinstalled',()=>{dp=null;box.style.display='none'});
box.addEventListener('pointerdown',e=>e.stopPropagation());
box.querySelector('.ok').onclick=async()=>{if(!dp)return;dp.prompt();try{await dp.userChoice}catch(e){}dp=null;box.style.display='none'};
box.querySelector('.x').onclick=()=>{off=true;box.style.display='none'};
setInterval(()=>{box.style.display=(dp&&!off&&st=='menu')?'flex':'none'},500)})();

