"""Model package.

Import concrete model modules directly where metadata population is needed.
This package intentionally avoids eager cross-imports to prevent circular
imports during app startup and test collection.
"""

