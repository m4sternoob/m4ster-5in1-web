"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  COLS,
  ROWS,
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
   drop. Hard CPU takes wins and blocks yours; Easy plays randomly.
   Juiced: gravity disc drops, ghost column previews, win line draw,
   confetti, pulsing turn indicator. */

const newBoard = (): Mark[] => Array<Mark>(COLS * ROWS).fill(EMPTY);

type DropInfo = { index: number; row: number; nonce: number };

const cellRC = (i: number) => ({ row: Math.floor(i / COLS), col: i % COLS });

const CONFETTI_COLORS = ["#22d3ee", "#818cf8", "#facc15", "#ef4444", "#a5f3fc"];

export default function Connect4Game() {
  const [board, setBoard] = useState<Mark[]>(newBoard);
  const [hard, setHard] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [tally, setTally] = useState({ you: 0, cpu: 0, draws: 0 });
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [lastDrop, setLastDrop] = useState<DropInfo | null>(null);
  const [gameId, setGameId] = useState(0);

  const thinkingRef = useRef(false);
  const countedRef = useRef(false);
  const nonceRef = useRef(0);
  const boardRef = useRef(board);
  boardRef.current = board;

  const line = winningLineOf(board);
  const winner = line ? board[line[0]] : null;
  const done = winner !== null || boardFull(board);
  const winSet = useMemo(() => new Set(line ?? []), [line]);

  // CPU answers after a short beat.
  useEffect(() => {
    if (done || thinkingRef.current) return;
    const cur = boardRef.current;
    const xCount = cur.filter((m) => m === PLAYER).length;
    const oCount = cur.filter((m) => m === CPU).length;
    if (xCount <= oCount) return; // player's turn

    thinkingRef.current = true;
    setThinking(true);
    const timer = setTimeout(() => {
      const b = boardRef.current;
      const col = pickCpuMove(b, hard);
      if (col >= 0) {
        const row = dropRow(b, col);
        const next = dropDisc(b, col, CPU);
        if (next && row >= 0) {
          nonceRef.current += 1;
          setLastDrop({ index: row * COLS + col, row, nonce: nonceRef.current });
          setBoard(next);
        }
      }
      thinkingRef.current = false;
      setThinking(false);
    }, 550);
    return () => clearTimeout(timer);
  }, [board, done, hard]);

  // Guards the score so a finished game is tallied exactly once.
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
    if (done || thinking) return;
    const b = boardRef.current;
    const row = dropRow(b, col);
    if (row < 0) return;
    const next = dropDisc(b, col, PLAYER);
    if (!next) return;
    nonceRef.current += 1;
    setLastDrop({ index: row * COLS + col, row, nonce: nonceRef.current });
    setBoard(next);
  }

  function reset() {
    countedRef.current = false;
    thinkingRef.current = false;
    setBoard(newBoard());
    setThinking(false);
    setLastDrop(null);
    setHoverCol(null);
    setGameId((g) => g + 1);
  }

  // Win-line endpoints in a 700x600 viewBox (100 units per cell).
  const winLine = useMemo(() => {
    if (!line) return null;
    const a = cellRC(line[0]);
    const b = cellRC(line[3]);
    return {
      x1: (a.col + 0.5) * 100,
      y1: (a.row + 0.5) * 100,
      x2: (b.col + 0.5) * 100,
      y2: (b.row + 0.5) * 100,
    };
  }, [line]);

  const confetti = useMemo(() => {
    if (!winner) return [];
    return Array.from({ length: 30 }, (_, i) => ({
      id: `${gameId}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 7,
    }));
  }, [winner, gameId]);

  const status = winner === PLAYER
    ? "You win — four in a row!"
    : winner === CPU
      ? "CPU wins. Try Hard mode for a real fight."
      : done
        ? "Board full — draw."
        : thinking
          ? "CPU is thinking…"
          : "Your move — tap a column.";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="pop-in mb-4 flex items-center justify-center gap-2" style={{ "--pop-delay": "60ms" } as CSSProperties}>
        {([true, false] as const).map((h) => (
          <button
            key={String(h)}
            type="button"
            onClick={() => {
              setHard(h);
              reset();
            }}
            className={`btn-alive rounded-lg border px-4 py-1.5 text-xs font-semibold ${
              hard === h
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {h ? "Hard" : "Easy"}
          </button>
        ))}
      </div>

      <div className="pop-in rounded-2xl border border-edge bg-panel p-3" style={{ "--pop-delay": "140ms" } as CSSProperties}>
        {/* Column tap targets with ghost disc preview */}
        <div className="mb-1 grid grid-cols-7 gap-1.5" onMouseLeave={() => setHoverCol(null)}>
          {Array.from({ length: COLS }, (_, c) => {
            const playable = !done && !thinking && dropRow(board, c) >= 0;
            const showGhost = hoverCol === c && playable;
            return (
              <button
                key={c}
                type="button"
                aria-label={`Drop in column ${c + 1}`}
                onClick={() => play(c)}
                onMouseEnter={() => setHoverCol(c)}
                onFocus={() => setHoverCol(c)}
                onBlur={() => setHoverCol(null)}
                disabled={!playable}
                className="flex h-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-ink hover:text-arcade disabled:cursor-default disabled:hover:bg-transparent"
              >
                {showGhost ? (
                  <span className="c4-disc c4-disc-red c4-ghost" aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">▼</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <div className="grid grid-cols-7 gap-1.5">
            {board.map((m, i) => {
              const { row, col } = cellRC(i);
              const isNew = lastDrop?.index === i;
              const isWin = winSet.has(i);
              const colHl = hoverCol === col && !done && !thinking;
              return (
                <div
                  key={i}
                  className={`c4-slot flex aspect-square items-center justify-center rounded-full border border-edge ${
                    colHl ? "c4-slot-hl" : ""
                  }`}
                >
                  {m !== EMPTY && (
                    <span
                      key={isNew ? `drop-${lastDrop!.nonce}` : "set"}
                      className={`c4-disc ${m === PLAYER ? "c4-disc-red" : "c4-disc-yellow"} ${
                        isNew ? "disc-drop" : ""
                      } ${isWin ? "win-pulse" : ""}`}
                      style={isNew ? ({ "--fall": row } as CSSProperties) : undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Win line draws through the four */}
          {winLine && (
            <svg
              viewBox="0 0 700 600"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <line
                x1={winLine.x1}
                y1={winLine.y1}
                x2={winLine.x2}
                y2={winLine.y2}
                stroke={winner === PLAYER ? "#22d3ee" : "#facc15"}
                strokeWidth={14}
                strokeLinecap="round"
                opacity={0.9}
                className="c4-win-line"
              />
            </svg>
          )}

          {/* Confetti rain on win */}
          {winner && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {confetti.map((p) => (
                <span
                  key={p.id}
                  className="c4-confetti"
                  style={
                    {
                      left: `${p.left}%`,
                      animationDelay: `${p.delay}s`,
                      background: p.color,
                      width: p.size,
                      height: p.size * 0.6,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Turn indicator + status */}
      <div className="mt-4 flex min-h-6 items-center justify-center gap-2">
        {!done && (
          <span
            className={`c4-turn-dot ${thinking ? "c4-dot-cpu" : "c4-dot-you"}`}
            aria-hidden="true"
          />
        )}
        <p
          key={done ? `end-${gameId}` : "play"}
          className={`text-sm font-semibold ${done ? "pop-in text-base text-white" : "text-slate-200"}`}
        >
          {status}
        </p>
      </div>

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
        className="btn-alive mt-4 rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
      >
        New game
      </button>
    </div>
  );
}
