import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/* Five game cards. Descriptions stick to features that actually ship in the
   app — nothing invented. */

type Game = {
  name: string;
  tagline: string;
  features: string[];
  icon: string; // emoji-style glyph used as the card's visual anchor
};

const GAMES: Game[] = [
  {
    name: "Snake",
    tagline: "The classic, with a need for speed.",
    features: [
      "Arrow keys or WASD controls",
      "Chill / Normal / Insane speed selector",
      "Combo multiplier for chained pickups",
      "Wrap-walls mode and particle effects",
    ],
    icon: "🐍",
  },
  {
    name: "Connect 4 vs CPU",
    tagline: "Drop discs, line up four.",
    features: [
      "Easy and Hard CPU difficulty",
      "Gravity disc drops with bounce",
      "Win celebration with confetti",
      "Glossy 3D discs",
    ],
    icon: "🔴",
  },
  {
    name: "Memory Match",
    tagline: "Flip pairs, clear the board.",
    features: [
      "Classic card-flip gameplay",
      "Move counter and timer",
      "Mismatch shake animation",
      "Win celebration",
    ],
    icon: "🃏",
  },
  {
    name: "Tic-Tac-Toe vs CPU",
    tagline: "You can't beat it — but you can try.",
    features: [
      "Minimax AI that never plays a losing move",
      "Animated result banner",
      "Win confetti when you pull off the impossible",
    ],
    icon: "⭕",
  },
  {
    name: "Number Guessing",
    tagline: "Pick the number before your attempts run out.",
    features: [
      "Easy / Medium / Hard / Custom difficulty",
      "Attempt limits that raise the stakes",
      "Hot-or-cold proximity meter",
      "Win-rate stat so you can track your form",
    ],
    icon: "🎯",
  },
];

export default function Games() {
  return (
    <section id="games" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="The lineup"
            title="Five games. One app. Zero filler."
            blurb="Every game runs natively on your Mac — no browser tab, no Electron wrapper, no waiting."
          />
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g, i) => (
            <Reveal key={g.name} delay={i * 90} className="h-full">
              <article className="card-alive flex h-full flex-col rounded-2xl border border-edge bg-panel p-6">
                <div className="float-slow mb-4 inline-block text-4xl" aria-hidden="true">
                  {g.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{g.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{g.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {g.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-arcade" aria-hidden="true">
                        ▸
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
          {/* Spacer card keeps the grid balanced and links to the download. */}
          <Reveal delay={GAMES.length * 90} className="h-full">
            <a
              href="#download"
              className="card-alive flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-edge p-6 text-center hover:border-arcade hover:bg-panel"
            >
              <div className="float-slow text-4xl" aria-hidden="true">
                🍎
              </div>
              <p className="mt-4 text-lg font-bold text-white">
                Get 5IN1 for Mac
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Free. macOS 14+ on Apple Silicon.
              </p>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
