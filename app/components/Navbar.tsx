"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AliveLogo from "./AliveLogo";

/* Logo rewind: clicking the top-left logo plays every CSS animation
   backwards for a beat while the page glides back to the top. If we are
   on another page, navigate home first, then rewind there. */
function rewindPage() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (!reduceMotion) {
    document.body.classList.add("rewind");
    window.setTimeout(
      () => document.body.classList.remove("rewind"),
      1100
    );
  }
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

/* Sticky top navigation — full-bleed, no box. The background is a
   vertical fade into transparency so the animated page background
   (TileGrid + aura) shows through and the bar reads as part of the
   page. An animated RGB separator is the bottom border.
   Collapses to a compact menu on small screens. The logo is 5x and
   fluid (clamp) — nav grows taller to fit it. */

const LINKS = [
  { href: "/#games", label: "Games" },
  { href: "/#download", label: "Download" },
  { href: "/#roadmap", label: "Roadmap" },
  { href: "/#tech", label: "Tech" },
  { href: "/play", label: "Play demos" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      rewindPage();
    } else {
      router.push("/");
      // let the home page land, then rewind there
      window.setTimeout(rewindPage, 350);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-edge bg-transparent pt-[env(safe-area-inset-top)]">
      <nav className="flex flex-row-reverse items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="logo-hover flex shrink-0 items-center gap-3"
          aria-label="5IN1 home — rewind to top"
        >
          {/* Mobile: two-line stack on the right. Desktop: horizontal mark on the left. */}
          <span className="sm:hidden">
            <AliveLogo size="sm" stacked />
          </span>
          <span className="hidden sm:block">
            <AliveLogo size="sm" />
          </span>
          <span className="hidden text-xs whitespace-nowrap text-slate-400 sm:inline">
            Five GAMES - (ALL PLATFORMS 1::1)
          </span>
        </Link>

        <button
          type="button"
          className="btn-alive shrink-0 rounded-md border border-edge bg-panel px-3 py-1.5 text-sm text-slate-300 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          Menu
        </button>

        <ul className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                className="text-sm whitespace-nowrap text-slate-300 transition-colors hover:text-arcade"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <ul className="pop-in space-y-1 border-t border-edge bg-panel/95 px-4 py-3 backdrop-blur-md md:hidden">
          {LINKS.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded px-2 py-2 text-sm text-slate-300 hover:bg-panel hover:text-arcade"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* RGB separator as the glowing bottom border. The border-edge
          line above stays as a fallback when RGB is disabled. */}
      <div
        className="rgb-sep pointer-events-none absolute inset-x-0 bottom-0"
        aria-hidden="true"
      />
    </header>
  );
}
