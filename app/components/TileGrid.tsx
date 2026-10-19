"use client";

import { useEffect, useRef } from "react";

/* Living game-tile grid: a fixed full-viewport canvas of square tiles, each
   running a tiny live animation drawn from the five 5IN1 games — a slithering
   snake ribbon, flipping memory cards, drawing X/O marks, a dropping
   Connect 4 disc, and rolling guess digits. Tiles breathe faintly at rest;
   the cursor lights them up, speeds their animation, and fires expanding
   ripples. Single rAF loop, no shadowBlur, DPR capped for 60fps.
   Rendered once in the root layout behind everything. Static grid when the
   user prefers reduced motion; ambient-only on touch devices. */

const CYAN = "34, 211, 238";
const INDIGO = "129, 140, 248";
const AMBER = "251, 191, 36";
const ROSE = "244, 63, 94";

const RADIUS = 140; // px cursor influence
const HEAT_DECAY = 0.94; // per-frame heat decay
const RIPPLE_MAX = 170; // px ripple travel
const RIPPLE_SPEED = 320; // px per second
const RIPPLE_BAND = 30; // px glow band around the ring

// Stable per-tile pseudo random 0..1 from cell coords.
function rand2(cx: number, cy: number, salt: number): number {
  let h = (cx * 374761393 + cy * 668265263 + salt * 974634211) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const tileType = (cx: number, cy: number): number =>
  Math.floor(rand2(cx, cy, 7) * 5);

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function rr(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof g.roundRect === "function") {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  } else {
    g.beginPath();
    g.rect(x, y, w, h);
  }
}

/* ---- Mini game animations. x,y = tile top-left, s = tile size,
      phase advances with time (faster under the cursor), a = 0..1 alpha. */

function drawSnake(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
  a: number
): void {
  const pad = s * 0.22;
  const inner = s - pad * 2;
  const cy = y + s / 2;
  const segs = 4;
  const gap = inner * 0.24;
  const travel = inner * 1.7;
  const off = (phase * s * 0.45) % travel;
  for (let i = segs - 1; i >= 0; i--) {
    let rel = (off - i * gap) % travel;
    if (rel < 0) rel += travel;
    const sx = x + pad - inner * 0.35 + rel;
    if (sx > x + pad + inner + inner * 0.15) continue;
    const sy = cy + Math.sin(sx * 0.09 + phase * 3) * inner * 0.09;
    const r = inner * 0.115 * (1 - i * 0.16);
    g.fillStyle = `rgba(${CYAN},${(a * (1 - i * 0.18)).toFixed(3)})`;
    g.beginPath();
    g.arc(sx, sy, r, 0, Math.PI * 2);
    g.fill();
  }
  // Head glow dot.
  let hrel = off % travel;
  if (hrel < 0) hrel += travel;
  const hx = x + pad - inner * 0.35 + hrel;
  if (hx <= x + pad + inner + inner * 0.15) {
    const hy = cy + Math.sin(hx * 0.09 + phase * 3) * inner * 0.09;
    g.fillStyle = `rgba(${CYAN},${(a * 0.35).toFixed(3)})`;
    g.beginPath();
    g.arc(hx, hy, inner * 0.2, 0, Math.PI * 2);
    g.fill();
  }
}

function drawMemory(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
  a: number
): void {
  const pad = s * 0.22;
  const inner = s - pad * 2;
  const cy = y + s / 2;
  const w = inner * 0.3;
  const h = inner * 0.54;
  for (let i = 0; i < 2; i++) {
    const cx = x + pad + inner * (i === 0 ? 0.24 : 0.76);
    const flip = Math.cos(phase * 1.7 + i * Math.PI);
    const sx = Math.max(0.14, Math.abs(flip));
    const front = flip > 0;
    const col = front ? CYAN : INDIGO;
    g.save();
    g.translate(cx, cy);
    g.scale(sx, 1);
    g.fillStyle = `rgba(${col},${(a * 0.9).toFixed(3)})`;
    rr(g, -w / 2, -h / 2, w, h, 3);
    g.fill();
    if (front) {
      g.fillStyle = `rgba(11, 14, 20,${(a * 0.85).toFixed(3)})`;
      g.beginPath();
      g.arc(0, 0, w * 0.16, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
}

function drawTicTacToe(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
  a: number
): void {
  const pad = s * 0.24;
  const inner = s - pad * 2;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const T = 4.2;
  const t = ((phase % T) + T) % T;
  const half = t < T / 2;
  const prog = easeOutCubic(Math.min(1, (half ? t : t - T / 2) / (T / 2) / 0.45));
  const fade = Math.min(1, Math.max(0, 1 - ((half ? t : t - T / 2) / (T / 2) - 0.72) / 0.28));
  const alpha = a * Math.min(1, prog * 4) * fade;
  if (alpha <= 0.01) return;
  const r = inner * 0.32;
  g.strokeStyle = `rgba(${half ? CYAN : INDIGO},${alpha.toFixed(3)})`;
  g.lineWidth = Math.max(2, s * 0.045);
  g.lineCap = "round";
  if (half) {
    // X draws on.
    const len = r * 2 * Math.SQRT2;
    g.setLineDash([len]);
    g.lineDashOffset = len * (1 - prog);
    g.beginPath();
    g.moveTo(cx - r, cy - r);
    g.lineTo(cx + r, cy + r);
    g.moveTo(cx + r, cy - r);
    g.lineTo(cx - r, cy + r);
    g.stroke();
    g.setLineDash([]);
  } else {
    // O draws on.
    g.beginPath();
    g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
    g.stroke();
  }
}

function drawConnect4(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
  a: number
): void {
  const pad = s * 0.22;
  const inner = s - pad * 2;
  const cx = x + s / 2;
  const top = y + pad * 0.7;
  const rest = y + s - pad - inner * 0.2;
  const T = 2.6;
  const t = ((phase % T) + T) % T;
  const cyc = Math.floor(phase / T);
  const col = cyc % 2 === 0 ? CYAN : AMBER;
  const dp = t / T;
  let py: number;
  let alpha = a;
  if (dp < 0.45) {
    py = top + easeOutBounce(dp / 0.45) * (rest - top);
  } else {
    py = rest;
    if (dp > 0.78) alpha = a * (1 - (dp - 0.78) / 0.22);
  }
  if (alpha <= 0.01) return;
  const r = inner * 0.21;
  g.fillStyle = `rgba(${col},${alpha.toFixed(3)})`;
  g.beginPath();
  g.arc(cx, py, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = `rgba(255, 255, 255,${(alpha * 0.35).toFixed(3)})`;
  g.beginPath();
  g.arc(cx - r * 0.3, py - r * 0.3, r * 0.42, 0, Math.PI * 2);
  g.fill();
  if (col === AMBER) {
    g.strokeStyle = `rgba(${ROSE},${(alpha * 0.5).toFixed(3)})`;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(cx, py, r + 2, 0, Math.PI * 2);
    g.stroke();
  }
}

function drawGuessing(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
  a: number
): void {
  const inner = s * 0.56;
  const cx = x + s / 2;
  const cy = y + s / 2;
  const step = 0.85;
  const idx = Math.floor(phase / step);
  const frac = easeOutCubic((phase % step) / step);
  const dh = inner * 0.42;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 ${Math.round(inner * 0.52)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const prev = ((idx % 10) + 10) % 10;
  const curr = (prev + 1) % 10;
  g.fillStyle = `rgba(${CYAN},${(a * (1 - frac)).toFixed(3)})`;
  g.fillText(String(prev), cx, cy - frac * dh);
  g.fillStyle = `rgba(${CYAN},${(a * (0.35 + 0.65 * frac)).toFixed(3)})`;
  g.fillText(String(curr), cx, cy + (1 - frac) * dh);
}

const DRAWN: Array<typeof drawSnake> = [
  drawSnake,
  drawMemory,
  drawTicTacToe,
  drawConnect4,
  drawGuessing,
];

interface Tile {
  heat: number;
  phase: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

export default function TileGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none)").matches;

    let CELL = window.innerWidth < 640 ? 56 : 72;
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      CELL = window.innerWidth < 640 ? 56 : 72;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawBaseGrid = () => {
      ctx.strokeStyle = `rgba(${CYAN},0.055)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0.5; gx <= w; gx += CELL) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
      }
      for (let gy = 0.5; gy <= h; gy += CELL) {
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
      }
      ctx.stroke();
    };

    if (reduced) {
      // Static: one frozen frame, no loop, no listeners.
      drawBaseGrid();
      const t = 1.7;
      for (let cy = 0; cy * CELL < h; cy++) {
        for (let cx = 0; cx * CELL < w; cx++) {
          const type = tileType(cx, cy);
          DRAWN[type](ctx, cx * CELL, cy * CELL, CELL, t + rand2(cx, cy, 3) * 6, 0.12);
        }
      }
      return () => window.removeEventListener("resize", resize);
    }

    const tiles = new Map<string, Tile>();
    const ripples: Ripple[] = [];
    let lastRipple = 0;

    const heatAt = (mx: number, my: number) => {
      const minCx = Math.max(0, Math.floor((mx - RADIUS) / CELL));
      const maxCx = Math.floor((mx + RADIUS) / CELL);
      const minCy = Math.max(0, Math.floor((my - RADIUS) / CELL));
      const maxCy = Math.floor((my + RADIUS) / CELL);
      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
          const px = cx * CELL + CELL / 2;
          const py = cy * CELL + CELL / 2;
          const dist = Math.hypot(mx - px, my - py);
          if (dist > RADIUS) continue;
          const target = 1 - dist / RADIUS;
          const key = cx + "," + cy;
          const cur = tiles.get(key);
          if (!cur) {
            if (target > 0.02)
              tiles.set(key, {
                heat: target,
                phase: perfNow() / 1000 + rand2(cx, cy, 3) * 6,
              });
          } else if (target > cur.heat) {
            cur.heat = target;
          }
        }
      }
    };

    const perfNow = (): number =>
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const onMove = (e: PointerEvent) => {
      heatAt(e.clientX, e.clientY);
      const now = perfNow();
      if (now - lastRipple > 110 && ripples.length < 6) {
        lastRipple = now;
        ripples.push({ x: e.clientX, y: e.clientY, r: 8, alpha: 0.55 });
      }
    };
    if (!touch) window.addEventListener("pointermove", onMove, { passive: true });

    let last = perfNow();
    const draw = () => {
      const now = perfNow();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, w, h);
      drawBaseGrid();

      // Advance ripples.
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += RIPPLE_SPEED * dt;
        rp.alpha *= 0.965;
        if (rp.r > RIPPLE_MAX || rp.alpha < 0.02) ripples.splice(i, 1);
      }

      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const key = cx + "," + cy;
          let tile = tiles.get(key);
          let heat = 0;
          if (tile) {
            tile.heat *= HEAT_DECAY;
            if (tile.heat < 0.012) {
              tiles.delete(key);
              tile = undefined;
            } else {
              heat = tile.heat;
              tile.phase += dt * (1 + heat * 2.6);
            }
          }
          const px = cx * CELL + CELL / 2;
          const py = cy * CELL + CELL / 2;

          // Ripple boost where the ring passes.
          let boost = 0;
          for (const rp of ripples) {
            const d = Math.hypot(px - rp.x, py - rp.y);
            const band = Math.max(0, 1 - Math.abs(d - rp.r) / RIPPLE_BAND);
            if (band > 0) boost += rp.alpha * band;
          }
          if (boost > 1) boost = 1;

          const glow = Math.min(1, heat * 0.85 + boost * 0.9);
          const intensity = Math.min(1, 0.12 + heat * 0.6 + boost * 0.75);
          if (intensity < 0.04 && glow < 0.04) continue;

          const x = cx * CELL;
          const y = cy * CELL;

          // Tile glow fill + border.
          ctx.fillStyle = `rgba(${CYAN},${(0.16 * glow + 0.028).toFixed(3)})`;
          ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
          ctx.strokeStyle = `rgba(${CYAN},${(0.1 + 0.42 * glow).toFixed(3)})`;
          ctx.lineWidth = glow > 0.4 ? 1.5 : 1;
          ctx.strokeRect(x + 0.75, y + 0.75, CELL - 1.5, CELL - 1.5);

          // Mini game animation.
          const type = tileType(cx, cy);
          const phase = tile ? tile.phase : t + rand2(cx, cy, 3) * 6;
          const pulse = 0.85 + 0.15 * Math.sin(t * 3 + cx * 0.6 + cy * 0.8);
          DRAWN[type](ctx, x, y, CELL, phase, Math.min(1, intensity * pulse));
        }
      }

      // Ripple rings.
      for (const rp of ripples) {
        ctx.strokeStyle = `rgba(${CYAN},${(rp.alpha * 0.5).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (!touch) window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="tile-grid-layer pointer-events-none fixed inset-0 z-0"
    />
  );
}
