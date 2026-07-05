# Internal Worklog

This file is for implementation notes, decisions, and follow-up items. It is intentionally short and operational.

## Current decisions

- Documentation is English.
- The UI is Persian-only and RTL.
- Production documentation assumes Docker Compose on a Linux VPS.
- The committed Dockerfiles are development defaults; production should override the runtime commands.

## Entries

### June 21, 2026

- Refreshed `README.md` into the canonical project entrypoint.
- Added `docs/PRODUCTION_DEPLOYMENT.md` for VPS deployment and production operations.
- Cleaned the demo and migration docs so they match the current app and do not contain broken mojibake.
- Documented the current Docker Compose layout, env vars, routes, and production caveats.
- Began the Flutter implementation pass by reviewing `docs/FLUTTER_IMPLEMENTATION_GUIDE.md`, `docs/FLUTTER_ARCHITECTURE.md`, `docs/FLUTTER_API_REFERENCE.md`, and `docs/FLUTTER_QUICKSTART.md`.
- Confirmed there is no existing `nisha_flutter/` workspace yet and mapped the current backend API groups for public, customer, seller, admin, auth, uploads, checkout, invoice, and order tracking flows.
- Checked that the local environment has Flutter and Dart available on `PATH` before attempting to scaffold the mobile app.
- Created the `nisha_flutter/` workspace with `flutter create --no-pub` after requesting elevated access because Flutter needed to write SDK cache files outside the repo.
- Replaced the generated Flutter placeholder README with a mobile-specific README that points back to the shared docs and describes the Persian-first app shell.
- Added the first Flutter app foundation: purple-black theme tokens, locale and theme controllers, secure session storage, HTTP API helpers, the public shell, auth shell, workspace shell, and a Persian-first landing page.
- Added localized ARB source files for English and Persian, then moved the generated localization output into `lib/l10n/` after Flutter rejected the old synthetic-package mode.
- Added a widget smoke test for the landing page and set up mocked preferences / secure storage for test execution.
- Offline package resolution succeeded with the cached Flutter dependencies. Analyzer and test runs still need a follow-up pass because the first attempts timed out in this environment.
- Fixed the auth presentation import depth so the Flutter pages resolve `lib/core`, `lib/shared`, and `lib/features/auth/models` correctly from `lib/features/auth/presentation/*`.
- Updated the theme setup to use `CardThemeData`, matching the current Flutter SDK API.
- Re-ran focused import scans after the patch. Full analyzer / test commands still time out in this environment, so the remaining verification gap is environmental rather than a known syntax issue.
- Switched verification to the direct Dart SDK binary plus `flutter_tools.dart` to avoid the hanging wrapper scripts. The stock `flutter` wrapper still hangs here because it cannot access the SDK cache lockfile, but `flutter_tools.dart analyze lib test` and the widget smoke test both pass after suppressing analytics and allowing the Flutter SDK cache lockfile write.
- Ran `dart format` across the Flutter sources and test file; the formatter made only style and import-order changes.
- Rewrote the Flutter docs to match the implemented `nisha_flutter/` workspace: implementation guide, architecture, API reference, quick start, and a new release guide.
- Updated the root README and mobile README to link the Flutter docs and point readers at the mobile workspace directly.
- Verified the rewritten docs have no mojibake in `docs/` and that all new Flutter doc links resolve to real files.
- Re-ran `flutter_tools.dart analyze lib test` and `flutter_tools.dart test --no-pub test/widget_test.dart` after the doc rewrite; both passed with analytics suppressed.

## Update template

When making future implementation changes, append a new dated entry with:

- What changed
- Which files changed
- Commands or checks run
- Follow-up items
