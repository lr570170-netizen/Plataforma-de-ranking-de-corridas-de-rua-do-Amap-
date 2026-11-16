import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async function(req){
 try{
  const db=getDatabase();
  await db.sql`CREATE TABLE IF NOT EXISTS desafios_corrida (id BIGSERIAL PRIMARY KEY, criador_id TEXT NOT NULL, desafiado_id TEXT NOT NULL, criador_nome TEXT NOT NULL, desafiado_nome TEXT NOT NULL, prova_nome TEXT NOT NULL, prova_data DATE NOT NULL, prova_url TEXT NOT NULL, distancia_km INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pendente', criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), respondido_em TIMESTAMPTZ)`;
  const user=await getUser();
  if(req.method==='GET'){
   if(!user)return reply({desafios:[]});
   const rows=await db.sql`SELECT id,criador_id,desafiado_id,criador_nome,desafiado_nome,prova_nome,prova_data,prova_url,distancia_km,status,criado_em FROM desafios_corrida WHERE criador_id=${user.id} OR desafiado_id=${user.id} ORDER BY criado_em DESC LIMIT 100`;
   return reply({desafios:rows,usuario_id:user.id});
  }
  if(!user)return reply({erro:'Faça login para participar dos desafios.'},401);
  if(req.method==='POST'){
   const b=await req.json();
   const destino=String(b.desafiado_id||'').trim(),nome=String(b.prova_nome||'').trim(),data=String(b.prova_data||''),url=String(b.prova_url||'').trim(),km=Number(b.distancia_km);
   if(!destino||destino===user.id||nome.length<5||nome.length>150||!/^20\d{2}-\d{2}-\d{2}$/.test(data)||!Number.isFinite(Date.parse(data+'T12:00:00Z'))||Date.parse(data+'T12:00:00Z')<Date.now()-86400000||!([5,10,21,42].includes(km)))return reply({erro:'Informe outro atleta, prova futura, data e distância válidas.'},400);
   let link;try{link=new URL(url);if(link.protocol!=='https:'||url.length>500||link.username||link.password)throw Error()}catch{return reply({erro:'Informe o link HTTPS oficial da corrida.'},400)}
   const criador=await db.sql`SELECT nome FROM atletas WHERE identity_id=${user.id} LIMIT 1`;
   const desafiado=await db.sql`SELECT nome FROM atletas WHERE identity_id=${destino} LIMIT 1`;
   if(!criador.length||!desafiado.length)return reply({erro:'Os dois atletas precisam ter perfil cadastrado.'},409);
   const dup=await db.sql`SELECT id FROM desafios_corrida WHERE criador_id=${user.id} AND desafiado_id=${destino} AND prova_nome=${nome} AND prova_data=${data}::date AND status IN ('pendente','aceito') LIMIT 1`;
   if(dup.length)return reply({erro:'Você já possui um desafio aberto com esse atleta nessa prova.'},409);
   const rows=await db.sql`INSERT INTO desafios_corrida(criador_id,desafiado_id,criador_nome,desafiado_nome,prova_nome,prova_data,prova_url,distancia_km) VALUES(${user.id},${destino},${criador[0].nome},${desafiado[0].nome},${nome},${data}::date,${url},${km}) RETURNING id`;
   return reply({ok:true,id:rows[0].id,mensagem:'Convite enviado. O outro atleta precisa aceitar.'},201);
  }
  if(req.method==='PATCH'){
   const b=await req.json(),id=Number(b.id),acao=String(b.acao||'');
   if(!Number.isSafeInteger(id)||id<1||!['aceitar','recusar','cancelar'].includes(acao))return reply({erro:'Ação inválida.'},400);
   const status=acao==='aceitar'?'aceito':acao==='recusar'?'recusado':'cancelado';
   const rows=acao==='cancelar'
    ?await db.sql`UPDATE desafios_corrida SET status=${status},respondido_em=NOW() WHERE id=${id} AND criador_id=${user.id} AND status='pendente' RETURNING id`
    :await db.sql`UPDATE desafios_corrida SET status=${status},respondido_em=NOW() WHERE id=${id} AND desafiado_id=${user.id} AND status='pendente' RETURNING id`;
   if(!rows.length)return reply({erro:'Desafio não encontrado ou já respondido.'},409);
   return reply({ok:true,status});
  }
  return reply({erro:'Método não permitido.'},405);
 }catch(e){console.error('desafios corrida:',e);return reply({erro:'Desafios temporariamente indisponíveis.'},503)}
}
export const config={path:'/api/desafios-corrida'};
