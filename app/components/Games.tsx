import Link from "next/link";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

/* Five games, each in its own distinct showcase frame — portfolio style.
   Every frame carries its own accent color, art header, and glow. */

type Game = {
  slug: string;
  name: string;
  index: string;
  tagline: string;
  features: string[];
  accent: string; // frame accent color
  art: React.ReactNode; // mini game-art header
};

function SnakeArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
      <path
        d="M8 44 C 28 44, 28 20, 48 20 S 68 44, 88 44 S 104 32, 112 32"
        fill="none"
        stroke={c}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="112" cy="32" r="5" fill={c} />
      <circle cx="114" cy="30" r="1.4" fill="#0b0e14" />
      <circle cx="30" cy="14" r="3.5" fill={c} opacity="0.7" />
    </svg>
  );
}

function Connect4Art({ c }: { c: string }) {
  const cells: React.ReactNode[] = [];
  const wins = new Set(["1-2", "2-2", "3-2", "4-2"]);
  for (let r = 0; r < 3; r++)
    for (let col = 0; col < 6; col++) {
      const win = wins.has(`${col}-${r}`);
      cells.push(
        <circle
          key={`${col}-${r}`}
          cx={14 + col * 19}
          cy={12 + r * 17}
          r="6.5"
          fill={win ? c : "none"}
          stroke={c}
          strokeOpacity={win ? 1 : 0.35}
          strokeWidth="1.6"
        />
      );
    }
  return (
    <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
      {cells}
    </svg>
  );
}

function MemoryArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
      <rect x="18" y="6" width="20" height="28" rx="4" fill="none" stroke={c} strokeWidth="2" />
      <rect x="44" y="6" width="20" height="28" rx="4" fill={c} opacity="0.25" stroke={c} strokeWidth="2" />
      <text x="54" y="26" textAnchor="middle" fontSize="13" fill={c} fontWeight="bold">?</text>
      <rect x="70" y="6" width="20" height="28" rx="4" fill="none" stroke={c} strokeWidth="2" strokeOpacity="0.45" />
      <rect x="18" y="38" width="20" height="12" rx="3" fill="none" stroke={c} strokeWidth="1.6" strokeOpacity="0.45" />
      <rect x="44" y="38" width="20" height="12" rx="3" fill="none" stroke={c} strokeWidth="1.6" strokeOpacity="0.45" />
      <rect x="70" y="38" width="20" height="12" rx="3" fill="none" stroke={c} strokeWidth="1.6" strokeOpacity="0.45" />
    </svg>
  );
}

function TicTacToeArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
      <g stroke={c} strokeWidth="2" strokeOpacity="0.35">
        <line x1="46" y1="4" x2="46" y2="52" />
        <line x1="74" y1="4" x2="74" y2="52" />
        <line x1="28" y1="21" x2="92" y2="21" />
        <line x1="28" y1="39" x2="92" y2="39" />
      </g>
      <g stroke={c} strokeWidth="3.4" strokeLinecap="round">
        <line x1="32" y1="8" x2="42" y2="17" />
        <line x1="42" y1="8" x2="32" y2="17" />
        <circle cx="60" cy="30" r="6" fill="none" />
        <line x1="78" y1="43" x2="88" y2="48" opacity="0.5" />
        <line x1="88" y1="43" x2="78" y2="48" opacity="0.5" />
      </g>
    </svg>
  );
}

function GuessingArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
      <text x="60" y="40" textAnchor="middle" fontSize="34" fontWeight="800" fill={c}>
        ?
      </text>
      <text x="22" y="20" textAnchor="middle" fontSize="12" fill={c} opacity="0.4">3</text>
      <text x="98" y="22" textAnchor="middle" fontSize="12" fill={c} opacity="0.4">7</text>
      <text x="30" y="48" textAnchor="middle" fontSize="11" fill={c} opacity="0.3">42</text>
      <text x="92" y="50" textAnchor="middle" fontSize="11" fill={c} opacity="0.3">9</text>
    </svg>
  );
}

const GAMES: Game[] = [
  {
    slug: "snake",
    name: "Snake",
    index: "01",
    tagline: "The classic, with a need for speed.",
    features: [
      "Arrow keys or WASD controls",
      "Chill / Normal / Insane speed selector",
      "Streak bonus food every 3 in a row",
      "Wrap-walls mode and particle effects",
    ],
    accent: "#00e676",
    art: <SnakeArt c="#00e676" />,
  },
  {
    slug: "connect4",
    name: "Connect 4 vs CPU",
    index: "02",
    tagline: "Drop discs, line up four.",
    features: [
      "Easy and Hard CPU difficulty",
      "Gravity disc drops with bounce",
      "Win celebration with confetti",
      "Glossy 3D discs",
    ],
    accent: "#ffb300",
    art: <Connect4Art c="#ffb300" />,
  },
  {
    slug: "memory",
    name: "Memory Match",
    index: "03",
    tagline: "Flip pairs, clear the board.",
    features: [
      "Real 3D card-flip animation",
      "Move counter and timer",
      "Mismatch shake animation",
      "Win celebration",
    ],
    accent: "#818cf8",
    art: <MemoryArt c="#818cf8" />,
  },
  {
    slug: "tictactoe",
    name: "Tic-Tac-Toe vs CPU",
    index: "04",
    tagline: "You can't beat it — but you can try.",
    features: [
      "Minimax AI that never plays a losing move",
      "X/O draw-in animations",
      "Win confetti when you pull off the impossible",
    ],
    accent: "#ff2d78",
    art: <TicTacToeArt c="#ff2d78" />,
  },
  {
    slug: "guessing",
    name: "Number Guessing",
    index: "05",
    tagline: "Pick the number before your attempts run out.",
    features: [
      "Easy / Medium / Hard / Custom difficulty",
      "Attempt limits that raise the stakes",
      "Hot-or-cold proximity meter",
      "Win-rate stat so you can track your form",
    ],
    accent: "#22d3ee",
    art: <GuessingArt c="#22d3ee" />,
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
            <Reveal key={g.slug} delay={i * 90} className="h-full">
              <article
                className="game-frame flex h-full flex-col p-6"
                style={{ "--accent": g.accent } as React.CSSProperties}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span
                    className="text-xs font-bold tracking-widest"
                    style={{ color: g.accent }}
                    aria-hidden="true"
                  >
                    {g.index}
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      color: g.accent,
                      borderColor: `${g.accent}55`,
                      background: `${g.accent}14`,
                    }}
                  >
                    Playable now
                  </span>
                </div>
                <div className="my-3">{g.art}</div>
                <h3 className="text-lg font-bold text-white">{g.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{g.tagline}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {g.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span style={{ color: g.accent }} aria-hidden="true">
                        ▸
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  <Link
                    href={`/play/${g.slug}`}
                    className="btn-alive inline-flex w-full items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-ink"
                    style={{ background: g.accent }}
                    aria-label={`Play ${g.name}`}
                  >
                    Play {g.name.split(" ")[0]}
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
          {/* CTA frame keeps the grid balanced and links to the download. */}
          <Reveal delay={GAMES.length * 90} className="h-full">
            <a
              href="#download"
              className="game-frame flex h-full min-h-[280px] flex-col items-center justify-center p-6 text-center"
              style={{ "--accent": "#22d3ee" } as React.CSSProperties}
            >
              <span className="text-lg font-bold text-arcade">Get all five</span>
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
