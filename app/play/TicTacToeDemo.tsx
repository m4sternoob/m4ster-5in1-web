"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* Playable Tic-Tac-Toe demo: you (X) against an unbeatable minimax CPU (O).
   This is a small web taste of the same game inside the 5IN1 Mac app. */

type Cell = "X" | "O" | null;
type Outcome = "X" | "O" | "draw" | null;

/** All eight winning lines on a 3x3 board. */
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

/** Returns the game result for a board, or null while it is still in play. */
function outcomeOf(board: Cell[]): Outcome {
  for (const [a, b, c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.every((cell) => cell !== null) ? "draw" : null;
}

/**
 * Minimax search scored from the CPU's (O) perspective, with depth
 * preference so the CPU wins fast and delays defeat. X is the minimizer.
 */
function minimax(board: Cell[], cpuTurn: boolean, depth: number): number {
  const result = outcomeOf(board);
  if (result === "O") return 10 - depth;
  if (result === "X") return depth - 10;
  if (result === "draw") return 0;

  let best = cpuTurn ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = cpuTurn ? "O" : "X";
      const score = minimax(board, !cpuTurn, depth + 1);
      board[i] = null;
      best = cpuTurn ? Math.max(best, score) : Math.min(best, score);
    }
  }
  return best;
}

/** Picks the CPU's move: the empty cell with the highest minimax score. */
function pickCpuMove(board: Cell[]): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = "O";
      const score = minimax(board, false, 0);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

const emptyBoard = (): Cell[] => Array<Cell>(9).fill(null);

export default function TicTacToeDemo() {
  const [board, setBoard] = useState<Cell[]>(emptyBoard);
  const [thinking, setThinking] = useState(false);
  const [tally, setTally] = useState({ you: 0, draws: 0, cpu: 0 });
  // Guards the score so a finished game is tallied exactly once.
  const countedRef = useRef(false);

  const result = outcomeOf(board);

  // The CPU answers each player move after a short beat so the game
  // feels like a turn, not an instant calculation.
  useEffect(() => {
    if (result !== null || !thinking) return;
    const xCount = board.filter((c) => c === "X").length;
    const oCount = board.filter((c) => c === "O").length;
    if (xCount <= oCount) return; // still the player's turn

    const timer = setTimeout(() => {
      setBoard((prev) => {
        const next = [...prev];
        const move = pickCpuMove(next);
        if (move >= 0) next[move] = "O";
        return next;
      });
      setThinking(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [board, result, thinking]);

  // Tally the finished game once.
  useEffect(() => {
    if (result === null || countedRef.current) return;
    countedRef.current = true;
    setTally((t) => ({
      you: t.you + (result === "X" ? 1 : 0),
      draws: t.draws + (result === "draw" ? 1 : 0),
      cpu: t.cpu + (result === "O" ? 1 : 0),
    }));
  }, [result]);

  function play(index: number) {
    if (result !== null || thinking || board[index] !== null) return;
    const next = [...board];
    next[index] = "X";
    setBoard(next);
    // If the game isn't over, the CPU gets the next move — flag it here
    // (in the event handler) instead of inside the effect below.
    if (outcomeOf(next) === null) setThinking(true);
  }

  function reset() {
    countedRef.current = false;
    setThinking(false);
    setBoard(emptyBoard());
  }

  const status =
    result === "X"
      ? "You win — the impossible happened."
      : result === "O"
        ? "CPU wins. It plays perfectly, so a draw is your best shot."
        : result === "draw"
          ? "Draw. Against perfect play, that's a victory."
          : thinking
            ? "CPU is thinking…"
            : "Your move — you're X.";

  return (
    <div className="w-full max-w-md text-center">
      <p className="mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
        Playable demo
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Tic-Tac-Toe vs CPU
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        The same minimax opponent from the 5IN1 Mac app — it never plays a
        losing move.
      </p>

      <div
        className="mx-auto mt-8 grid w-64 grid-cols-3 gap-2 sm:w-72"
        role="grid"
        aria-label="Tic-Tac-Toe board"
      >
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            disabled={cell !== null || result !== null || thinking}
            aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ""}`}
            className="flex aspect-square items-center justify-center rounded-xl border border-edge bg-panel text-4xl font-extrabold transition-colors hover:border-arcade-dim disabled:cursor-default disabled:hover:border-edge"
          >
            <span className={cell === "X" ? "text-arcade" : "text-rose-400"}>
              {cell}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-6 min-h-6 text-sm font-semibold text-slate-200">
        {status}
      </p>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-400">
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
        className="mt-6 rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
      >
        New game
      </button>

      <p className="mt-8 text-xs text-slate-500">
        Liked this? The full game — plus Guessing, Snake, Snakes &amp;
        Ladders, and Ludo — ships in the{" "}
        <Link href="/" className="text-arcade hover:underline">
          5IN1 Mac app
        </Link>
        .
      </p>
    </div>
  );
}
