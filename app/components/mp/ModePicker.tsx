"use client";

export type GameMode = "solo" | "local" | "online";

const MODES: { id: GameMode; label: string }[] = [
  { id: "solo", label: "Solo" },
  { id: "local", label: "Local 2P" },
  { id: "online", label: "Online 2P" },
];

/* Solo vs CPU / same-device 2P / online 2P — one segmented control
   shared by every game that supports multiplayer. */
export default function ModePicker({
  mode,
  onChange,
}: {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}) {
  return (
    <div
      className="pop-in mb-5 flex items-center justify-center gap-2"
      role="group"
      aria-label="Game mode"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={mode === m.id}
          className={`btn-alive rounded-lg border px-4 py-1.5 text-xs font-semibold ${
            mode === m.id
              ? "border-arcade bg-arcade text-ink"
              : "border-edge bg-panel text-slate-400 hover:text-arcade"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
