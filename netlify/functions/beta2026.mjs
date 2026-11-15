import {getStore} from '@netlify/blobs';import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const reply=(v,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store'}});
const ds=['5 km','10 km','21,0975 km','42,195 km'];
export default async function(req){
 try{
  const db=getDatabase();
  if(req.method==='GET'){
   const u=await getUser();
   const url=new URL(req.url);
   if(url.searchParams.get('fila')==='1'){
    if(!u?.roles?.includes('admin'))return reply({erro:'Sem permissão'},403);
    const resultados=await db.sql`SELECT r.id,r.prova,r.data,r.dist,r.tempo_segundos,r.url,r.comprovante_pdf,r.colocacao,a.nome FROM resultados_beta_2026 r JOIN atletas a ON a.id=r.atleta_id WHERE r.status='pendente' ORDER BY r.criado_em LIMIT 100`;
    return reply({resultados});
   }
   if(url.searchParams.get('meus')==='1'){
    if(!u)return reply({erro:'Entre na sua conta'},401);
    const resultados=await db.sql`SELECT r.id,r.prova,r.data,r.dist,r.tempo_segundos,r.status,r.comprovante_pdf,r.colocacao FROM resultados_beta_2026 r JOIN atletas a ON a.id=r.atleta_id WHERE a.identity_id=${u.id} ORDER BY r.data DESC LIMIT 200`;
    return reply({resultados});
   }
   const atletas=await db.sql`SELECT a.nome,a.cidade,a.sexo,a.faixa,a.classe,r.dist,COUNT(*)::int AS provas,MIN(r.tempo_segundos)::int AS melhor_tempo FROM resultados_beta_2026 r JOIN atletas a ON a.id=r.atleta_id WHERE r.status='aprovado' GROUP BY a.id,a.nome,a.cidade,a.sexo,a.faixa,a.classe,r.dist ORDER BY r.dist,melhor_tempo,a.nome LIMIT 500`;
   return reply({temporada:2026,experimental:true,atletas});
  }
  const u=await getUser();
  if(!u)return reply({erro:'Entre na sua conta'},401);
  if(req.method==='POST'){
   const b=await req.json(),d=String(b.data||''),t=String(b.tempo||''),m=t.match(/^(\d{1,2}):([0-5]\d):([0-5]\d)$/),segundos=m?Number(m[1])*3600+Number(m[2])*60+Number(m[3]):0,colocacao=Number(b.colocacao);
   if(!/^2026-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||d>new Date().toISOString().slice(0,10)||!ds.includes(b.dist)||segundos<1||segundos>86400||!Number.isSafeInteger(colocacao)||colocacao<1||String(b.prova||'').trim().length<3||String(b.prova||'').length>120||(!/^https:\/\//.test(String(b.url||''))&&!/^[a-f0-9-]{36}$/.test(String(b.comprovante_pdf||'')))||String(b.url||'').length>1000)return reply({erro:'Informe resultado oficial válido de 2026 e link HTTPS de comprovação'},400);
   if(b.comprovante_pdf){const meta=await getStore({name:'comprovantes-resultados',consistency:'strong'}).getMetadata(String(b.comprovante_pdf));if(!meta||meta.metadata?.owner!==u.id)return reply({erro:'O PDF deve ser enviado pela sua própria conta'},403)} const rows=await db.sql`INSERT INTO resultados_beta_2026(atleta_id,prova,data,dist,tempo_segundos,colocacao,url,comprovante_pdf) SELECT id,${b.prova.trim()},${d}::date,${b.dist},${segundos},${colocacao},${b.url||''},${b.comprovante_pdf||null} FROM atletas WHERE identity_id=${u.id} ON CONFLICT DO NOTHING RETURNING id`;
   return rows.length?reply({id:rows[0].id,status:'pendente'},201):reply({erro:'Perfil online ausente ou resultado duplicado'},409);
  }
  if(req.method==='PATCH'){
   if(!u.roles?.includes('admin'))return reply({erro:'Sem permissão'},403);
   const b=await req.json(),id=Number(b.id);
   if(!Number.isSafeInteger(id)||id<1||!['aprovado','rejeitado'].includes(b.status))return reply({erro:'Dados inválidos'},400);
   const rows=await db.sql`UPDATE resultados_beta_2026 SET status=${b.status} WHERE id=${id} AND status='pendente' RETURNING id,status`;
   return rows.length?reply({resultado:rows[0]}):reply({erro:'Resultado já analisado ou inexistente'},409);
  }
  return reply({erro:'Método não permitido'},405);
 }catch(e){console.error('beta2026:',e);return reply({erro:'Serviço experimental temporariamente indisponível'},503)}
}
export const config={path:'/api/beta2026'};
