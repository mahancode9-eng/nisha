# Nisha Flutter Quick Start

This is the fast path for running the mobile app in `nisha_flutter/`.

## Prerequisites

- Flutter SDK with Dart 3.x
- Android Studio or VS Code with Flutter support
- An Android emulator, a physical device, or Xcode on macOS for iOS
- A running Nisha backend

## Setup

```bash
cd nisha_flutter
flutter pub get
```

## Run The App

Use the default development backend on an Android emulator:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
```

If you are using a physical device, point `API_BASE_URL` at your machine or staging host.

## Verify The App

```bash
flutter analyze
flutter test
```

The current smoke test checks that:

- The app boots under `ProviderScope`
- The Persian landing page renders
- The appearance button is available

## What You Should See

On first launch:

- Persian is selected
- RTL layout is active
- The purple/black theme is visible
- The public landing page shows the main platform entry points
- The appearance sheet can switch language and theme modes

## Build Commands

Android APK:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
```

Android App Bundle:

```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.example.com
```

iOS archive on macOS:

```bash
flutter build ipa --release --dart-define=API_BASE_URL=https://api.example.com
```

## Common Issues

- If the backend is not reachable, confirm `API_BASE_URL`
- If secure storage behaves oddly in tests, make sure the test uses mocked preferences and secure storage
- If text is not mirrored, confirm the app is running in Persian mode
- If a release build points at the wrong backend, update the `--dart-define` value

