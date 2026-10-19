/* The M4STER-5IN1 brand mark — a designed vector monogram, alive.
   One continuous neon style: M4STER- in flowing script-like strokes,
   then the 5IN1 icon (5 → I → N → 1) with breathing room between letters.
   Thick rounded strokes (9px) with neon glow, in the MT-logo style.
   Custom vector paths, never plain text. It breathes forever via .logo-alive.
   Sizes are fluid via clamp() — bold on desktop, restrained on phones
   so no layout breaks. */

const LOGO_PATH =
  "M 26 108 L 26 34 C 34 46, 42 58, 50 70 C 58 58, 66 46, 74 34 L 74 108 M 130 34 L 130 108 M 130 40 L 100 82 L 144 82 M 220 46 C 216 36, 206 31, 194 33 C 180 36, 178 47, 188 53 C 200 60, 216 66, 215 82 C 214 97, 200 107, 186 105 C 176 103, 169 99, 167 93 M 245 32 L 283 32 M 264 32 L 264 108 M 349 34 L 311 34 L 311 108 L 347 108 M 311 70 L 337 70 M 379 108 L 379 32 L 405 32 C 419 32, 419 64, 405 64 L 379 64 M 401 64 L 421 108 M 447 70 L 469 70 M 504 104 C 520 111, 538 106, 543 93 C 548 81, 538 71, 522 68 C 508 65, 499 59, 497 49 L 495 37 C 494.5 31, 497 28, 502 28 L 548 28 M 585 32 L 585 108 M 625 108 L 625 30 L 685 108 L 685 30 C 694 31, 701 36, 706 43 L 725 30 L 725 108 C 725 114, 718 117, 708 114";

export default function AliveLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  /* lg is width-based (never wider than the viewport) so the hero mark
     always centers instead of overflowing; sm/md keep height-based sizing. */
  const cls =
    size === "lg"
      ? "h-auto w-[min(94vw,58rem)]"
      : size === "sm"
        ? "h-[clamp(2rem,1.5rem+4vw,6.25rem)] w-auto"
        : "h-[clamp(2rem,1.25rem+4vw,5.625rem)] w-auto";
  return (
    <svg
      viewBox="0 0 760 140"
      className={`logo-alive neon-logo max-w-full ${cls}`}
      role="img"
      aria-label="M4STER-5IN1"
    >
      <defs>
        <linearGradient id="flow51" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.5" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
        <filter id="neon51" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={LOGO_PATH}
        fill="none"
        stroke="url(#flow51)"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neon51)"
      />
    </svg>
  );
}
