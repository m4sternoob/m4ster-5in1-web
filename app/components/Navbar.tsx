"use client";

import Link from "next/link";
import { useState } from "react";
import AliveLogo from "./AliveLogo";

/* Sticky top navigation. Collapses to a compact menu on small screens.
   The logo is 5x and fluid (clamp) — nav grows taller to fit it. */

const LINKS = [
  { href: "#games", label: "Games" },
  { href: "#download", label: "Download" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#tech", label: "Tech" },
  { href: "/play", label: "Play demos" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-edge bg-ink/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3"
          aria-label="5IN1 home"
        >
          <AliveLogo size="sm" />
          <span className="hidden text-xs whitespace-nowrap text-slate-400 sm:inline">
            five games, every platform
          </span>
        </Link>

        <button
          className="btn-alive shrink-0 rounded-md border border-edge bg-panel px-3 py-1.5 text-sm text-slate-300"
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
        <ul className="pop-in space-y-1 border-t border-edge px-4 py-3 md:hidden">
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
    </header>
  );
}
