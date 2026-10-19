import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/* Roadmap timeline. Checklists here describe plans, not shipped work. */

type Phase = {
  version: string;
  title: string;
  status: "shipped" | "in progress" | "planned";
  items: string[];
};

const PHASES: Phase[] = [
  {
    version: "v1.0",
    title: "One codebase, all platforms",
    status: "shipped",
    items: [
      "Same five games on web, Windows, Mac, Android, iOS",
      "Web on Vercel, desktop via Tauri, mobile via Capacitor",
      "Alive UI: breathing logo, aura backgrounds, pop-in entrances",
      "Five games: Snake, Connect 4, Memory Match, Tic-Tac-Toe, Number Guessing",
    ],
  },
  {
    version: "v1.1",
    title: "Feel & polish",
    status: "in progress",
    items: [
      "Win confetti across all five games",
      "Game-switch transitions",
      "Snake: pause menu and game-over stats",
      "Guessing: streak tracking",
      "Subtle sound effects, mutable, off by default",
    ],
  },
  {
    version: "v1.2",
    title: "Social & sharing",
    status: "planned",
    items: [
      "Exportable PNG score cards for each game",
      "Local leaderboards across all five games on one screen",
      "Tic-Tac-Toe: score streaks and a polished CPU-thinks indicator",
    ],
  },
];

const NON_GOALS = [
  "No network multiplayer — it stays offline",
  "No accounts",
  "No analytics",
  "No ads",
];

const STATUS_STYLE: Record<Phase["status"], string> = {
  shipped: "border-arcade bg-arcade text-ink",
  "in progress": "border-arcade bg-arcade/20 text-arcade",
  planned: "border-edge bg-panel text-slate-400",
};

export default function Roadmap() {
  return (
    <section id="roadmap" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionHeading
            eyebrow="What's next"
            title="The roadmap"
            blurb="Five games, kept sharp. Here's where it's headed."
          />
        </Reveal>

        <ol className="relative space-y-10 border-l border-edge pl-6 sm:pl-8">
          {PHASES.map((p, i) => (
            <Reveal key={p.version} delay={i * 100}>
              <li className="relative">
                <span
                  className={`absolute top-1 -left-[31px] h-4 w-4 rounded-full border-2 sm:-left-[39px] ${
                    p.status === "planned"
                      ? "border-edge bg-panel"
                      : "border-arcade bg-arcade/40 shadow-[0_0_12px_rgb(34_211_238/0.5)]"
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-white">{p.version}</h3>
                  <span className="text-sm text-slate-400">{p.title}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-arcade" aria-hidden="true">
                        ▸
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={300}>
          <div className="mt-12 rounded-2xl border border-edge bg-panel p-6">
            <h3 className="text-sm font-bold tracking-widest text-slate-400 uppercase">
              Never happening
            </h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              {NON_GOALS.map((g) => (
                <li key={g} className="flex gap-2">
                  <span className="text-slate-500" aria-hidden="true">
                    ✕
                  </span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
