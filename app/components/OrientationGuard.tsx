"use client";

import { useEffect } from "react";
import { detectAppMode } from "../lib/appMode";

/* Portrait lock for app contexts.
 *
 * 5IN1 is a portrait app. Inside the native shells and installed PWAs
 * we ask the platform to hold portrait: on the first user gesture and
 * again whenever fullscreen is entered (Android Chrome only honors
 * orientation.lock() while fullscreen). Support is spotty by design —
 * iOS has no lock API at all, desktop browsers throw — so every
 * attempt is feature-checked and wrapped to fail silently. The plain
 * website never attaches a listener, and the landscape CSS overlay in
 * globals.css is the fallback wherever the lock cannot hold.
 *
 * The manifest also declares orientation: portrait, which covers the
 * installed-PWA launch before any of this code runs. */

type OrientationWithLock = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
};

function tryLockPortrait() {
  try {
    const orientation = window.screen?.orientation as
      | OrientationWithLock
      | undefined;
    if (!orientation || typeof orientation.lock !== "function") return;
    const pending = orientation.lock("portrait");
    if (pending && typeof pending.catch === "function") {
      pending.catch(() => {
        /* not fullscreen, unsupported, or denied — the CSS overlay
           covers landscape instead; never surface this. */
      });
    }
  } catch {
    /* same: a failed lock attempt must never break the app */
  }
}

export default function OrientationGuard() {
  useEffect(() => {
    let engaged = false;
    let detach: (() => void) | undefined;

    const engage = () => {
      if (engaged || !detectAppMode()) return;
      engaged = true;
      const onGesture = () => tryLockPortrait();
      const onFullscreenChange = () => {
        if (document.fullscreenElement) tryLockPortrait();
      };
      window.addEventListener("pointerdown", onGesture, { passive: true });
      document.addEventListener("fullscreenchange", onFullscreenChange);
      detach = () => {
        window.removeEventListener("pointerdown", onGesture);
        document.removeEventListener("fullscreenchange", onFullscreenChange);
      };
    };

    /* Same engagement timing as AppShell: the UA / installed-PWA
       signals are synchronous, but a native bridge can land late, so
       re-check on load and on two short retries. */
    engage();
    window.addEventListener("load", engage);
    const t1 = window.setTimeout(engage, 400);
    const t2 = window.setTimeout(engage, 1500);
    return () => {
      window.removeEventListener("load", engage);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      detach?.();
    };
  }, []);

  return null;
}
