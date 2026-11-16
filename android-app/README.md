# Ranking Amapá Running — Aplicativo Android

A tela inicial agora abre a plataforma existente em uma WebView Android com JavaScript, armazenamento local e seletor nativo de comprovantes (imagens/PDF). Os rankings, formulários e homologações são fornecidos pelo site atual. O botão **Treino GPS** abre o módulo nativo experimental já existente; **Navegador** abre o site no navegador externo, útil para autenticação caso o provedor não aceite WebView.

**Estado:** código-fonte integrado ao repositório, mas compilação do APK, login, envio de anexos e instalação em aparelho real ainda precisam de testes. O módulo GPS continua local e não envia treinos automaticamente ao ranking.

O workflow GitHub Actions em `.github/workflows/android-debug.yml` executa `gradle assembleDebug` quando a pasta `android-app` é alterada. Após uma execução bem-sucedida, o APK estará no artefato `ranking-amapa-running-debug-apk` da aba Actions. Não compartilhe credenciais, tokens ou dados de localização no repositório.

## Abrir no Android Studio

Abra `android-app`, sincronize o Gradle com JDK 17 e Android SDK 35 e execute no dispositivo Android (mínimo Android 8). Para gerar um APK local, execute `gradle assembleDebug`. O APK de depuração não é uma versão assinada para publicação na Play Store.

## Próximas etapas

Validar login com Netlify Identity dentro do WebView, selecionar e enviar PDF/imagem, navegação e comportamento offline; melhorar ícone, splash screen e assinatura do aplicativo. A integração Health Connect/Strava requer consentimento, APIs específicas e trabalho adicional.

## Preparação para Google Play Store

Há um workflow manual `.github/workflows/android-play-release.yml` para gerar o Android App Bundle (`.aab`) de produção **somente após** configurar no GitHub Actions os segredos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`. A chave de assinatura deve ser criada e guardada de modo seguro pelo proprietário; nunca deve ser enviada por mensagem ou incluída no repositório. O workflow não publica automaticamente na Play Store.

Antes de publicar, são necessários: conta Google Play Console verificada, nome e identidade visual próprios, capturas reais de tela, ícone 512×512, imagem de destaque, política de privacidade pública adequada ao tratamento de localização e dados de atletas, formulário Data safety, classificação indicativa, testes em aparelhos reais e eventuais exigências de teste fechado da conta. Não reutilize logotipo, nome ou interface protegida do Strava.

**Funcionalidades de referência para futuras versões:** feed de atividades, mapa de percursos, metas, desafios, recordes pessoais, segmentos e sincronização autorizada com wearables. Nenhuma dessas funcionalidades deve ser anunciada como pronta sem implementação e testes. O GPS atual não sincroniza com o ranking online.
