"use client";

import Link from "next/link";
import { useState } from "react";

/* Sticky top navigation. Collapses to a compact menu on small screens. */

const LINKS = [
  { href: "#games", label: "Games" },
  { href: "#download", label: "Download" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#tech", label: "Tech" },
  { href: "/play", label: "Play demo" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-edge bg-ink/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-extrabold tracking-tight text-white">
            5<span className="text-arcade">IN</span>1
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            five games, one native macOS app
          </span>
        </Link>

        <button
          className="rounded-md border border-edge px-3 py-1.5 text-sm text-slate-300 md:hidden"
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
                className="text-sm text-slate-300 transition-colors hover:text-arcade"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <ul className="space-y-1 border-t border-edge px-4 py-3 md:hidden">
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
