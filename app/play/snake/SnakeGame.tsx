"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Canvas Snake — 60fps minimum, 120fps capable.
   Fixed-timestep logic + interpolated rendering for buttery movement.
   Streak system: every 3 foods in a row spawns a BIG bonus food (5x,
   timed) — the core objective loop. Particles, screen shake, floating
   score text, glowing head with directional eyes. */

const COLS = 20;
const ROWS = 20;
const BASE_MS = 170;
const MIN_MS = 70;
const DOTS_PER_LEVEL = 5;
const SPEEDUP_MS = 15;
const STREAK_FOR_BONUS = 3;

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

interface Pos { x: number; y: number }
const samePos = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;

function stepMs(score: number, mult: number): number {
  const levels = Math.floor(score / DOTS_PER_LEVEL);
  return Math.max(MIN_MS, BASE_MS - levels * SPEEDUP_MS) * mult;
}

function randomFood(blocked: Pos[]): Pos {
  const taken = new Set(blocked.map((p) => p.y * COLS + p.x));
  while (true) {
    const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!taken.has(p.y * COLS + p.x)) return p;
  }
}

const BEST_KEY = "5in1-web-snake-best";

/* ---------- particles ---------- */
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string;
}
interface FloatText { x: number; y: number; text: string; life: number; maxLife: number }

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [alive, setAlive] = useState(true);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(SPEEDS[1]);
  const [walls, setWalls] = useState<Walls>("solid");
  const [streak, setStreak] = useState(0);
  const [scorePop, setScorePop] = useState(0);

  // All mutable game state lives in a ref — zero re-renders per frame.
  const G = useRef({
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }] as Pos[],
    prevSnake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }] as Pos[],
    dir: DIRS.right as Dir,
    pendingDir: null as Dir | null,
    food: { x: 15, y: 10 } as Pos,
    golden: null as Pos | null,
    bonus: null as Pos | null,
    bonusTtl: 0,
    goldenTtl: 0,
    score: 0,
    streak: 0,
    combo: 1,
    comboTtl: 0,
    alive: true,
    running: false,
    speedMult: 1,
    walls: "solid" as Walls,
    stepAcc: 0,
    lastStep: 0,
    interp: 1, // 0..1 interpolation between steps
    particles: [] as Particle[],
    texts: [] as FloatText[],
    shake: 0,
    time: 0,
  });

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem(BEST_KEY) ?? 0);
    if (saved > 0) setBest(saved);
  }, []);

  const syncHud = useCallback(() => {
    const g = G.current;
    setScore(g.score);
    setStreak(g.streak);
    setScorePop((p) => p + 1);
  }, []);

  const start = useCallback(() => {
    const fresh = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    const g = G.current;
    g.snake = fresh.map((p) => ({ ...p }));
    g.prevSnake = fresh.map((p) => ({ ...p }));
    g.dir = DIRS.right;
    g.pendingDir = null;
    g.food = randomFood(fresh);
    g.golden = null;
    g.bonus = null;
    g.bonusTtl = 0;
    g.goldenTtl = 0;
    g.score = 0;
    g.streak = 0;
    g.combo = 1;
    g.comboTtl = 0;
    g.alive = true;
    g.running = true;
    g.stepAcc = 0;
    g.interp = 1;
    g.particles = [];
    g.texts = [];
    g.shake = 0;
    setScore(0);
    setStreak(0);
    setAlive(true);
    setRunning(true);
  }, []);

  const steer = useCallback((d: Dir) => {
    const g = G.current;
    const cur = g.pendingDir ?? g.dir;
    if (cur.dx === -d.dx && cur.dy === -d.dy) return;
    g.pendingDir = d;
  }, []);

  /* ---------- one logic step ---------- */
  const step = useCallback(() => {
    const g = G.current;
    if (!g.running || !g.alive) return;

    if (g.pendingDir) { g.dir = g.pendingDir; g.pendingDir = null; }
    if (g.goldenTtl > 0 && --g.goldenTtl === 0) g.golden = null;
    if (g.bonusTtl > 0 && --g.bonusTtl === 0) g.bonus = null;
    if (g.comboTtl > 0 && --g.comboTtl === 0) g.combo = 1;

    g.prevSnake = g.snake.map((p) => ({ ...p }));

    const head = g.snake[0];
    const raw = { x: head.x + g.dir.dx, y: head.y + g.dir.dy };
    const next = g.walls === "wrap"
      ? { x: (raw.x + COLS) % COLS, y: (raw.y + ROWS) % ROWS }
      : raw;
    const hitWall = g.walls === "solid" &&
      (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS);
    const ate = samePos(next, g.food);
    const ateGolden = g.golden !== null && samePos(next, g.golden);
    const ateBonus = g.bonus !== null && samePos(next, g.bonus);
    const ateAny = ate || ateGolden || ateBonus;
    const body = ateAny ? g.snake : g.snake.slice(0, -1);

    if (hitWall || body.some((p) => samePos(p, next))) {
      g.alive = false;
      g.running = false;
      g.shake = 14;
      // Death burst from the head.
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 4;
        g.particles.push({
          x: next.x + 0.5, y: next.y + 0.5,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, maxLife: 40 + Math.random() * 30,
          size: 0.06 + Math.random() * 0.1,
          color: Math.random() < 0.5 ? "#22d3ee" : "#0e7490",
        });
      }
      setAlive(false);
      setRunning(false);
      setStreak(0);
      setBest((b) => {
        const nb = Math.max(b, g.score);
        try { localStorage.setItem(BEST_KEY, String(nb)); } catch { /* noop */ }
        return nb;
      });
      return;
    }

    if (ateAny) {
      let gain: number;
      let label: string;
      if (ateBonus) {
        gain = 5 * g.combo;
        label = `+${gain} BONUS`;
        g.bonus = null;
        g.bonusTtl = 0;
      } else if (ateGolden) {
        gain = 3 * g.combo;
        label = `+${gain}`;
        g.golden = null;
      } else {
        gain = g.combo;
        label = `+${gain}`;
      }
      g.score += gain;
      g.streak += 1;
      g.combo = Math.min(g.combo + 1, 5);
      g.comboTtl = 25;

      // Eat particles.
      for (let i = 0; i < (ateBonus ? 26 : 12); i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.8 + Math.random() * 2.5;
        g.particles.push({
          x: next.x + 0.5, y: next.y + 0.5,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, maxLife: 25 + Math.random() * 20,
          size: 0.05 + Math.random() * 0.08,
          color: ateBonus ? "#facc15" : ateGolden ? "#fde68a" : "#22d3ee",
        });
      }
      g.texts.push({ x: next.x + 0.5, y: next.y, text: label, life: 0, maxLife: 50 });

      // Respawn eaten food.
      const occupied = [...g.snake, next];
      if (ate) {
        g.food = randomFood(occupied);
        // 12% chance of a golden side-spawn.
        if (g.golden === null && Math.random() < 0.12) {
          g.goldenTtl = 45;
          g.golden = randomFood([...occupied, g.food]);
        }
      }
      // STREAK: every 3 in a row spawns the BIG bonus food (timed).
      if (g.streak > 0 && g.streak % STREAK_FOR_BONUS === 0 && g.bonus === null) {
        g.bonusTtl = 120; // ~10s at normal pace
        g.bonus = randomFood([...occupied, g.food, ...(g.golden ? [g.golden] : [])]);
        g.texts.push({ x: 10, y: 10, text: "BONUS FOOD!", life: 0, maxLife: 70 });
      }
      syncHud();
    }

    g.snake = [next, ...(ateAny ? g.snake : g.snake.slice(0, -1))];
    g.interp = 0;
  }, [syncHud]);

  /* ---------- render loop: rAF, interpolated ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let lastT = performance.now();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      canvas.width = w * dpr;
      canvas.height = w * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const g = G.current;
      const dt = Math.min(100, t - lastT);
      lastT = t;
      g.time += dt / 1000;

      // Fixed-timestep logic.
      if (g.running && g.alive) {
        g.stepAcc += dt;
        const ms = stepMs(g.score, g.speedMult);
        while (g.stepAcc >= ms) {
          g.stepAcc -= ms;
          step();
        }
        g.interp = Math.min(1, g.stepAcc / ms);
      }

      // Particles + texts always update (death anim plays when not running).
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.life++;
        p.x += (p.vx * dt) / 60;
        p.y += (p.vy * dt) / 60;
        p.vx *= 0.96; p.vy *= 0.96;
        if (p.life >= p.maxLife) g.particles.splice(i, 1);
      }
      for (let i = g.texts.length - 1; i >= 0; i--) {
        const ft = g.texts[i];
        ft.life++;
        ft.y -= (dt / 1000) * 1.2;
        if (ft.life >= ft.maxLife) g.texts.splice(i, 1);
      }
      if (g.shake > 0) g.shake = Math.max(0, g.shake - (dt / 1000) * 30);

      // ---- draw ----
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = canvas.width, H = canvas.height;
      const cw = W / COLS, ch = H / ROWS;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cssW = W / dpr, cssH = H / dpr;
      const cellW = cssW / COLS, cellH = cssH / ROWS;

      // Screen shake.
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
      }

      // Board.
      ctx.fillStyle = "#0b0e14";
      ctx.fillRect(-20, -20, cssW + 40, cssH + 40);
      ctx.strokeStyle = "rgba(34,211,238,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < COLS; x++) { ctx.moveTo(x * cellW, 0); ctx.lineTo(x * cellW, cssH); }
      for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, y * cellH); ctx.lineTo(cssW, y * cellH); }
      ctx.stroke();

      const ease = g.interp * g.interp * (3 - 2 * g.interp); // smoothstep
      const px = (i: number) => {
        const c = g.snake[i], p = g.prevSnake[i] ?? c;
        // Wrap teleport: don't lerp across the board.
        if (Math.abs(c.x - p.x) > 1 || Math.abs(c.y - p.y) > 1) return c;
        return { x: p.x + (c.x - p.x) * ease, y: p.y + (c.y - p.y) * ease };
      };

      // Body as a tapered ribbon.
      const n = g.snake.length;
      if (n > 0) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = n - 1; i >= 1; i--) {
          const a = px(i), b = px(i - 1);
          const t = i / n; // 0 head → 1 tail
          const wdt = cellW * (0.72 - t * 0.42);
          const grad = ctx.createLinearGradient(a.x * cellW, 0, b.x * cellW, 0);
          grad.addColorStop(0, "#0e7490");
          grad.addColorStop(1, "#22d3ee");
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(1.5, wdt);
          ctx.beginPath();
          ctx.moveTo((a.x + 0.5) * cellW, (a.y + 0.5) * cellH);
          ctx.lineTo((b.x + 0.5) * cellW, (b.y + 0.5) * cellH);
          ctx.stroke();
        }
        // Head: glowing circle + directional eyes.
        const h = px(0);
        const hx = (h.x + 0.5) * cellW, hy = (h.y + 0.5) * cellH;
        const hr = cellW * 0.42;
        const hg = ctx.createRadialGradient(hx, hy, hr * 0.2, hx, hy, hr * 1.8);
        hg.addColorStop(0, "rgba(34,211,238,0.5)");
        hg.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(hx, hy, hr * 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
        // Eyes look along the direction.
        const d = g.dir;
        const ex = d.dx * hr * 0.42, ey = d.dy * hr * 0.42;
        const perpX = -d.dy, perpY = d.dx;
        ctx.fillStyle = "#0b0e14";
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(hx + ex + perpX * hr * 0.32 * s, hy + ey + perpY * hr * 0.32 * s, hr * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#ffffff";
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(hx + ex + perpX * hr * 0.32 * s + ex * 0.25, hy + ey + perpY * hr * 0.32 * s + ey * 0.25, hr * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Food: pulsing red.
      const pulse = 1 + Math.sin(g.time * 6) * 0.12;
      const fx = (g.food.x + 0.5) * cellW, fy = (g.food.y + 0.5) * cellH;
      const fr = cellW * 0.3 * pulse;
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 2.2);
      fg.addColorStop(0, "rgba(239,68,68,0.55)");
      fg.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(fx, fy, fr * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();

      // Golden food: rotating diamond + sparkles.
      if (g.golden) {
        const gx = (g.golden.x + 0.5) * cellW, gy = (g.golden.y + 0.5) * cellH;
        const gr = cellW * 0.32 * (1 + Math.sin(g.time * 8) * 0.1);
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(g.time * 2);
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#facc15"; ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(0, -gr); ctx.lineTo(gr, 0); ctx.lineTo(0, gr); ctx.lineTo(-gr, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // BONUS food: big, golden, urgent pulse + ring timer.
      if (g.bonus) {
        const bx = (g.bonus.x + 0.5) * cellW, by = (g.bonus.y + 0.5) * cellH;
        const br = cellW * 0.52 * (1 + Math.sin(g.time * 10) * 0.08);
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2.4);
        bg.addColorStop(0, "rgba(250,204,21,0.6)");
        bg.addColorStop(1, "rgba(250,204,21,0)");
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.arc(bx, by, br * 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(g.time * 3);
        ctx.fillStyle = "#fde047";
        ctx.shadowColor = "#facc15"; ctx.shadowBlur = 18;
        const s = br;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const rr = k % 2 === 0 ? s : s * 0.55;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;
        // TTL ring.
        const frac = g.bonusTtl / 120;
        ctx.strokeStyle = `rgba(250,204,21,${0.35 + frac * 0.5})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bx, by, br * 1.7, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
      }

      // Particles.
      for (const p of g.particles) {
        const a = 1 - p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc((p.x) * cellW, (p.y) * cellH, p.size * cellW * a + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Floating texts.
      ctx.textAlign = "center";
      ctx.font = `700 ${Math.max(11, cellW * 0.62)}px system-ui, sans-serif`;
      for (const ft of g.texts) {
        const a = 1 - ft.life / ft.maxLife;
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = ft.text.includes("BONUS") ? "#facc15" : "#e8ecf3";
        ctx.fillText(ft.text, ft.x * cellW, ft.y * cellH);
      }
      ctx.globalAlpha = 1;

      // Vignette.
      const vg = ctx.createRadialGradient(cssW / 2, cssH / 2, cssW * 0.35, cssW / 2, cssH / 2, cssW * 0.75);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, cssW, cssH);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [step]);

  // Keyboard: arrows/WASD steer, SPACE starts or restarts.
  useEffect(() => {
    const keys: Record<string, Dir> = {
      ArrowUp: DIRS.up, ArrowDown: DIRS.down, ArrowLeft: DIRS.left,
      ArrowRight: DIRS.right, w: DIRS.up, s: DIRS.down, a: DIRS.left, d: DIRS.right,
      W: DIRS.up, S: DIRS.down, A: DIRS.left, D: DIRS.right,
    };
    const onKey = (e: KeyboardEvent) => {
      const d = keys[e.key];
      if (d) {
        e.preventDefault();
        steer(d);
        return;
      }
      if (e.code === "Space" || e.key === " ") {
        const g = G.current;
        if (!g.running) {
          e.preventDefault();
          start();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steer, start]);

  // Keep speed/walls in sync with the sim ref.
  useEffect(() => { G.current.speedMult = speed.mult; }, [speed]);
  useEffect(() => { G.current.walls = walls; }, [walls]);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="pop-in mb-4 flex items-center justify-center gap-2.5" style={{ ["--pop-delay" as string]: "60ms" }}>
        <div className="rounded-xl border border-edge bg-panel px-4 py-2">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Score</p>
          <p key={scorePop} className="score-pop text-xl font-extrabold text-white">{score}</p>
        </div>
        <div className="rounded-xl border border-edge bg-panel px-4 py-2">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Best</p>
          <p className="text-xl font-extrabold text-arcade">{best}</p>
        </div>
        <div className={`rounded-xl border px-4 py-2 transition-all ${streak >= STREAK_FOR_BONUS ? "border-yellow-400/60 bg-yellow-400/10 streak-glow" : "border-edge bg-panel"}`}>
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Streak</p>
          <p className={`text-xl font-extrabold ${streak >= 2 ? "text-yellow-300" : "text-slate-300"}`}>
            {streak}x
          </p>
        </div>
      </div>
      {streak > 0 && streak < STREAK_FOR_BONUS && (
        <p className="mb-2 text-center text-xs font-semibold text-slate-400">
          {STREAK_FOR_BONUS - streak} more for <span className="text-yellow-300">BONUS FOOD</span>
        </p>
      )}

      {!alive ? (
        <div className="pop-in mb-4 text-center" style={{ ["--pop-delay" as string]: "100ms" }}>
          <p className="gameover-title text-2xl font-extrabold text-white">GAME OVER</p>
          <p className="mt-1 text-sm text-slate-400">
            Scored {score} · best streak {streak}x · press{" "}
            <kbd className="rounded border border-edge bg-panel px-1.5 py-0.5 font-mono text-xs text-slate-200">SPACE</kbd>{" "}
            to play again
          </p>
          <button type="button" onClick={start} className="btn-alive mt-4 rounded-xl bg-arcade px-8 py-2.5 text-sm font-bold text-ink">
            Play again
          </button>
        </div>
      
      ) : null}

      <div className="pop-in mb-4 flex flex-wrap items-center justify-center gap-2 px-2" style={{ ["--pop-delay" as string]: "200ms" }}>
        {SPEEDS.map((sp) => (
          <button
            key={sp.label}
            type="button"
            onClick={() => setSpeed(sp)}
            className={`btn-alive rounded-lg border px-3 py-1.5 text-xs font-semibold ${
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
            className={`btn-alive rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${
              walls === w
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {w} walls
          </button>
        ))}
      </div>

      <div
        ref={wrapRef}
        className="pop-in touch-none overflow-hidden rounded-2xl border border-edge bg-panel p-2.5 select-none"
        style={{ ["--pop-delay" as string]: "140ms" }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const startT = touchRef.current;
          touchRef.current = null;
          if (!startT) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - startT.x;
          const dy = t.clientY - startT.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS.right : DIRS.left) : (dy > 0 ? DIRS.down : DIRS.up));
        }}
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="block w-full cursor-pointer rounded-xl focus:ring-2 focus:ring-arcade/60 focus:outline-none"
          aria-label="Snake game board. Click the board, then press space to start."
          onClick={() => canvasRef.current?.focus()}
        />
      </div>

      {/* D-pad for touch screens — red, 20% opacity, above overlays */}
      <div className="relative z-20 mx-auto mt-1 grid w-36 grid-cols-3 gap-1.5 sm:hidden">
        <div />
        <button type="button" aria-label="Up" onTouchStart={() => steer(DIRS.up)} onClick={() => steer(DIRS.up)} className="btn-alive rounded-lg border border-red-500/40 bg-red-500/20 py-2 text-lg text-red-300">↑</button>
        <div />
        <button type="button" aria-label="Left" onTouchStart={() => steer(DIRS.left)} onClick={() => steer(DIRS.left)} className="btn-alive rounded-lg border border-red-500/40 bg-red-500/20 py-2 text-lg text-red-300">←</button>
        <button type="button" aria-label="Down" onTouchStart={() => steer(DIRS.down)} onClick={() => steer(DIRS.down)} className="btn-alive rounded-lg border border-red-500/40 bg-red-500/20 py-2 text-lg text-red-300">↓</button>
        <button type="button" aria-label="Right" onTouchStart={() => steer(DIRS.right)} onClick={() => steer(DIRS.right)} className="btn-alive rounded-lg border border-red-500/40 bg-red-500/20 py-2 text-lg text-red-300">→</button>
      </div>
      {alive && !running ? (
        <div className="pop-in mt-4 text-center" style={{ ["--pop-delay" as string]: "100ms" }}>
          <p className="text-sm text-slate-400">
            Arrows / WASD / swipe to steer. Click the board + press{" "}
            <kbd className="rounded border border-edge bg-panel px-1.5 py-0.5 font-mono text-xs text-slate-200">SPACE</kbd>{" "}
            to start. Eat {STREAK_FOR_BONUS} in a row for{" "}
            <span className="font-bold text-yellow-300">BONUS FOOD</span> (5x).
          </p>
          <button type="button" onClick={start} className="btn-alive mt-4 rounded-xl bg-arcade px-8 py-2.5 text-sm font-bold text-ink">
            Start
          </button>
        </div>
      
      ) : null}

    </div>
  );
}
