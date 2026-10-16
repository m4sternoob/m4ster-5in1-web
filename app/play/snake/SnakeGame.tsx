"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Playable Snake, ported from the Android app's rules: 20x20 grid,
   three speeds, solid or wrap walls, golden food worth 3x combo,
   combo multiplier up to 5x. Arrows / WASD / swipe to steer. */

const COLS = 20;
const ROWS = 20;
const BASE_MS = 170;
const MIN_MS = 70;
const DOTS_PER_LEVEL = 5;
const SPEEDUP_MS = 15;

type Speed = { label: string; mult: number };
const SPEEDS: Speed[] = [
  { label: "Chill", mult: 1.45 },
  { label: "Normal", mult: 1.0 },
  { label: "Insane", mult: 0.6 },
];

type Walls = "solid" | "wrap";
type Dir = { dx: number; dy: number };
const DIRS: Record<string, Dir> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

interface Pos {
  x: number;
  y: number;
}

const samePos = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;

/** Pace quickens every 5 dots: 170ms a step down to a 70ms floor. */
function stepMs(score: number, mult: number): number {
  const levels = Math.floor(score / DOTS_PER_LEVEL);
  return Math.max(MIN_MS, BASE_MS - levels * SPEEDUP_MS) * mult;
}

function randomFood(blocked: Pos[]): Pos {
  const taken = new Set(blocked.map((p) => p.y * COLS + p.x));
  while (true) {
    const p = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    if (!taken.has(p.y * COLS + p.x)) return p;
  }
}

const BEST_KEY = "5in1-web-snake-best";

export default function SnakeGame() {
  const [snake, setSnake] = useState<Pos[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [dir, setDir] = useState<Dir>(DIRS.right);
  const [food, setFood] = useState<Pos>(() =>
    randomFood([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]),
  );
  const [golden, setGolden] = useState<Pos | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [alive, setAlive] = useState(true);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(SPEEDS[1]);
  const [walls, setWalls] = useState<Walls>("solid");

  const stateRef = useRef({ snake, dir, food, golden, score, alive, running, speed, walls });
  stateRef.current = { snake, dir, food, golden, score, alive, running, speed, walls };
  const goldenTtl = useRef(0);
  const combo = useRef(1);
  const comboTtl = useRef(0);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem(BEST_KEY) ?? 0);
    if (saved > 0) setBest(saved);
  }, []);

  const start = useCallback(() => {
    const fresh = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setSnake(fresh);
    setDir(DIRS.right);
    setFood(randomFood(fresh));
    setGolden(null);
    goldenTtl.current = 0;
    combo.current = 1;
    comboTtl.current = 0;
    setScore(0);
    setAlive(true);
    setRunning(true);
  }, []);

  // One step of the game loop.
  const step = useCallback(() => {
    const s = stateRef.current;
    if (!s.running || !s.alive) return;

    if (goldenTtl.current > 0 && --goldenTtl.current === 0) setGolden(null);
    if (comboTtl.current > 0 && --comboTtl.current === 0) combo.current = 1;

    const head = s.snake[0];
    const raw = { x: head.x + s.dir.dx, y: head.y + s.dir.dy };
    const next =
      s.walls === "wrap"
        ? { x: (raw.x + COLS) % COLS, y: (raw.y + ROWS) % ROWS }
        : raw;
    const hitWall =
      s.walls === "solid" &&
      (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS);
    const ate = samePos(next, s.food);
    const ateGolden = s.golden !== null && samePos(next, s.golden);
    // Moving into the departing tail is legal when not eating.
    const body = ate || ateGolden ? s.snake : s.snake.slice(0, -1);

    if (hitWall || body.some((p) => samePos(p, next))) {
      setAlive(false);
      setRunning(false);
      setBest((b) => {
        const nb = Math.max(b, s.score);
        localStorage.setItem(BEST_KEY, String(nb));
        return nb;
      });
      return;
    }

    if (ate || ateGolden) {
      const gain = ateGolden ? 3 * combo.current : combo.current;
      const newScore = s.score + gain;
      setScore(newScore);
      combo.current = Math.min(combo.current + 1, 5);
      comboTtl.current = 25;
      if (ateGolden) {
        setGolden(null);
      } else {
        const nf = randomFood([...s.snake, next]);
        setFood(nf);
        setGolden((g) => {
          if (g === null && Math.random() < 0.12) {
            goldenTtl.current = 45;
            return randomFood([...s.snake, next, nf]);
          }
          return g;
        });
      }
    }
    setSnake([next, ...(ate || ateGolden ? s.snake : s.snake.slice(0, -1))]);
  }, []);

  // Game loop.
  useEffect(() => {
    if (!running) return;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      step();
      id = setTimeout(tick, stepMs(stateRef.current.score, stateRef.current.speed.mult));
    };
    id = setTimeout(tick, stepMs(score, speed.mult));
    return () => clearTimeout(id);
  }, [running, step, score, speed]);

  const steer = useCallback((d: Dir) => {
    setDir((prev) => {
      // No 180° turns — they'd kill the snake instantly.
      if (prev.dx === -d.dx && prev.dy === -d.dy) return prev;
      return d;
    });
    setRunning((r) => {
      if (!r && stateRef.current.alive) {
        // First steer starts a fresh run after game over screen shows.
      }
      return r;
    });
  }, []);

  useEffect(() => {
    const keys: Record<string, Dir> = {
      ArrowUp: DIRS.up,
      ArrowDown: DIRS.down,
      ArrowLeft: DIRS.left,
      ArrowRight: DIRS.right,
      w: DIRS.up,
      s: DIRS.down,
      a: DIRS.left,
      d: DIRS.right,
    };
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.key];
      if (!d) return;
      e.preventDefault();
      steer(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steer]);

  const head = snake[0];
  const cells = new Map<string, string>();
  snake.forEach((p, i) => {
    cells.set(`${p.x},${p.y}`, i === 0 ? "head" : "body");
  });
  cells.set(`${food.x},${food.y}`, "food");
  if (golden) cells.set(`${golden.x},${golden.y}`, "golden");

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
          steer(
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? DIRS.right
                : DIRS.left
              : dy > 0
                ? DIRS.down
                : DIRS.up,
          );
        }}
      >
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const x = i % COLS;
            const y = Math.floor(i / COLS);
            const kind = cells.get(`${x},${y}`);
            return (
              <div
                key={i}
                className={`aspect-square rounded-[2px] ${
                  kind === "head"
                    ? "bg-arcade"
                    : kind === "body"
                      ? "bg-arcade-dim"
                      : kind === "food"
                        ? "bg-red-500"
                        : kind === "golden"
                          ? "animate-pulse bg-yellow-400"
                          : "bg-ink"
                }`}
              />
            );
          })}
        </div>
      </div>

      {!alive ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-200">
            Game over — you scored {score}.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-3 rounded-xl bg-arcade px-6 py-2.5 text-sm font-bold text-ink transition-opacity hover:opacity-90"
          >
            Play again
          </button>
        </div>
      ) : !running ? (
        <div className="mt-4">
          <p className="text-sm text-slate-400">
            Arrows / WASD / swipe to steer. Golden food is worth 3x combo.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-3 rounded-xl bg-arcade px-6 py-2.5 text-sm font-bold text-ink transition-opacity hover:opacity-90"
          >
            Start
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-center gap-2">
        {SPEEDS.map((sp) => (
          <button
            key={sp.label}
            type="button"
            onClick={() => setSpeed(sp)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              speed.label === sp.label
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {sp.label}
          </button>
        ))}
        {(["solid", "wrap"] as Walls[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWalls(w)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${
              walls === w
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {w} walls
          </button>
        ))}
      </div>

      {/* D-pad for touch screens */}
      <div className="mx-auto mt-4 grid w-36 grid-cols-3 gap-1.5 sm:hidden">
        <div />
        <button
          type="button"
          aria-label="Up"
          onTouchStart={() => steer(DIRS.up)}
          className="rounded-lg border border-edge bg-panel py-2 text-lg text-slate-200"
        >
          ↑
        </button>
        <div />
        <button
          type="button"
          aria-label="Left"
          onTouchStart={() => steer(DIRS.left)}
          className="rounded-lg border border-edge bg-panel py-2 text-lg text-slate-200"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Down"
          onTouchStart={() => steer(DIRS.down)}
          className="rounded-lg border border-edge bg-panel py-2 text-lg text-slate-200"
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Right"
          onTouchStart={() => steer(DIRS.right)}
          className="rounded-lg border border-edge bg-panel py-2 text-lg text-slate-200"
        >
          →
        </button>
      </div>
    </div>
  );
}
