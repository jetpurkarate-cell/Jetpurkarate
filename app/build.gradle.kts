plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.jetpurkarate.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.jetpurkarate.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.core:core:1.15.0")
    implementation("androidx.activity:activity:1.10.0")
    implementation("com.google.firebase:firebase-messaging:24.1.0")
}