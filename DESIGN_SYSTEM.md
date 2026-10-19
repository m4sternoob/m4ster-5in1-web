# 5IN1 Cross-Platform Design System

**Version:** 1.0 — 2026-10-18
**Status:** SINGLE SOURCE OF TRUTH. Every platform (web, Android, Windows, Mac, iOS) must match this spec exactly. Fortnite-level parity: a user should not be able to tell which platform they're on from the UI alone.

---

## 1. Color Tokens

All colors are exact. No approximations.

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#0b0e14` | Page/app background. Everything sits on this. |
| `panel` | `#12161f` | Cards, panels, game shells. |
| `edge` | `#232a38` | Borders, dividers. |
| `arcade` | `#22d3ee` | **Primary accent (cyan).** Logo glow, buttons, active states, links. |
| `arcade-dim` | `#0e7490` | Muted accent for secondary elements. |
| `text-primary` | `#e8ecf3` | Body text. |
| `text-secondary` | `#94a3b8` (slate-400) | Taglines, muted descriptions. |
| `indigo-glow` | `#818cf8` | Secondary glow color (aura blobs, shimmer gradient). |
| `shimmer-light` | `#a5f3fc` | Brightest point of the shimmer gradient. |

### Derived / Alpha Values

- Logo glow halo: `drop-shadow(0 0 6px rgb(34 211 238 / 0.55))` + `drop-shadow(0 0 22px rgb(34 211 238 / 0.25))` at rest; `drop-shadow(0 0 10px rgb(34 211 238 / 0.9))` + `drop-shadow(0 0 34px rgb(34 211 238 / 0.45))` at peak.
- Aura blob A: `radial-gradient(circle, rgb(34 211 238 / 0.16), transparent 65%)`
- Aura blob B: `radial-gradient(circle, rgb(129 140 248 / 0.14), transparent 65%)`
- Aura blob C: `radial-gradient(circle, rgb(34 211 238 / 0.10), transparent 65%)`
- Hero grid lines: `rgb(34 211 238 / 0.06)`, 1px, 44px spacing.
- Card hover border: `rgb(34 211 238 / 0.6)`
- Card hover glow: `0 0 24px rgb(34 211 238 / 0.18)` + `0 12px 32px rgb(0 0 0 / 0.45)`
- Button hover glow: `0 0 18px rgb(34 211 238 / 0.45)`
- Shimmer sweep: `rgb(255 255 255 / 0.08)` band on loading skeletons.

---

## 2. Typography

- **Font:** Geist Sans (`var(--font-geist-sans)`), fallback `ui-sans-serif, system-ui, sans-serif`. Dark-first; `color-scheme: dark`.
- **Logo:** `font-extrabold`, `tracking-tight`. Sizes: `text-4xl sm:text-5xl` (nav), `text-7xl sm:text-8xl` (hero), `text-xl` (compact).
- **Logo text treatment:** `5<span shimmer>IN</span>1` — "5" and "1" in solid white, "IN" in animated shimmer gradient.
- **Section headings:** eyebrow (small caps accent), title (bold, large), blurb (secondary text).
- **Game cards:** title `text-lg font-bold text-white`; tagline `text-sm` secondary; feature list `text-sm` with `▸` accent markers.
- **Buttons:** `font-semibold`, no uppercase.

---

## 3. The Alive Animation System

Every animation below runs on loop or on mount. **Static = dead. Never ship a static screen.**

### 3.1 Living Logo (`logo-breathe`)
```css
@keyframes logo-breathe {
  0%, 100% { transform: scale(1);
    filter: drop-shadow(0 0 6px rgb(34 211 238 / 0.55))
            drop-shadow(0 0 22px rgb(34 211 238 / 0.25)); }
  50% { transform: scale(1.06);
    filter: drop-shadow(0 0 10px rgb(34 211 238 / 0.9))
            drop-shadow(0 0 34px rgb(34 211 238 / 0.45)); }
}
.logo-alive { animation: logo-breathe 3.2s ease-in-out infinite; }
```
The logo breathes forever — 3.2s cycle, 6% scale pulse, glow halo swells. **Native equivalent:** scale 1.0→1.06 + outer glow alpha 0.25→0.45, 3200ms, ease-in-out, infinite.

### 3.2 Shimmer Text (`gradient-pan`)
```css
.text-shimmer {
  background: linear-gradient(110deg, #22d3ee 20%, #a5f3fc 40%, #818cf8 60%, #22d3ee 80%);
  background-size: 220% auto;
  animation: gradient-pan 5s ease-in-out infinite;
}
```
5s sweep across the "IN". **Native:** animate gradient offset 0%→100%→0% over 5000ms.

### 3.3 Staggered Pop-In Entrances (`pop-in`)
```css
@keyframes pop-in {
  0%   { opacity: 0; transform: translateY(26px) scale(0.94); }
  55%  { opacity: 1; transform: translateY(-4px) scale(1.015); }
  75%  { transform: translateY(2px) scale(0.997); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.pop-in { animation: pop-in 0.7s cubic-bezier(0.22, 1.4, 0.36, 1) forwards;
          animation-delay: var(--pop-delay, 0ms); }
```
Springy bounce on mount. **Stagger:** hero lines cascade 0→520ms, game cards 90ms apart, play-hub cards 70ms apart. **Native:** spring damping ~0.7, 700ms, per-item delay.

### 3.4 Living Aura Background (`aura-drift`)
Three fixed blurred blobs behind all content:
- Blob A: 46vmax, cyan 0.16 alpha, top-left — drifts 18s loop (`aura-drift-a`: translate ±6vw/±5vh, scale 0.92–1.15)
- Blob B: 40vmax, indigo 0.14 alpha, right-center — drifts 24s loop (`aura-drift-b`)
- Blob C: 36vmax, cyan 0.10 alpha, bottom — 18s loop
- `filter: blur(90px)`, `border-radius: 9999px`, `pointer-events: none`

**Native:** 3 large radial-gradient circles, blur ~90px, slow sinusoidal drift on independent 18s/24s loops.

### 3.5 Buttons (`btn-alive`)
- Hover: `translateY(-2px) scale(1.03)` + `0 0 18px rgb(34 211 238 / 0.45)` glow (150–200ms)
- Active/press: `translateY(1px) scale(0.97)` + reduced glow
- **Native:** press-down scale to 0.97 with haptic-feeling snap; glow on focus.

### 3.6 Game Cards (`card-alive`)
- Rest: `rounded-2xl` (16px), `border: 1px solid #232a38`, `background: #12161f`, `padding: 24px`
- Hover: `translateY(-6px) scale(1.02)`, border → `rgb(34 211 238 / 0.6)`, shadow `0 12px 32px rgb(0 0 0 / 0.45)` + `0 0 24px rgb(34 211 238 / 0.18)` (250ms spring)
- **Native:** same lift + border-glow on press/focus.

### 3.7 Loading Shimmer
Diagonal white sweep (`rgb(255 255 255 / 0.08)`) across skeleton placeholders, 1.8s loop.

### 3.8 Gentle Float
Decorative elements: `translateY(0 → -10px)`, 5s ease-in-out infinite.

### 3.9 Ludo Game Animations
- Token glide: 220ms ease between cells (never teleport)
- Landing hop: 280ms (scale 1 → 1.25 → 1, y-offset bounce)
- Movable-token ring: pulsing glow `1.1s` infinite
- Capture poof: 350ms scale-up fade
- Dice shake: 280ms rotation wobble while rolling
- Win: confetti rain + banner pop (550ms spring)

### 3.10 Accessibility
`prefers-reduced-motion: reduce` disables all loops; pop-ins render at final state.

---

## 4. Component Patterns

### Game Card
```
rounded-2xl | bg #12161f | border 1px #232a38 | padding 24px
[icon 40px] → title (lg bold white) → tagline (sm secondary) → feature list (sm, ▸ markers)
+ card-alive hover behavior
```

### Primary Button
```
bg #22d3ee | text #0b0e14 | font-semibold | rounded-xl (12px) | padding 12px 24px
+ btn-alive press/glow behavior
```

### Game Shell (every /play page)
```
AuraBackground (fixed) → centered max-w container → game title (pop-in) → board/canvas → controls
```

### Page Layout
```
bg #0b0e14 → AuraBackground fixed -z-10 → hero-grid subtle backdrop (44px, masked radial)
→ content max-w-6xl centered → sections py-20/28
```

---

## 5. Spacing, Radius, Shadows

| Token | Value |
|---|---|
| Card radius | 16px (`rounded-2xl`) |
| Button radius | 12px (`rounded-xl`) |
| Pill radius | 9999px |
| Card padding | 24px |
| Section padding | 80px desktop / 112px large |
| Content max-width | 1152px (`max-w-6xl`) |
| Grid gap (cards) | 24px |
| Card hover shadow | `0 12px 32px rgb(0 0 0 / 0.45)` |
| Glow shadow (accent) | `0 0 24px rgb(34 211 238 / 0.18)` |

---

## 6. Platform Mapping Notes

| Web (CSS) | Android (Compose) | Notes |
|---|---|---|
| `logo-breathe` 3.2s | `infiniteRepeatable(tween(3200ms, EaseInOut), scale 1→1.06 + glow)` | Draw glow via `shadow` with accent color |
| `pop-in` spring | `AnimatedVisibility` + `spring(dampingRatio=0.7)` | Stagger with `delay()` per index |
| `aura-blob` blur 90px | 3 `Box` with radial gradient + `blur(90.dp)` | Animate offset with infinite transition |
| `btn-alive` | `scale` on `interactionSource` press | 0.97 press, glow via shadow |
| `card-alive` | Same on cards | Lift -6dp, border color animate |
| `#0b0e14` etc. | `Color(0xFF0B0E14)` etc. | Exact hex, no approximations |

Windows (Tauri) and macOS (Tauri) render the same web build — parity is automatic.

---

*End of spec. When in doubt, open https://m4ster-5in1.vercel.app and match what you see.*
