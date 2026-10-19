"use client";

import { useEffect, useRef } from "react";

/* Living circuit-board grid: a fixed full-viewport canvas of visible square
   tiles. Each tile lights up with cyan glow as the cursor passes over it,
   then fades back independently — a trail of lit tiles follows the mouse.
   Rendered once in the root layout; sits behind everything. Skipped on
   touch devices and when the user prefers reduced motion. */

const CELL = 48; // px per tile
const RADIUS = 110; // px cursor influence radius
const DECAY = 0.93; // per-frame intensity decay

export default function TileGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    // "cx,cy" -> intensity 0..1
    const cells = new Map<string, number>();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
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

    const lightCells = (mx: number, my: number) => {
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
          const key = `${cx},${cy}`;
          const cur = cells.get(key) ?? 0;
          if (target > cur) cells.set(key, target);
        }
      }
    };

    const onMove = (e: PointerEvent) => lightCells(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      // Base grid — subtle square outlines, always visible.
      ctx.strokeStyle = "rgba(34, 211, 238, 0.055)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0.5; x <= w; x += CELL) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0.5; y <= h; y += CELL) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Lit tiles — each fades independently.
      const t = now / 1000;
      for (const [key, intensity] of cells) {
        const next = intensity * DECAY;
        if (next < 0.015) {
          cells.delete(key);
          continue;
        }
        cells.set(key, next);
        const sep = key.indexOf(",");
        const cx = Number(key.slice(0, sep));
        const cy = Number(key.slice(sep + 1));
        const x = cx * CELL;
        const y = cy * CELL;
        // Breathe: lit tiles pulse softly instead of glowing flat.
        const pulse = 0.82 + 0.18 * Math.sin(t * 4 + cx * 0.7 + cy * 0.9);
        const a = next * pulse;

        ctx.fillStyle = `rgba(34, 211, 238, ${(0.14 * a).toFixed(3)})`;
        ctx.fillRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);

        ctx.strokeStyle = `rgba(34, 211, 238, ${(0.4 * a).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.75, y + 0.75, CELL - 1.5, CELL - 1.5);

        if (a > 0.25) {
          const g = ctx.createRadialGradient(
            x + CELL / 2,
            y + CELL / 2,
            0,
            x + CELL / 2,
            y + CELL / 2,
            CELL
          );
          g.addColorStop(0, `rgba(34, 211, 238, ${(0.22 * a).toFixed(3)})`);
          g.addColorStop(1, "rgba(34, 211, 238, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(x - CELL / 2, y - CELL / 2, CELL * 2, CELL * 2);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
