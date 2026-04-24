# QR Forever

Beautiful QR codes that never expire.

## Why this exists

Most online QR generators create "trackable" QR codes that route through a shortener service. If that service shuts down, rebrands, or paywalls your account — **every QR code you ever printed becomes garbage**. Not great when you've already stapled them to a hundred flyers.

QR Forever takes the opposite approach. The QR code encodes your destination URL *directly*. There is no redirect, no database, no account, no middleman. As long as your destination URL works, your QR works. Print it on anything.

## Features

- **Direct encoding** — no third-party redirect, ever
- **Multiple formats** — transparent PNG (black or white dots), SVG (vector), high-res PNG (1024px, 2048px)
- **Preset styles** — classic, transparent, inverted, dots, warm, sage, indigo
- **Fine-tune** — colors, dot shapes, corner styles, error correction, margin
- **Center logo** — upload an image, adjust size, hide dots behind it
- **Free** — hosted on Vercel, runs entirely in your browser

## Local development

```bash
npm install
npm run dev
```

## Deploy

Pushes to `main` auto-deploy via Vercel.

## Tech

- Next.js 16 (App Router, Turbopack)
- TypeScript + Tailwind CSS
- `qr-code-styling` — client-side QR generation (no server round-trips)

## Roadmap

- [ ] Phase 2 — optional tracked-link mode (opt-in, uses Vercel Postgres for click analytics)
- [ ] Batch generation (CSV in → ZIP out)
- [ ] Preset library saved locally
- [ ] Print-preview with physical-scale overlay

Built in the Claude Sandbox. Owned by [@texastentialism](https://github.com/texastentialism).
