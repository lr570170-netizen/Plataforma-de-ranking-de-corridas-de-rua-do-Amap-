import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const isAdmin=u=>Array.isArray(u?.app_metadata?.roles)&&u.app_metadata.roles.includes('admin')||Array.isArray(u?.roles)&&u.roles.includes('admin');
export default async function(req){
 try{
  const user=await getUser();
  if(!user)return reply({erro:'Entre na sua conta para consultar sua inscrição.'},401);
  const admin=isAdmin(user),db=getDatabase();
  await db.sql`CREATE TABLE IF NOT EXISTS inscricoes_anuais (id BIGSERIAL PRIMARY KEY, usuario_id TEXT NOT NULL, email TEXT NOT NULL, temporada INTEGER NOT NULL, valor_centavos INTEGER NOT NULL, comprovante_base64 TEXT NOT NULL, comprovante_tipo TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pendente', criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), analisado_em TIMESTAMPTZ, analisado_por TEXT, UNIQUE(usuario_id,temporada))`;
  if(req.method==='GET'){
   if(new URL(req.url).searchParams.get('admin')==='1'){
    if(!admin)return reply({erro:'Acesso restrito à administração.'},403);
    const rows=await db.sql`SELECT id,usuario_id,email,temporada,valor_centavos,status,criado_em,analisado_em FROM inscricoes_anuais WHERE temporada=2027 ORDER BY CASE WHEN status='pendente' THEN 0 ELSE 1 END,criado_em DESC LIMIT 250`;
    return reply({inscricoes:rows});
   }
   const rows=await db.sql`SELECT id,temporada,valor_centavos,status,criado_em,analisado_em FROM inscricoes_anuais WHERE usuario_id=${user.id} AND temporada=2027 LIMIT 1`;
   return reply({inscricao:rows[0]||null});
  }
  if(req.method==='POST'){
   const b=await req.json();
   const proof=String(b.comprovante||''),m=/^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(proof);
   if(!m||m[2].length>1400000||m[2].length<100)return reply({erro:'Envie um comprovante JPG, PNG, WebP ou PDF de até 1 MB.'},400);
   const raw=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));
   if(raw.length>1048576)return reply({erro:'O comprovante deve ter no máximo 1 MB.'},400);
   const pdf=raw[0]===37&&raw[1]===80&&raw[2]===68&&raw[3]===70;
   const png=raw[0]===137&&raw[1]===80&&raw[2]===78&&raw[3]===71;
   const jpg=raw[0]===255&&raw[1]===216&&raw[2]===255;
   const webp=String.fromCharCode(...raw.slice(0,4))==='RIFF'&&String.fromCharCode(...raw.slice(8,12))==='WEBP';
   if(!((m[1]==='application/pdf'&&pdf)||(m[1]==='image/png'&&png)||(m[1]==='image/jpeg'&&jpg)||(m[1]==='image/webp'&&webp)))return reply({erro:'Arquivo do comprovante inválido.'},400);
   const email=String(user.email||'').slice(0,200);
   const rows=await db.sql`INSERT INTO inscricoes_anuais(usuario_id,email,temporada,valor_centavos,comprovante_base64,comprovante_tipo) VALUES(${user.id},${email},2027,3000,${m[2]},${m[1]}) ON CONFLICT(usuario_id,temporada) DO UPDATE SET comprovante_base64=EXCLUDED.comprovante_base64,comprovante_tipo=EXCLUDED.comprovante_tipo,status='pendente',criado_em=NOW(),analisado_em=NULL,analisado_por=NULL WHERE inscricoes_anuais.status<>'aprovado' RETURNING id,status`;
   if(!rows.length)return reply({erro:'Sua inscrição já foi aprovada.'},409);
   return reply({ok:true,status:'pendente'});
  }
  if(req.method==='PATCH'){
   if(!admin)return reply({erro:'Acesso restrito.'},403);
   const b=await req.json(),id=Number(b.id),status=String(b.status||'');
   if(!Number.isSafeInteger(id)||id<1||!['aprovado','rejeitado'].includes(status))return reply({erro:'Solicitação inválida.'},400);
   const rows=await db.sql`UPDATE inscricoes_anuais SET status=${status},analisado_em=NOW(),analisado_por=${user.id} WHERE id=${id} AND temporada=2027 AND status='pendente' RETURNING id`;
   if(!rows.length)return reply({erro:'Inscrição não encontrada ou já analisada.'},409);
   return reply({ok:true});
  }
  return reply({erro:'Método não permitido.'},405);
 }catch(e){console.error('inscricoes-anuais:',e);return reply({erro:'Serviço de inscrições indisponível.'},503)}
}
export const config={path:'/api/inscricoes-anuais'};
