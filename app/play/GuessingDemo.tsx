"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import FullscreenButton from "./FullscreenButton";

/* Playable Guessing Game demo: guess the secret number before your attempts
   run out. Mirrors the Mac app's rules — Easy 1–50 (8 attempts),
   Medium 1–100 (10), Hard 1–500 (15), Custom range with no attempt cap —
   plus the same hot-or-cold proximity meter and a best score per difficulty
   that persists in localStorage. The cryptic hints, daily challenge, and win
   streaks live only in the full Mac app. */

type Phase = "setup" | "playing" | "won" | "lost";
type Difficulty = "easy" | "medium" | "hard" | "custom";
type Hint = "low" | "high" | "correct";

type Attempt = {
  value: number;
  hint: Hint;
  number: number;
};

type Proximity = {
  label: string;
  emoji: string;
};

const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  blurb: string;
  range: [number, number] | null; // null for custom (user picks)
  attemptLimit: number | null; // null for unlimited
}[] = [
  { id: "easy", label: "Easy", blurb: "1–50 · 8 attempts", range: [1, 50], attemptLimit: 8 },
  { id: "medium", label: "Medium", blurb: "1–100 · 10 attempts", range: [1, 100], attemptLimit: 10 },
  { id: "hard", label: "Hard", blurb: "1–500 · 15 attempts", range: [1, 500], attemptLimit: 15 },
  { id: "custom", label: "Custom", blurb: "Your range · no attempt cap", range: null, attemptLimit: null },
];

/** Same proximity bands as the Mac app, as a fraction of the range. */
function proximityFor(distance: number, span: number): Proximity {
  const ratio = distance / Math.max(1, span);
  if (ratio < 0.04) return { label: "Burning hot!", emoji: "🚀" };
  if (ratio < 0.12) return { label: "Hot!", emoji: "🔥" };
  if (ratio < 0.28) return { label: "Warm — getting there", emoji: "🌤️" };
  if (ratio < 0.55) return { label: "Cold", emoji: "❄️" };
  return { label: "Freezing — way off", emoji: "🧊" };
}

/** Best (fewest) attempts for a difficulty, persisted like the Mac app. */
function bestKey(difficulty: Difficulty): string {
  return `5in1-guess-best-${difficulty}`;
}

/** Loads every persisted best at once so the component needs no effect. */
function loadBests(): Record<Difficulty, number | null> {
  const out = { easy: null, medium: null, hard: null, custom: null } as Record<
    Difficulty,
    number | null
  >;
  if (typeof window === "undefined") return out;
  for (const d of DIFFICULTIES) {
    try {
      const raw = window.localStorage.getItem(bestKey(d.id));
      const v = raw === null ? 0 : parseInt(raw, 10);
      if (v > 0) out[d.id] = v;
    } catch {
      // Private-mode storage can fail; the game still works.
    }
  }
  return out;
}

export default function GuessingDemo() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [minText, setMinText] = useState("1");
  const [maxText, setMaxText] = useState("100");
  const [lower, setLower] = useState(1);
  const [upper, setUpper] = useState(100);
  const [secret, setSecret] = useState(0);
  const [guessText, setGuessText] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [message, setMessage] = useState("Pick a difficulty and press Start.");
  const [proximity, setProximity] = useState<Proximity | null>(null);
  const [possibleLo, setPossibleLo] = useState(1);
  const [possibleHi, setPossibleHi] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [bests, setBests] = useState<Record<Difficulty, number | null>>(loadBests);
  const [isNewBest, setIsNewBest] = useState(false);

  const best = bests[difficulty];
  const attemptLimit = DIFFICULTIES.find((d) => d.id === difficulty)?.attemptLimit ?? null;
  const attemptsLeft = attemptLimit === null ? null : Math.max(0, attemptLimit - attempts.length);

  function startGame() {
    const config = DIFFICULTIES.find((d) => d.id === difficulty);
    if (!config) return;

    let lo: number;
    let hi: number;
    if (config.range) {
      [lo, hi] = config.range;
    } else {
      lo = Math.max(1, parseInt(minText, 10) || 1);
      hi = parseInt(maxText, 10) || 100;
      if (hi <= lo) {
        setError("Max must be bigger than min.");
        return;
      }
    }

    const target = lo + Math.floor(Math.random() * (hi - lo + 1));
    setLower(lo);
    setUpper(hi);
    setSecret(target);
    setPossibleLo(lo);
    setPossibleHi(hi);
    setAttempts([]);
    setGuessText("");
    setProximity(null);
    setIsNewBest(false);
    setError(null);
    setPhase("playing");
    setMessage(`I'm thinking of a number between ${lo} and ${hi}.`);
  }

  function submitGuess() {
    if (phase !== "playing") return;
    const val = parseInt(guessText, 10);
    if (guessText.trim() === "" || Number.isNaN(val)) {
      setError("Enter a number first.");
      return;
    }
    if (val < lower || val > upper) {
      setError(`Guess must be between ${lower} and ${upper}.`);
      return;
    }
    setError(null);

    const n = attempts.length + 1;
    if (val === secret) {
      const next: Attempt[] = [...attempts, { value: val, hint: "correct", number: n }];
      setAttempts(next);
      setProximity(null);
      setPhase("won");
      setMessage(`Correct! The number was ${secret}.`);
      setGuessText("");
      // Fewest attempts wins the best-score spot, like the Mac app.
      if (best === null || n < best) {
        setBests((prev) => ({ ...prev, [difficulty]: n }));
        setIsNewBest(true);
        try {
          window.localStorage.setItem(bestKey(difficulty), String(n));
        } catch {
          // Private-mode storage can fail; the game still works.
        }
      }
    } else {
      const tooLow = val < secret;
      const next: Attempt[] = [...attempts, { value: val, hint: tooLow ? "low" : "high", number: n }];
      setAttempts(next);
      if (tooLow) {
        setPossibleLo((lo) => Math.max(lo, val + 1));
        setProximity(proximityFor(secret - val, upper - lower));
        setMessage(`${val} is too low — try higher.`);
      } else {
        setPossibleHi((hi) => Math.min(hi, val - 1));
        setProximity(proximityFor(val - secret, upper - lower));
        setMessage(`${val} is too high — try lower.`);
      }
      setGuessText("");
      // Out of attempts?
      if (attemptLimit !== null && next.length >= attemptLimit) {
        setProximity(null);
        setPhase("lost");
        setMessage(`Out of attempts! The number was ${secret}.`);
      }
    }
  }

  function backToSetup() {
    setPhase("setup");
    setAttempts([]);
    setGuessText("");
    setProximity(null);
    setIsNewBest(false);
    setError(null);
    setMessage("Pick a difficulty and press Start.");
  }

  const hintGlyph = (hint: Hint) => (hint === "correct" ? "✓" : hint === "low" ? "↑" : "↓");
  const hintLabel = (hint: Hint) => (hint === "correct" ? "correct" : hint === "low" ? "too low" : "too high");

  return (
    <div className="w-full px-4 text-center sm:max-w-md sm:px-0">
      <p className="pop-in mb-2 text-xs font-bold tracking-widest text-arcade uppercase" style={{ "--pop-delay": "40ms" } as CSSProperties}>
        Playable demo
      </p>
      <div className="pop-in flex items-center justify-center gap-3" style={{ "--pop-delay": "100ms" } as CSSProperties}>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Guessing Game
        </h1>
        <FullscreenButton />
      </div>
      <p className="pop-in mt-3 text-sm text-slate-400" style={{ "--pop-delay": "160ms" } as CSSProperties}>
        The game that started M4ster-5IN1 — guess the secret number before your
        attempts run out.
      </p>

      {phase === "setup" ? (
        <div className="mt-8 text-left">
          <div className="grid grid-cols-2 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                aria-pressed={difficulty === d.id}
                className={`btn-alive rounded-xl border p-4 text-left ${
                  difficulty === d.id
                    ? "border-arcade bg-panel"
                    : "border-edge bg-panel/40 hover:border-arcade-dim"
                }`}
              >
                <p className="font-bold text-white">{d.label}</p>
                <p className="mt-1 text-xs text-slate-400">{d.blurb}</p>
              </button>
            ))}
          </div>

          {difficulty === "custom" && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate-300">
                Min
                <input
                  value={minText}
                  onChange={(e) => setMinText(e.target.value)}
                  inputMode="numeric"
                  className="w-20 rounded-lg border border-edge bg-ink px-3 py-2 text-white outline-none focus:border-arcade"
                />
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                Max
                <input
                  value={maxText}
                  onChange={(e) => setMaxText(e.target.value)}
                  inputMode="numeric"
                  className="w-20 rounded-lg border border-edge bg-ink px-3 py-2 text-white outline-none focus:border-arcade"
                />
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={startGame}
            className="btn-alive mt-6 w-full rounded-xl bg-arcade px-6 py-3 text-sm font-bold text-ink hover:bg-arcade-dim hover:text-white"
          >
            Start
          </button>
          {error && (
            <p role="alert" className="mt-3 text-center text-sm text-rose-400">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>
              Possible range{" "}
              <strong className="text-white">
                {possibleLo}–{possibleHi}
              </strong>
            </span>
            <span aria-live="polite">
              Attempts left{" "}
              <strong key={attempts.length} className="score-pop inline-block text-white">
                {attemptsLeft === null ? "∞" : attemptsLeft}
              </strong>
            </span>
            {best !== null && (
              <span>
                Best <strong className="text-arcade">{best}</strong>
              </span>
            )}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitGuess();
            }}
          >
            <input
              value={guessText}
              onChange={(e) => setGuessText(e.target.value)}
              inputMode="numeric"
              aria-label="Your guess"
              placeholder={`A number from ${lower} to ${upper}`}
              disabled={phase !== "playing"}
              className="min-w-0 flex-1 rounded-xl border border-edge bg-ink px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-arcade disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={phase !== "playing"}
              className="rounded-xl bg-arcade px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-arcade-dim hover:text-white disabled:opacity-50"
            >
              Guess
            </button>
          </form>

          {error && (
            <p role="alert" className="mt-3 text-sm text-rose-400">
              {error}
            </p>
          )}

          {phase === "won" ? (
            <div key="wincelebrate" className="pop-in mt-4">
              <p className="gameover-title text-2xl font-extrabold text-arcade">CORRECT!</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{message}</p>
              {isNewBest && <p className="pop-in mt-1 text-sm font-bold text-yellow-300" style={{ "--pop-delay": "300ms" } as CSSProperties}>New best score!</p>}
              <div className="guess-confetti" aria-hidden="true">
                {Array.from({ length: 24 }, (_, i) => <span key={i} style={{ "--i": i } as any} />)}
              </div>
            </div>
          ) : phase === "lost" ? (
            <div key="lostcelebrate" className="pop-in mt-4">
              <p className="gameover-title text-2xl font-extrabold text-rose-400">OUT OF ATTEMPTS</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{message}</p>
            </div>
          ) : (
            <p className="mt-4 min-h-6 text-sm font-semibold text-slate-200">{message}</p>
          )}

          {proximity && phase === "playing" && (
            <p key={proximity.label} className="pop-in mt-2 text-sm text-slate-300" aria-live="polite">
              <span aria-hidden="true">{proximity.emoji} </span>
              {proximity.label}
            </p>
          )}

          {attempts.length > 0 && (
            <ul className="mx-auto mt-6 max-h-40 space-y-1 overflow-y-auto text-sm">
              {[...attempts].reverse().map((a) => (
                <li
                  key={a.number}
                  className="guess-attempt flex items-center justify-between rounded-lg border border-edge bg-panel/40 px-4 py-2 text-slate-300"
                >
                  <span>
                    #{a.number} — <strong className="text-white">{a.value}</strong>
                  </span>
                  <span
                    className={
                      a.hint === "correct" ? "font-bold text-arcade" : "text-slate-400"
                    }
                  >
                    <span aria-hidden="true">{hintGlyph(a.hint)} </span>
                    {hintLabel(a.hint)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={startGame}
              className="btn-alive rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={backToSetup}
              className="btn-alive rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
            >
              Change difficulty
            </button>
          </div>
        </div>
      )}


      <style>{`
        .guess-attempt { animation: guess-slide 0.3s cubic-bezier(0.22,1.2,0.36,1); }
        @keyframes guess-slide { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
        .guess-confetti { position: relative; height: 0; }
        .guess-confetti span { position: absolute; left: 50%; top: 0; width: 6px; height: 10px; border-radius: 2px; opacity: 0; }
        .guess-confetti span:nth-child(3n) { background: #22d3ee; }
        .guess-confetti span:nth-child(3n+1) { background: #818cf8; }
        .guess-confetti span:nth-child(3n+2) { background: #facc15; }
        .guess-confetti span { animation: guess-confetti 1.4s ease-out forwards; animation-delay: calc(var(--i) * 35ms); }
        @keyframes guess-confetti {
          0% { opacity: 1; transform: translate(0,0) rotate(0); }
          100% { opacity: 0; transform: translate(calc((var(--i) - 12) * 14px), 90px) rotate(540deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .guess-attempt, .guess-confetti span { animation-duration: 0.01ms !important; }
        }
      `}</style>
      <p className="mt-8 text-xs text-slate-500">
        Five games, one app —{" "}
        <Link href="/" className="text-arcade hover:underline">
          M4ster-5IN1
        </Link>
        , everywhere.
      </p>
    </div>
  );
}
