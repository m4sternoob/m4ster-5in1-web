"use client";

import { useEffect, useState } from "react";

/* Simplified Ludo, ported from the Android app's rules: 24-cell track,
   two tokens each, roll a 6 to leave base, captures off safe squares,
   exact roll to finish, rolling 6 grants an extra turn. You vs CPU,
   or 2 players pass-and-play. First to bring both tokens home wins. */

const TRACK = 24;
const BASE = -1;
const HOME = 24;
const SAFE = new Set([0, 12]);

type Mode = "cpu" | "2p";

const startOf = (side: number) => (side === 0 ? 0 : 12);
const DICE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

/** Boustrophedon (row, col) for a track cell on a 6x4 grid. */
function cellPos(cell: number): [number, number] {
  const row = Math.floor(cell / 6);
  const col = row % 2 === 0 ? cell % 6 : 5 - (cell % 6);
  return [row, col];
}

export default function LudoGame() {
  const [mode, setMode] = useState<Mode>("cpu");
  const [tokens, setTokens] = useState<number[][]>([
    [BASE, BASE],
    [BASE, BASE],
  ]);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [message, setMessage] = useState("Roll a 6 to leave base!");
  const [winner, setWinner] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const names = mode === "cpu" ? ["You", "CPU"] : ["Player 1", "Player 2"];

  function reset(m: Mode = mode) {
    setMode(m);
    setTokens([
      [BASE, BASE],
      [BASE, BASE],
    ]);
    setTurn(0);
    setDice(null);
    setMessage("Roll a 6 to leave base!");
    setWinner(null);
    setRolling(false);
  }

  /** Token indices for side s that can move with this roll. */
  function movableFor(tk: number[][], s: number, roll: number): number[] {
    return tk[s]
      .map((p, t) => ({ p, t }))
      .filter(
        ({ p }) =>
          p !== HOME && ((p === BASE && roll === 6) || (p >= 0 && p + roll <= HOME)),
      )
      .map(({ t }) => t);
  }

  function wouldCapture(tk: number[][], s: number, token: number, roll: number): boolean {
    const from = tk[s][token];
    const dest = from === BASE ? startOf(s) : from + roll;
    return dest !== HOME && !SAFE.has(dest) && tk[1 - s].includes(dest);
  }

  function doMove(tk: number[][], s: number, token: number, roll: number) {
    const mine = [...tk[s]];
    const theirs = [...tk[1 - s]];
    const from = mine[token];
    const dest = from === BASE ? startOf(s) : from + roll;
    let captured = false;
    if (dest === HOME) {
      mine[token] = HOME;
    } else {
      if (!SAFE.has(dest)) {
        for (let o = 0; o < theirs.length; o++) {
          if (theirs[o] === dest) {
            theirs[o] = BASE;
            captured = true;
          }
        }
      }
      mine[token] = dest;
    }
    const next = s === 0 ? [mine, theirs] : [theirs, mine];
    return { next, extra: roll === 6, captured };
  }

  function afterMove(s: number, tk: number[][], extra: boolean, captured: boolean, roll: number) {
    setTokens(tk);
    if (tk[s].every((p) => p === HOME)) {
      setWinner(s);
      setMessage(`${names[s]} brought both tokens home — ${names[s]} wins!`);
      setDice(null);
      return;
    }
    setMessage(
      captured
        ? `${names[s]} rolled ${roll} and captured!`
        : `${names[s]} rolled ${roll}.`,
    );
    if (extra) {
      setMessage((m) => m + " Extra turn!");
      setDice(null);
      // Same side rolls again; CPU chains automatically via the effect.
    } else {
      setTurn(1 - s);
      setDice(null);
    }
  }

  function roll(s: number) {
    if (rolling || winner !== null || turn !== s || dice !== null) return;
    setRolling(true);
    let ticks = 0;
    const id = setInterval(() => {
      setDice(1 + Math.floor(Math.random() * 6));
      if (++ticks >= 6) {
        clearInterval(id);
        const r = 1 + Math.floor(Math.random() * 6);
        setDice(r);
        setRolling(false);
      }
    }, 70);
  }

  function playToken(token: number) {
    if (dice === null || winner !== null) return;
    const s = turn;
    const moves = movableFor(tokens, s, dice);
    if (!moves.includes(token)) return;
    const roll = dice;
    const { next, extra, captured } = doMove(tokens, s, token, roll);
    afterMove(s, next, extra, captured, roll);
  }

  // CPU: roll, then prefer captures, else a random legal move.
  useEffect(() => {
    if (mode !== "cpu" || turn !== 1 || winner !== null) return;
    if (dice === null && !rolling) {
      const t = setTimeout(() => roll(1), 700);
      return () => clearTimeout(t);
    }
    if (dice !== null && !rolling) {
      const t = setTimeout(() => {
        const moves = movableFor(tokens, 1, dice);
        if (moves.length > 0) {
          const pick =
            moves.find((tk) => wouldCapture(tokens, 1, tk, dice)) ??
            moves[Math.floor(Math.random() * moves.length)];
          const { next, extra, captured } = doMove(tokens, 1, pick, dice);
          afterMove(1, next, extra, captured, dice);
        } else {
          setMessage(`CPU rolled ${dice} — no moves.`);
          setTurn(0);
          setDice(null);
        }
      }, 700);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, winner, dice, rolling, tokens]);

  const moves = dice !== null && winner === null ? movableFor(tokens, turn, dice) : [];
  const isCpuTurn = mode === "cpu" && turn === 1;

  // Build the 6x4 track grid.
  const grid: { tokens: { side: number; idx: number }[]; safe: boolean }[][] = Array.from(
    { length: 4 },
    () =>
      Array.from({ length: 6 }, () => ({
        tokens: [] as { side: number; idx: number }[],
        safe: false,
      })),
  );
  tokens.forEach((side, s) =>
    side.forEach((cell, idx) => {
      if (cell === BASE || cell === HOME) return;
      const [r, c] = cellPos(cell);
      grid[r][c].tokens.push({ side: s, idx });
    }),
  );
  for (const s of SAFE) {
    const [r, c] = cellPos(s);
    grid[r][c].safe = true;
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 flex items-center justify-center gap-2">
        {(["cpu", "2p"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => reset(m)}
            className={`rounded-lg border px-4 py-1.5 text-xs font-semibold ${
              mode === m
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {m === "cpu" ? "vs CPU" : "2 Players"}
          </button>
        ))}
      </div>

      {/* Bases and home counts */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        {[0, 1].map((s) => (
          <div key={s} className="rounded-xl border border-edge bg-panel p-2">
            <p className="text-xs font-bold text-slate-400">
              <span className={s === 0 ? "text-cyan-400" : "text-amber-400"}>●</span>{" "}
              {names[s]} · {tokens[s].filter((p) => p === HOME).length}/2 home
            </p>
            <div className="mt-1 flex gap-1">
              {tokens[s].map((p, i) =>
                p === BASE ? (
                  <span key={i} className="text-xs text-slate-600">
                    ○
                  </span>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-edge bg-panel p-3">
        <div className="grid grid-cols-6 gap-1">
          {grid.flatMap((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`flex aspect-square items-center justify-center gap-0.5 rounded-lg ${
                  cell.safe ? "bg-emerald-900/50" : "bg-ink"
                }`}
              >
                {cell.tokens.map(({ side, idx }) => {
                  const canMove = moves.includes(idx) && side === turn;
                  return (
                    <button
                      key={`${side}-${idx}`}
                      type="button"
                      disabled={!canMove}
                      onClick={() => playToken(idx)}
                      aria-label={`${names[side]} token ${idx + 1}`}
                      className={`h-5 w-5 rounded-full ${
                        side === 0 ? "bg-cyan-400" : "bg-amber-400"
                      } ${canMove ? "animate-pulse ring-2 ring-white" : ""}`}
                    />
                  );
                })}
              </div>
            )),
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="text-5xl">{dice ? DICE[dice - 1] : "🎲"}</div>
        <button
          type="button"
          onClick={() => roll(turn)}
          disabled={rolling || dice !== null || winner !== null || isCpuTurn}
          className="rounded-xl bg-arcade px-6 py-2.5 text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
        >
          {rolling ? "Rolling…" : `Roll (${names[turn]})`}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {dice !== null && moves.length > 0 && !isCpuTurn
          ? "Tap a glowing token to move it."
          : ""}
      </p>
      <p className="mt-1 min-h-6 text-sm font-semibold text-slate-200">{message}</p>

      {winner !== null && (
        <button
          type="button"
          onClick={() => reset()}
          className="mt-2 rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
        >
          Play again
        </button>
      )}
    </div>
  );
}
