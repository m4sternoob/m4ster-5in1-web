/* The 5IN1 brand mark, alive: it breathes with a glow halo forever.
   Sizes are 5x the originals, fluid via clamp() — bold on desktop,
   restrained on phones so no layout breaks. */

export default function AliveLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "text-[clamp(5rem,2rem+16vw,30rem)]"
      : size === "sm"
        ? "text-[clamp(2rem,1.5rem+4vw,6.25rem)]"
        : "text-[clamp(2rem,1.25rem+4vw,5.625rem)]";
  return (
    <span
      className={`logo-alive font-extrabold tracking-tight text-white ${cls}`}
      aria-label="5IN1"
    >
      5<span className="text-shimmer">IN</span>1
    </span>
  );
}
