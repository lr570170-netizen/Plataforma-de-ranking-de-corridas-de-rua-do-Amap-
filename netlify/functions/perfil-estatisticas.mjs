import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const reply=(v,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store'}});
export default async function(req){
 try{
  if(req.method!=='GET')return reply({erro:'Método não permitido'},405);
  const user=await getUser();
  if(!user)return reply({erro:'Entre na conta para consultar suas estatísticas.'},401);
  const db=getDatabase();
  await db.sql`CREATE TABLE IF NOT EXISTS treinos_gps (id BIGSERIAL PRIMARY KEY, identity_id TEXT NOT NULL, nome TEXT NOT NULL, cidade TEXT NOT NULL, sexo TEXT NOT NULL, distancia_m INTEGER NOT NULL, duracao_s INTEGER NOT NULL, iniciado_em TIMESTAMPTZ NOT NULL, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  await db.sql`ALTER TABLE treinos_gps ADD COLUMN IF NOT EXISTS removido_em TIMESTAMPTZ`;
  const rows=await db.sql`SELECT id,distancia_m,duracao_s,iniciado_em,ROUND((distancia_m::numeric/1000)*10+(distancia_m::numeric*3600/NULLIF(duracao_s,0)/1000)*5,2) AS pontos FROM treinos_gps WHERE identity_id=${user.id} AND removido_em IS NULL AND distancia_m>=10 AND duracao_s>=30 ORDER BY iniciado_em DESC LIMIT 2000`;
  return reply({treinos:rows});
 }catch(e){console.error('perfil estatisticas:',e);return reply({erro:'Não foi possível consultar os treinos.'},503)}
}
export const config={path:'/api/perfil/estatisticas'};
