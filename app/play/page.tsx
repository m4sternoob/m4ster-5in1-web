import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AuraBackground from "../components/AuraBackground";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "Play the games — 5IN1",
  description:
    "Play all 5IN1 games right in your browser — Snake, Connect 4, Memory Match, Tic-Tac-Toe, and Number Guessing.",
};

/* /play hub: every 5IN1 game playable in the browser. */

const GAMES = [
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
];

export default function PlayPage() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <AuraBackground />
      <main className="flex flex-1 items-center justify-center px-4 pt-28 pb-16 sm:px-6">
        <div className="w-full max-w-3xl text-center">
          <Reveal delay={0}>
            <div className="card-alive mx-auto mb-8 max-w-2xl overflow-hidden rounded-2xl border border-edge">
              <img
                src="/og-image.png"
                alt="5IN1 — five games, one app"
                className="h-auto w-full"
                loading="lazy"
              />
            </div>
          </Reveal>
          <Reveal delay={60}>
            <p className="mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
              Playable in your browser
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Play <span className="text-shimmer">5IN1</span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              All five games from the 5IN1 app, running right here — no
              download needed.
            </p>
          </Reveal>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {GAMES.map((g, i) => (
              <Reveal key={g.href} delay={220 + i * 70}>
                <Link
                  href={g.href}
                  className="card-alive group block rounded-2xl border border-edge bg-panel p-5"
                >
                  <div className="float-slow text-4xl">{g.icon}</div>
                  <h2 className="mt-3 font-bold text-white group-hover:text-arcade">
                    {g.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{g.blurb}</p>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={800}>
            <p className="mt-8 text-xs text-slate-500">
              Want the full experience?{" "}
              <Link href="/" className="text-arcade hover:underline">
                Get the 5IN1 Mac app
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}
