plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android { namespace = "br.com.rankingamaparunning"; compileSdk = 35
    val storePath = System.getenv("ANDROID_KEYSTORE_PATH")
    val storePass = System.getenv("ANDROID_KEYSTORE_PASSWORD")
    val alias = System.getenv("ANDROID_KEY_ALIAS")
    val pass = System.getenv("ANDROID_KEY_PASSWORD")
    signingConfigs {
        if (!storePath.isNullOrBlank() && !storePass.isNullOrBlank() && !alias.isNullOrBlank() && !pass.isNullOrBlank()) {
            create("playRelease") {
                storeFile = file(storePath)
                storePassword = storePass
                keyAlias = alias
                keyPassword = pass
            }
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            if (signingConfigs.names.contains("playRelease")) signingConfig = signingConfigs.getByName("playRelease")
        }
    }
    defaultConfig { applicationId = "br.com.rankingamaparunning"; minSdk = 26; targetSdk = 35; versionCode = 2; versionName = "0.2.0" }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("com.google.android.gms:play-services-location:21.3.0")
}
