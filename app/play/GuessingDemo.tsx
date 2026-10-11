"use client";

import { useState } from "react";
import Link from "next/link";

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
    <div className="w-full max-w-md text-center">
      <p className="mb-2 text-xs font-bold tracking-widest text-arcade uppercase">
        Playable demo
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Guessing Game
      </h1>
      <p className="mt-3 text-sm text-slate-400">
        The game that started 5IN1 — guess the secret number before your
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
                className={`rounded-xl border p-4 text-left transition-colors ${
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
            className="mt-6 w-full rounded-xl bg-arcade px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-arcade-dim hover:text-white"
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
              <strong className="text-white">
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

          <p className="mt-4 min-h-6 text-sm font-semibold text-slate-200">
            {phase === "won" ? (
              <>
                {message}{" "}
                {isNewBest && (
                  <span className="text-arcade">New best score!</span>
                )}
              </>
            ) : (
              message
            )}
          </p>

          {proximity && phase === "playing" && (
            <p className="mt-2 text-sm text-slate-300" aria-live="polite">
              <span aria-hidden="true">{proximity.emoji} </span>
              {proximity.label}
            </p>
          )}

          {attempts.length > 0 && (
            <ul className="mx-auto mt-6 max-h-40 space-y-1 overflow-y-auto text-sm">
              {[...attempts].reverse().map((a) => (
                <li
                  key={a.number}
                  className="flex items-center justify-between rounded-lg border border-edge bg-panel/40 px-4 py-2 text-slate-300"
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
              className="rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={backToSetup}
              className="rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-arcade hover:text-arcade"
            >
              Change difficulty
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-slate-500">
        A taste of the full game — cryptic hints, the daily challenge, and win
        streaks ship in the{" "}
        <Link href="/" className="text-arcade hover:underline">
          5IN1 Mac app
        </Link>
        .
      </p>
    </div>
  );
}
