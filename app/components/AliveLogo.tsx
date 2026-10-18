/* The 5IN1 brand mark, alive: it breathes with a glow halo forever. */

export default function AliveLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "text-7xl sm:text-8xl"
      : size === "sm"
        ? "text-xl"
        : "text-4xl sm:text-5xl";
  return (
    <span
      className={`logo-alive font-extrabold tracking-tight text-white ${cls}`}
      aria-label="5IN1"
    >
      5<span className="text-shimmer">IN</span>1
    </span>
  );
}
