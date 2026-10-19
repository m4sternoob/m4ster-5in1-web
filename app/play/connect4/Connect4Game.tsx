"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
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
   Juiced: gravity disc drops, ghost column previews, canvas confetti
   explosion, sequential win-disc pops, glowing win line, spring banner. */

const newBoard = (): Mark[] => Array<Mark>(COLS * ROWS).fill(EMPTY);

type DropInfo = { index: number; row: number; nonce: number };

const cellRC = (i: number) => ({ row: Math.floor(i / COLS), col: i % COLS });

const CONFETTI_COLORS = ["#22d3ee", "#818cf8", "#facc15", "#ef4444", "#a5f3fc", "#ffffff"];

/* Canvas confetti burst. Fires from (x, y) in canvas CSS pixels. */
function burst(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  x: number,
  y: number,
  count: number,
  power: number,
) {
  const parts: {
    x: number; y: number; vx: number; vy: number;
    w: number; h: number; rot: number; vr: number;
    color: string; life: number; maxLife: number;
  }[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (0.35 + Math.random() * 0.65) * power;
    parts.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - power * 0.45,
      w: 5 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35,
      color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
      life: 0,
      maxLife: 130 + Math.random() * 90,
    });
  }
  let raf = 0;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of parts) {
      p.life++;
      if (p.life > p.maxLife) continue;
      alive = true;
      p.vy += 0.22;
      p.vx *= 0.985;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const fade = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

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

  const boardWrapRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const discRefs = useRef(new Map<number, HTMLSpanElement>());

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

  // WIN CELEBRATION — fires once per win. Canvas confetti explosion from
  // the winning line, screen flash, then follow-up waves.
  useEffect(() => {
    if (!winner || !line) return;
    const canvas = fxRef.current;
    const wrap = boardWrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;

    // Winning line center — measured from the real disc elements.
    const centers = line
      .map((i) => discRefs.current.get(i))
      .filter((el): el is HTMLSpanElement => !!el)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
      });
    const cx = centers.length
      ? centers.reduce((s, c) => s + c.x, 0) / centers.length
      : W / 2;
    const cy = centers.length
      ? centers.reduce((s, c) => s + c.y, 0) / centers.length
      : H / 2;

    const stops: (() => void)[] = [];
    // Wave 1: big burst from the winning line.
    stops.push(burst(ctx, W, H, cx, cy, 130, 11));
    // Wave 2: side cannons after a beat.
    const wave2 = setTimeout(() => {
      stops.push(burst(ctx, W, H, W * 0.12, H * 0.25, 60, 8));
      stops.push(burst(ctx, W, H, W * 0.88, H * 0.25, 60, 8));
    }, 450);
    // Wave 3: top rain.
    const wave3 = setTimeout(() => {
      stops.push(burst(ctx, W, H, W * 0.5, -10, 70, 7));
    }, 950);
    return () => {
      clearTimeout(wave2);
      clearTimeout(wave3);
      stops.forEach((s) => s());
      ctx.clearRect(0, 0, W, H);
    };
  }, [winner, line, gameId]);

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
    discRefs.current.clear();
    setBoard(newBoard());
    setThinking(false);
    setLastDrop(null);
    setHoverCol(null);
    setGameId((g) => g + 1);
  }

  const status = winner === PLAYER
    ? "You win — four in a row!"
    : winner === CPU
      ? "CPU wins this one."
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
                  <span aria-hidden="true">&#9660;</span>
                )}
              </button>
            );
          })}
        </div>

        <div ref={boardWrapRef} className="relative">
          <div className="grid grid-cols-7 gap-1.5">
            {board.map((m, i) => {
              const { row, col } = cellRC(i);
              const isNew = lastDrop?.index === i;
              const isWin = winSet.has(i);
              const winOrder = line ? line.indexOf(i) : -1;
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
                      ref={(el) => {
                        if (el) discRefs.current.set(i, el);
                        else discRefs.current.delete(i);
                      }}
                      key={isNew ? `drop-${lastDrop!.nonce}` : "set"}
                      className={`c4-disc ${m === PLAYER ? "c4-disc-red" : "c4-disc-yellow"} ${
                        isNew ? "disc-drop" : ""
                      } ${isWin ? "win-pop" : ""}`}
                      style={
                        {
                          ...(isNew ? { "--fall": row } : {}),
                          ...(isWin && winOrder >= 0 ? { "--win-delay": `${0.15 + winOrder * 0.14}s` } : {}),
                        } as CSSProperties
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Celebration canvas: confetti bursts render here */}
          <canvas
            ref={fxRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          />

          {/* Glowing win line — through measured disc centers */}
          {winner && line && (
            <WinLine line={line} boardWrapRef={boardWrapRef} discRefs={discRefs} winner={winner} />
          )}
        </div>
      </div>

      {/* Win banner — big, springy, glowing */}
      {winner && (
        <div key={`banner-${gameId}`} className="c4-banner mt-5 text-center" aria-live="polite">
          <div className={`c4-banner-text ${winner === PLAYER ? "c4-banner-you" : "c4-banner-cpu"}`}>
            {winner === PLAYER ? "YOU WIN!" : "CPU WINS"}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-400">
            {winner === PLAYER ? "Four in a row — unstoppable." : "The machine takes this one."}
          </div>
        </div>
      )}

      {/* Draw treatment */}
      {done && !winner && (
        <div key={`draw-${gameId}`} className="c4-banner mt-5 text-center" aria-live="polite">
          <div className="c4-banner-text c4-banner-draw">DRAW</div>
          <div className="mt-1 text-sm font-medium text-slate-400">Board full — nobody blinked.</div>
        </div>
      )}

      {/* Turn indicator + status */}
      <div className="mt-4 flex min-h-6 items-center justify-center gap-2">
        {!done && (
          <span
            className={`c4-turn-dot ${thinking ? "c4-dot-cpu" : "c4-dot-you"}`}
            aria-hidden="true"
          />
        )}
        {!winner && (
          <p className="text-sm font-semibold text-slate-200">
            {status}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-center gap-6 text-sm text-slate-400">
        <span>
          You <strong key={tally.you} className="score-pop text-white">{tally.you}</strong>
        </span>
        <span>
          Draws <strong key={tally.draws} className="score-pop text-white">{tally.draws}</strong>
        </span>
        <span>
          CPU <strong key={tally.cpu} className="score-pop text-white">{tally.cpu}</strong>
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

/* Win line through the ACTUAL measured disc centers — percentage-based,
   so grid gaps can't throw it off. */
function WinLine({
  line,
  boardWrapRef,
  discRefs,
  winner,
}: {
  line: number[];
  boardWrapRef: RefObject<HTMLDivElement | null>;
  discRefs: RefObject<Map<number, HTMLSpanElement>>;
  winner: Mark;
}) {
  const [geom, setGeom] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    const wrap = boardWrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const wr = wrap.getBoundingClientRect();
      if (wr.width === 0) return;
      const pts = line
        .map((i) => discRefs.current.get(i))
        .filter((el): el is HTMLSpanElement => !!el)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            x: ((r.left - wr.left + r.width / 2) / wr.width) * 100,
            y: ((r.top - wr.top + r.height / 2) / wr.height) * 100,
          };
        });
      if (pts.length === 4) {
        const dx = pts[3].x - pts[0].x;
        const dy = pts[3].y - pts[0].y;
        const len = Math.hypot(dx, dy) || 1;
        const ex = (dx / len) * 3.5;
        const ey = (dy / len) * 3.5;
        setGeom({
          x1: pts[0].x - ex,
          y1: pts[0].y - ey,
          x2: pts[3].x + ex,
          y2: pts[3].y + ey,
        });
      }
    };
    measure();
    const t = setTimeout(measure, 60);
    return () => clearTimeout(t);
  }, [line, boardWrapRef, discRefs]);

  if (!geom) return null;
  const glow = winner === PLAYER ? "#22d3ee" : "#facc15";
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <line
        x1={geom.x1}
        y1={geom.y1}
        x2={geom.x2}
        y2={geom.y2}
        stroke={glow}
        strokeWidth={3.2}
        strokeLinecap="round"
        opacity={0.95}
        className="c4-win-line"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 8px ${glow}) drop-shadow(0 0 20px ${glow})` }}
      />
    </svg>
  );
}
