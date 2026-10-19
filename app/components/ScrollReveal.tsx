"use client";

import { useEffect, useRef, useState } from "react";

/* Scroll-triggered reveal wrapper. Each section gets its own flavor:
   "fade-up" | "scale-in" | "slide-left" | "slide-right" | "blur-in"
   Fires once when the element enters the viewport, then unobserves. */

type Variant = "fade-up" | "scale-in" | "slide-left" | "slide-right" | "blur-in";

const VARIANT_CLASS: Record<Variant, string> = {
  "fade-up": "scroll-fade-up",
  "scale-in": "scroll-scale-in",
  "slide-left": "scroll-slide-left",
  "slide-right": "scroll-slide-right",
  "blur-in": "scroll-blur-in",
};

export default function ScrollReveal({
  children,
  variant = "fade-up",
  stagger = false,
  delay = 0,
  className = "",
  threshold = 0.15,
}: {
  children: React.ReactNode;
  variant?: Variant;
  stagger?: boolean;
  delay?: number;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Small delay lets the scroll settle before the pop
            window.setTimeout(() => setVisible(true), delay);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, threshold]);

  // Assign --stagger-i to children for cascade timing
  useEffect(() => {
    if (!stagger || !ref.current) return;
    const kids = ref.current.children;
    for (let i = 0; i < kids.length; i++) {
      (kids[i] as HTMLElement).style.setProperty("--stagger-i", String(i));
    }
  }, [stagger, visible]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${VARIANT_CLASS[variant]} ${
        visible ? "scroll-visible" : ""
      } ${stagger ? "scroll-stagger" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
