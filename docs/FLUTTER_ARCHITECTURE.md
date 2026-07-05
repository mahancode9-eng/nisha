# Nisha Flutter Architecture

## Overview

`nisha_flutter/` is a single Flutter application for the Nisha platform. It serves:

- Public visitors
- Sellers and admins
- Customers

The first implementation pass is intentionally shell-first. The app already has a working theme system, locale switching, secure session restoration, auth screens, and a role-aware router. The remaining role pages are scaffolded for future backend integration.

## Design Goals

- Persian-first UI with English still available
- RTL layout by default
- Purple/black visual system with light, dark, and system modes
- Shared shell widgets for consistent headers, drawers, and nav bars
- Secure token persistence
- Feature-first organization without overengineering the first pass

## Directory Structure

```text
nisha_flutter/
  lib/
    app.dart
    main.dart
    core/
      config/
      api/
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

## Runtime Flow

1. `main.dart` initializes Flutter bindings and starts `NishaApp`.
2. `NishaApp` watches theme, locale, and router providers.
3. `MaterialApp.router` builds the app with localization delegates and theme data.
4. `Directionality` is forced to RTL when Persian is active.
5. `SessionController` restores any saved seller or customer session.
6. `GoRouter` redirects to the correct login or workspace route based on the session state.

## Core Modules

### Config

`lib/core/config/app_config.dart` exposes:

- `appName`
- `apiBaseUrl`
- `apiUrl`
- `defaultLocale`
- `supportedLocales`

The backend URL is injected with `--dart-define=API_BASE_URL=...`.

### Theme

`lib/core/theme/` contains the purple/black palette and the theme controller.

- `AppColors` holds the brand colors
- `AppTheme` builds light and dark `ThemeData`
- `ThemeController` persists the selected theme mode with `SharedPreferences`

### Localization

`lib/core/localization/locale_controller.dart` stores the selected locale.

- Persian is the default
- English is available through the shared appearance sheet
- Generated localizations live under `lib/l10n/`

### Session

`lib/core/session/` manages auth state and secure storage.

- `SessionStorage` uses `flutter_secure_storage`
- `SessionController` restores the last seller or customer session on startup
- `AppSession` models the current auth state

### API

`lib/core/api/api_client.dart` wraps `http.Client`.

- Requests send and receive JSON
- Server error messages are normalized into `ApiException`
- The UI shows the backend message verbatim when available

### Router

`lib/core/router/app_router.dart` owns the route tree and redirects.

- Public routes are accessible without auth
- Seller routes require seller or admin access
- Customer routes require customer access
- Admin routes require seller access with the admin role

## Shells

The shared shell widgets are in `lib/shared/widgets/`.

- `PublicShell` handles the landing page header and track-order shortcut
- `AuthShell` wraps login, register, and recovery screens
- `WorkspaceShell` wraps seller, customer, and admin workspace pages
- `AppearanceSection` is reused wherever the theme and language controls need to appear

## Current Feature Status

### Implemented

- Public landing page
- Seller login and registration
- Customer login, registration, and password recovery
- Theme and language controls
- Secure session restoration
- Role-aware navigation

### Scaffolded

- Seller dashboard and content pages
- Customer dashboard and content pages
- Admin dashboard and moderation pages
- Public store, checkout, invoice, and order tracking flows

These scaffolded areas use placeholder pages today so the routing and shell structure are stable while backend-backed screens are added.

## Extension Rules

When adding new feature work:

- Keep feature-specific widgets and state close to the feature folder
- Route through `GoRouter` instead of manual navigation logic
- Keep user-facing strings in ARB files
- Keep persistent preferences in `SharedPreferences`
- Keep tokens in secure storage
- Keep backend errors in `ApiException.message`

## Test Strategy

The current baseline test is a widget smoke test that proves the app boots and renders the Persian landing page.

Add more tests in the same style when new feature screens land:

- Widget tests for auth forms and navigation
- Repository tests for request mapping
- Golden tests for shell layout if UI complexity increases

