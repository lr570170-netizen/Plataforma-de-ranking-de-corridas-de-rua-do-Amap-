# Ranking Amapá Running — Aplicativo Android

A tela inicial agora abre a plataforma existente em uma WebView Android com JavaScript, armazenamento local e seletor nativo de comprovantes (imagens/PDF). Os rankings, formulários e homologações são fornecidos pelo site atual. O botão **Treino GPS** abre o módulo nativo experimental já existente; **Navegador** abre o site no navegador externo, útil para autenticação caso o provedor não aceite WebView.

**Estado:** código-fonte integrado ao repositório, mas compilação do APK, login, envio de anexos e instalação em aparelho real ainda precisam de testes. O módulo GPS continua local e não envia treinos automaticamente ao ranking.

O workflow GitHub Actions em `.github/workflows/android-debug.yml` executa `gradle assembleDebug` quando a pasta `android-app` é alterada. Após uma execução bem-sucedida, o APK estará no artefato `ranking-amapa-running-debug-apk` da aba Actions. Não compartilhe credenciais, tokens ou dados de localização no repositório.

## Abrir no Android Studio

Abra `android-app`, sincronize o Gradle com JDK 17 e Android SDK 35 e execute no dispositivo Android (mínimo Android 8). Para gerar um APK local, execute `gradle assembleDebug`. O APK de depuração não é uma versão assinada para publicação na Play Store.

## Próximas etapas

Validar login com Netlify Identity dentro do WebView, selecionar e enviar PDF/imagem, navegação e comportamento offline; melhorar ícone, splash screen e assinatura do aplicativo. A integração Health Connect/Strava requer consentimento, APIs específicas e trabalho adicional.
