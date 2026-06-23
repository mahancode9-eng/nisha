# Nisha Flutter Implementation Guide

This guide explains how the `nisha_flutter/` workspace is organized and how to extend it without breaking the current shell, theme, localization, or auth flow.

## Current Goal

The Flutter app is a Persian-first mobile client for the Nisha platform. The first implementation pass focuses on:

- Shared app shell and responsive layout
- RTL by default, with English still available
- Purple/black theme with light, dark, and system modes
- Seller/admin auth and customer auth
- Secure session persistence
- Role-aware routing for public, seller, customer, and admin areas

Most role dashboards are currently shell screens or placeholders. The auth flow, theme controls, and landing page are real and wired to the backend auth endpoints.

## Workspace Layout

The actual Flutter workspace is:

```text
nisha_flutter/
  lib/
    app.dart
    main.dart
    core/
      api/
      config/
      localization/
      router/
      session/
      theme/
    features/
      auth/
      public/
    shared/
  assets/
    l10n/
  test/
```

### Important Files

- `lib/main.dart` boots `ProviderScope` and `NishaApp`
- `lib/app.dart` builds the `MaterialApp.router`, localization, theme, and RTL direction
- `lib/core/config/app_config.dart` holds the app name, base URL, and supported locales
- `lib/core/theme/*` contains the purple/black design tokens and theme persistence
- `lib/core/localization/locale_controller.dart` persists the selected language
- `lib/core/session/*` handles secure auth session storage and restoration
- `lib/core/router/app_router.dart` defines the public, auth, seller, customer, and admin routes
- `lib/features/auth/*` contains the seller and customer auth screens
- `lib/features/public/presentation/home/public_home_page.dart` is the landing page
- `lib/shared/widgets/*` contains the reusable app shell widgets and appearance controls
- `assets/l10n/app_en.arb` and `assets/l10n/app_fa.arb` define the user-visible copy
- `test/widget_test.dart` is the landing page smoke test

## Implementation Model

### App Bootstrap

The app is launched from `main.dart`, which wraps `NishaApp` in `ProviderScope`.
`NishaApp` watches:

- `themeControllerProvider`
- `localeControllerProvider`
- `appRouterProvider`

It then builds a `MaterialApp.router` with:

- `lang="fa"` behavior by default
- `dir="rtl"` when Persian is selected
- `ThemeData` for light and dark mode
- Flutter localization delegates

### Theme and Appearance

The theme system lives in `lib/core/theme/` and uses a purple/black palette.

- Light mode uses a bright surface with purple accents
- Dark mode uses near-black surfaces with lavender highlights
- Theme choice is stored in `SharedPreferences`
- The shared appearance sheet lets the user switch:
  - System
  - Light
  - Dark
  - Persian
  - English

The appearance button is exposed in:

- Public header
- Auth shells
- Workspace shells

### Localization

Localization is generated from ARB files in `assets/l10n/`.

- Persian is the default locale
- English remains available
- User-visible labels, helper text, and button text go through `AppLocalizations`

Use `context.l10n` from `lib/shared/extensions/build_context_x.dart` instead of hardcoding strings in widgets.

### Session Storage

The app stores role sessions with `flutter_secure_storage`.

- Seller/admin session tokens and cached user JSON are stored under seller keys
- Customer session tokens and cached user JSON are stored under customer keys
- `SessionController` restores the session on startup and exposes:
  - `SessionLoading`
  - `SessionUnauthenticated`
  - `SellerSession`
  - `CustomerSession`

### API Layer

The Flutter app currently uses `package:http/http.dart` through `ApiClient`.

- JSON request bodies are encoded with `jsonEncode`
- JSON responses are decoded with `jsonDecode`
- Backend error messages are surfaced from `detail`, `message`, or a raw text body
- `ApiException.message` is what the UI shows in snack bars

### Routing

`lib/core/router/app_router.dart` defines the role-aware route table.

Public routes:

- `/`
- `/track-order`
- `/store/:slug`
- `/store/:slug/products/:productId`
- `/store/:slug/checkout`
- `/invoice/:invoiceCode`

Auth routes:

- `/auth/login`
- `/auth/register`
- `/auth/customer/login`
- `/auth/customer/register`
- `/auth/customer/recover`

Workspace routes:

- `/seller/...`
- `/customer/...`
- `/admin/...`

The router redirects unauthenticated users into the correct login flow and keeps seller/customer/admin areas separated.

## How To Extend The App

### Add A New Screen

1. Create the widget under the correct feature folder.
2. Reuse one of the shared shells if the page belongs to a role area.
3. Add the route to `lib/core/router/app_router.dart`.
4. Add the translation keys to both ARB files.
5. Update the widget test if the new screen changes the landing flow.

### Add A Backend Call

1. Add the request method to a repository in `lib/features/<feature>/data/`.
2. Parse the response into a typed model under `lib/features/<feature>/models/`.
3. Reuse `ApiClient` instead of calling `http` directly from widgets.
4. Show `ApiException.message` to users.

### Add A New Translated Label

1. Add the key to `assets/l10n/app_en.arb`.
2. Add the matching Persian value to `assets/l10n/app_fa.arb`.
3. Regenerate the localization output by running the Flutter toolchain.
4. Use the generated getter from `context.l10n`.

### Add A New Theme Token

1. Add the color to `lib/core/theme/app_colors.dart`.
2. Reference it from `lib/core/theme/app_theme.dart`.
3. Prefer semantic use, such as `primary`, `surface`, or `outline`, over direct color literals in widgets.

## Verification

Run these checks from `nisha_flutter/`:

```bash
flutter analyze
flutter test
```

For release validation:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
```

## Current Status

The app is already functional for:

- Persian-first landing page
- Theme and language switching
- Seller login and register
- Customer login, register, and recovery
- Persistent auth restoration

The remaining role screens are scaffolded and ready for backend-backed feature work.
