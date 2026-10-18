"use client";

import { useEffect, useRef } from "react";

/* Mouse-reactive glow for the hero grid.
   A canvas overlay tracks the cursor and paints a cyan/indigo glow trail —
   cells near the mouse breathe with light that pulses, then fades out.
   Throttled via rAF; skips entirely on touch devices and when the user
   prefers reduced motion (the ambient aura stays). */

type Spot = { x: number; y: number; born: number };

const LIFETIME = 900; // ms a glow spot stays visible
const RADIUS = 140; // px glow radius
const MAX_SPOTS = 60;
const MIN_GAP = 16; // ms between spot drops (throttles pointermove)

export default function GridGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;

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
    const spots: Spot[] = [];

    const resize = () => {
      const r = section.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    let lastAdd = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastAdd < MIN_GAP) return;
      lastAdd = now;
      const r = canvas.getBoundingClientRect();
      spots.push({ x: e.clientX - r.left, y: e.clientY - r.top, born: now });
      if (spots.length > MAX_SPOTS) spots.splice(0, spots.length - MAX_SPOTS);
    };
    section.addEventListener("pointermove", onMove);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = spots.length - 1; i >= 0; i--) {
        if (now - spots[i].born > LIFETIME) spots.splice(i, 1);
      }
      for (const s of spots) {
        const age = (now - s.born) / LIFETIME; // 0 → 1
        // Pulse while fading: glow breathes instead of just dying.
        const pulse = 0.75 + 0.25 * Math.sin(age * Math.PI * 3);
        const alpha = (1 - age) * 0.45 * pulse;
        if (alpha <= 0.01) continue;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, RADIUS);
        g.addColorStop(0, `rgba(34, 211, 238, ${alpha.toFixed(3)})`);
        g.addColorStop(0.55, `rgba(129, 140, 248, ${(alpha * 0.55).toFixed(3)})`);
        g.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(s.x - RADIUS, s.y - RADIUS, RADIUS * 2, RADIUS * 2);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}
