# Testing

## What we test and why

The product has one sacred guarantee: **the QR code actually encodes the URL we say it does, and a phone can scan it**. Everything else is decoration.

Tests are organized to reflect that priority.

## `tests/qr-roundtrip.spec.ts` — the only test that really matters

Generates a QR in the browser, downloads the PNG, decodes it with `jsqr`, and asserts the decoded URL matches the URL the user typed. If this test passes, the product works. If it fails, ship nothing.

Covers:
- Multiple test URLs (short, long, with query strings)
- PNG 1024 (web format)
- PNG 2048 (print format)
- Transparent PNG (with alpha-over-white compositing before decode)

## `tests/smoke.spec.ts` — production-readiness sanity checks

- Page loads with zero console errors
- All presets click and update the preview
- URL validation behaves (valid → green check, invalid → "incomplete")
- OpenGraph image route returns a real PNG
- Favicon route returns SVG
- Mobile viewport renders without broken controls

## Running tests

```bash
# Install browsers once (first time only)
npx playwright install --with-deps chromium webkit

# Run all tests against local dev
npm run test

# Run against production
TEST_BASE_URL=https://qr-forever-delta.vercel.app npm run test

# Run just the roundtrip (fastest way to validate "does it work")
npm run test tests/qr-roundtrip.spec.ts
```

## Pre-merge checklist (humans)

Before merging a PR that changes generator logic or layout:

1. `npm run build` — passes
2. `npm run test` — all green
3. **Physical scan test** — download a PNG, open on phone (iOS Camera and Google Lens both), confirm it resolves to the right URL
4. **Print preview** — print at postcard size (4×6") and scan from 30cm — still works
5. **iMessage preview** — send the site link to yourself on iMessage; OG card renders
6. **Lighthouse** — mobile score > 90 on Performance, Accessibility, SEO

## Why not unit tests?

There's one real unit here — the QR library. It's already battle-tested (millions of installs, years of use). A unit test for our wrapper would re-test the library, which buys nothing. The roundtrip test validates the actual integration, which is what matters.

When we add more business logic (Phase 2 shortened links, click analytics), unit tests become worth it.
