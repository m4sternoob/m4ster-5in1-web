"use client";

import { useState } from "react";

/* Memory Match, ported from the Android app's rules: flip pairs of
   cards, matches stay face-up. Three sizes — Easy 4x3, Medium 4x4,
   Hard 6x4. Emoji stand in for the icon set. */

type Size = { cols: number; pairs: number; label: string };
const SIZES: Size[] = [
  { cols: 4, pairs: 6, label: "Easy" },
  { cols: 4, pairs: 8, label: "Medium" },
  { cols: 6, pairs: 12, label: "Hard" },
];

/* 12 distinct faces — enough for the biggest deck. */
const FACES = ["🚀", "🎮", "🐍", "🎲", "👾", "🎯", "🍕", "⚡", "🌙", "🔥", "💎", "🎪"];

function newDeck(pairs: number): number[] {
  const deck = [...Array(pairs).keys(), ...Array(pairs).keys()];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MemoryGame() {
  const [size, setSize] = useState<Size>(SIZES[0]);
  const [deck, setDeck] = useState<number[]>(() => newDeck(SIZES[0].pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);

  const done = matched.size === size.pairs;

  function newGame(s: Size) {
    setSize(s);
    setDeck(newDeck(s.pairs));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLock(false);
  }

  function flip(i: number) {
    if (lock || done || flipped.includes(i) || matched.has(deck[i])) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      if (deck[next[0]] === deck[next[1]]) {
        // Match — both stay face-up.
        setMatched((m) => new Set(m).add(deck[next[0]]));
        setFlipped([]);
      } else {
        // Miss — flip back after a beat.
        setLock(true);
        setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 700);
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4 flex items-center justify-center gap-2">
        {SIZES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => newGame(s)}
            className={`rounded-lg border px-4 py-1.5 text-xs font-semibold ${
              size.label === s.label
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="ml-2 rounded-xl border border-edge bg-panel px-4 py-1.5">
          <span className="text-xs text-slate-500">Moves </span>
          <strong className="text-sm text-white">{moves}</strong>
        </div>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${size.cols}, 1fr)` }}
      >
        {deck.map((face, i) => {
          const up = flipped.includes(i) || matched.has(face);
          return (
            <button
              key={i}
              type="button"
              onClick={() => flip(i)}
              disabled={up || lock || done}
              aria-label={up ? `Card showing ${FACES[face]}` : "Face-down card"}
              className={`flex aspect-square items-center justify-center rounded-xl border text-3xl transition-all sm:text-4xl ${
                up
                  ? matched.has(face)
                    ? "border-arcade bg-arcade/15"
                    : "border-edge bg-panel"
                  : "border-edge bg-panel hover:border-arcade-dim"
              }`}
            >
              {up ? FACES[face] : <span className="text-arcade-dim">?</span>}
            </button>
          );
        })}
      </div>

      <p className="mt-4 min-h-6 text-sm font-semibold text-slate-200">
        {done
          ? `Cleared in ${moves} moves — nice memory!`
          : `${size.pairs - matched.size} pairs left.`}
      </p>

      <button
        type="button"
        onClick={() => newGame(size)}
        className="mt-2 rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
      >
        New game
      </button>
    </div>
  );
}
