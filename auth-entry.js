import {signup,login,logout,getUser,handleAuthCallback} from '@netlify/identity';
window.onlineAuth={signup,login,logout,getUser};
(async()=>{try{await handleAuthCallback()}catch(e){console.warn('Autenticação pendente:',e.message)}try{window.onlineUser=await getUser()}catch(e){window.onlineUser=null}window.dispatchEvent(new Event('auth-ready'))})();