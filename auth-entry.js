import {signup,login,logout,getUser,handleAuthCallback} from '@netlify/identity';
window.onlineAuth={signup,login,logout,getUser};
window.onlineAuth.ready=(async()=>{
 try{await handleAuthCallback()}catch(e){console.warn('Retorno da autenticação:',e.message)}
 try{window.onlineUser=await getUser()}catch(e){console.warn('Sessão não verificada; será tentado novamente ao retornar:',e.message);window.onlineUser=null}
 window.dispatchEvent(new Event('auth-ready'));
 return window.onlineUser;
})();
