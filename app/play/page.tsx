import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Play the games — 5IN1",
  description:
    "Play all 5IN1 games right in your browser — 2048, Snake, Connect 4, Memory Match, Tic-Tac-Toe, Guessing Game, Snakes & Ladders, and Ludo.",
};

/* /play hub: every 5IN1 game playable in the browser. */

const GAMES = [
  {
    href: "/play/2048",
    icon: "🔢",
    title: "2048",
    blurb: "Merge tiles to 2048.",
  },
  {
    href: "/play/snake",
    icon: "🐍",
    title: "Snake",
    blurb: "Eat dots, chase golden food.",
  },
  {
    href: "/play/connect4",
    icon: "🔴",
    title: "Connect 4",
    blurb: "Line up four vs the CPU.",
  },
  {
    href: "/play/memory",
    icon: "🃏",
    title: "Memory Match",
    blurb: "Flip pairs, clear the board.",
  },
  {
    href: "/play/tictactoe",
    icon: "⭕",
    title: "Tic-Tac-Toe",
    blurb: "Minimax CPU, unbeatable.",
  },
  {
    href: "/play/guessing",
    icon: "🎯",
    title: "Number Guessing",
    blurb: "Hot-or-cold number hunt.",
  },
  {
    href: "/play/ladders",
    icon: "🪜",
    title: "Snakes & Ladders",
    blurb: "Race to 100 vs the CPU.",
  },
  {
    href: "/play/ludo",
    icon: "🎲",
    title: "Ludo",
    blurb: "Bring both tokens home.",
  },
];

export default function PlayPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <div className="w-full max-w-3xl text-center">
          <p className="mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
            Playable in your browser
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Play 5IN1
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            All eight games from the 5IN1 app, running right here — no
            download needed.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GAMES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="group rounded-2xl border border-edge bg-panel p-5 transition-colors hover:border-arcade"
              >
                <div className="text-4xl">{g.icon}</div>
                <h2 className="mt-3 font-bold text-white group-hover:text-arcade">
                  {g.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{g.blurb}</p>
              </Link>
            ))}
          </div>

          <p className="mt-8 text-xs text-slate-500">
            Want the full experience?{" "}
            <Link href="/" className="text-arcade hover:underline">
              Get the 5IN1 Mac app
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
