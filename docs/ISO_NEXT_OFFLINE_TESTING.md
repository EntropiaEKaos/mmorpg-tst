# ISO Next — Offline visual testing

This environment is designed to validate the built Mor'ia ISO Next client without Vercel or any production service. It serves the already-built Vite `dist` locally and opens the isolated `/prototype/isometric` route in headless Chromium.

## One-time prerequisites

```bash
npm ci
npx playwright install chromium
```

## Full local gate

```bash
npm run build
node scripts/iso-next-offline.mjs
```

The runner starts `npm run preview` bound only to `127.0.0.1`, waits for readiness, then validates the ISO route at desktop 1440x900 and narrow 430x932 viewports.

## Evidence

Successful execution creates:

- `docs/screenshots/iso-next/iso-next-eldoria-day.png`
- `docs/screenshots/iso-next/iso-next-eldoria-narrow.png`
- `docs/screenshots/iso-next/offline-report.json`

The report fails the process when Chromium emits a console error or uncaught page error, or when the Pixi canvas does not become visible.

## Scope

This is a presentation/browser gate. It does not replace server regression, security, load, migration or authoritative-gameplay certification. The prototype fixture remains presentation-only.

## Recommended clean-room command

```bash
rm -rf node_modules dist
npm ci
npm audit
npm run typecheck
npm run build
npx playwright install chromium
node scripts/iso-next-offline.mjs
```

On Windows PowerShell, remove `node_modules` and `dist` with the platform equivalent before running the remaining commands.
