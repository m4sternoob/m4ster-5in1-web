# 5in1-web

The marketing and download site for **5IN1** — m4sternoob's native macOS game
app (Guessing Game, Snake, Snakes & Ladders, Ludo vs CPU, Tic-Tac-Toe vs CPU).

Built with Next.js (App Router) + TypeScript + Tailwind CSS.

## What's on the site

- **Hero** — "5IN1 — five games, one native macOS app"
- **Games** — showcase cards for all five games (features describe only what
  actually ships in the Mac app)
- **Download** — links to the GitHub releases page, with honest system
  requirements (macOS 14+, Apple Silicon) and a note about the ad-hoc signature
- **Roadmap** — timeline mirroring the phases in the app's `ROADMAP.md`
- **Tech** — SwiftUI, SpriteKit, zero dependencies, native macOS, offline
- **/play** — a playable Tic-Tac-Toe demo (you vs an unbeatable minimax CPU)

## Run it locally

Requires Node.js 18.18+ (20+ recommended).

```bash
cd 5in1-web
npm install
npm run dev      # dev server at http://localhost:3000
```

## Production build

```bash
npm run build    # must exit 0 — this is the only "it works" claim we make
npm run start    # serve the production build locally
```

## Deploy on Vercel

1. Push this folder to a GitHub repo (it is a standalone project root).
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework is auto-detected as Next.js — no settings to change.
4. No environment variables are needed. Deploy.

The site is fully static-friendly; no server secrets or config involved.

## Notes

- The `/play` demo is a web toy. The real games ship in the Mac app:
  https://github.com/m4sternoob/m4ster-5in1/releases
- Roadmap content mirrors `ROADMAP.md` in the
  [m4ster-5in1](https://github.com/m4sternoob/m4ster-5in1) repo.
  If the phases drift apart, the repo file is the source of truth.
- Contact: xyaz@gmail.com
