"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Install App button — triggers the PWA install prompt.
   Home page Download section ONLY. Auto-hides ~5.5s after it appears if
   untouched, and hides permanently once the app is installed. */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Auto-hide after ~5.5s if the user never taps it.
    timerRef.current = window.setTimeout(() => setDismissed(true), 5500);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const install = useCallback(async () => {
    // User engaged — cancel the auto-hide so the install flow is uninterrupted.
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    // No prompt available (iOS Safari): show the share-sheet hint.
    setIosHint((v) => !v);
  }, [deferred]);

  if (installed || dismissed) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {iosHint && (
        <div
          style={{
            background: "rgba(10,10,26,0.95)",
            border: "1px solid rgba(34,211,238,0.4)",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            color: "#e9d5ff",
            maxWidth: 260,
            boxShadow: "0 0 24px rgba(34,211,238,0.25)",
            textAlign: "center",
          }}
        >
          Tap <b>Share</b> → <b>Add to Home Screen</b> to install M4ster-5IN1.
        </div>
      )}
      <button
        onClick={install}
        aria-label="Install M4ster-5IN1 app"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 18px",
          borderRadius: 999,
          border: "1px solid rgba(34,211,238,0.5)",
          background: "rgba(10,10,26,0.9)",
          color: "#22d3ee",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(34,211,238,0.35)",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Install App
      </button>
    </div>
  );
}
