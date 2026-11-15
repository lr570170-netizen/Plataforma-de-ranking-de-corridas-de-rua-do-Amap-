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
