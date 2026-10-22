"use client";

import { useEffect } from "react";

/* Game-reactive accent color (his call, 2026-10-22): when a game ends, the
   separator bars and the result banner take GREEN on a win, RED on a loss,
   and the neutral theme color on a draw; a restart clears it. Games report
   their outcome through useGameResult — the value lands as a `data-result`
   attribute on <html> and globals.css does the rest. In light mode
   (animations off) the color simply changes, statically; with animations
   on, one subtle pulse is allowed. */

export type GameResult = "win" | "lose" | "draw";

export function setGameResult(result: GameResult | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (result) root.dataset.result = result;
  else delete root.dataset.result;
}

/* Keep `data-result` in sync with a game's outcome. Pass null while the
   game is still in play; the attribute clears on unmount too, so leaving a
   game page never leaks its color into the rest of the site. */
export function useGameResult(result: GameResult | null): void {
  useEffect(() => {
    setGameResult(result);
    return () => setGameResult(null);
  }, [result]);
}
