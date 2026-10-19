"use client";

import { useEffect, useState } from "react";

/* Floating Customize toolbar — logo sizes, glow intensity, background
   animation, and RGB separator controls. Settings persist to localStorage
   and are applied as CSS vars / body classes on :root. */

const KEY = "m4ster-customize";

type Settings = {
  navLogo: number;
  heroLogo: number;
  glow: number;
  bgAnim: boolean;
  rgb: boolean;
  rgbSpeed: number;
  rgbBreathe: boolean;
};

const DEFAULTS: Settings = {
  navLogo: 1,
  heroLogo: 1,
  glow: 1,
  bgAnim: true,
  rgb: true,
  rgbSpeed: 6,
  rgbBreathe: false,
};

function apply(s: Settings) {
  const r = document.documentElement;
  r.style.setProperty("--logo-nav-scale", String(s.navLogo));
  r.style.setProperty("--logo-hero-scale", String(s.heroLogo));
  r.style.setProperty("--glow", String(s.glow));
  r.style.setProperty("--rgb-speed", `${s.rgbSpeed}s`);
  document.body.classList.toggle("no-bg-anim", !s.bgAnim);
  document.body.classList.toggle("no-rgb", !s.rgb);
  document.body.classList.toggle("rgb-breathe", s.rgbBreathe);
}

function Row({
  label,
  value,
  display,
  children,
}: {
  label: string;
  value: string;
  display: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block select-none">
      <span className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-mono text-arcade">{display}</span>
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="tap-fast flex w-full select-none items-center justify-between py-1.5 text-xs text-slate-300"
    >
      <span>{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-arcade" : "bg-edge"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function CustomizeToolbar() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const saved = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
      setS(saved);
      apply(saved);
    } catch {
      apply(DEFAULTS);
    }
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    apply(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — settings still apply for this session */
    }
  };

  const reset = () => {
    setS(DEFAULTS);
    apply(DEFAULTS);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-[9998]">
      {open && (
        <div className="pop-in mb-3 max-h-[80dvh] w-64 space-y-4 overflow-y-auto overscroll-contain rounded-xl border border-edge bg-panel/95 p-4 shadow-2xl backdrop-blur select-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100">Customize</span>
            <button
              type="button"
              onClick={reset}
              className="tap-fast text-xs text-slate-400 hover:text-arcade"
            >
              Reset
            </button>
          </div>

          <Row
            label="Navbar logo size"
            value="navLogo"
            display={`${Math.round(s.navLogo * 100)}%`}
          >
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={s.navLogo}
              onChange={(e) => update({ navLogo: Number(e.target.value) })}
              className="slider-touch w-full"
              aria-label="Navbar logo size"
            />
          </Row>

          <Row
            label="Hero logo size"
            value="heroLogo"
            display={`${Math.round(s.heroLogo * 100)}%`}
          >
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={s.heroLogo}
              onChange={(e) => update({ heroLogo: Number(e.target.value) })}
              className="slider-touch w-full"
              aria-label="Hero logo size"
            />
          </Row>

          <Row
            label="Glow intensity"
            value="glow"
            display={`${Math.round(s.glow * 100)}%`}
          >
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={s.glow}
              onChange={(e) => update({ glow: Number(e.target.value) })}
              className="slider-touch w-full"
              aria-label="Glow intensity"
            />
          </Row>

          <Toggle
            label="Background animation"
            checked={s.bgAnim}
            onChange={(v) => update({ bgAnim: v })}
          />

          <div className="space-y-3 border-t border-edge pt-3">
            <span className="text-xs font-semibold text-slate-400">
              RGB separators
            </span>
            <Toggle
              label="RGB lines"
              checked={s.rgb}
              onChange={(v) => update({ rgb: v })}
            />
            <Toggle
              label="Breathing mode"
              checked={s.rgbBreathe}
              onChange={(v) => update({ rgbBreathe: v })}
            />
            <Row
              label="Flow speed"
              value="rgbSpeed"
              display={`${s.rgbSpeed}s`}
            >
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={s.rgbSpeed}
                onChange={(e) => update({ rgbSpeed: Number(e.target.value) })}
                className="slider-touch w-full"
                aria-label="RGB flow speed"
              />
            </Row>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle customize toolbar"
        className="tap-fast btn-alive flex h-12 w-12 items-center justify-center rounded-full border border-edge bg-panel text-lg text-arcade shadow-lg hover:border-arcade"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}
