import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default async function(req){
 try{
  const u=await getUser();
  if(!u)return reply({erro:'Autenticação necessária.'},401);
  if(!u.roles?.includes('admin'))return reply({erro:'Acesso administrativo necessário.'},403);
  const db=getDatabase();
  if(req.method==='GET'){
   const corridas=await db.sql`SELECT id,nome,cidade,data,distancias,organizador,status FROM corridas_oficiais WHERE status='pendente' ORDER BY criado_em LIMIT 100`;
   const estatisticas=await db.sql`SELECT (SELECT count(*)::int FROM atletas WHERE identity_id IS NOT NULL) AS atletas,(SELECT count(*)::int FROM resultados WHERE status='pendente') AS resultados_pendentes,(SELECT count(*)::int FROM resultados WHERE status='aprovado') AS resultados_aprovados,(SELECT count(*)::int FROM corridas_oficiais WHERE status='aprovada') AS corridas_aprovadas`;
   return reply({corridas,estatisticas:estatisticas[0]});
  }
  if(req.method!=='PATCH')return reply({erro:'Método não permitido'},405);
  const b=await req.json(),id=Number(b.id);
  if(!Number.isSafeInteger(id)||id<1||!['aprovada','rejeitada'].includes(b.status))return reply({erro:'Dados inválidos'},400);
  const rows=await db.sql`UPDATE corridas_oficiais SET status=${b.status} WHERE id=${id} AND status='pendente' RETURNING id,status`;
  return rows.length?reply({corrida:rows[0]}):reply({erro:'Corrida não encontrada ou já analisada'},409);
 }catch(e){console.error('admin corridas:',e);return reply({erro:'Consulta administrativa indisponível'},503)}
}
export const config={path:'/api/admin/corridas'};
