"use client";

import { useEffect, useRef } from "react";
import { PREFS_EVENT } from "../lib/prefs";

/* Signature m4ster orb cursor — follows the mouse everywhere, native
   cursor hidden. Red-hot special effect (expand + red glowing core +
   pulsing ring) on buttons, links, and [data-cursor="red"] elements.
   Regular content gets the normal small cyan orb. */

export default function OrbCursor() {
  const orbRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const raf = useRef(0);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    // Skip on touch devices and when the user prefers reduced motion
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      // Red-hot state: hovering a button, link, or marked element?
      const t = e.target as HTMLElement | null;
      const hot = !!t?.closest?.(
        'button, a, [role="button"], [data-cursor="red"], .download-btn'
      );
      orb.classList.toggle("orb-hot", hot);
    };

    const tick = () => {
      // Smooth follow with lerp
      pos.current.x += (target.current.x - pos.current.x) * 0.22;
      pos.current.y += (target.current.y - pos.current.y) * 0.22;
      orb.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(tick);
    };

    /* Light mode (master Animations off -> body.no-anim) parks the orb:
       no rAF loop, and the native cursor comes back because orb-active
       is only present while running. PREFS_EVENT flips it live. */
    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      document.body.classList.add("orb-active");
      window.addEventListener("mousemove", onMove, { passive: true });
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
      document.body.classList.remove("orb-active");
    };
    const sync = () => {
      if (document.body.classList.contains("no-anim")) stop();
      else start();
    };
    sync();
    window.addEventListener(PREFS_EVENT, sync);

    return () => {
      window.removeEventListener(PREFS_EVENT, sync);
      stop();
    };
  }, []);

  return <div ref={orbRef} className="orb-cursor" aria-hidden="true" />;
}
