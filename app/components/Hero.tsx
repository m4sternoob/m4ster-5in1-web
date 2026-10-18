import Link from "next/link";
import AliveLogo from "./AliveLogo";
import GridGlow from "./GridGlow";
import Reveal from "./Reveal";

/* Landing hero: brand, tagline, primary call to action. */

export default function Hero() {
  return (
    <section className="hero-grid relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <GridGlow />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal delay={0}>
          <p className="mb-4 inline-block rounded-full border border-edge bg-panel px-4 py-1 text-xs font-medium tracking-widest text-slate-300 uppercase">
            Native macOS game app
          </p>
        </Reveal>
        <Reveal delay={120}>
          <AliveLogo size="lg" />
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300 sm:text-xl">
            Five games, one native macOS app.
          </p>
        </Reveal>
        <Reveal delay={320}>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
            Snake, Connect 4, Memory Match, Tic-Tac-Toe, and Number Guessing —
            built in SwiftUI + SpriteKit, zero dependencies, offline by design.
          </p>
        </Reveal>
        <Reveal delay={420}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#download"
              className="btn-alive rounded-lg bg-arcade px-7 py-3 text-sm font-bold text-ink"
            >
              Download for Mac
            </Link>
            <Link
              href="#games"
              className="btn-alive rounded-lg border border-edge bg-panel px-7 py-3 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
            >
              See the games
            </Link>
          </div>
        </Reveal>
        <Reveal delay={520}>
          <p className="mt-8 text-xs text-slate-500">
            macOS 14+ &middot; Apple Silicon (arm64) &middot; free &middot; no
            accounts, no ads, no tracking
          </p>
        </Reveal>
      </div>
    </section>
  );
}
