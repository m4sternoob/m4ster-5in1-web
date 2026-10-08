import SectionHeading from "./SectionHeading";

/* Roadmap timeline. Checklists here describe plans, not shipped work —
   and the current phase matches the release status in the Download
   section above so the two never contradict each other. */

type Phase = {
  version: string;
  title: string;
  status: "in progress" | "planned";
  items: string[];
};

const PHASES: Phase[] = [
  {
    version: "v3.2.1",
    title: "Release hardening",
    status: "in progress",
    items: [
      "Build is done — v3.2.1 is in playtesting now",
      "Public release lands once playtesting passes",
      "Ad-hoc signed: first-launch instructions live in the download section",
    ],
  },
  {
    version: "v3.3",
    title: "Gameplay depth",
    status: "planned",
    items: [
      "Snake: pause menu and game-over stats (length, time survived)",
      "Guessing: streak tracking and a daily-challenge seed mode",
      "Ludo: 4-player mode (you + 3 CPU) and a faster-CPU toggle",
      "Snakes & Ladders: 2-player local pass-and-play",
      "Tic-Tac-Toe: score streaks and a polished CPU-thinks indicator",
      "Subtle sound effects, mutable, off by default",
    ],
  },
  {
    version: "v3.4",
    title: "Social & sharing",
    status: "planned",
    items: [
      "Exportable PNG score cards for each game",
      "Local leaderboards across all five games on one screen",
    ],
  },
  {
    version: "v4.0",
    title: "Platform expansion",
    status: "planned",
    items: [
      "iOS port — the iOS target already exists and needs wiring",
      "Android is already live (v1.4.0) — grab it in the Download section",
    ],
  },
];

const NON_GOALS = [
  "No network multiplayer — it stays offline",
  "No accounts",
  "No analytics",
  "No ads",
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="What's next"
          title="The roadmap"
          blurb="Where the Mac app is headed. The current phase always matches the release status in the Download section."
        />

        <ol className="relative space-y-10 border-l border-edge pl-6 sm:pl-8">
          {PHASES.map((p) => (
            <li key={p.version} className="relative">
              <span
                className={`absolute top-1 -left-[31px] h-4 w-4 rounded-full border-2 sm:-left-[39px] ${
                  p.status === "in progress"
                    ? "border-arcade bg-arcade/40"
                    : "border-edge bg-panel"
                }`}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-white">{p.version}</h3>
                <span className="text-sm text-slate-400">{p.title}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.status === "in progress"
                      ? "bg-arcade/15 text-arcade"
                      : "bg-panel text-slate-400"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-slate-500" aria-hidden="true">
                      –
                    </span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-2xl border border-edge bg-panel p-6">
          <h3 className="text-sm font-bold tracking-widest text-slate-300 uppercase">
            Non-goals
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Things 5IN1 will never become:
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            {NON_GOALS.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="text-arcade" aria-hidden="true">
                  ✕
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
