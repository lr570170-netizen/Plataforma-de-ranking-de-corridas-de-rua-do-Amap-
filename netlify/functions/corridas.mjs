import {getDatabase} from '@netlify/database';
import {getUser} from '@netlify/identity';
const respond=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export default async function(req){
 try{
  const db=getDatabase();
  if(req.method==='GET'){
   const rows=await db.sql`SELECT id,nome,cidade,data,distancias,organizador,status FROM corridas_oficiais WHERE status='aprovada' ORDER BY data,nome LIMIT 250`;
   return respond({corridas:rows});
  }
  if(req.method!=='POST')return respond({erro:'Método não permitido'},405);
  const user=await getUser();
  if(!user)return respond({erro:'Entre na sua conta.'},401);
  const b=await req.json();
  const nome=String(b.nome||'').trim(),cidade=String(b.cidade||''),organizador=String(b.organizador||'').trim(),data=String(b.data||''),distancias=String(b.distancias||'').trim();
  if(nome.length<4||nome.length>120||organizador.length<3||organizador.length>120||!/^2027-\d{2}-\d{2}$/.test(data)||!Number.isFinite(Date.parse(data))||distancias.length<3||distancias.length>120||!['Macapá','Santana','Oiapoque','Porto Grande','Laranjal do Jari','Tartarugalzinho','Pedra Branca do Amapari','Mazagão','Calçoene','Amapá','Ferreira Gomes','Itaubal','Cutias','Pracuúba','Serra do Navio','Vitória do Jari'].includes(cidade))return respond({erro:'Confira os dados da corrida.'},400);
  const rows=await db.sql`INSERT INTO corridas_oficiais(nome,cidade,data,distancias,organizador,criado_por) VALUES(${nome},${cidade},${data}::date,${distancias},${organizador},${user.id}) RETURNING id,status`;
  return respond({corrida:rows[0]},201);
 }catch(e){console.error('corridas:',e);return respond({erro:'Serviço de corridas indisponível.'},503)}
}
export const config={path:'/api/corridas'};
