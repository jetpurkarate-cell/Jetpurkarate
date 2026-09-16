# Jetpur Karate Android App - GitHub APK Build

This project can be built without Android Studio using GitHub Actions.

## Steps

1. Create a new GitHub repository, for example `jetpur-karate-app`.
2. Upload all files and folders from this project to the repository root.
3. Make sure `.github/workflows/build-apk.yml` is uploaded.
4. Open the repository's **Actions** tab.
5. Select **Build Android APK**.
6. Click **Run workflow** (or push to `main`).
7. When the workflow finishes, open the workflow run and download the artifact named **JetpurKarate-debug-apk**.

The Android package/application ID is `com.jetpurkarate.app` and the Firebase configuration is already included in `app/google-services.json`.

## Important

- Do not upload any Firebase service-account private key to GitHub.
- `firebase-service-account.json.example` is only an example/template.
- For production release/Play Store publishing, create a signing key and keep it in GitHub Secrets.
