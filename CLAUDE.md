# CLAUDE.md

Guidance for working in this repo.

## Versioning

The app version is tracked in **`app.config.js`** (`expo.version`) and **`package.json`** (`version`). These two must always match.

When asked to bump the version:

1. Increase the version (default: patch bump, e.g. `1.0.5` → `1.0.6`) in both `app.config.js` and `package.json`.
2. Update the **Status** section in `README.md` so the "currently in development" version matches the new version in `app.config.js` / `package.json`.
3. The "live on the App Store" line in the README Status section is updated separately — only when a build actually ships to the App Store, not on every bump.

Keep `app.config.js`, `package.json`, and the README Status section in sync.
