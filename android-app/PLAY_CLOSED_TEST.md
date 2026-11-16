# Ranking Amapá Running — Plano de teste fechado no Google Play

## Identificação
- Nome: Ranking Amapá Running
- Pacote Android: `br.com.rankingamaparunning`
- Versão do projeto Android: 0.2.0 (versionCode 2)
- Formato de distribuição: Android App Bundle (.aab), assinado com chave de upload
- Canal inicial: teste fechado (Closed testing)

## Descrição curta sugerida
Acompanhe rankings de corridas e registre seus treinos no Amapá.

## Descrição longa sugerida
O Ranking Amapá Running reúne informações e classificações de corridas de rua do Amapá. Consulte rankings e resultados, acompanhe categorias disponíveis na plataforma e acesse seu perfil. A seção de treinos permite o cadastro de atividades com comprovantes e homologação administrativa, conforme as regras de cada ranking. O aplicativo também inclui um módulo experimental de acompanhamento de treinos por GPS, com histórico local. A sincronização automática do GPS com o ranking online ainda não está disponível.

## Antes de enviar para a Play Console
- [ ] Confirmar se o identificador `br.com.rankingamaparunning` está disponível na conta.
- [ ] Criar e guardar a chave de upload (keystore) fora do GitHub.
- [ ] Configurar no GitHub Actions os segredos ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS e ANDROID_KEY_PASSWORD.
- [ ] Executar Android debug APK e instalar em aparelho físico.
- [ ] Testar abertura, login, saída, navegação, ranking, upload de comprovante e homologação.
- [ ] Testar permissões de localização e notificação, início e encerramento de treino, tela bloqueada, perda de GPS e histórico local.
- [ ] Revisar autenticação em WebView; se o provedor bloquear WebView, implementar fluxo seguro de navegador/Custom Tabs antes de publicar.
- [ ] Publicar uma política de privacidade verdadeira e acessível, descrevendo dados pessoais, GPS, retenção, exclusão, terceiros e contato do responsável.
- [ ] Preencher Data safety e declarações de permissões no Play Console de acordo com a implementação real.
- [ ] Preparar ícone 512x512, imagem de destaque 1024x500 e capturas reais do aplicativo.
- [ ] Verificar requisitos atuais do Google Play (API alvo, verificações de conta e eventual quantidade/duração mínima de testadores).
- [ ] Executar workflow Android Play Store release bundle e verificar AAB assinado.
- [ ] Criar faixa de teste fechado na Play Console, cadastrar testadores e disponibilizar link de participação.
- [ ] Corrigir problemas encontrados antes de solicitar acesso à produção.

## Cenários de teste
1. Abertura inicial com e sem internet; comportamento de erros de rede.
2. Autenticação e autorização de contas de atleta e administrador.
3. Classificações masculinas, femininas, PcD e por município, conforme funcionalidades existentes no site.
4. Cadastro manual de treino com data permitida, duração e distância; anexação de imagem/PDF.
5. Rejeição de datas anteriores a 15/11/2026 e de registros inválidos.
6. Treino manual pendente não deve pontuar antes da homologação.
7. Homologação e remoção pelo administrador devem refletir corretamente no ranking.
8. GPS em aparelho físico, com tela ligada e bloqueada; validação da distância contra percurso conhecido.
9. Nenhum treino GPS deve ser anunciado como sincronizado automaticamente enquanto a API não estiver integrada.
10. Encerramento inesperado do processo, interrupção por falta de bateria e privacidade dos dados locais.

## Avisos importantes
Este arquivo é um plano de preparação, não comprova aprovação na Play Store. Não publicar o APK/AAB sem testes reais. A interface do aplicativo é própria; não utilizar marca, ícones ou layouts protegidos de outros serviços. Não inserir senhas, chave de assinatura, dados de atletas ou tokens neste repositório.
