# 5IN1 Dev Log

Chronological record of everything shipped on this repo. Newest entries at the top.

---

## 2026-10-19 — The alive site day

### Separate game frames (portfolio style)
- Each of the 5 games now gets its own distinct showcase frame instead of uniform cards.
- Every frame has its own accent color, border, tinted background, glow shadow, index number (01-05), mini game-art SVG header, "Playable now" badge, and an accent-colored Play button.
- Snake green `#00e676`, Connect 4 amber `#ffb300`, Memory indigo `#818cf8`, Tic-Tac-Toe rose `#ff2d78`, Guessing cyan `#22d3ee`.
- New `.game-frame` class in `globals.css` (CSS-var driven accent, reduced-motion safe).
- Commit: `93663bf` — "feat: separate game frames like portfolio"

### Crisp logo strokes + hero logo 2.5x
- The SVG neon filter was blurring the actual stroke, making the logo look fuzzy. Fixed with two layers: a blurred copy underneath for the glow halo, and the same path with NO filter on top — solid crisp core, like a real neon tube. Applied to both `AliveLogo.tsx` and `public/logo.svg`.
- Hero logo is now ~2.5x the navbar logo (`w-[min(72vw,84rem)]`), centered, can never overflow.
- Commit: `fd167b5` — "fix: crisp logo core with glow halo, hero logo 2.5x"

### Navbar logo left, smaller hero logo
- Confirmed navbar logo is flush-left in code (earlier screenshots were a stale deploy).
- Hero `lg` logo shrunk from `w-[min(94vw,58rem)]` (was getting cut off on the right) to `w-[min(80vw,36rem)]`. Navbar `sm` size untouched.
- Commit: `c1a77f8` — "fix: navbar logo left, smaller hero logo"

### Hero centered and stacked
- Hero content was left-aligned. It is now a centered vertical stack: big M4STER-5IN1 logo on top, game cover banner directly below, CTAs after.
- Navbar logo moved to extreme left (removed `mx-auto max-w-6xl` container constraints).
- Root cause of the earlier left-shift: the old `lg` logo used height-clamp with `w-auto`, producing an SVG up to ~2600px wide, breaking centering. Switched to width-based sizing.
- Dropped the redundant "FIVE GAMES, EVERY PLATFORM" pill badge (duplicated the navbar tagline).
- Commit: `3cddf9c` — "fix: center hero content"

### Tauri package name fix
- Tauri Build run #2 failed: `src-tauri/Cargo.toml` declared `name = "6in1"`, which Cargo rejects — package names cannot start with a digit.
- Renamed to `m4ster-5in1`. Swept `tauri.conf.json`, `main.rs`, `build.rs` — zero other `6in1` references.
- Commit: `2b40e8d` — "fix: rename Tauri package 6in1 to m4ster-5in1"

### Back button visibility fix
- The new "All games" back button existed in the markup but was invisible on desktop: the 5x bigger logo made the fixed navbar ~133px tall, while game pages only had `pt-28` (112px) padding — the button rendered behind the navbar.
- Button is now `sticky top-[84px] md:top-[148px] z-40` — parks below the navbar, stays visible while scrolling. Game pages got `md:pt-10` to clear the taller navbar.
- Commit: `d838861` — "fix: back button visibility"

### Back button on all game pages
- Playing a game had no clear way back to the menu. The old "All games" text link was tiny muted `text-xs text-slate-500` — easy to miss.
- New shared `app/play/BackToGames.tsx`: a real pill button with alive styling (cyan border glow on hover), clear "All games" label, `min-h-[44px]` touch target, `aria-label="Back to all games"`, links to `/play`.
- Replaced the muted link in `GameShell.tsx` (covers Snake, Connect 4, Memory) and in the Tic-Tac-Toe and Guessing pages.
- Commit: `5205c69` — "feat: back button on all game pages"

### Menu button fix + game quality pass
- **Menu button:** it was always visible but the dropdown it toggled had `md:hidden` — clicking did nothing on desktop. Added `md:hidden` to the button itself so it only appears where the dropdown works.
- **Snake — full canvas rewrite** (was 400 DOM divs re-rendered per step): fixed-timestep logic + smoothstep-interpolated rendering on a single rAF loop, zero React re-renders per frame, DPR capped at 2x — comfortably 120fps on modern hardware, 60fps floor on mid-range.
- **Snake streak objectives:** every 3 foods in a row spawns a big golden bonus food (5x points, 8-point star, TTL ring timer ~10s). Streak counter in HUD with glow, "BONUS FOOD!" banner on spawn.
- **Snake juice:** gradient ribbon body with head-to-tail taper, glowing head with directional eyes, pulsing food, rotating golden diamond, eat particles, floating `+N` text, death shatter burst + screen shake, vignette.
- **Memory Match — real 3D card flips:** `perspective: 1200px`, `preserve-3d`, `rotateY(180deg)` 0.45s spring transition. The card physically turns over — no more instant icon swaps. Emoji faces replaced with 12 geometric neon glyphs (sharp at any size). Deal-in stagger, match pop + glow ring, mismatch shake, win message pops in.
- **Tic-Tac-Toe:** X draws stroke-by-stroke and O draws as an arc via SVG stroke-dashoffset animation. Glowing win strike-through. Cells bounce on press, winning cells pulse, entrance stagger.
- **Guessing:** "CORRECT!" slams in with 24-piece confetti burst; "OUT OF ATTEMPTS" for losses. Attempt history slides in per row, counters pop on change.
- **Connect 4:** tally counters pop on change.
- Shared CSS: `.score-pop`, `.streak-glow`, `.gameover-title` — all reduced-motion safe.
- Commit: `8be9e14` — "fix: menu button + game quality pass"

### M4STER-5IN1 logo with fixed spacing
- The 5IN1 letters were too tight (I and N merged into a 10px ligature, strokes touching). Now every letter breathes: 5→I 37px, I→N 40px, N→1 40px; M4STER- letters 23-30px apart.
- Added the "M4STER-" prefix as custom vector paths in the same neon style — full **M4STER-5IN1** wordmark, one gradient, one glow. Render-verified at all sizes.
- Applied everywhere via `AliveLogo`: navbar, hero, footer pick it up automatically. Favicon intentionally unchanged (simplified "5" glyph, readable at 16px).
- Commit: `5771e57` — "feat: M4STER-5IN1 logo with fixed spacing"

### Designed 5IN1 vector logo
- A real designed logo, not styled text. A single continuous flowing gesture 5 → I → N → 1 in the MT tracker logo style: thick 9px rounded strokes, custom vector paths, lavender `#e9d5ff` → cyan `#22d3ee` → indigo `#818cf8` gradient, SVG neon glow filter.
- Design iterations: v1 read as "5JN1" (I hooked like a J), v2–v3 read as "5UN1" (I downstroke + N upstroke formed a U). Fixed with an I+N ligature — shared bold vertical stem.
- Deliverables: `public/logo.svg` (master), `public/favicon.svg` (simplified), `app/components/AliveLogo.tsx` rewritten (keeps 5x clamp sizing and breathe animation), `app/layout.tsx` icons metadata, DESIGN_SYSTEM.md logo section updated.
- Known gap: `app/icon.png` and `favicon.ico` are binaries and can't be pushed via API — they still show old artwork. Need rendering from the new SVG + upload via the GitHub web UI.
- Commit: `ec91811` — "feat: designed 5IN1 vector logo"

### Live game-tile grid background
- Rewrote `TileGrid.tsx`: every tile now runs a live simplified mini-animation from one of the five 5IN1 games, assigned by a stable coordinate hash (no reshuffle on resize).
  - Snake: 4-segment ribbon slithering with sine-wave motion, head glow
  - Memory: two cards flipping (scaleX flip, cyan/indigo faces)
  - Tic-Tac-Toe: X draws with line-dash animation, O draws as an arc, alternating
  - Connect 4: disc drops with bounce easing, alternating cyan/amber
  - Guessing: digits 0–9 roll slot-machine style with crossfade
- Cursor interaction: tiles within 140px light up with cyan glow and their animation speeds up 2.6x; moving the cursor fires expanding ripple rings (max 6) that boost tiles as the ring passes.
- Always alive: tiles breathe at rest (~0.12 alpha sine pulse). Performance: single rAF loop, no `shadowBlur`, DPR capped at 1.5, low-intensity tiles skip drawing. Reduced-motion renders one frozen frame; touch devices get ambient only.
- Commit: `77d48e7` — "feat: live game-tile grid background"

### m4ster design system (RGB separators, scroll animations, orb cursor, neon logo)
- Commit: `682813b` — "feat: full m4ster design system — RGB separators, scroll animations, orb cursor, neon logo"

### Roadmap update
- v1.1 renamed "Feel & polish" → "Alive everywhere", rewritten to match reality (tile grid site-wide, 5x logo, banner reveal, direct download links, build fixes).
- v1.2 "Feel & polish" (planned) holds the old v1.1 game-feel items; v1.3 "Social & sharing" (planned).
- Commit: `60471e9` — "docs: update roadmap"

### 5x bigger logo, layout fixed
- All three logo sizes went 5x, fluid via `clamp()` so they stay bold on desktop without breaking mobile. Navbar and footer layouts hardened (shrink-0, whitespace-nowrap). Footer text logo replaced with `AliveLogo size="md"` (breathes like everywhere else).
- Commit: `b0a13b8` — "feat: 5x bigger logo, layout fixed"

### Alive background on all pages + footer
- Root layout renders `AuraBackground` + `TileGrid` — every page (`/`, `/play`, all 5 game pages) and the footer inherit them. One shared fixed instance, no duplication.
- Discrete tile grid replaced the radial-gradient GridGlow: visible 48px square tiles, each lighting up with cyan fill + brighter border as the cursor passes, fading back independently.
- Old `GridGlow.tsx` deleted.
- Hero banner bumped to `max-w-5xl` with a 1.2s cinematic scroll reveal (scale 0.92→1.0, fade, 48px upward drift, slow easing + subtle parallax).
- Fixed a stale "Get the 5IN1 Mac app" link on `/play` → "Get the 5IN1 app".
- Commits: `a73a9d4` — "feat: alive background on all pages + footer"; `de7a17d` — "chore: remove GridGlow, replaced by site-wide TileGrid"

### Build failure diagnosis and fixes
- **v1.0.0 released but shipped zero binaries.** Both tag-triggered workflows failed:
  - **Tauri Build run #1:** `npm ci` failed — package-lock.json was out of sync (missing the Capacitor 8.5.3 dependency tree). Fix: regenerated the lockfile with `npm install` locally and uploaded it via the GitHub web UI (270KB, over the 128KB API push cap).
  - **Capacitor Android run #1:** Capacitor CLI 8.5.3 requires Node >= 22; the workflow pinned Node 20. Fix: bumped `node-version` 20 → 22 in both workflows. Also switched the Capacitor workflow from `npm install` to `npm ci` now that the lockfile exists.
- **Run #2 (after those fixes) failed again** with two new root causes:
  - Capacitor Android: Gradle needs Java 21, workflow installed Java 17 ("invalid source release: 21"). Fix: `java-version` 17 → 21 in `capacitor-android.yml` (requires browser edit — GitHub API returns 403 on `.github/workflows/`).
  - Tauri Build: fixed by the Cargo.toml rename above (`2b40e8d`).
- Commits: `8788c1e` — "fix: sync package-lock.json with Capacitor 8.5.3 deps"; `8e2ed97` — "fix: Node 22 for Capacitor CLI"; `fc7209e` — "fix: Node 22 for Tauri build"
- **Open:** Capacitor Java 21 edit + manual re-run of both workflows via workflow_dispatch. Then the `.exe`/`.dmg`/`.apk` artifacts attach to the release, and the Download section buttons link directly to the files instead of the releases page.

---

## 2026-10-18 — The consolidation day

### v1.0.0 released
- Released on tag `v1.0.0` (commit `8a503f0`), the first release from the consolidated main repo.
- Shipped with zero binaries (both build workflows failed — see 2026-10-19 fixes above).

### Gameplay GIFs + alive README
- Captured 5 real gameplay GIFs via Playwright, uploaded to `docs/gifs/`.
- README rewritten: alive styling, 5 games, platform badges/matrix, architecture.
- Commits: `38468a6` — "docs: alive README with gameplay GIFs"; `d847f5e` — "docs: add gameplay GIFs"

### One-codebase-all-platforms README + branding fixes
- README documents the universal pipeline. Tauri and Capacitor workflows fixed to say 5IN1 branding.
- Commits: `63bbabd` — "docs: one-codebase-all-platforms README"; `62f8346`, `e2036e2` — "fix: 5IN1 branding in Tauri/Capacitor workflow"

### 6IN1 → 5IN1 rebrand
- Repo renamed back from 6IN1 to 5IN1 everywhere: Tauri identifier `com.m4ster.6in1` → `com.m4ster.5in1`. Zero 6IN1 references remain.
- Commit: `74578b7` — "fix: rebrand 6IN1 → 5IN1 everywhere"

### Game list finalization — 5 games only
- Removed 2048, Snakes & Ladders, Ludo. Final list: Snake, Connect 4, Memory Match, Tic-Tac-Toe, Number Guessing.
- Live on `/play` with routes: snake, connect4, memory, tictactoe, guessing.
- Commits: `34fa79f` and siblings — "feat: remove 2048, Snakes & Ladders, Ludo — 5 games"

### Cover banners
- Generated `public/og-image.png` (1200×630) + `public/hero-banner.png` (2352×1008): dark, cyan glow, 5-game motifs. Wired into OG/Twitter meta, README hero, Hero section, `/play` hub header.
- Commits: `b276742` — "feat: 5IN1 cover banner everywhere"; `c053b0d` — "feat: add 5IN1 cover banners"

### Download section alive
- Contrast and animations fixed across the Download section.
- Commit: `499b434` — "fix: Download section alive — contrast, animations, glow"

### Whole-site alive overhaul
- The site was stale: hero said "Native macOS app / SwiftUI + SpriteKit", emoji game icons, footer linked to a private repo, Download said 6IN1. Fixed hero, games, download, navbar, footer, roadmap, techstack, site.ts. Contrast verified ~11:1 body, ~7:1 secondary.

### Capacitor merged (PR #10)
- One codebase, all platforms — mobile half. `capacitor.config.ts` (appId `com.m4ster.sixinone`), `@capacitor/*` 8.5.3, android/ios shells generated in CI (gitignored). `.github/workflows/capacitor-android.yml` created via browser (API returns 403 on `.github/workflows/`). package-lock.json deliberately not committed at the time (270KB over push cap) — the workflow used `npm install` instead.
- Commits: `a4718ca` (PR #10 merge), `d5653af` — "feat: Capacitor config", `00a476b` — "feat: Capacitor Android build workflow for GitHub Actions", `a962bf0` — "chore: gitignore Capacitor native shells (generated in CI)", `d7fb6b4` — "feat: add @capacitor/core, cli, android, ios dependencies"

### Connect 4 win celebration fix
- Win showed flat text only. Fixed: 130-particle canvas confetti from measured disc positions, sequential disc pops (130ms stagger, 1.45x), accurate glowing win line, big glowing "YOU WIN!" banner. The old confetti was 30 invisible DOM spans.
- Commits: `09f940e` — "feat: juicy Connect 4 animations"; `df927d4` — "fix: Connect 4 win celebration actually fires"; `63c5cae` — "fix: Connect 4 win celebration types"

### Snake overhaul
- Canvas rewrite: smooth glide interpolation, gradient tapered body, glowing head with directional eyes, food particles, death shatter + screen shake, golden food diamond with sparkles. Rules unchanged.
- Commit: `0684d86` — "feat: high-quality 2D Snake with juicy animations"

### DESIGN_SYSTEM.md
- Single source of truth: ink `#0b0e14`, panel `#12161f`, edge `#232a38`, arcade `#22d3ee`, arcade-dim `#0e7490`, text `#e8ecf3`, secondary `#94a3b8`, indigo `#818cf8`, shimmer `#a5f3fc`; Geist Sans; logo-breathe 3.2s, gradient-pan 5s, pop-in 0.7s spring, aura 18s/24s.
- Commit: `39dac1c` — "docs: 6IN1 cross-platform design system"

### Mouse-reactive grid background
- First version of the alive background: canvas overlay in the hero, cursor leaves a pulsing cyan→indigo glow trail (900ms fade, reduced-motion + hover:none respected).
- Commit: `0b48934` — "feat: mouse-reactive alive grid background"

### Tauri merged (PR #9)
- Desktop half of the one-codebase pipeline: static export, `src-tauri/` (app name 5IN1, window 1280×800), 5 binary icons uploaded via browser, `.github/workflows/tauri-build.yml` (windows-latest + macos-latest, tauri-action@v0).
- Note: the workflow used `releaseDraft: true` — combined with the failed builds, this contributed to v1.0.0 shipping with no binaries.
- Commits: `8f03fca` (PR #9 merge), `b8e07ef` — "Add Tauri build workflow for GitHub Actions", `98f2c6a` and siblings — "feat: Tauri desktop builds for Windows and macOS", `3f4935f` — binary icons via browser upload

### Windows download card
- Download section now has macOS + Android + Windows cards (3-column grid), each linking to the releases page.
- Commit: `3e7d945` — "feat: add Windows download card, rebrand to 6IN1"

---

## The universal app pipeline (standing rule)

One codebase, all 5 platforms, one-to-one identical. Change once, push everywhere:
- Web → Vercel (auto-deploy)
- Windows `.exe` + Mac `.dmg` → Tauri (on v* release tag)
- Android `.apk` + iOS `.ipa` → Capacitor (on v* release tag)

Applies to 5IN1 and every future app. No separate native codebases.

## Design rules (standing)

- **Alive, not static:** breathing logo, staggered pop-in entrances, living aura backgrounds, shimmer. Glow stays subtle and slow — never distracting from the work.
- **Same UI everywhere:** web, Android, Windows, Mac — one design language.
- **Logos are designed, not typed:** vector monograms with custom paths, never plain text.
- **RGB separators:** every separator line is an animated flowing rainbow gradient, with on/off + speed + breathing controls.
- **Performance:** 60fps minimum, 120fps target. Canvas over DOM for game loops, fixed-timestep logic, DPR caps, no layout thrash.
- **Accessibility:** `prefers-reduced-motion` respected everywhere, touch targets ≥ 44px, touch devices get ambient-only animations.
