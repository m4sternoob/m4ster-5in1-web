"use client";

import { useEffect } from "react";
import { useAppMode } from "./AppModeProvider";
import { isNativeShell } from "../../lib/appMode";

/* Exit confirmation, shown by the quit button and by a back press at
 * the launcher root. Quitting goes through the native bridges (see
 * lib/appMode quitApp); when no bridge can close the app — the usual
 * case for an installed PWA — the overlay switches to a plain
 * "you can close the app now" state instead of pretending. */

export default function ExitOverlay() {
  const { exitOpen, setExitOpen, quitState, confirmQuit } = useAppMode();

  useEffect(() => {
    if (!exitOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExitOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitOpen, setExitOpen]);

  if (!exitOpen) return null;

  const manual = quitState === "manual";
  const closing = quitState === "closing";
  // Inside a native shell the manual state means the platform refused
  // a programmatic exit (iOS) — never describe the app as a web app.
  const nativeShell = isNativeShell();

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Exit M4ster-5IN1"
      onClick={() => setExitOpen(false)}
    >
      <div
        className="pop-in w-full max-w-sm rounded-2xl border border-edge bg-panel p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {manual ? (
          <>
            <h2 className="text-lg font-extrabold text-white">
              You can close the app now
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {nativeShell
                ? "Use your app switcher or home button to leave M4ster-5IN1."
                : "This device does not let web apps close themselves. Use your app switcher or home button to leave M4ster-5IN1."}
            </p>
            <button
              type="button"
              onClick={() => setExitOpen(false)}
              className="btn-alive mt-5 w-full rounded-xl border border-arcade/60 px-5 py-3 text-sm font-bold text-arcade transition-colors hover:bg-arcade/10"
            >
              Keep playing
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-white">
              Exit M4ster-5IN1?
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Your high scores stay saved on this device.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setExitOpen(false)}
                className="btn-alive flex-1 rounded-xl border border-edge px-5 py-3 text-sm font-bold text-slate-200 transition-colors hover:border-arcade hover:text-white"
              >
                Keep playing
              </button>
              <button
                type="button"
                onClick={confirmQuit}
                disabled={closing}
                className="btn-alive flex-1 rounded-xl border border-rose-400/60 px-5 py-3 text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-60"
              >
                {closing ? "Closing..." : "Quit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
