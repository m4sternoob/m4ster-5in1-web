"use client";

import { useEffect, useRef, useState } from "react";
import { isNativeShell, isStandaloneDisplay } from "../lib/appMode";
import {
  DEFAULT_VOLUME,
  ambientMusic,
  loadVolumeState,
  saveVolumeState,
  type VolumeState,
} from "../lib/music";

/* Music volume for the game pages on the plain website.
 *
 * The app shell has this in its AppBar, but website visitors never see
 * the shell — this is the same control for them, sitting beside the
 * fullscreen button in the game-page header. All state goes through
 * lib/music and the same `m4ster-app-volume` localStorage key the
 * AppBar writes, so the two surfaces can never disagree: a level set
 * here is the level the app opens with, and vice versa.
 *
 * Where this renders is decided by the environment, not by the React
 * context: it steps aside ONLY where the AppBar is contractually the
 * volume UI — the native shells (Tauri / Capacitor) and a genuinely
 * installed PWA (standalone display). It used to key off the app-mode
 * context flag, i.e. it vanished whenever AppModeProvider mounted —
 * and that provider also mounts when the shell latches onto a plain
 * browser tab via display-mode: fullscreen (AutoFullscreen requests
 * fullscreen on the first tap, and embedded frames can report a
 * fullscreen host), leaving a website visitor with no page-level
 * volume control at all. Fullscreen alone is not an install, so it
 * never suppresses this control.
 *
 * Interaction mirrors the AppBar panel: the speaker toggles mute (the
 * level itself is kept, so unmuting restores it), a slider sits inline
 * on wider screens, and on small screens a chevron opens a dropdown
 * panel — closed by tapping anywhere outside it via a document
 * pointerdown listener, never an overlay: a full-screen layer, even
 * portaled, hit-tests above the panel and swallows the slider's drag
 * on touch devices (the v1.0.10 AppBar bug). */

const iconProps = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

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
      width={12}
      height={12}
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

const chromeBtn =
  "btn-alive shrink-0 rounded-lg border border-edge bg-panel p-2 text-slate-300 transition-colors hover:border-arcade hover:text-arcade";

export default function VolumeControl() {
  /* Decided once, synchronously, from the same signals the shell
     gate uses — no provider needs to have mounted, and a provider
     mounting later (the fullscreen latch) cannot change the answer:
     both checks are false for a plain tab before and after any latch.
     On the server both are false, so SSR renders the control exactly
     as a plain browser will keep it. */
  const [shellOwnsVolume] = useState(
    () => isNativeShell() || isStandaloneDisplay(),
  );
  const [state, setState] = useState<VolumeState>({
    volume: DEFAULT_VOLUME,
    muted: false,
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  /* The server renders defaults; the persisted state only exists in
     this browser, so it loads on mount. */
  useEffect(() => {
    setState(loadVolumeState());
  }, []);

  /* Same gesture kick as the app shell: browsers hold audio until a
     user gesture, so the engine starts (or resumes) on the first
     pointerdown anywhere on the page. Runs whenever this control is
     the page's volume surface; in the shells that suppress it, the
     provider's own kick covers the engine instead. */
  useEffect(() => {
    if (shellOwnsVolume) return;
    const kick = () => ambientMusic.start(stateRef.current);
    kick();
    window.addEventListener("pointerdown", kick);
    return () => window.removeEventListener("pointerdown", kick);
  }, [shellOwnsVolume]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen]);

  /* Tap-away close without an overlay — see the header note. */
  useEffect(() => {
    if (!panelOpen) return;
    const onDown = (e: PointerEvent) => {
      if (
        clusterRef.current &&
        !clusterRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [panelOpen]);

  if (shellOwnsVolume) return null;

  const { volume, muted } = state;
  const shown = muted ? 0 : volume;

  /* One write path for every interaction, identical to the app
     shell's: persist, then push the state into the engine. */
  const apply = (next: VolumeState) => {
    setState(next);
    saveVolumeState(next);
    ambientMusic.start(next);
    ambientMusic.setVolume(next);
  };

  const setVolume = (v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    apply({ volume: clamped, muted: clamped === 0 ? muted : false });
  };

  const toggleMute = () => apply({ volume, muted: !muted });

  const slider = (id: string, className: string) => (
    <input
      id={id}
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(shown * 100)}
      onChange={(e) => setVolume(Number(e.target.value) / 100)}
      aria-label="Music volume"
      className={className}
    />
  );

  return (
    <div
      ref={clusterRef}
      className="relative flex shrink-0 items-center gap-1.5"
    >
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute music" : "Mute music"}
        aria-pressed={muted}
        title={muted ? "Unmute music" : "Mute music"}
        className={chromeBtn}
      >
        <VolumeIcon muted={muted || volume === 0} />
      </button>
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-label="Volume slider"
        aria-expanded={panelOpen}
        aria-haspopup="true"
        title="Volume"
        className={`${chromeBtn} px-1.5 sm:hidden`}
      >
        <ChevronIcon open={panelOpen} />
      </button>
      {slider(
        "game-volume-slider",
        "hidden h-1.5 w-20 cursor-pointer accent-arcade sm:block",
      )}

      {panelOpen && (
        <div
          role="group"
          aria-label="Music volume"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-xl border border-edge bg-[#12161f] p-3 text-left shadow-xl shadow-black/50 sm:hidden"
        >
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            <span>Music</span>
            <span className="text-slate-200">{Math.round(shown * 100)}%</span>
          </div>
          {slider(
            "game-volume-slider-panel",
            "h-1.5 w-full cursor-pointer touch-pan-y accent-arcade",
          )}
        </div>
      )}
    </div>
  );
}
