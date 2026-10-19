"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* Memory Match — REAL 3D card flips (rotateY + perspective, the card
   physically turns over). Crisp geometric faces, match celebrations,
   entrance stagger, mismatch shake. 60fps: GPU-composited transforms. */

type Size = { cols: number; pairs: number; label: string };
const SIZES: Size[] = [
  { cols: 4, pairs: 6, label: "Easy" },
  { cols: 4, pairs: 8, label: "Medium" },
  { cols: 6, pairs: 12, label: "Hard" },
];

/* 12 crisp geometric faces — system glyphs, no emoji, sharp at any size. */
const FACES = ["▲", "●", "◆", "■", "★", "♥", "♠", "♣", "✚", "◉", "⬟", "✦"];
const FACE_COLORS = [
  "#22d3ee", "#818cf8", "#facc15", "#f472b6",
  "#34d399", "#fb7185", "#a78bfa", "#fbbf24",
  "#38bdf8", "#e879f9", "#4ade80", "#f97316",
];

function newDeck(pairs: number): number[] {
  const deck = [...Array(pairs).keys(), ...Array(pairs).keys()];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MemoryGame() {
  const [size, setSize] = useState<Size>(SIZES[0]);
  const [deck, setDeck] = useState<number[]>(() => newDeck(SIZES[0].pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const [justMatched, setJustMatched] = useState<number[]>([]);
  const [missPair, setMissPair] = useState<number[]>([]);
  const [dealKey, setDealKey] = useState(0);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = matched.size === size.pairs;

  useEffect(() => () => { if (missTimer.current) clearTimeout(missTimer.current); }, []);

  function newGame(s: Size) {
    if (missTimer.current) clearTimeout(missTimer.current);
    setSize(s);
    setDeck(newDeck(s.pairs));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLock(false);
    setJustMatched([]);
    setMissPair([]);
    setDealKey((k) => k + 1);
  }

  function flip(i: number) {
    if (lock || done || flipped.includes(i) || matched.has(deck[i])) return;
    const next = [...flipped, i];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      if (deck[next[0]] === deck[next[1]]) {
        // MATCH — celebration pop, then lock face-up.
        const face = deck[next[0]];
        setJustMatched(next);
        setTimeout(() => {
          setMatched((m) => new Set(m).add(face));
          setFlipped([]);
          setJustMatched([]);
        }, 420);
      } else {
        // MISS — shake, then flip back.
        setLock(true);
        setMissPair(next);
        missTimer.current = setTimeout(() => {
          setFlipped([]);
          setLock(false);
          setMissPair([]);
        }, 750);
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="pop-in mb-4 flex items-center justify-center gap-2" style={{ "--pop-delay": "60ms" } as CSSProperties}>
        {SIZES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => newGame(s)}
            className={`btn-alive rounded-lg border px-4 py-1.5 text-xs font-semibold ${
              size.label === s.label
                ? "border-arcade bg-arcade text-ink"
                : "border-edge bg-panel text-slate-400 hover:text-arcade"
            }`}
          >
            {s.label}
          </button>
        ))}
        <div className="ml-2 rounded-xl border border-edge bg-panel px-4 py-1.5">
          <span className="text-xs text-slate-500">Moves </span>
          <strong key={moves} className="score-pop text-sm text-white">{moves}</strong>
        </div>
      </div>

      <div
        className="grid gap-2 [perspective:1200px]"
        style={{ gridTemplateColumns: `repeat(${size.cols}, 1fr)` }}
        key={dealKey}
      >
        {deck.map((face, i) => {
          const up = flipped.includes(i) || matched.has(face);
          const isMatch = matched.has(face);
          const popping = justMatched.includes(i);
          const missing = missPair.includes(i);
          return (
            <div
              key={i}
              className="deal-in aspect-square"
              style={{ "--deal-delay": `${Math.min(i * 35, 600)}ms` } as CSSProperties}
            >
              <button
                type="button"
                onClick={() => flip(i)}
                disabled={up || lock || done}
                aria-label={up ? `Card showing ${FACES[face]}` : "Face-down card"}
                className={`card3d ${up ? "card3d-up" : ""} ${popping ? "card3d-pop" : ""} ${missing ? "card3d-miss" : ""} ${
                  isMatch ? "card3d-matched" : ""
                }`}
              >
                {/* back of card (face-down) */}
                <span className="card3d-face card3d-back" aria-hidden="true">
                  <span className="card3d-back-glyph">?</span>
                </span>
                {/* front of card (face-up) */}
                <span className="card3d-face card3d-front" aria-hidden="true">
                  <span
                    className="card3d-symbol"
                    style={{ color: FACE_COLORS[face], textShadow: `0 0 14px ${FACE_COLORS[face]}66` }}
                  >
                    {FACES[face]}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 min-h-6 text-center text-sm font-semibold text-slate-200">
        {done ? (
          <span key="done" className="pop-in inline-block text-arcade">Cleared in {moves} moves — nice memory!</span>
        ) : (
          `${size.pairs - matched.size} pairs left.`
        )}
      </p>

      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={() => newGame(size)}
          className="btn-alive rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
        >
          New game
        </button>
      </div>

      <style>{`
        .deal-in { animation: deal-in 0.5s cubic-bezier(0.22,1.4,0.36,1) backwards; animation-delay: var(--deal-delay, 0ms); }
        @keyframes deal-in { from { opacity: 0; transform: translateY(14px) scale(0.9); } to { opacity: 1; transform: none; } }
        .card3d { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.45s cubic-bezier(0.34,1.3,0.5,1); cursor: pointer; border-radius: 0.75rem; }
        .card3d:not(.card3d-up):hover { transform: translateY(-3px); }
        .card3d-up { transform: rotateY(180deg); cursor: default; }
        .card3d-face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 0.75rem; border: 1px solid #232a38; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .card3d-back { background: linear-gradient(135deg, #12161f 0%, #0e1420 100%); }
        .card3d-back:hover, button:not(:disabled) .card3d-back { border-color: #0e7490; }
        .card3d-back-glyph { font-size: 1.5rem; font-weight: 800; color: #0e7490; opacity: 0.7; }
        .card3d-front { background: linear-gradient(135deg, #161c28 0%, #12161f 100%); border-color: #232a38; transform: rotateY(180deg); }
        .card3d-matched .card3d-front { border-color: rgba(34,211,238,0.7); box-shadow: 0 0 18px rgba(34,211,238,0.25), inset 0 0 12px rgba(34,211,238,0.08); }
        .card3d-symbol { font-size: 2rem; line-height: 1; }
        @media (min-width: 640px) { .card3d-symbol { font-size: 2.5rem; } }
        .card3d-pop { animation: card3d-pop 0.42s cubic-bezier(0.22,1.6,0.36,1); }
        @keyframes card3d-pop { 0% { scale: 1; } 45% { scale: 1.14; } 100% { scale: 1; } }
        .card3d-miss { animation: card3d-miss 0.4s ease; }
        @keyframes card3d-miss { 0%,100% { translate: 0 0; } 25% { translate: -5px 0; } 50% { translate: 5px 0; } 75% { translate: -3px 0; } }
        .card3d:disabled { cursor: default; }
        @media (prefers-reduced-motion: reduce) {
          .card3d, .deal-in, .card3d-pop, .card3d-miss { animation: none !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
