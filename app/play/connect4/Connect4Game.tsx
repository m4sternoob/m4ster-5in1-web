"use client";

import { useEffect, useRef, useState } from "react";
import {
  COLS,
  CPU,
  EMPTY,
  PLAYER,
  boardFull,
  dropDisc,
  dropRow,
  pickCpuMove,
  winningLineOf,
  type Mark,
} from "./logic";

/* Playable Connect 4: you (red) vs the CPU (yellow). Tap a column to
   drop. Hard CPU takes wins and blocks yours; Easy plays randomly. */

const newBoard = (): Mark[] => Array<Mark>(COLS * 6).fill(EMPTY);

export default function Connect4Game() {
  const [board, setBoard] = useState<Mark[]>(newBoard);
  const [hard, setHard] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [tally, setTally] = useState({ you: 0, cpu: 0, draws: 0 });

  const line = winningLineOf(board);
  const winner = line ? board[line[0]] : null;
  const done = winner !== null || boardFull(board);

  // CPU answers after a short beat.
  useEffect(() => {
    if (done || thinking) return;
    const xCount = board.filter((m) => m === PLAYER).length;
    const oCount = board.filter((m) => m === CPU).length;
    if (xCount <= oCount) return; // player's turn

    setThinking(true);
    const timer = setTimeout(() => {
      setBoard((prev) => {
        const col = pickCpuMove(prev, hard);
        if (col < 0) return prev;
        return dropDisc(prev, col, CPU) ?? prev;
      });
      setThinking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [board, done, thinking, hard]);

  // Guards the score so a finished game is tallied exactly once.
  const countedRef = useRef(false);
  useEffect(() => {
    if (!done || countedRef.current) return;
    countedRef.current = true;
    setTally((t) => ({
      you: t.you + (winner === PLAYER ? 1 : 0),
      cpu: t.cpu + (winner === CPU ? 1 : 0),
      draws: t.draws + (winner === null ? 1 : 0),
    }));
  }, [done, winner]);

  function play(col: number) {
    if (done || thinking || dropRow(board, col) < 0) return;
    setBoard((prev) => dropDisc(prev, col, PLAYER) ?? prev);
  }

  function reset() {
    countedRef.current = false;
    setBoard(newBoard());
    setThinking(false);
  }

  const winSet = new Set(line ?? []);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 flex items-center justify-center gap-2">
        {([true, false] as const).map((h) => (
          <button
            key={String(h)}
            type="button"
            onClick={() => {
              setHard(h);
              reset();
            }}
            className={`rounded-lg border px-4 py-1.5 text-xs font-semibold ${
              hard === h
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {h ? "Hard" : "Easy"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-edge bg-panel p-3">
        {/* Column tap targets */}
        <div className="mb-1 grid grid-cols-7 gap-1.5">
          {Array.from({ length: COLS }, (_, c) => (
            <button
              key={c}
              type="button"
              aria-label={`Drop in column ${c + 1}`}
              onClick={() => play(c)}
              disabled={done || thinking || dropRow(board, c) < 0}
              className="flex h-6 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-ink hover:text-arcade disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-slate-500"
            >
              ▼
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {board.map((m, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-full border ${
                winSet.has(i) ? "border-arcade" : "border-edge"
              } bg-ink`}
            >
              {m !== EMPTY && (
                <div
                  className={`h-4/5 w-4/5 rounded-full ${
                    m === PLAYER ? "bg-red-500" : "bg-yellow-400"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 min-h-6 text-sm font-semibold text-slate-200">
        {winner === PLAYER
          ? "You win — four in a row!"
          : winner === CPU
            ? "CPU wins. Try Hard mode for a real fight."
            : done
              ? "Board full — draw."
              : thinking
                ? "CPU is thinking…"
                : "Your move — tap a column."}
      </p>

      <div className="mt-2 flex items-center justify-center gap-6 text-sm text-slate-400">
        <span>
          You <strong className="text-white">{tally.you}</strong>
        </span>
        <span>
          Draws <strong className="text-white">{tally.draws}</strong>
        </span>
        <span>
          CPU <strong className="text-white">{tally.cpu}</strong>
        </span>
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
      >
        New game
      </button>
    </div>
  );
}
