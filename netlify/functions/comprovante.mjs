import {getStore} from '@netlify/blobs';
import {getUser} from '@netlify/identity';
import {randomUUID} from 'node:crypto';
const store=()=>getStore({name:'comprovantes-resultados',consistency:'strong'});
const json=(v,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store'}});
export default async function(req){
 try{
  const user=await getUser();
  if(!user)return json({erro:'Entre na conta para acessar comprovantes'},401);
  if(req.method==='POST'){
   const form=await req.formData();
   const file=form.get('arquivo');
   if(!file||typeof file==='string'||file.size<8||file.size>5*1024*1024)return json({erro:'Selecione PDF com até 5 MB'},400);
   const bytes=new Uint8Array(await file.arrayBuffer());
   if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')return json({erro:'Arquivo inválido: somente PDF verdadeiro'},400);
   const key=randomUUID();
   await store().set(key,new Blob([bytes],{type:'application/pdf'}),{metadata:{owner:user.id,filename:String(file.name||'resultado.pdf').slice(0,120),uploadedAt:new Date().toISOString()}});
   return json({comprovante_pdf:key},201);
  }
  if(req.method==='GET'){
   const key=new URL(req.url).searchParams.get('id')||'';
   if(!/^[a-f0-9-]{36}$/.test(key))return json({erro:'Comprovante inválido'},400);
   const entry=await store().getWithMetadata(key,{type:'arrayBuffer'});
   if(!entry)return json({erro:'Arquivo não encontrado'},404);
   if(entry.metadata?.owner!==user.id&&!user.roles?.includes('admin'))return json({erro:'Sem permissão'},403);
   return new Response(entry.data,{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="resultado-oficial.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  return json({erro:'Método não permitido'},405);
 }catch(e){console.error('comprovante:',e);return json({erro:'Falha no serviço de comprovantes'},503)}
}
export const config={path:'/api/comprovante'};
