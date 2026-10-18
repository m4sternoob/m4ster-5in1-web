# 6IN1

Six games, one codebase, every platform. This is the main 6IN1 repo —
the web app here is the single source of truth for UI and game logic,
and every native build ships from it.

## One codebase, all platforms

| Platform | How | Output |
|---|---|---|
| Web | Next.js static export, deployed on Vercel | https://m4ster-5in1.vercel.app |
| Windows | Tauri desktop shell around the same build | `.exe` installer |
| macOS | Tauri desktop shell around the same build | `.dmg` |
| Android | Capacitor wraps the same build in a native WebView | `.apk` |
| iOS | Capacitor wraps the same build in a native WebView | `.ipa` |

Change one thing, push once, and it lands everywhere — same UI,
same animations, same effects, one-to-one across all platforms.
`DESIGN_SYSTEM.md` is the visual contract every shell must honor.

## The games

Guessing, Ludo, Tic-Tac-Toe, Memory Match, 2048, Minesweeper —
all playable in the browser at `/play`, all offline-first.

## Run it locally

Requires Node.js 20+.

```bash
npm install
npm run dev      # dev server at http://localhost:3000
```

## Production build

```bash
npm run build    # static export to out/ — must exit 0
```

## Mobile shells (Capacitor)

The native shells are generated from `capacitor.config.ts` — they are not
committed (see `.gitignore`). To work on them locally:

```bash
npx cap add android      # scaffold the Android shell (once)
npx cap sync             # copy the web build into android/ and ios/
npx cap open android     # open in Android Studio
npx cap open ios         # open in Xcode (Mac only)
```

Android APKs build automatically on `v*` tags via
`.github/workflows/capacitor-android.yml`. iOS builds need a Mac runner.

## Desktop shells (Tauri)

The `src-tauri/` project wraps the same `out/` build. Windows `.exe`
and macOS `.dmg` build automatically on `v*` tags via
`.github/workflows/tauri-build.yml`.

## Deploy on Vercel

Push to `main` — auto-deploys. No environment variables needed.

Contact: xyaz@gmail.com
