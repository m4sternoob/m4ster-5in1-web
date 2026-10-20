"use client";

import FullscreenButton from "../../play/FullscreenButton";
import AliveLogo from "../AliveLogo";
import { useAppMode } from "./AppModeProvider";

/* The app shell's always-visible bar. Left: back (one step inside the
 * app, or the exit overlay at the root) and menu (launcher home).
 * Right: music volume + mute, fullscreen, quit. Sits above the live
 * background with a blur so games scroll underneath it cleanly. */

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

export default function AppBar() {
  const { goBack, goHome, setExitOpen, volume, muted, setVolume, toggleMute } =
    useAppMode();
  const shown = muted ? 0 : volume;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-edge bg-[#12161f]/15 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          title="Back"
          className={barBtn}
        >
          <BackIcon />
        </button>
        <button
          type="button"
          onClick={goHome}
          aria-label="Game menu"
          title="Game menu"
          className={barBtn}
        >
          <MenuIcon />
        </button>

        <div className="mx-1 flex min-w-0 flex-1 items-center justify-center">
          <AliveLogo size="sm" />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(shown * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label="Music volume"
            className="h-1.5 w-16 cursor-pointer accent-arcade sm:w-24"
          />
        </div>

        <FullscreenButton />
        <button
          type="button"
          onClick={() => setExitOpen(true)}
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
