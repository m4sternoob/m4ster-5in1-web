"use client";

import { useEffect } from "react";
import { isNativeShell } from "../lib/appMode";

/* Service worker registration.
 *
 * Plain web (including installed web PWAs): registers /sw.js for
 * offline-first caching, as before.
 *
 * Native shells (Tauri / Capacitor): NEVER registers. The bundle is
 * already on disk, and a worker inside a shell webview is a liability:
 * the webview profile persists across app upgrades, so a worker left
 * by an older build keeps answering navigations with that build's
 * cached HTML — whose content-hashed CSS/JS chunks no longer exist in
 * the new bundle and 404, leaving the app unstyled and unhydrated
 * (the v1.0.6 Windows exe bug). If a worker from a previous version is
 * already registered here, remove it and drop its caches so upgraded
 * installs heal themselves; the worker script also retires itself in
 * shells, which covers the case where this page's JS never loads. */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (isNativeShell()) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) =>
          Promise.all(regs.map((reg) => reg.unregister()))
        )
        .catch(() => {
          /* best-effort cleanup */
        });
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(keys.map((key) => caches.delete(key)))
          )
          .catch(() => {
            /* best-effort cleanup */
          });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline-first is best-effort; page still works without it */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
