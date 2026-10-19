"use client";

/* Animated RGB flowing-gradient separator — the m4ster standard.
   Respects body.no-rgb (hidden), body.rgb-breathe (pulse mode),
   and --rgb-speed (flow duration). */

export default function RgbSeparator({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`rgb-sep mx-auto w-full max-w-6xl ${className}`}
      role="separator"
      aria-hidden="true"
    />
  );
}
