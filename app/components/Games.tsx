import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/* Five game cards. Descriptions stick to features that actually ship. */

type Game = {
  name: string;
  tagline: string;
  features: string[];
  glyph: string; // single-letter anchor, styled — no emoji
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
    glyph: "S",
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
    glyph: "4",
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
    glyph: "M",
  },
  {
    name: "Tic-Tac-Toe vs CPU",
    tagline: "You can't beat it — but you can try.",
    features: [
      "Minimax AI that never plays a losing move",
      "Animated result banner",
      "Win confetti when you pull off the impossible",
    ],
    glyph: "X",
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
    glyph: "#",
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
            blurb="The same five games, one-to-one identical on web, Windows, Mac, Android, and iOS."
          />
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g, i) => (
            <Reveal key={g.name} delay={i * 90} className="h-full">
              <article className="card-alive flex h-full flex-col rounded-2xl border border-edge bg-panel p-6">
                <div
                  className="float-slow mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-arcade/40 bg-arcade/10 text-2xl font-extrabold text-arcade"
                  aria-hidden="true"
                >
                  {g.glyph}
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
              className="card-alive flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-arcade/40 bg-panel/60 p-6 text-center transition-colors hover:border-arcade"
            >
              <span className="text-lg font-bold text-arcade">
                Get all five
              </span>
              <span className="mt-2 text-sm text-slate-400">
                Free on every platform. Pick yours below.
              </span>
              <span className="btn-alive mt-5 rounded-xl bg-arcade px-6 py-2.5 text-sm font-bold text-ink">
                Download
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
