# Jetpur Karate Android App

This project wraps https://jetpurkarate.in/ in an Android WebView and adds Firebase Cloud Messaging (FCM) push notifications.

## One-time Firebase setup
1. Create/select a Firebase project.
2. Add Android app package `com.jetpurkarate.app`.
3. Download `google-services.json` and copy it into `app/google-services.json`.
4. Enable Cloud Messaging.
5. Build the APK with Android Studio.

## Server setup
Copy `firebase-service-account.json.example` from the website package to the website server as `firebase-service-account.json`, replacing it with the real Firebase service-account JSON for the same project. Keep this file private and never put it inside the Android app.

The updated website Admin panel has **🔔 Notifications**. It sends through `api.php` to registered app devices.

## Important
The website's existing client-side Admin password system is preserved. For production, server-side authentication should eventually be strengthened because a browser-based password is not a secure API credential.
