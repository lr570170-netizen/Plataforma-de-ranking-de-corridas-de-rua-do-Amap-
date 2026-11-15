# Ranking Amapá Running — protótipo Android

Aplicativo nativo Kotlin com GPS de alta precisão via Fused Location Provider e foreground service do tipo location. Mantém atualizações enquanto o usuário bloqueia a tela, sujeito às permissões e políticas de energia do Android. Notificação persistente mostra distância, duração e ritmo.

## Executar
Abra a pasta `android-app` no Android Studio (JDK 17), sincronize o Gradle, instale em celular Android com Google Play Services e autorize localização precisa. Inicie o treino com o app visível; depois bloqueie a tela e confira a notificação. Teste em aparelho real.

## Estado atual e limitações
- Protótipo de rastreamento local; **não é APK pronto, não foi compilado/testado e não envia resultados ao site**.
- O serviço precisa ser iniciado com o aplicativo visível. Não solicita ACCESS_BACKGROUND_LOCATION porque o foreground service é iniciado em primeiro plano; novas regras de versões Android devem ser observadas.
- Apenas resumo da última atividade em SharedPreferences. Ainda falta persistência robusta de pontos GPS (Room), autenticação Netlify Identity, integração autenticada com /api/treinos, envio seguro de trilha, prevenção de fraude, pausa/retomada, recuperação de encerramento inesperado e interface de ranking masculino/feminino.
- A precisão depende do hardware e do ambiente. O Google Maps não melhora a medição GNSS.
- A política de privacidade deve esclarecer a coleta de localização, finalidade, retenção e consentimento.

## Atualização do protótipo
A tela inicial mostra o histórico local e abre o site do ranking. Durante o treino, o serviço salva checkpoints da trilha GPS periodicamente no armazenamento privado do aplicativo. Ao encerrar normalmente, grava o percurso completo no histórico local. Checkpoints não equivalem à retomada automática após o sistema encerrar o processo; essa recuperação ainda precisa ser implementada e testada.

## APK de testes
O workflow `.github/workflows/android-debug.yml` tenta compilar o APK no GitHub Actions em cada alteração da pasta Android. Consulte a aba Actions e baixe o artefato `ranking-amapa-running-debug-apk` **somente se a execução terminar com sucesso**. Ainda não foi confirmada compilação ou instalação em aparelho físico.

## Segurança e sincronização
Não há envio automático de localização nem de treinos para o servidor. A integração com `/api/treinos` exigirá login real do atleta, autorização explícita para envio e validação de trilha no servidor; não é seguro usar uma chave global ou confiar apenas em distância e duração informadas pelo celular.
