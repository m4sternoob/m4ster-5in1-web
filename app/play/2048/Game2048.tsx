"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canMove, move, newBoard, type Direction } from "./logic";

/* Playable 2048: arrow keys / WASD / swipe. Same rules as the 5IN1
   Android app — merge to 2048, game over when the board locks. */

const TILE_COLORS: Record<number, string> = {
  2: "bg-slate-700 text-slate-100",
  4: "bg-slate-600 text-slate-100",
  8: "bg-orange-500 text-white",
  16: "bg-orange-600 text-white",
  32: "bg-red-500 text-white",
  64: "bg-red-600 text-white",
  128: "bg-yellow-400 text-yellow-950",
  256: "bg-yellow-500 text-yellow-950",
  512: "bg-amber-400 text-amber-950",
  1024: "bg-amber-500 text-amber-950",
  2048: "bg-cyan-400 text-cyan-950",
};

function tileClass(value: number): string {
  return TILE_COLORS[value] ?? "bg-fuchsia-500 text-white";
}

const BEST_KEY = "5in1-web-2048-best";

export default function Game2048() {
  const [board, setBoard] = useState<number[]>(() => newBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem(BEST_KEY) ?? 0);
    if (saved > 0) setBest(saved);
  }, []);

  const doMove = useCallback(
    (dir: Direction) => {
      if (over) return;
      setBoard((prev) => {
        const { board: next, gained, moved } = move(prev, dir);
        if (!moved) return prev;
        setScore((s) => {
          const total = s + gained;
          setBest((b) => {
            const nb = Math.max(b, total);
            localStorage.setItem(BEST_KEY, String(nb));
            return nb;
          });
          return total;
        });
        if (next.includes(2048)) setWon(true);
        if (!canMove(next)) setOver(true);
        return next;
      });
    },
    [over],
  );

  // Keyboard: arrows + WASD.
  useEffect(() => {
    const keys: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = keys[e.key];
      if (!dir) return;
      e.preventDefault();
      doMove(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  function reset() {
    setBoard(newBoard());
    setScore(0);
    setOver(false);
    setWon(false);
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className="rounded-xl border border-edge bg-panel px-4 py-2">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Score
          </p>
          <p className="text-xl font-extrabold text-white">{score}</p>
        </div>
        <div className="rounded-xl border border-edge bg-panel px-4 py-2">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Best
          </p>
          <p className="text-xl font-extrabold text-arcade">{best}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-edge bg-panel px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
        >
          New game
        </button>
      </div>

      <div
        className="touch-none rounded-2xl border border-edge bg-panel p-2.5 select-none"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchRef.current;
          touchRef.current = null;
          if (!start) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          doMove(
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "right"
                : "left"
              : dy > 0
                ? "down"
                : "up",
          );
        }}
      >
        <div className="grid grid-cols-4 gap-2.5">
          {board.map((v, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-xl text-2xl font-extrabold transition-all ${
                v === 0 ? "bg-ink" : tileClass(v)
              }`}
            >
              {v !== 0 ? v : ""}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 min-h-6 text-sm font-semibold text-slate-200">
        {over
          ? "Game over — no moves left."
          : won
            ? "You hit 2048! Keep going for a bigger tile."
            : "Arrow keys, WASD, or swipe to play."}
      </p>
    </div>
  );
}
