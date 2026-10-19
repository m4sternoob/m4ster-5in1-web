"use client";

import { useEffect, useState } from "react";

/* Small fullscreen toggle for the game pages. Icon flips between
   expand and compress based on real fullscreen state via the
   fullscreenchange event. On mobile this hides the browser chrome
   for true fullscreen gaming. */

const iconProps = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ExpandIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

export default function FullscreenButton() {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(document.fullscreenElement != null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* Fullscreen can be blocked (e.g. inside some iframes) — stay put. */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}
      aria-pressed={isFs}
      title={isFs ? "Exit fullscreen" : "Enter fullscreen"}
      className="btn-alive shrink-0 rounded-lg border border-edge bg-panel p-2 text-slate-300 transition-colors hover:border-arcade hover:text-arcade"
    >
      {isFs ? <CompressIcon /> : <ExpandIcon />}
    </button>
  );
}
