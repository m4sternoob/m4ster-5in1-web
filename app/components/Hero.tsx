import Link from "next/link";

/* Landing hero: brand, tagline, primary call to action. */

export default function Hero() {
  return (
    <section className="hero-grid relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="mb-4 inline-block rounded-full border border-edge bg-panel px-4 py-1 text-xs font-medium tracking-widest text-slate-300 uppercase">
          Native macOS game app
        </p>
        <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-8xl">
          5<span className="text-arcade">IN</span>1
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300 sm:text-xl">
          Five games, one native macOS app.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
          Guessing, Snake, Snakes &amp; Ladders, Ludo, and Tic-Tac-Toe — built in
          SwiftUI + SpriteKit, zero dependencies, offline by design.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#download"
            className="rounded-lg bg-arcade px-7 py-3 text-sm font-bold text-ink transition-colors hover:bg-cyan-300"
          >
            Download for Mac
          </Link>
          <Link
            href="#games"
            className="rounded-lg border border-edge bg-panel px-7 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
          >
            See the games
          </Link>
        </div>
        <p className="mt-8 text-xs text-slate-500">
          macOS 14+ &middot; Apple Silicon (arm64) &middot; free &middot; no
          accounts, no ads, no tracking
        </p>
      </div>
    </section>
  );
}
