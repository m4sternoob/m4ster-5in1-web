"use client";

import { useEffect, useRef, useState } from "react";
import FullscreenButton from "../../play/FullscreenButton";
import AliveLogo from "../AliveLogo";
import { useAppMode } from "./AppModeProvider";

/* The app shell's always-visible bar. Left: back (one step inside the
 * app, or the exit overlay at the root) and menu (launcher home).
 * Center: the logo, width-capped on small screens so it scales down
 * instead of spilling over its neighbours. Right: music volume + mute,
 * fullscreen, quit. On narrow screens the volume slider leaves the bar
 * and drops into a panel under the speaker button — the bar itself only
 * ever holds buttons. Sits above the live background with a blur so
 * games scroll underneath it cleanly. */

const iconProps = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function BackIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M19 12H5m6-7-7 7 7 7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      {muted ? (
        <path d="m16 9 5 6m0-6-5 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.4 5.6a9 9 0 0 1 0 12.8" />
        </>
      )}
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <path d="M12 3v8" />
      <path d="M6.3 6.5a8 8 0 1 0 11.4 0" />
    </svg>
  );
}

const barBtn =
  "btn-alive flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel/80 text-slate-200 transition-colors hover:border-arcade hover:text-arcade";

const chevronBtn =
  "btn-alive flex h-10 w-7 shrink-0 items-center justify-center rounded-lg border border-edge bg-panel/80 text-slate-300 transition-colors hover:border-arcade hover:text-arcade sm:hidden";

export default function AppBar() {
  const { goBack, goHome, setExitOpen, volume, muted, setVolume, toggleMute } =
    useAppMode();
  const shown = muted ? 0 : volume;
  const [volOpen, setVolOpen] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);

  /* The dropdown is a small-screen-only affordance; close it on Escape
   * so it never lingers over a game. */
  useEffect(() => {
    if (!volOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVolOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [volOpen]);

  /* Tap-away close, without an overlay element. A full-screen layer —
     even portaled to <body> under the header's stacking context —
     hit-tests ABOVE the panel, because the panel overflows the
     header's box; on touch devices the slider's drag then landed on
     the layer, got cancelled, and the volume never moved. A document
     listener intercepts nothing: taps outside the volume cluster
     close the panel, taps inside it (slider included) pass through
     to their real targets. */
  useEffect(() => {
    if (!volOpen) return;
    const onDown = (e: PointerEvent) => {
      if (
        clusterRef.current &&
        !clusterRef.current.contains(e.target as Node)
      ) {
        setVolOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [volOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-edge bg-[#12161f]/65 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex h-14 items-center gap-1.5 px-2.5 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => {
            setVolOpen(false);
            goBack();
          }}
          aria-label="Back"
          title="Back"
          className={barBtn}
        >
          <BackIcon />
        </button>
        <button
          type="button"
          onClick={() => {
            setVolOpen(false);
            goHome();
          }}
          aria-label="Game menu"
          title="Game menu"
          className={barBtn}
        >
          <MenuIcon />
        </button>

        {/* Logo: capped on small screens and shrunk by its container —
            flex-1 + min-w-0 means it takes only the space the buttons
            leave, and the svg scales to that width instead of painting
            over the controls beside it. */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <div className="w-full max-w-[104px] min-[400px]:max-w-[120px] sm:w-auto sm:max-w-none [&>span]:block sm:[&>span]:inline-block [&_svg]:w-full sm:[&_svg]:w-auto">
            <AliveLogo size="sm" />
          </div>
        </div>

        <div
          ref={clusterRef}
          className="relative flex shrink-0 items-center gap-1.5 sm:gap-2"
        >
          <div className="relative z-50 flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute music" : "Mute music"}
              aria-pressed={muted}
              title={muted ? "Unmute music" : "Mute music"}
              className={barBtn}
            >
              <VolumeIcon muted={muted || volume === 0} />
            </button>
            <button
              type="button"
              onClick={() => setVolOpen((v) => !v)}
              aria-label="Volume slider"
              aria-expanded={volOpen}
              aria-haspopup="true"
              title="Volume"
              className={chevronBtn}
            >
              <ChevronIcon open={volOpen} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(shown * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              aria-label="Music volume"
              className="hidden h-1.5 w-24 cursor-pointer accent-arcade sm:block"
            />
          </div>

          {volOpen && (
            <div
              role="group"
              aria-label="Music volume"
              className="absolute right-0 top-[calc(100%+14px)] z-50 w-48 rounded-xl border border-edge bg-[#12161f] p-3 shadow-xl shadow-black/50 sm:hidden"
            >
              <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <span>Music</span>
                <span className="text-slate-200">
                  {Math.round(shown * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(shown * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                aria-label="Music volume"
                className="h-1.5 w-full cursor-pointer touch-pan-y accent-arcade"
              />
            </div>
          )}
        </div>

        <FullscreenButton />
        <button
          type="button"
          onClick={() => {
            setVolOpen(false);
            setExitOpen(true);
          }}
          aria-label="Quit app"
          title="Quit"
          className={`${barBtn} hover:border-rose-400 hover:text-rose-300`}
        >
          <PowerIcon />
        </button>
      </div>
    </header>
  );
}
