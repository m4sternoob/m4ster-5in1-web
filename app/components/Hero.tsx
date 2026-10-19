"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AliveLogo from "./AliveLogo";
import Reveal from "./Reveal";

/* Slow cinematic banner reveal: an IntersectionObserver triggers a 1.2s
   scale-up + fade + upward drift when the banner enters the viewport.
   A separate outer wrapper adds subtle scroll parallax. Under
   prefers-reduced-motion the banner renders visible immediately. */

function BannerReveal({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const progress = 1 - Math.min(1, Math.max(0, r.top / window.innerHeight));
        setParallax(progress * 36);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="mx-auto mt-14 w-full max-w-5xl"
      style={{ transform: `translateY(${-parallax}px)` }}
    >
      <div
        className="card-alive overflow-hidden rounded-2xl border border-edge"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.92) translateY(48px)",
          transition:
            "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "opacity, transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* Landing hero: centered vertical stack — logo on top, game banner below,
   then CTAs, then tagline. */

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
        <Reveal delay={0}>
          <Link
            href="/play"
            aria-label="Play games"
            className="block cursor-pointer"
            style={{ transform: "scale(var(--logo-hero-scale, 1))" }}
          >
            <AliveLogo size="lg" />
          </Link>
        </Reveal>
        <BannerReveal>
          <img
            src="/hero-banner.png"
            alt="M4ster-5IN1 — five games, one app, everywhere"
            className="h-auto w-full"
            loading="lazy"
          />
        </BannerReveal>
        <Reveal delay={420}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#download"
              className="btn-alive rounded-lg bg-arcade px-7 py-3 text-sm font-bold text-ink"
            >
              Download
            </Link>
            <Link
              href="/play"
              className="btn-alive rounded-lg border border-edge bg-panel px-7 py-3 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
            >
              Play in browser
            </Link>
          </div>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-10 max-w-xl text-lg text-slate-200 sm:text-xl">
            Five games, one app — web, Windows, Mac, Android, iOS.
          </p>
        </Reveal>
        <Reveal delay={320}>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
            Snake, Connect 4, Memory Match, Tic-Tac-Toe, and Number Guessing.
            One codebase, one-to-one identical on every platform. Free,
            offline, no accounts.
          </p>
        </Reveal>
        <Reveal delay={520}>
          <p className="mt-8 text-xs text-slate-400">
            Web &middot; Windows &middot; macOS &middot; Android &middot; iOS
            &middot; free &middot; no accounts, no ads, no tracking
          </p>
        </Reveal>
      </div>
    </section>
  );
}
