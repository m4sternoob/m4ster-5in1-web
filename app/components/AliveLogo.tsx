/* The M4ster-5IN1 brand mark — a designed vector monogram, alive.
   One continuous neon style: M4STER- in flowing script-like strokes,
   then the M4ster-5IN1 icon (5 → I → N → 1) with breathing room between letters.
   Custom vector paths, never plain text. It breathes forever via .logo-alive.
   Sticker style: a SOLID black outline (16px) sits under every letter,
   the crisp neon core (9px) on top, and a blurred halo behind everything.
   Sizes are fluid via clamp() — the navbar mark stays compact, the hero
   stays big. Hover kicks the wrapper (.logo-hover) so it never fights
   the breathing animation on the svg itself. */

const LOGO_PATH =
  "M 26 108 L 26 34 C 34 46, 42 58, 50 70 C 58 58, 66 46, 74 34 L 74 108 M 130 34 L 130 108 M 130 40 L 100 82 L 144 82 M 220 46 C 216 36, 206 31, 194 33 C 180 36, 178 47, 188 53 C 200 60, 216 66, 215 82 C 214 97, 200 107, 186 105 C 176 103, 169 99, 167 93 M 245 32 L 283 32 M 264 32 L 264 108 M 349 34 L 311 34 L 311 108 L 347 108 M 311 70 L 337 70 M 379 108 L 379 32 L 405 32 C 419 32, 419 64, 405 64 L 379 64 M 401 64 L 421 108 M 447 70 L 469 70 M 504 104 C 520 111, 538 106, 543 93 C 548 81, 538 71, 522 68 C 508 65, 499 59, 497 49 L 495 37 C 494.5 31, 497 28, 502 28 L 548 28 M 585 32 L 585 108 M 625 108 L 625 30 L 685 108 L 685 30 C 694 31, 701 36, 706 43 L 725 30 L 725 108 C 725 114, 718 117, 708 114";

const STROKE = {
  fill: "none",
  stroke: "url(#flow51)",
  strokeWidth: 9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* Sticker outline — thick black under every letter so the neon pops. */
const OUTLINE = {
  fill: "none",
  stroke: "#000000",
  strokeWidth: 16,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* Shared defs/paths for a cropped mark — gradient + filter ids are
   suffixed so multiple cropped instances never collide in the DOM. */
function markDefs(gradientId: string, filterId: string) {
  return (
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#e9d5ff" />
        <stop offset="0.5" stopColor="#22d3ee" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
      {/* Halo only — blur with no SourceGraphic, so the aura stays soft
          while the core below stays razor sharp. */}
      <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  );
}

function markPaths(gradientId: string, filterId: string) {
  return (
    <>
      {/* Glow halo behind everything */}
      <path
        d={LOGO_PATH}
        {...STROKE}
        stroke={`url(#${gradientId})`}
        filter={`url(#${filterId})`}
        style={{ opacity: "calc(0.9 * var(--glow, 1))" }}
      />
      {/* Black sticker outline under every letter */}
      <path d={LOGO_PATH} {...OUTLINE} />
      {/* Solid crisp neon core on top */}
      <path d={LOGO_PATH} {...STROKE} stroke={`url(#${gradientId})`} />
    </>
  );
}

/* Crops of the full wordmark — "M4STER" is x 10–435, "M4ster-5IN1" is x 480–740
   (path coords plus outline margin). */
const STACK_TOP_VIEWBOX = "10 0 425 140";
const STACK_BOTTOM_VIEWBOX = "480 0 260 140";

export default function AliveLogo({
  size = "md",
  stacked = false,
}: {
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
}) {
  /* lg is the hero mark: ~2.5x the navbar logo, width-based (never wider
     than the viewport) so it always centers instead of overflowing;
     sm is the compact navbar mark; md is the footer mark. */
  /* Sizes read the Customize toolbar CSS vars so the sliders work:
     --logo-nav-scale (sm) and --logo-hero-scale (lg), 1 = 100%. */
  const cls =
    size === "lg" ? "h-auto" : size === "sm" ? "w-auto" : "h-[clamp(2rem,1.25rem+4vw,5.625rem)] w-auto";
  const varStyle =
    size === "lg"
      ? { width: "min(72vw, 56rem)" } /* base fits the hero's max-w-4xl parent;
        live scaling is via transform: scale(var(--logo-hero-scale)) on the
        Hero link wrapper (width scaling is clamped by the parent) */
      : size === "sm"
        ? { height: "calc(clamp(1.125rem, 0.875rem + 1.5vw, 2.5rem) * var(--logo-nav-scale, 1))" }
        : undefined;
  if (stacked) {
    /* Mobile navbar: two-line stack — "M4STER" over "M4ster-5IN1", each a crop
       of the same vector wordmark so the design language is identical. */
    return (
      <span className="logo-hover mx-auto inline-flex max-w-full flex-col items-center gap-1">
        <svg
          viewBox={STACK_TOP_VIEWBOX}
          className={`logo-alive neon-logo ${cls}`}
          style={varStyle}
          role="img"
          aria-label="M4STER"
        >
          {markDefs("flow51a", "halo51a")}
          {markPaths("flow51a", "halo51a")}
        </svg>
        <svg
          viewBox={STACK_BOTTOM_VIEWBOX}
          className={`logo-alive neon-logo ${cls}`}
          style={varStyle}
          role="img"
          aria-label="M4ster-5IN1"
        >
          {markDefs("flow51b", "halo51b")}
          {markPaths("flow51b", "halo51b")}
        </svg>
      </span>
    );
  }

  return (
    <span className="logo-hover mx-auto inline-block max-w-full">
      <svg
        viewBox="0 0 760 140"
        className={`logo-alive neon-logo ${cls}`}
        style={varStyle}
        role="img"
        aria-label="M4ster-5IN1"
      >
        {markDefs("flow51", "halo51")}
        {markPaths("flow51", "halo51")}
      </svg>
    </span>
  );
}
