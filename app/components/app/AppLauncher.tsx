"use client";

import Link from "next/link";
import AliveLogo from "../AliveLogo";

/* App-mode home screen: the game launcher. Same card design as the
 * /play hub — this is the first thing the app shows and the screen the
 * menu button and back-at-root return to. No marketing sections, no
 * external links: just the five games. */

type GameArt = {
  href: string;
  title: string;
  blurb: string;
  accent: string;
  art: React.ReactNode;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const GAMES: GameArt[] = [
  {
    href: "/play/snake",
    title: "Snake",
    blurb: "Eat dots, chase golden food.",
    accent: "#00e676",
    art: (
      <svg width="44" height="44" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <path d="M4 17c4 0 4-3 8-3s4-3 8-3" />
        <circle cx="20" cy="11" r="0.5" fill="currentColor" />
        <circle cx="6" cy="7" r="1.6" />
      </svg>
    ),
  },
  {
    href: "/play/connect4",
    title: "Connect 4",
    blurb: "Line up four vs the CPU.",
    accent: "#ffb300",
    art: (
      <svg width="44" height="44" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <circle cx="8" cy="8" r="2.6" />
        <circle cx="16" cy="8" r="2.6" />
        <circle cx="8" cy="16" r="2.6" />
        <circle cx="16" cy="16" r="2.6" fill="currentColor" fillOpacity="0.35" />
      </svg>
    ),
  },
  {
    href: "/play/memory",
    title: "Memory Match",
    blurb: "Flip pairs, clear the board.",
    accent: "#818cf8",
    art: (
      <svg width="44" height="44" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <rect x="3" y="6" width="11" height="15" rx="2" transform="rotate(-6 8 13)" />
        <rect x="11" y="3" width="11" height="15" rx="2" transform="rotate(8 16 10)" />
      </svg>
    ),
  },
  {
    href: "/play/tictactoe",
    title: "Tic-Tac-Toe",
    blurb: "Minimax CPU, unbeatable.",
    accent: "#ff2d78",
    art: (
      <svg width="44" height="44" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <path d="M5 5l5 5m0-5-5 5" />
        <circle cx="16.5" cy="16.5" r="3.4" />
        <path d="M9 3v18M3 9h18" strokeOpacity="0.35" />
      </svg>
    ),
  },
  {
    href: "/play/guessing",
    title: "Number Guessing",
    blurb: "Hot-or-cold number hunt.",
    accent: "#22d3ee",
    art: (
      <svg width="44" height="44" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export default function AppLauncher() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 pt-24 pb-12 text-center">
      <div className="pop-in">
        <AliveLogo size="lg" />
      </div>
      <p
        className="pop-in mt-4 text-xs font-bold tracking-widest text-arcade uppercase"
        style={{ "--pop-delay": "90ms" } as React.CSSProperties}
      >
        Five games, one app
      </p>
      <h1
        className="pop-in mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
        style={{ "--pop-delay": "160ms" } as React.CSSProperties}
      >
        Pick a game
      </h1>

      <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {GAMES.map((g, i) => (
          <div
            key={g.href}
            className="pop-in"
            style={{ "--pop-delay": `${220 + i * 70}ms` } as React.CSSProperties}
          >
            <Link
              href={g.href}
              className="card-alive group block rounded-2xl border border-edge bg-panel p-5"
            >
              <div className="float-slow flex justify-center" style={{ color: g.accent }}>
                {g.art}
              </div>
              <h2 className="mt-3 font-bold text-white group-hover:text-arcade">
                {g.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{g.blurb}</p>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
