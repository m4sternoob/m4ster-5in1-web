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
    let wantsFs = false;

    // Bulletproof fullscreen: the request must stay synchronous inside the
    // user gesture (no await before it), skip when already fullscreen as an
    // installed PWA, and retry when the tab becomes visible again.
    const goFullscreen = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) return; // already fullscreen as PWA
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => void;
      };
      try {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } catch {
        /* ignored — the tap / visibilitychange retry tries again */
      }
    };

    const tryFs = () => {
      if (entered || userExited) return;
      if (!document.fullscreenEnabled) return;
      if (document.fullscreenElement) {
        entered = true;
        return;
      }
      goFullscreen();
    };

    const onFirstTap = () => {
      window.removeEventListener("pointerdown", onFirstTap);
      // SYNCHRONOUS — no await before the request, or the browser drops the gesture.
      wantsFs = true;
      tryFs();
    };

    const onVisChange = () => {
      if (!document.hidden && wantsFs) tryFs();
    };

    const onFsChange = () => {
      if (entered && !document.fullscreenElement) userExited = true;
      else if (document.fullscreenElement) entered = true;
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("visibilitychange", onVisChange);
    tryFs();
    window.addEventListener("pointerdown", onFirstTap, { passive: true });

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("pointerdown", onFirstTap);
    };
  }, []);

  return null;
}
