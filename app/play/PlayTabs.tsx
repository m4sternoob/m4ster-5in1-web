"use client";

import { useState } from "react";
import TicTacToeDemo from "./TicTacToeDemo";
import GuessingDemo from "./GuessingDemo";

/* Tab switcher for the /play demos. Tic-Tac-Toe stays the default so the
   page behaves as it always has; the Guessing Game is the newer addition. */

const TABS = [
  { id: "tic-tac-toe", label: "Tic-Tac-Toe" },
  { id: "guessing", label: "Guessing Game" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PlayTabs() {
  const [tab, setTab] = useState<TabId>("tic-tac-toe");

  return (
    <div className="flex w-full flex-col items-center">
      <div
        role="tablist"
        aria-label="Choose a demo"
        className="mb-4 flex gap-1 rounded-xl border border-edge bg-panel p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-arcade text-ink"
                : "text-slate-300 hover:text-arcade"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tic-tac-toe" ? <TicTacToeDemo /> : <GuessingDemo />}
    </div>
  );
}
