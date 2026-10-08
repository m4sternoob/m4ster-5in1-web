# 5IN1 — Web Companion

Marketing and download site for **5IN1** — the five-games-in-one native macOS app
(Guessing Game, Snake, Snakes & Ladders, Ludo vs CPU, Tic-Tac-Toe vs CPU), with
download links for the Android builds as well.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

## What's on the site

- **Hero** — "5IN1 — five games, one native macOS app"
- **Games** — cards for all five games; features describe only what actually ships
  in the Mac app
- **Download** — macOS + Android releases, honest system requirements (macOS 14+,
  Apple Silicon), and a note about the ad-hoc signature
- **Roadmap** — timeline that mirrors `ROADMAP.md` in the Mac app repo
- **Tech** — SwiftUI, SpriteKit, zero dependencies, native macOS, offline
- **/play** — a playable Tic-Tac-Toe demo: you vs an unbeatable minimax CPU
  (a web toy, not the real game)

## Run it locally

Requires Node.js 20.9+.

```bash
npm install
npm run dev      # dev server at http://localhost:3000
```

## Production build

```bash
npm run build    # must exit 0 — this is the only "it works" claim we make
npm run start    # serve the production build locally
npm run lint     # ESLint with the Next.js ruleset
```

## Deploy on Vercel

1. In Vercel: **Add New → Project → Import** this repo.
2. The framework preset is detected as Next.js — no settings to change.
3. No environment variables needed. Deploy.

No server secrets or env config involved.

## Notes

- The `/play` demo is a web toy. The real games ship in the Mac app:
  https://github.com/m4sternoob/m4ster-5in1/releases
- Roadmap content mirrors `ROADMAP.md` in
  [m4ster-5in1](https://github.com/m4sternoob/m4ster-5in1).
  If the two drift apart, the repo file is the source of truth.
- License: MIT (see `LICENSE`).
- Contact: masternoob102030@gmail.com
