"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Canvas-rendered high-quality Snake — smooth interpolated movement,
   gradient body with tapered tail, glowing directional head, particle
   bursts, death shatter, screen shake, speed lines.
   Same rules as the Android app: 20x20 grid, three speeds, solid/wrap
   walls, golden food 3x, combo multiplier up to 5x.
   Visuals follow DESIGN_SYSTEM.md: cyan/indigo on ink, alive glows. */

const COLS = 20;
const ROWS = 20;
const BASE_MS = 170;
const MIN_MS = 70;
const DOTS_PER_LEVEL = 5;
const SPEEDUP_MS = 15;

/* Design tokens (DESIGN_SYSTEM.md) */
const INK = "#0b0e14";
const PANEL = "#12161f";
const ARCADE = "#22d3ee"; // cyan
const ARCADE_DIM = "#0e7490";
const SHIMMER = "#a5f3fc";
const FOOD_RED = "#fb7185";
const GOLD = "#facc15";

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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
}

/** Lerp between two hex colors. t: 0 → a, 1 → b. */
function lerpColor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const BEST_KEY = "5in1-web-snake-best";

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [alive, setAlive] = useState(true);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(SPEEDS[1]);
  const [walls, setWalls] = useState<Walls>("solid");

  /* Engine state lives in a ref — the rAF loop reads/writes it directly,
     React state only mirrors what the UI chrome needs. */
  const eng = useRef({
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ] as Pos[],
    prev: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ] as Pos[],
    dir: DIRS.right as Dir,
    pendingDir: null as Dir | null,
    food: { x: 14, y: 10 } as Pos,
    golden: null as Pos | null,
    score: 0,
    alive: true,
    running: false,
    speed: SPEEDS[1] as Speed,
    walls: "solid" as Walls,
    lastTick: 0,
    particles: [] as Particle[],
    floats: [] as FloatText[],
    shake: 0,
    deadAt: 0,
    combo: 1,
    comboTtl: 0,
    goldenTtl: 0,
  });

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem(BEST_KEY) ?? 0);
    if (saved > 0) setBest(saved);
  }, []);

  /* Sync UI controls into the engine. */
  useEffect(() => {
    eng.current.speed = speed;
  }, [speed]);
  useEffect(() => {
    eng.current.walls = walls;
  }, [walls]);

  const spawnBurst = useCallback(
    (gx: number, gy: number, color: string, n: number, cell: number) => {
      const e = eng.current;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.6 + Math.random() * 2.2) * (cell / 18);
        e.particles.push({
          x: (gx + 0.5) * cell,
          y: (gy + 0.5) * cell,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          maxLife: 380 + Math.random() * 320,
          size: 1.5 + Math.random() * 2.5,
          color,
        });
      }
    },
    [],
  );

  const addFloat = useCallback(
    (gx: number, gy: number, text: string, color: string, cell: number) => {
      eng.current.floats.push({
        x: (gx + 0.5) * cell,
        y: (gy + 0.2) * cell,
        text,
        life: 0,
        maxLife: 900,
        color,
      });
    },
    [],
  );

  const start = useCallback(() => {
    const fresh = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    const e = eng.current;
    e.snake = fresh.map((p) => ({ ...p }));
    e.prev = fresh.map((p) => ({ ...p }));
    e.dir = DIRS.right;
    e.pendingDir = null;
    e.food = randomFood(fresh);
    e.golden = null;
    e.goldenTtl = 0;
    e.combo = 1;
    e.comboTtl = 0;
    e.score = 0;
    e.alive = true;
    e.running = true;
    e.particles = [];
    e.floats = [];
    e.shake = 0;
    e.lastTick = performance.now();
    setScore(0);
    setAlive(true);
    setRunning(true);
  }, []);

  /* One logic step — identical rules to the original. */
  const step = useCallback(
    (cell: number) => {
      const e = eng.current;
      if (!e.running || !e.alive) return;

      if (e.pendingDir) {
        const d = e.pendingDir;
        if (!(e.dir.dx === -d.dx && e.dir.dy === -d.dy)) e.dir = d;
        e.pendingDir = null;
      }

      if (e.goldenTtl > 0 && --e.goldenTtl === 0) e.golden = null;
      if (e.comboTtl > 0 && --e.comboTtl === 0) e.combo = 1;

      const head = e.snake[0];
      const raw = { x: head.x + e.dir.dx, y: head.y + e.dir.dy };
      const next =
        e.walls === "wrap"
          ? { x: (raw.x + COLS) % COLS, y: (raw.y + ROWS) % ROWS }
          : raw;
      const hitWall =
        e.walls === "solid" &&
        (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS);
      const ate = samePos(next, e.food);
      const ateGolden = e.golden !== null && samePos(next, e.golden);
      const body = ate || ateGolden ? e.snake : e.snake.slice(0, -1);

      if (hitWall || body.some((p) => samePos(p, next))) {
        // Death — shatter the snake into particles + shake.
        e.alive = false;
        e.running = false;
        e.shake = 14;
        e.deadAt = performance.now();
        for (const p of e.snake) {
          spawnBurst(p.x, p.y, ARCADE, 3, cell);
          if (Math.random() < 0.4) spawnBurst(p.x, p.y, SHIMMER, 2, cell);
        }
        setAlive(false);
        setRunning(false);
        setBest((b) => {
          const nb = Math.max(b, e.score);
          localStorage.setItem(BEST_KEY, String(nb));
          return nb;
        });
        return;
      }

      if (ate || ateGolden) {
        const gain = ateGolden ? 3 * e.combo : e.combo;
        e.score += gain;
        setScore(e.score);
        addFloat(
          next.x,
          next.y,
          `+${gain}`,
          ateGolden ? GOLD : ARCADE,
          cell,
        );
        spawnBurst(
          next.x,
          next.y,
          ateGolden ? GOLD : FOOD_RED,
          ateGolden ? 22 : 14,
          cell,
        );
        e.combo = Math.min(e.combo + 1, 5);
        e.comboTtl = 25;
        if (ateGolden) {
          e.golden = null;
        } else {
          const grown = [next, ...e.snake];
          e.food = randomFood(grown);
          if (e.golden === null && Math.random() < 0.12) {
            e.goldenTtl = 45;
            e.golden = randomFood([...grown, e.food]);
          }
        }
      }

      e.prev = e.snake.map((p) => ({ ...p }));
      e.snake = [next, ...(ate || ateGolden ? e.snake : e.snake.slice(0, -1))];
    },
    [addFloat, spawnBurst],
  );

  const steer = useCallback((d: Dir) => {
    const e = eng.current;
    // Queue the turn — applied at the next tick, no 180° reversals.
    e.pendingDir = d;
  }, []);

  /* ---------- render loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let cell = 0;
    let dpr = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.floor(rect.width);
      cell = w / COLS;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(w * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    /** Interpolated pixel center of segment i. */
    const segCenter = (e: typeof eng.current, i: number, t: number) => {
      const cur = e.snake[i];
      const prv = e.prev[i] ?? cur;
      // Wrapped segments snap instead of lerping across the board.
      const wrapped =
        Math.abs(cur.x - prv.x) > 1 || Math.abs(cur.y - prv.y) > 1;
      const gx = wrapped ? cur.x : prv.x + (cur.x - prv.x) * t;
      const gy = wrapped ? cur.y : prv.y + (cur.y - prv.y) * t;
      return { x: (gx + 0.5) * cell, y: (gy + 0.5) * cell };
    };

    const draw = (now: number) => {
      const e = eng.current;
      const interval = stepMs(e.score, e.speed.mult);

      // Advance logic on its own cadence.
      if (e.running && e.alive && now - e.lastTick >= interval) {
        e.lastTick = now - ((now - e.lastTick) % interval);
        step(cell);
      }
      const t = e.running && e.alive
        ? easeOut(Math.min(1, (now - e.lastTick) / interval))
        : 1;

      ctx.clearRect(0, 0, w, w);

      // Screen shake (death).
      if (e.shake > 0.3) {
        e.shake *= 0.88;
        ctx.save();
        ctx.translate(
          (Math.random() - 0.5) * e.shake,
          (Math.random() - 0.5) * e.shake,
        );
      } else if (e.shake !== 0) {
        e.shake = 0;
      }
      const shaken = e.shake > 0.3;

      /* --- board --- */
      ctx.fillStyle = INK;
      const radius = 14;
      ctx.beginPath();
      ctx.roundRect(0, 0, w, w, radius);
      ctx.fill();
      // Subtle grid.
      ctx.strokeStyle = "rgba(34,211,238,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < COLS; i++) {
        ctx.moveTo(i * cell + 0.5, 0);
        ctx.lineTo(i * cell + 0.5, w);
        ctx.moveTo(0, i * cell + 0.5);
        ctx.lineTo(w, i * cell + 0.5);
      }
      ctx.stroke();
      // Ambient breathing vignette.
      const breathe = 0.5 + 0.5 * Math.sin(now / 1600);
      const vg = ctx.createRadialGradient(
        w / 2, w / 2, w * 0.2, w / 2, w / 2, w * 0.75,
      );
      vg.addColorStop(0, "rgba(34,211,238,0)");
      vg.addColorStop(1, `rgba(34,211,238,${0.05 + breathe * 0.03})`);
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.roundRect(0, 0, w, w, radius);
      ctx.fill();

      const showSnake = e.alive || now - e.deadAt < 120;

      /* --- food --- */
      if (e.alive) {
        const pulse = 1 + 0.14 * Math.sin(now / 240);
        const fx = (e.food.x + 0.5) * cell;
        const fy = (e.food.y + 0.5) * cell;
        const fr = cell * 0.3 * pulse;
        ctx.save();
        ctx.shadowColor = FOOD_RED;
        ctx.shadowBlur = 14 + 6 * Math.sin(now / 240);
        const fg = ctx.createRadialGradient(
          fx - fr * 0.3, fy - fr * 0.3, fr * 0.1, fx, fy, fr,
        );
        fg.addColorStop(0, "#fecdd3");
        fg.addColorStop(0.55, FOOD_RED);
        fg.addColorStop(1, "#9f1239");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        /* golden food — diamond with orbiting sparkles */
        if (e.golden) {
          const gx = (e.golden.x + 0.5) * cell;
          const gy = (e.golden.y + 0.5) * cell;
          const gr = cell * 0.34 * (1 + 0.12 * Math.sin(now / 200));
          const blink = 0.55 + 0.45 * Math.sin(now / 160);
          ctx.save();
          ctx.shadowColor = GOLD;
          ctx.shadowBlur = 18 * blink;
          ctx.translate(gx, gy);
          ctx.rotate(Math.PI / 4 + 0.25 * Math.sin(now / 500));
          const gg = ctx.createLinearGradient(-gr, -gr, gr, gr);
          gg.addColorStop(0, "#fef9c3");
          gg.addColorStop(0.5, GOLD);
          gg.addColorStop(1, "#a16207");
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.roundRect(-gr * 0.72, -gr * 0.72, gr * 1.44, gr * 1.44, 4);
          ctx.fill();
          ctx.restore();
          // Sparkles.
          for (let s = 0; s < 3; s++) {
            const a = now / 420 + (s * Math.PI * 2) / 3;
            const sx = gx + Math.cos(a) * cell * 0.62;
            const sy = gy + Math.sin(a) * cell * 0.62;
            const sr = 1.6 + 1.2 * Math.sin(now / 150 + s * 2);
            ctx.fillStyle = `rgba(254,240,138,${0.5 + 0.5 * Math.sin(now / 150 + s)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.4, sr), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      /* --- snake body: tapered flowing ribbon --- */
      if (showSnake && e.snake.length > 1) {
        const n = e.snake.length;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Draw tail-first so the head sits on top.
        for (let i = n - 1; i >= 1; i--) {
          const p0 = segCenter(e, i, t);
          const p1 = segCenter(e, i - 1, t);
          const frac = i / n; // 0 head-side → 1 tail
          const width = cell * (0.78 - 0.5 * Math.pow(frac, 1.4));
          ctx.strokeStyle = lerpColor(ARCADE, ARCADE_DIM, Math.pow(frac, 0.8));
          ctx.lineWidth = Math.max(2, width);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
        // Belly highlight — thin bright line along the top of the body.
        ctx.strokeStyle = "rgba(165,243,252,0.28)";
        for (let i = n - 1; i >= 1; i--) {
          const p0 = segCenter(e, i, t);
          const p1 = segCenter(e, i - 1, t);
          const frac = i / n;
          ctx.lineWidth = Math.max(1, cell * (0.2 - 0.12 * frac));
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y - cell * 0.16);
          ctx.lineTo(p1.x, p1.y - cell * 0.16);
          ctx.stroke();
        }
      }

      /* --- head: glowing, eyes track direction --- */
      if (showSnake) {
        const hp = segCenter(e, 0, t);
        const hr = cell * 0.46;
        const d = e.dir;
        ctx.save();
        ctx.shadowColor = ARCADE;
        ctx.shadowBlur = 20;
        const hg = ctx.createRadialGradient(
          hp.x - hr * 0.35, hp.y - hr * 0.35, hr * 0.15, hp.x, hp.y, hr,
        );
        hg.addColorStop(0, SHIMMER);
        hg.addColorStop(0.5, ARCADE);
        hg.addColorStop(1, "#0e7490");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, hr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Eyes — offset forward + sideways from the head center.
        const ex = d.dx;
        const ey = d.dy;
        const px = -ey;
        const py = ex;
        for (const s of [-1, 1]) {
          const cxp = hp.x + ex * hr * 0.42 + px * s * hr * 0.52;
          const cyp = hp.y + ey * hr * 0.42 + py * s * hr * 0.52;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(cxp, cyp, hr * 0.30, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0b0e14";
          ctx.beginPath();
          ctx.arc(
            cxp + ex * hr * 0.12,
            cyp + ey * hr * 0.12,
            hr * 0.155,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        /* speed lines at high pace */
        const ms = stepMs(e.score, e.speed.mult);
        if (e.running && e.alive && ms < 110) {
          const lines = ms < 80 ? 5 : 3;
          ctx.strokeStyle = "rgba(34,211,238,0.35)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          for (let l = 0; l < lines; l++) {
            const off = (l - (lines - 1) / 2) * cell * 0.7;
            const bx = hp.x - ex * hr * (1.6 + ((now / 14 + l * 37) % 26) / 13);
            const by = hp.y - ey * hr * (1.6 + ((now / 14 + l * 37) % 26) / 13);
            ctx.beginPath();
            ctx.moveTo(bx + px * off, by + py * off);
            ctx.lineTo(
              bx - ex * cell * 0.5 + px * off,
              by - ey * cell * 0.5 + py * off,
            );
            ctx.stroke();
          }
        }
      }

      /* --- particles --- */
      const dt = 16.7;
      e.particles = e.particles.filter((p) => {
        p.life += dt;
        if (p.life >= p.maxLife) return false;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        const a = 1 - p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a + 0.4, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;

      /* --- floating score text --- */
      e.floats = e.floats.filter((f) => {
        f.life += dt;
        if (f.life >= f.maxLife) return false;
        const k = f.life / f.maxLife;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = f.color;
        ctx.font = `700 ${Math.max(12, cell * 0.72)}px ui-sans-serif, system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y - k * cell * 1.6);
        return true;
      });
      ctx.globalAlpha = 1;

      if (shaken) ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [step]);

  /* ---------- keyboard ---------- */
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
    const onKey = (ev: KeyboardEvent) => {
      const d = keys[ev.key];
      if (!d) return;
      ev.preventDefault();
      steer(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steer]);

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
        ref={wrapRef}
        className="touch-none rounded-2xl border border-edge bg-panel p-2.5 select-none"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const st = touchRef.current;
          touchRef.current = null;
          if (!st) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - st.x;
          const dy = t.clientY - st.y;
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
        <canvas ref={canvasRef} className="block w-full rounded-xl" />
      </div>

      {!alive ? (
        <div className="mt-4 text-center">
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
        <div className="mt-4 text-center">
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
