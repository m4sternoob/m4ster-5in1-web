"use client";

/* Staggered pop-in wrapper. Pass delay in ms to cascade siblings:
   <Reveal delay={120}>…</Reveal> */

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`pop-in ${className}`}
      style={{ "--pop-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
