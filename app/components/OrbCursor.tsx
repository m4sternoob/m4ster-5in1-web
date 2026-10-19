"use client";

import { useEffect, useRef } from "react";

/* Signature m4ster orb cursor — follows the mouse everywhere.
   Special effect ONLY on download buttons (.download-btn):
   orb expands, white-hot core, pulsing ring.
   Regular interactive elements get the normal small orb. */

export default function OrbCursor() {
  const orbRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const raf = useRef(0);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    // Skip on touch devices
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    document.body.classList.add("orb-active");

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      // Hot state: hovering a download button?
      const t = e.target as HTMLElement | null;
      const hot = !!t?.closest?.(".download-btn");
      orb.classList.toggle("orb-hot", hot);
    };

    const tick = () => {
      // Smooth follow with lerp
      pos.current.x += (target.current.x - pos.current.x) * 0.22;
      pos.current.y += (target.current.y - pos.current.y) * 0.22;
      orb.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
      document.body.classList.remove("orb-active");
    };
  }, []);

  return <div ref={orbRef} className="orb-cursor" aria-hidden="true" />;
}
