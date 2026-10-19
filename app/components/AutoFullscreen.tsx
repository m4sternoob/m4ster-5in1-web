"use client";

import { useEffect } from "react";

/* Auto-fullscreen for the whole site on mobile: opens every page in
   fullscreen so the browser chrome disappears and it feels like a native
   app. Browsers require a user gesture, so we try once on load and fall
   back to the first tap anywhere. If the user exits fullscreen manually
   we respect it and never force it back on. The manual FullscreenButton
   stays as a fallback. */

export default function AutoFullscreen() {
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined")
      return;

    // Touch devices only — desktop users keep their window chrome.
    const isTouch =
      window.matchMedia("(hover: none)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    // Already running as an installed app — nothing to gain.
    const inApp = window.matchMedia(
      "(display-mode: fullscreen), (display-mode: standalone)"
    ).matches;
    if (inApp) return;

    let entered = false;
    let userExited = false;

    const tryFs = async () => {
      if (entered || userExited) return;
      if (!document.fullscreenEnabled) return;
      if (document.fullscreenElement) {
        entered = true;
        return;
      }
      try {
        await document.documentElement.requestFullscreen();
        entered = true;
      } catch {
        /* No user gesture yet (or unsupported) — the first-tap
           listener below retries once the user interacts. */
      }
    };

    const onFirstTap = () => {
      window.removeEventListener("pointerdown", onFirstTap);
      void tryFs();
    };

    const onFsChange = () => {
      if (entered && !document.fullscreenElement) userExited = true;
    };

    document.addEventListener("fullscreenchange", onFsChange);
    void tryFs();
    window.addEventListener("pointerdown", onFirstTap, { passive: true });

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("pointerdown", onFirstTap);
    };
  }, []);

  return null;
}
