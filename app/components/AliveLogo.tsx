/* The 5IN1 brand mark — a designed vector monogram, alive.
   One continuous flowing gesture: 5 → I → N → 1, thick rounded strokes
   (9px) with neon glow, in the MT-logo style. Custom vector paths, never
   plain text. It breathes forever via .logo-alive.
   Sizes are fluid via clamp() — bold on desktop, restrained on phones
   so no layout breaks. */

const LOGO_PATH =
  "M 32 104 C 48 111, 66 106, 71 93 C 76 81, 66 71, 50 68 C 36 65, 27 59, 25 49 L 23 37 C 22.5 31, 25 28, 30 28 L 76 28 C 88 27, 98 29, 104 32 L 104 108 C 108 110, 111 110, 114 108 L 114 30 L 172 108 L 172 30 C 181 31, 188 36, 193 43 L 216 30 L 216 108 C 216 114, 209 117, 199 114";

export default function AliveLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "h-[clamp(5rem,2rem+16vw,30rem)]"
      : size === "sm"
        ? "h-[clamp(2rem,1.5rem+4vw,6.25rem)]"
        : "h-[clamp(2rem,1.25rem+4vw,5.625rem)]";
  return (
    <svg
      viewBox="0 0 252 140"
      className={`logo-alive neon-logo w-auto ${cls}`}
      role="img"
      aria-label="5IN1"
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
