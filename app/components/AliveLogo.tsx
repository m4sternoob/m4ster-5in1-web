/* The M4STER-5IN1 brand mark — a designed vector monogram, alive.
   One continuous neon style: M4STER- in flowing script-like strokes,
   then the 5IN1 icon (5 → I → N → 1) with breathing room between letters.
   Custom vector paths, never plain text. It breathes forever via .logo-alive.
   Neon done right: a SOLID crisp core on top + a blurred halo behind it
   (like a real neon tube) — never a blurred core.
   Sizes are driven by CSS vars (--logo-nav-scale, --logo-hero-scale, --glow)
   set by the Customize toolbar and persisted to localStorage. */

const LOGO_PATH =
  "M 26 108 L 26 34 C 34 46, 42 58, 50 70 C 58 58, 66 46, 74 34 L 74 108 M 130 34 L 130 108 M 130 40 L 100 82 L 144 82 M 220 46 C 216 36, 206 31, 194 33 C 180 36, 178 47, 188 53 C 200 60, 216 66, 215 82 C 214 97, 200 107, 186 105 C 176 103, 169 99, 167 93 M 245 32 L 283 32 M 264 32 L 264 108 M 349 34 L 311 34 L 311 108 L 347 108 M 311 70 L 337 70 M 379 108 L 379 32 L 405 32 C 419 32, 419 64, 405 64 L 379 64 M 401 64 L 421 108 M 447 70 L 469 70 M 504 104 C 520 111, 538 106, 543 93 C 548 81, 538 71, 522 68 C 508 65, 499 59, 497 49 L 495 37 C 494.5 31, 497 28, 502 28 L 548 28 M 585 32 L 585 108 M 625 108 L 625 30 L 685 108 L 685 30 C 694 31, 701 36, 706 43 L 725 30 L 725 108 C 725 114, 718 117, 708 114";

const STROKE = {
  fill: "none",
  stroke: "url(#flow51)",
  strokeWidth: 9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export default function AliveLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  /* sm = navbar (~175% of the original mark), lg = hero (big, centered),
     md = footer. lg/halo read the toolbar's CSS vars. */
  const style: React.CSSProperties =
    size === "lg"
      ? { width: "calc(min(46vw, 42rem) * var(--logo-hero-scale, 2))" }
      : size === "sm"
        ? {
            height:
              "calc(clamp(1.75rem, 1.3rem + 3.5vw, 5.5rem) * var(--logo-nav-scale, 1))",
          }
        : { height: "clamp(2rem, 1.25rem + 4vw, 5.625rem)" };
  return (
    <svg
      viewBox="0 0 760 140"
      className="logo-alive neon-logo mx-auto block h-auto w-auto max-w-none"
      style={style}
      role="img"
      aria-label="M4STER-5IN1"
    >
      <defs>
        <linearGradient id="flow51" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        {/* Halo only — blur with no SourceGraphic, so the aura stays soft
            while the core below stays razor sharp. */}
        <filter id="halo51" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* Glow halo behind — intensity from the toolbar's --glow var */}
      <path
        d={LOGO_PATH}
        {...STROKE}
        filter="url(#halo51)"
        style={{ opacity: "calc(0.9 * var(--glow, 1))" }}
      />
      {/* Solid crisp core on top */}
      <path d={LOGO_PATH} {...STROKE} />
    </svg>
  );
}
