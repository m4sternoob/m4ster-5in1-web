"use client";

import { useEffect, useRef, useState } from "react";

/* Full classic Ludo on a 15x15 board: 52-cell cross track, 4 colored home
   bases, home columns, star safe squares. You (cyan) vs CPU or Player 2
   (amber), 4 tokens each. Roll 6 to leave base, exact roll to finish,
   captures on non-safe squares, extra turn on 6. Tokens glide cell by
   cell along the path — no teleporting. */

/* Classic 52-cell main track, starting at red's start square (6,1). */
const TRACK: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

/* Home columns: 5 cells each, leading into the center. */
const HOME_COLS: [number, number][][] = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], // cyan (red's column)
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // amber (yellow's column)
];

/* Track offsets where each side enters the board. */
const START_OFFSET = [0, 26];

/* Absolute safe squares: 4 starts + 4 stars. */
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const STARS = new Set([8, 21, 34, 47]);

const BASE = -1;
const FINISHED = 56; // 0-50 track, 51-55 home column, 56 home
const TOKENS = 4;

/* Base slot coordinates (fractional grid units) for tokens waiting in base. */
const BASE_SLOTS: [number, number][][] = [
  [[2, 2], [2, 4], [4, 2], [4, 4]],
  [[11, 11], [11, 13], [13, 11], [13, 13]],
];

const COLORS = [
  { base: "#22d3ee", dark: "#0e7490", light: "#a5f3fc", name: "Cyan" },
  { base: "#f59e0b", dark: "#b45309", light: "#fde68a", name: "Amber" },
];

type Mode = "cpu" | "2p";

/** Absolute track index for a side's progress value on the main track. */
const absTrack = (side: number, prog: number) =>
  (START_OFFSET[side] + prog) % 52;

/** Grid coords for a token's progress value (fractional allowed). */
function tokenRC(side: number, token: number, prog: number): [number, number] {
  if (prog === BASE) return BASE_SLOTS[side][token];
  if (prog <= 50) return TRACK[absTrack(side, prog)];
  if (prog <= 55) return HOME_COLS[side][prog - 51];
  // Finished: fan out inside the center home.
  return [7.5 + (token < 2 ? -0.35 : 0.35), 7.5 + (token % 2 === 0 ? -0.35 : 0.35)];
}

/** Token indices for side s that can move with this roll. */
function movableFor(tk: number[][], s: number, roll: number): number[] {
  return tk[s]
    .map((p, t) => ({ p, t }))
    .filter(
      ({ p }) =>
        p !== FINISHED && ((p === BASE && roll === 6) || (p >= 0 && p + roll <= FINISHED)),
    )
    .map(({ t }) => t);
}

/* ------------------------------------------------------------------ */
/* Board cell map: precomputed once — kind + owning side per grid cell. */
/* ------------------------------------------------------------------ */

type CellKind = "empty" | "track" | "start" | "star" | "homecol" | "base" | "center";

type Cell = { kind: CellKind; side: number }; // side -1 = neutral/decorative

function buildCellMap(): Cell[][] {
  const map: Cell[][] = Array.from({ length: 15 }, () =>
    Array.from({ length: 15 }, () => ({ kind: "empty" as CellKind, side: -1 })),
  );
  const set = (r: number, c: number, kind: CellKind, side = -1) => {
    map[r][c] = { kind, side };
  };

  TRACK.forEach(([r, c], i) => {
    if (STARS.has(i)) set(r, c, "star");
    else if (i === 0) set(r, c, "start", 0);
    else if (i === 26) set(r, c, "start", 1);
    else if (i === 13 || i === 39) set(r, c, "start", -1);
    else set(r, c, "track");
  });
  HOME_COLS[0].forEach(([r, c]) => set(r, c, "homecol", 0));
  HOME_COLS[1].forEach(([r, c]) => set(r, c, "homecol", 1));

  // Four corner bases (6x6). Sides 0/1 playable, others decorative.
  const bases = [
    { r0: 0, c0: 0, side: 0 },
    { r0: 0, c0: 9, side: 2 },
    { r0: 9, c0: 9, side: 1 },
    { r0: 9, c0: 0, side: 3 },
  ];
  for (const b of bases)
    for (let r = b.r0; r < b.r0 + 6; r++)
      for (let c = b.c0; c < b.c0 + 6; c++) set(r, c, "base", b.side);

  for (let r = 6; r <= 8; r++) for (let c = 6; c <= 8; c++) set(r, c, "center");
  return map;
}

const CELL_MAP = buildCellMap();

const BASE_TINT = ["#22d3ee", "#f59e0b", "#22c55e", "#3b82f6"];

function CellView({ cell }: { cell: Cell }) {
  if (cell.kind === "empty") return <div className="bg-[#0d1117]" />;
  if (cell.kind === "base") {
    const tint = BASE_TINT[cell.side];
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: tint }}
      >
        <div className="flex h-[68%] w-[68%] items-center justify-center rounded-[18%] bg-white/95 shadow-inner" />
      </div>
    );
  }
  if (cell.kind === "center") {
    return (
      <div
        style={{
          background:
            "conic-gradient(#22d3ee 0 25%, #22c55e 0 50%, #f59e0b 0 75%, #3b82f6 0 100%)",
        }}
      />
    );
  }
  // Track / start / star / home-column cells.
  let bg = "#f1f5f9";
  let glyph: string | null = null;
  if (cell.kind === "start" && cell.side >= 0) bg = BASE_TINT[cell.side];
  else if (cell.kind === "start") bg = "#cbd5e1";
  else if (cell.kind === "star") glyph = "★";
  else if (cell.kind === "homecol") bg = BASE_TINT[cell.side] + "55";
  return (
    <div
      className="flex items-center justify-center border border-slate-300/70"
      style={{ background: bg }}
    >
      {glyph && (
        <span className="text-[9px] leading-none text-slate-500 sm:text-[11px]">
          {glyph}
        </span>
      )}
    </div>
  );
}

/* Dice with real pips. */
function Dice({ value, rolling }: { value: number | null; rolling: boolean }) {
  const pips: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };
  const cells = Array.from({ length: 9 }, (_, i) => i);
  const on = new Set((value ? pips[value] : []).map(([r, c]) => r * 3 + c));
  return (
    <div
      className={`grid h-16 w-16 grid-cols-3 grid-rows-3 gap-1 rounded-2xl border-2 border-edge bg-white p-2 shadow-lg ${
        rolling ? "dice-rolling" : ""
      }`}
      aria-label={value ? `Rolled ${value}` : "Dice"}
    >
      {cells.map((i) => (
        <div key={i} className="flex items-center justify-center">
          {on.has(i) && <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function LudoGame() {
  const [mode, setMode] = useState<Mode>("cpu");
  const [tokens, setTokens] = useState<number[][]>([
    Array(TOKENS).fill(BASE),
    Array(TOKENS).fill(BASE),
  ]);
  // Rendered positions — animated step by step toward `tokens`.
  const [display, setDisplay] = useState<number[][]>([
    Array(TOKENS).fill(BASE),
    Array(TOKENS).fill(BASE),
  ]);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [phase, setPhase] = useState<"roll" | "move" | "anim" | "over">("roll");
  const [message, setMessage] = useState("Roll a 6 to leave base!");
  const [winner, setWinner] = useState<number | null>(null);
  const [poof, setPoof] = useState<{ r: number; c: number; key: number } | null>(null);
  const [hop, setHop] = useState<string | null>(null); // token key doing landing hop
  const animRef = useRef<number | null>(null);

  const names = mode === "cpu" ? ["You", "CPU"] : ["Player 1", "Player 2"];

  function reset(m: Mode = mode) {
    if (animRef.current) window.clearInterval(animRef.current);
    setMode(m);
    const fresh = [Array(TOKENS).fill(BASE), Array(TOKENS).fill(BASE)];
    setTokens(fresh);
    setDisplay(fresh.map((r) => [...r]));
    setTurn(0);
    setDice(null);
    setRolling(false);
    setPhase("roll");
    setMessage("Roll a 6 to leave base!");
    setWinner(null);
    setPoof(null);
  }

  function roll(s: number) {
    if (rolling || phase !== "roll" || turn !== s || winner !== null) return;
    setRolling(true);
    let ticks = 0;
    const id = window.setInterval(() => {
      setDice(1 + Math.floor(Math.random() * 6));
      if (++ticks >= 7) {
        window.clearInterval(id);
        const r = 1 + Math.floor(Math.random() * 6);
        setDice(r);
        setRolling(false);
        const moves = movableFor(tokens, s, r);
        if (moves.length === 0) {
          setMessage(
            `${names[s]} rolled ${r} — no moves. ${names[1 - s]}'s turn.`,
          );
          window.setTimeout(() => {
            setTurn(1 - s);
            setDice(null);
            setPhase("roll");
          }, 1100);
        } else {
          setPhase("move");
          setMessage(
            `${names[s]} rolled ${r} — tap a glowing token.`,
          );
        }
      }
    }, 75);
  }

  /** Glide a token along its path, then commit. */
  function animateMove(
    side: number,
    token: number,
    from: number,
    to: number,
    done: () => void,
  ) {
    const steps: number[] = [];
    for (let p = from + 1; p <= to; p++) steps.push(p);
    if (steps.length === 0) {
      done();
      return;
    }
    setPhase("anim");
    let i = 0;
    setDisplay((prev) => {
      const next = prev.map((r) => [...r]);
      next[side][token] = steps[0];
      return next;
    });
    animRef.current = window.setInterval(() => {
      i++;
      if (i >= steps.length) {
        if (animRef.current) window.clearInterval(animRef.current);
        animRef.current = null;
        setHop(`${side}-${token}`);
        window.setTimeout(() => setHop(null), 300);
        done();
      } else {
        const v = steps[i];
        setDisplay((prev) => {
          const next = prev.map((r) => [...r]);
          next[side][token] = v;
          return next;
        });
      }
    }, 150);
  }

  function playToken(token: number) {
    if (phase !== "move" || dice === null || winner !== null) return;
    const s = turn;
    const rollVal = dice;
    if (!movableFor(tokens, s, rollVal).includes(token)) return;

    const from = tokens[s][token];
    const to = from === BASE ? 0 : from + rollVal;

    animateMove(s, token, from, to, () => {
      // Commit + captures.
      const next = tokens.map((r) => [...r]);
      next[s][token] = to;
      let captured = false;
      if (to <= 50) {
        const abs = absTrack(s, to);
        if (!SAFE.has(abs)) {
          const o = 1 - s;
          for (let t = 0; t < TOKENS; t++) {
            const op = next[o][t];
            if (op >= 0 && op <= 50 && absTrack(o, op) === abs) {
              next[o][t] = BASE;
              captured = true;
              const [r, c] = TRACK[abs];
              setPoof({ r, c, key: Date.now() });
              window.setTimeout(() => setPoof(null), 400);
            }
          }
        }
      }
      // Sync display for captured tokens (they poof back to base).
      setDisplay(next.map((r) => [...r]));
      setTokens(next);

      if (next[s].every((p) => p === FINISHED)) {
        setWinner(s);
        setPhase("over");
        setMessage(`${names[s]} brought all four tokens home!`);
        setDice(null);
        return;
      }
      const extra = rollVal === 6;
      setMessage(
        captured
          ? `${names[s]} rolled ${rollVal} and captured!${extra ? " Extra turn!" : ""}`
          : `${names[s]} rolled ${rollVal}.${extra ? " Extra turn!" : ""}`,
      );
      setDice(null);
      if (extra) {
        setPhase("roll");
      } else {
        setTurn(1 - s);
        setPhase("roll");
      }
    });
  }

  // CPU brain: roll, then prefer captures, leaving base, then furthest along.
  useEffect(() => {
    if (mode !== "cpu" || turn !== 1 || winner !== null) return;
    if (phase === "roll") {
      const t = window.setTimeout(() => roll(1), 800);
      return () => window.clearTimeout(t);
    }
    if (phase === "move" && dice !== null) {
      const t = window.setTimeout(() => {
        const r = dice;
        const moves = movableFor(tokens, 1, r);
        if (moves.length === 0) return;
        const captureMove = moves.find((tk) => {
          const from = tokens[1][tk];
          const to = from === BASE ? 0 : from + r;
          if (to > 50) return false;
          const abs = absTrack(1, to);
          if (SAFE.has(abs)) return false;
          return tokens[0].some(
            (op) => op >= 0 && op <= 50 && absTrack(0, op) === abs,
          );
        });
        const pick =
          captureMove ??
          moves.find((tk) => tokens[1][tk] === BASE) ??
          moves.reduce((a, b) => (tokens[1][a] > tokens[1][b] ? a : b));
        playToken(pick);
      }, 800);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, winner, phase, dice, tokens]);

  const moves =
    phase === "move" && dice !== null && winner === null
      ? movableFor(tokens, turn, dice)
      : [];
  const isCpuTurn = mode === "cpu" && turn === 1;
  const canRoll =
    phase === "roll" && !rolling && winner === null && !isCpuTurn;

  // Confetti for the winner.
  const confetti =
    winner !== null
      ? Array.from({ length: 60 }, (_, i) => ({
          left: `${(i * 37) % 100}%`,
          delay: `${(i % 20) * 0.12}s`,
          dur: `${2.2 + (i % 5) * 0.4}s`,
          color: ["#22d3ee", "#f59e0b", "#22c55e", "#f472b6", "#a78bfa"][i % 5],
          size: 6 + (i % 4) * 3,
        }))
      : [];

  return (
    <div className="mx-auto w-full max-w-lg">
      {confetti.map((c, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: c.left,
            animationDelay: c.delay,
            animationDuration: c.dur,
            background: c.color,
            width: c.size,
            height: c.size * 0.6,
            borderRadius: 2,
          }}
        />
      ))}

      <div className="mb-4 flex items-center justify-center gap-2">
        {(["cpu", "2p"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => reset(m)}
            className={`btn-alive rounded-lg border px-4 py-1.5 text-xs font-semibold ${
              mode === m
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {m === "cpu" ? "vs CPU" : "2 Players"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => reset()}
          className="btn-alive rounded-lg border border-edge bg-panel px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-arcade"
        >
          Restart
        </button>
      </div>

      {/* Score strip */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        {[0, 1].map((s) => (
          <div
            key={s}
            className={`rounded-xl border bg-panel p-2 transition-colors ${
              turn === s && winner === null
                ? "border-arcade"
                : "border-edge"
            }`}
          >
            <p className="text-xs font-bold text-slate-300">
              <span style={{ color: COLORS[s].base }}>●</span> {names[s]} ·{" "}
              {tokens[s].filter((p) => p === FINISHED).length}/{TOKENS} home
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(tokens[s].filter((p) => p === FINISHED).length / TOKENS) * 100}%`,
                  background: COLORS[s].base,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* The board */}
      <div className="pop-in overflow-hidden rounded-2xl border-2 border-edge bg-[#0d1117] p-2 shadow-2xl">
        <div className="relative aspect-square w-full">
          <div className="grid h-full w-full grid-cols-[repeat(15,1fr)] grid-rows-[repeat(15,1fr)] gap-[1px]">
            {CELL_MAP.flatMap((row, r) =>
              row.map((cell, c) => <CellView key={`${r}-${c}`} cell={cell} />),
            )}
          </div>

          {/* Tokens glide above the board */}
          {[0, 1].map((s) =>
            display[s].map((prog, t) => {
              const [r, c] = tokenRC(s, t, prog);
              const key = `${s}-${t}`;
              const movable = moves.includes(t) && s === turn;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!movable}
                  onClick={() => playToken(t)}
                  aria-label={`${names[s]} token ${t + 1}`}
                  className={`ludo-token absolute ${hop === key ? "token-hop" : ""} ${
                    movable ? "token-movable" : ""
                  }`}
                  style={{
                    top: `${((r + 0.5) / 15) * 100}%`,
                    left: `${((c + 0.5) / 15) * 100}%`,
                    width: "5.4%",
                    aspectRatio: "1",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span
                    className="block h-full w-full rounded-full border-2 border-white/90 shadow-md"
                    style={{
                      background: `radial-gradient(circle at 32% 30%, ${COLORS[s].light}, ${COLORS[s].base} 55%, ${COLORS[s].dark})`,
                    }}
                  />
                </button>
              );
            }),
          )}

          {/* Capture poof */}
          {poof && (
            <div
              key={poof.key}
              className="capture-poof absolute rounded-full bg-white"
              style={{
                top: `${((poof.r + 0.5) / 15) * 100}%`,
                left: `${((poof.c + 0.5) / 15) * 100}%`,
                width: "6%",
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </div>
      </div>

      {/* Dice + roll */}
      <div className="mt-4 flex items-center justify-center gap-5">
        <Dice value={dice} rolling={rolling} />
        <button
          type="button"
          onClick={() => roll(turn)}
          disabled={!canRoll}
          className="btn-alive rounded-xl bg-arcade px-6 py-2.5 text-sm font-bold text-ink disabled:cursor-default disabled:opacity-40"
        >
          {rolling ? "Rolling…" : `Roll (${names[turn]})`}
        </button>
      </div>

      <p className="mt-3 min-h-5 text-xs text-slate-500">
        {phase === "move" && moves.length > 0 && !isCpuTurn
          ? "Tap a glowing token to move it."
          : ""}
      </p>
      <p className="min-h-6 text-sm font-semibold text-slate-200">{message}</p>

      {winner !== null && (
        <div className="banner-pop mt-3 rounded-2xl border border-arcade bg-panel p-4">
          <p className="text-lg font-extrabold" style={{ color: COLORS[winner].base }}>
            {names[winner]} wins!
          </p>
          <p className="mt-1 text-xs text-slate-400">
            All four tokens home. Beautiful game.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="btn-alive mt-3 rounded-lg bg-arcade px-6 py-2 text-sm font-bold text-ink"
          >
            Play again
          </button>
        </div>
      )}

      <p className="mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-slate-600">
        Classic rules: roll a 6 to leave base, star squares are safe, captures
        send rivals home, exact roll to finish, rolling 6 earns another turn.
      </p>
    </div>
  );
}
