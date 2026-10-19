"use client";

import { useEffect } from "react";

/* Registers the PWA service worker on the client. No-op when SW is
   unsupported or the page isn't served over https/localhost. */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
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
