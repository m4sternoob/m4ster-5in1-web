"use client";

import { IS_TEST_BUILD } from "../lib/buildInfo";

/* Small floating pill shown only on TEST builds so a test link can
   never be mistaken for the production site. */
export default function TestBadge() {
  if (!IS_TEST_BUILD) return null;
  return (
    <div
      className="fixed bottom-4 left-4 z-[70] flex items-center gap-2 rounded-full border border-amber-400/50 bg-[#12161f]/90 py-1.5 pr-3.5 pl-3 shadow-lg backdrop-blur-md"
      role="note"
      aria-label="Test build"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
      </span>
      <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
        Test build
      </span>
    </div>
  );
}
