import {getDatabase} from '@netlify/database';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const pontos=p=>!Number.isSafeInteger(p)||p<1?0:p===1?100:p===2?90:p===3?80:p<=10?80-(p-3)*5:p<=30?45-(p-10)*2:1;
export default async function(req){
 if(req.method!=='GET')return json({erro:'Método não permitido'},405);
 try{
  const db=getDatabase();
  await db.sql`ALTER TABLE atletas ADD COLUMN IF NOT EXISTS nivel VARCHAR(12) NOT NULL DEFAULT 'Amador'`;const rows=await db.sql`SELECT a.id,a.nome,a.cidade,a.sexo,a.faixa,a.classe,a.nivel,r.id AS resultado_id,r.prova,r.data,r.dist,r.tempo_segundos,r.colocacao FROM resultados r JOIN atletas a ON a.id=r.atleta_id WHERE r.status='aprovado' AND r.dist = '5 km' AND r.data BETWEEN '2027-01-01' AND '2027-12-31' ORDER BY r.data,r.id`;
  const grupos=new Map(),referencias=new Map();
  for(const r of rows){
   const chave=[r.dist,r.sexo,r.classe||'',r.nivel||'Amador'].join('|'),atleta=String(r.id),prova=[r.prova,String(r.data).slice(0,10)].join('|');
   if(!grupos.has(chave))grupos.set(chave,new Map());
   const participantes=grupos.get(chave);
   if(!participantes.has(atleta))participantes.set(atleta,{id:r.id,nome:r.nome,cidade:r.cidade,sexo:r.sexo,faixa:r.faixa,classe:r.classe,nivel:r.nivel||'Amador',dist:r.dist,resultados:new Map()});
   const perfil=participantes.get(atleta),anterior=perfil.resultados.get(prova);
   if(!anterior||Number(r.colocacao)<Number(anterior.colocacao)||(Number(r.colocacao)===Number(anterior.colocacao)&&Number(r.tempo_segundos)<Number(anterior.tempo_segundos)))perfil.resultados.set(prova,r);
  }
  const atletas=[];
  for(const [chave,participantes] of grupos){
   const referencia=Math.max(0,...[...participantes.values()].map(a=>a.resultados.size));
   referencias.set(chave,referencia);
   for(const a of participantes.values()){
    const ordenados=[...a.resultados.values()].sort((x,y)=>Number(x.colocacao)-Number(y.colocacao)||Number(x.tempo_segundos)-Number(y.tempo_segundos));
    const validos=ordenados.slice(0,referencia);
    const detalhes=validos.map(x=>{const referenciaTempo=900;const tempo=Number(x.tempo_segundos);const colocacaoPontos=pontos(Number(x.colocacao));const pontosColocacao=0.7*colocacaoPontos;const pontosTempo=tempo>0?30*Math.min(1,referenciaTempo/tempo):0;return {resultado_id:x.resultado_id,prova:x.prova,data:String(x.data).slice(0,10),colocacao:Number(x.colocacao),tempo_segundos:tempo,tempo_referencia_segundos:referenciaTempo,pontos_colocacao:Number(pontosColocacao.toFixed(2)),pontos_tempo:Number(pontosTempo.toFixed(2)),pontos_total:Number((pontosColocacao+pontosTempo).toFixed(2))}});
    const pontosTotal=Number(detalhes.reduce((s,x)=>s+x.pontos_total,0).toFixed(2));
    const tempos=validos.map(x=>Number(x.tempo_segundos));
    const vitorias=validos.filter(x=>Number(x.colocacao)===1).length,segundos=validos.filter(x=>Number(x.colocacao)===2).length,terceiros=validos.filter(x=>Number(x.colocacao)===3).length;
    atletas.push({id:a.id,nome:a.nome,cidade:a.cidade,sexo:a.sexo,faixa:a.faixa,classe:a.classe,nivel:a.nivel,dist:a.dist,provas:validos.length,referencia,pontos:pontosTotal,detalhes,melhor_tempo:Math.min(...tempos),soma:tempos.reduce((x,y)=>x+y,0),vitorias,segundos,terceiros,provisorio:validos.length<referencia,faltam:Math.max(0,referencia-validos.length)});
   }
  }
  atletas.sort((a,b)=>a.dist.localeCompare(b.dist)||a.nivel.localeCompare(b.nivel)||a.sexo.localeCompare(b.sexo)||String(a.classe).localeCompare(String(b.classe))||Number(a.provisorio)-Number(b.provisorio)||b.pontos-a.pontos||b.vitorias-a.vitorias||b.segundos-a.segundos||b.terceiros-a.terceiros||a.melhor_tempo-b.melhor_tempo||a.nome.localeCompare(b.nome,'pt-BR'));
  return json({temporada:2027,criterio:'misto_70_colocacao_30_tempo_fixo_15min',limite:null,dinamico:true,referencias:Object.fromEntries(referencias),atletas:atletas.slice(0,500)});
 }catch(e){console.error('ranking 2027:',e);return json({erro:'Ranking indisponível. Verifique a configuração do banco de dados.'},503)}
}
export const config={path:'/api/ranking'};