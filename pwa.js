let deferredInstallPrompt=null;
const banner=document.getElementById('pwa-install'),installButton=document.getElementById('pwa-install-button'),closeButton=document.getElementById('pwa-install-close');
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(e=>console.warn('PWA:',e.message)));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;if(!sessionStorage.getItem('pwa-install-dismissed'))banner.hidden=false});
installButton.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;banner.hidden=true;await deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null});
closeButton.addEventListener('click',()=>{banner.hidden=true;sessionStorage.setItem('pwa-install-dismissed','1')});
window.addEventListener('appinstalled',()=>{banner.hidden=true;deferredInstallPrompt=null});
