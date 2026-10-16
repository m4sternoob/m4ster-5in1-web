"use client";

import { useEffect, useState } from "react";

/* Snakes & Ladders, ported from the Android app's rules: 10x10
   boustrophedon board, exact roll to finish, vs CPU or 2-player
   pass-and-play. First to 100 wins. */

const PORTALS: Record<number, number> = {
  // ladders
  4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92,
  // snakes
  27: 5, 40: 3, 43: 18, 54: 34, 66: 45, 76: 58, 89: 53, 99: 41,
};
const LADDER_FEET = new Set([4, 13, 33, 42, 50, 62, 74]);

type Mode = "cpu" | "2p";

/** Boustrophedon cell number (1-100) for row/col. Row 0 is the top. */
function cellAt(row: number, col: number): number {
  const fromBottom = 9 - row;
  return fromBottom % 2 === 0
    ? fromBottom * 10 + col + 1
    : fromBottom * 10 + (9 - col) + 1;
}

function portalKind(cell: number): "ladder" | "snake" | null {
  if (!(cell in PORTALS)) return null;
  return LADDER_FEET.has(cell) ? "ladder" : "snake";
}

const DICE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function LaddersGame() {
  const [mode, setMode] = useState<Mode>("cpu");
  const [positions, setPositions] = useState<number[]>([0, 0]);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [message, setMessage] = useState("Race to 100!");
  const [winner, setWinner] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const names = mode === "cpu" ? ["You", "CPU"] : ["Player 1", "Player 2"];

  function reset(m: Mode = mode) {
    setMode(m);
    setPositions([0, 0]);
    setTurn(0);
    setDice(null);
    setMessage("Race to 100!");
    setWinner(null);
    setRolling(false);
  }

  function applyRoll(player: number, roll: number) {
    const from = positions[player];
    const landed = from + roll;
    // Exact roll needed to finish.
    if (landed > 100) {
      setMessage(`${names[player]} rolled ${roll} — needs exact roll!`);
      return;
    }
    const dest = PORTALS[landed] ?? landed;
    const kind = portalKind(landed);
    const next = [...positions];
    next[player] = dest;
    setPositions(next);

    if (dest === 100) {
      setWinner(player);
      setMessage(`${names[player]} reaches 100 and wins!`);
      return;
    }
    setMessage(
      kind === "ladder"
        ? `${names[player]} rolled ${roll} — ladder up to ${dest}!`
        : kind === "snake"
          ? `${names[player]} rolled ${roll} — snake down to ${dest}!`
          : `${names[player]} rolled ${roll}.`,
    );
    setTurn(1 - player);
  }

  function roll(player: number) {
    if (rolling || winner !== null || turn !== player) return;
    setRolling(true);
    // Dice tumble.
    let ticks = 0;
    const id = setInterval(() => {
      setDice(1 + Math.floor(Math.random() * 6));
      if (++ticks >= 6) {
        clearInterval(id);
        const r = 1 + Math.floor(Math.random() * 6);
        setDice(r);
        setRolling(false);
        applyRoll(player, r);
      }
    }, 70);
  }

  // CPU takes its turn after a beat.
  useEffect(() => {
    if (mode !== "cpu" || turn !== 1 || winner !== null || rolling) return;
    const timer = setTimeout(() => roll(1), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, winner, rolling]);

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

      <div className="rounded-2xl border border-edge bg-panel p-3">
        <div className="grid grid-cols-10 gap-0.5">
          {Array.from({ length: 100 }, (_, k) => {
            const row = Math.floor(k / 10);
            const col = k % 10;
            const cell = cellAt(row, col);
            const kind = portalKind(cell);
            const tokens = positions
              .map((p, i) => (p === cell ? i : -1))
              .filter((i) => i >= 0);
            return (
              <div
                key={cell}
                className={`relative flex aspect-square items-center justify-center rounded text-[8px] font-semibold sm:text-[10px] ${
                  kind === "ladder"
                    ? "bg-emerald-900/60 text-emerald-300"
                    : kind === "snake"
                      ? "bg-red-900/60 text-red-300"
                      : cell === 100
                        ? "bg-arcade/30 text-arcade"
                        : "bg-ink text-slate-600"
                }`}
              >
                {cell}
                {tokens.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                    {tokens.map((t) => (
                      <div
                        key={t}
                        className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${
                          t === 0 ? "bg-cyan-400" : "bg-amber-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="text-5xl">{dice ? DICE[dice - 1] : "🎲"}</div>
        <button
          type="button"
          onClick={() => roll(turn)}
          disabled={rolling || winner !== null || (mode === "cpu" && turn === 1)}
          className="rounded-xl bg-arcade px-6 py-2.5 text-sm font-bold text-ink transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
        >
          {rolling ? "Rolling…" : `Roll (${names[turn]})`}
        </button>
      </div>

      <p className="mt-4 min-h-6 text-sm font-semibold text-slate-200">
        {message}
      </p>

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
