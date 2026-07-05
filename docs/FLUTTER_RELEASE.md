# Nisha Flutter Release Guide

This guide covers shipping the mobile app from `nisha_flutter/`.

It is separate from backend deployment. Use the backend production guide for the API server and database. Use this guide for the Flutter client build and release process.

## Release Checklist

Before building a release:

- Confirm the backend production URL
- Confirm the backend allows the mobile origin or network path you will use
- Decide the release version and build number
- Verify Persian is still the default locale
- Verify the theme toggle still persists
- Run `flutter analyze` and `flutter test`

## Environment

The app reads its backend URL from `API_BASE_URL`.

Examples:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
```

For production, point `API_BASE_URL` at the public HTTPS API host.

## Android Release

### Debug APK For Internal Testing

```bash
flutter build apk --debug --dart-define=API_BASE_URL=https://api.example.com
```

### Release APK

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
```

### Release App Bundle

```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.example.com
```

Use the app bundle for Play Store submissions.

### Signing

1. Create a release keystore outside the repository.
2. Copy `android/key.properties.example` to `android/key.properties`.
3. Fill in the keystore path and passwords in `key.properties`.
4. Build with `flutter build appbundle --release`.

`android/app/build.gradle.kts` reads `key.properties` when present and uses the release signing config. If the file is missing, release builds fall back to debug signing for local testing only.

Never commit:

- `android/key.properties`
- `*.jks` / `*.keystore` files

Example `key.properties`:

```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=upload
storeFile=/absolute/path/to/upload-keystore.jks
```

## iOS Release

On macOS:

```bash
flutter build ipa --release --dart-define=API_BASE_URL=https://api.example.com
```

Then archive and upload through Xcode or Transporter.

## Versioning

Update the app version in `pubspec.yaml` or pass build metadata at build time.

Examples:

```bash
flutter build appbundle --release --build-name=1.0.0 --build-number=42 --dart-define=API_BASE_URL=https://api.example.com
```

## Asset Checks

Before release, confirm:

- App icon looks correct on Android and iOS
- The Persian font renders correctly
- Light and dark themes both read well
- No placeholder text is visible in the release paths you are shipping

## Smoke Test Checklist

Verify these screens before releasing:

- Public landing page
- Seller login
- Customer login
- Customer recovery flow
- Theme mode switch
- Language switch

If you later replace placeholder pages with live data, extend this checklist to include seller, customer, and admin role flows.

## Rollback Strategy

If a release needs to be rolled back:

- Keep the previous signed artifact
- Bump the build number for the replacement build
- Rebuild with the same backend URL or an updated rollback URL
- Re-run the smoke checklist before publishing

