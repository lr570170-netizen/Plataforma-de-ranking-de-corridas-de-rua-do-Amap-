import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async function(req){
 try{
  const user=await getUser();
  if(!user)return reply({erro:'Autenticação necessária.'},401);
  if(!user.roles?.includes('admin'))return reply({erro:'Acesso exclusivo à administração.'},403);
  const db=getDatabase();
  await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS removido_em TIMESTAMPTZ`;
  await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS removido_por TEXT`;
  await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS motivo_remocao TEXT`;await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS origem TEXT`;await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS homologado_em TIMESTAMPTZ`;await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS homologado_por TEXT`;
  await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS nome_corrida TEXT`;await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS resultado_oficial TEXT`;if(req.method==='GET'){
   const rows=await db.sql`SELECT id,nome,cidade,sexo,distancia_m,duracao_s,iniciado_em,criado_em,removido_em,motivo_remocao,origem,homologado_em,nome_corrida,resultado_oficial,ROUND(100000.0/NULLIF(duracao_s,0),2) AS pontos FROM treinos_gps ORDER BY CASE WHEN origem='corrida_oficial' AND homologado_em IS NULL AND removido_em IS NULL THEN 0 ELSE 1 END, criado_em DESC LIMIT 1000`;
   return reply({treinos:rows});
  }
  if(req.method==='PATCH'){
   const b=await req.json(),id=Number(b.id);
   if(!Number.isSafeInteger(id)||id<1)return reply({erro:'ID inválido.'},400);
   const rows=await db.sql`UPDATE treinos_gps SET homologado_em=NOW(),homologado_por=${user.id} WHERE id=${id} AND origem='corrida_oficial' AND nome_corrida IS NOT NULL AND resultado_oficial IS NOT NULL AND homologado_em IS NULL AND removido_em IS NULL RETURNING id`;
   if(!rows.length)return reply({erro:'Treino não encontrado, removido ou já homologado.'},409);
   return reply({ok:true,id:rows[0].id,mensagem:'Treino homologado e pontuação liberada no ranking.'});
  }
  if(req.method!=='DELETE')return reply({erro:'Método não permitido'},405);
  const b=await req.json(),id=Number(b.id),motivo=String(b.motivo||'').trim();
  if(!Number.isSafeInteger(id)||id<1||motivo.length<5||motivo.length>500)return reply({erro:'Informe um ID válido e motivo de 5 a 500 caracteres.'},400);
  const rows=await db.sql`UPDATE treinos_gps SET removido_em=NOW(),removido_por=${user.id},motivo_remocao=${motivo} WHERE id=${id} AND removido_em IS NULL RETURNING id`;
  if(!rows.length)return reply({erro:'Treino não encontrado ou já removido.'},404);
  return reply({ok:true,id:rows[0].id,mensagem:'Treino retirado do ranking; pontuação será recalculada automaticamente.'});
 }catch(e){console.error('admin treinos:',e);return reply({erro:'Gestão de treinos temporariamente indisponível.'},503)}
}
export const config={path:'/api/admin/treinos'};
