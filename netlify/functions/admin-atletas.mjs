import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default async function(req){
  try{
    const user=await getUser();
    if(!user)return reply({erro:'Faça login para acessar o painel.'},401);
    if(!user.roles?.includes('admin'))return reply({erro:'Acesso exclusivo para administradores autorizados.'},403);
    const db=getDatabase();
    if(req.method==='DELETE'){
      const body=await req.json().catch(()=>null);
      const id=Number(body?.id);
      if(!Number.isSafeInteger(id)||id<1||body?.confirmacao!=='EXCLUIR')return reply({erro:'Informe o ID do participante e confirme a exclusão.'},400);
      const removidos=await db.sql`WITH alvo AS (SELECT id,nome FROM atletas WHERE id=${id} AND identity_id IS NOT NULL),
      apagar_beta AS (DELETE FROM resultados_beta_2026 WHERE atleta_id IN (SELECT id FROM alvo) RETURNING id),
      apagar_resultados AS (DELETE FROM resultados WHERE atleta_id IN (SELECT id FROM alvo) RETURNING id),
      apagar_perfil AS (DELETE FROM atletas WHERE id IN (SELECT id FROM alvo) RETURNING id,nome)
      SELECT id,nome,(SELECT COUNT(*)::int FROM apagar_beta) AS resultados_2026,(SELECT COUNT(*)::int FROM apagar_resultados) AS resultados_2027 FROM apagar_perfil`;
      if(!removidos.length)return reply({erro:'Participante não encontrado.'},404);
      return reply({excluido:true,participante:removidos[0]});
    }
    if(req.method!=='GET')return reply({erro:'Método não permitido'},405);
    const url=new URL(req.url);
    const cidade=url.searchParams.get('cidade')||'';
    const categoria=url.searchParams.get('categoria')||'';
    const busca=(url.searchParams.get('busca')||'').trim().slice(0,90);
    const pagina=Math.min(10000,Math.max(1,Number.parseInt(url.searchParams.get('pagina')||'1',10)||1));
    const offset=(pagina-1)*50;
    const filtroCidade=cidade||null, filtroCategoria=categoria||null, filtroBusca=busca||null;
    const totais=await db.sql`SELECT COUNT(*)::int AS total,COUNT(DISTINCT cidade)::int AS municipios FROM atletas WHERE identity_id IS NOT NULL`;
    const filtrados=await db.sql`SELECT COUNT(*)::int AS total FROM atletas WHERE identity_id IS NOT NULL AND (${filtroCidade}::text IS NULL OR cidade=${filtroCidade}) AND (${filtroCategoria}::text IS NULL OR sexo=${filtroCategoria}) AND (${filtroBusca}::text IS NULL OR nome ILIKE '%' || ${filtroBusca} || '%')`;
    const atletas=await db.sql`SELECT id,nome,cidade,sexo,faixa,classe FROM atletas WHERE identity_id IS NOT NULL AND (${filtroCidade}::text IS NULL OR cidade=${filtroCidade}) AND (${filtroCategoria}::text IS NULL OR sexo=${filtroCategoria}) AND (${filtroBusca}::text IS NULL OR nome ILIKE '%' || ${filtroBusca} || '%') ORDER BY nome,id LIMIT 50 OFFSET ${offset}`;
    return reply({total:totais[0]?.total||0,municipios:totais[0]?.municipios||0,totalFiltrado:filtrados[0]?.total||0,pagina,porPagina:50,atletas});
  }catch(err){console.error('admin atletas:',err);return reply({erro:'Não foi possível consultar os cadastros online.'},503)}
}
export const config={path:'/api/admin/atletas'};
