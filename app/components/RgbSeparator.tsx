"use client";

/* Separator bar in the site's theme accent — the m4ster standard.
   Theme-colored and static by default; the rainbow flow is opt-in via
   Customize ("Rainbow separators" -> body.sep-rainbow, with
   body.rgb-breathe pulse mode and --rgb-speed flow duration).
   Respects body.no-rgb (hidden) and html[data-result] (game outcome
   color: green win / red loss / theme draw). */

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
