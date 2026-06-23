# Nisha Flutter App

Flutter workspace for the mobile Nisha platform client.

## What This App Does

- Persian is the default UI language.
- RTL is the default layout direction.
- Purple-black theme tokens are used across the app.
- Light, dark, and system theme modes are available.
- The app is structured for public, seller, customer, and admin flows.
- Seller and customer auth screens are live.
- The remaining workspace screens are scaffolded and ready for backend-backed feature work.

## Run

```bash
flutter pub get --offline
flutter test test/widget_test.dart
flutter run
```

If you want to point the app at a different backend:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
```

## Structure

- `lib/app.dart` - app root, localization, theme, router
- `lib/core/` - config, theme, session, API, and routing helpers
- `lib/features/` - role-specific screens
- `lib/shared/` - reusable shells, cards, and appearance controls
- `assets/l10n/` - English and Persian ARB source files

## Docs

- [Flutter implementation guide](../docs/FLUTTER_IMPLEMENTATION_GUIDE.md)
- [Flutter architecture](../docs/FLUTTER_ARCHITECTURE.md)
- [Flutter API reference](../docs/FLUTTER_API_REFERENCE.md)
- [Flutter quick start](../docs/FLUTTER_QUICKSTART.md)
- [Flutter release guide](../docs/FLUTTER_RELEASE.md)
- [Production deployment guide](../docs/PRODUCTION_DEPLOYMENT.md)
- [Internal worklog](../docs/WORKLOG.md)

## Notes

- The current implementation pass focuses on the platform shell, localization, theme toggles, auth flows, and role-aware navigation.
- Backend integration is wired through the shared API helpers and can be extended feature by feature.
