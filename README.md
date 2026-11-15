# Ranking Amapá Running — MVP demonstrativo

Abra `index.html` no navegador. Não exige instalação ou servidor. O projeto inclui: página inicial, rankings demonstrativos por pontos e tempo com filtros de gênero, PcD, classe esportiva, faixa etária, município e distância; calendário ilustrativo; desafios e medalhas digitais; premiação Top 5; perfil e envio de resultados; painel administrativo de demonstração.

## Importante

**É um protótipo, não uma plataforma de produção.** Os dados de atletas, corridas e pontos são fictícios. Os formulários usam `localStorage` do navegador; não existe banco de dados remoto, autenticação, verificação de resultados, concessão oficial de medalhas ou sistema de auditoria. O botão "Aprovar demo" não representa homologação real. Não cadastrar informações sensíveis.

## Próxima etapa de produção

1. Migrar para Next.js + TypeScript e PostgreSQL/Supabase.
2. Implantar autenticação, permissões administrativas e políticas de acesso ao banco.
3. Criar tabelas de atletas, eventos, distâncias, resultados, comprovações, homologações, categorias PcD, regras versionadas, pontos, desafios e premiações.
4. Validar documentos e URLs oficiais, deduplicar resultados e registrar histórico de revisões.
5. Implementar regras definitivas para idade de referência, classes PcD, pontuação, critérios de desempate, tempo líquido/bruto, homologação de percursos e período de recurso.
6. Adicionar privacidade/LGPD, acessibilidade, backups, testes e monitoramento.
7. Integrar API compartilhada com futuro app React Native/Expo.

## Publicação

Pode ser hospedado como site estático (Netlify, por exemplo), **somente como demonstração pública**, sem dados reais. Para operação real, implementar o backend e a segurança antes de permitir cadastros de atletas.
