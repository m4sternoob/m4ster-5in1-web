"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import FullscreenButton from "./FullscreenButton";
import VolumeControl from "./VolumeControl";
import ModePicker, { type GameMode } from "../components/mp/ModePicker";
import OnlinePanel from "../components/mp/OnlinePanel";
import {
  inviteCodeFromUrl,
  useMpRoom,
  type MpEngine,
} from "../lib/mp/room";

/* Tic-Tac-Toe, three ways:
   Solo — vs the unbeatable minimax CPU (the original demo, unchanged).
   Local 2P — same device, X and O alternate.
   Online 2P — host-authoritative rooms over a WebSocket room relay; temp session
   names only, no accounts. X draws in with stroke animation, O draws
   as an arc, win line strikes through, cells bounce on press. */

type Cell = "X" | "O" | null;
type Outcome = "X" | "O" | "draw" | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

function outcomeOf(board: Cell[]): Outcome {
  for (const [a, b, c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every((cell) => cell !== null) ? "draw" : null;
}

function winLineOf(board: Cell[]): readonly number[] | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

function minimax(board: Cell[], cpuTurn: boolean, depth: number): number {
  const result = outcomeOf(board);
  if (result === "O") return 10 - depth;
  if (result === "X") return depth - 10;
  if (result === "draw") return 0;
  let best = cpuTurn ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = cpuTurn ? "O" : "X";
      const score = minimax(board, !cpuTurn, depth + 1);
      board[i] = null;
      best = cpuTurn ? Math.max(best, score) : Math.min(best, score);
    }
  }
  return best;
}

function pickCpuMove(board: Cell[]): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = "O";
      const score = minimax(board, false, 0);
      board[i] = null;
      if (score > bestScore) { bestScore = score; bestMove = i; }
    }
  }
  return bestMove;
}

const emptyBoard = (): Cell[] => Array<Cell>(9).fill(null);

/* ---- online engine: host is X, guest is O, host validates moves ---- */
type TttState = { board: Cell[]; turn: "X" | "O" };

const tttEngine: MpEngine<TttState, number> = {
  initial: () => ({ board: emptyBoard(), turn: "X" }),
  applyMove: (state, idx, by) => {
    const mark = by === "host" ? "X" : "O";
    if (state.turn !== mark) return null;
    if (idx < 0 || idx > 8 || state.board[idx] !== null) return null;
    if (outcomeOf(state.board) !== null) return null;
    const board = [...state.board];
    board[idx] = mark;
    return { board, turn: mark === "X" ? "O" : "X" };
  },
  isFinished: (state) => outcomeOf(state.board) !== null,
};

/* SVG mark that draws itself in. */
function Mark({ cell, fresh }: { cell: Cell; fresh: boolean }) {
  if (cell === "X") {
    return (
      <svg viewBox="0 0 40 40" className={`ttt-mark ${fresh ? "ttt-draw" : ""}`} aria-hidden="true">
        <line x1="10" y1="10" x2="30" y2="30" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" />
        <line x1="30" y1="10" x2="10" y2="30" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }
  if (cell === "O") {
    return (
      <svg viewBox="0 0 40 40" className={`ttt-mark ${fresh ? "ttt-draw" : ""}`} aria-hidden="true">
        <circle cx="20" cy="20" r="12" fill="none" stroke="#fb7185" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

export default function TicTacToeDemo() {
  const [mode, setMode] = useState<GameMode>("solo");
  const room = useMpRoom<TttState, number>("tictactoe", tttEngine);

  const [board, setBoard] = useState<Cell[]>(emptyBoard);
  const [localTurn, setLocalTurn] = useState<"X" | "O">("X");
  const [thinking, setThinking] = useState(false);
  const thinkingRef = useRef(false);
  const [tally, setTally] = useState({ a: 0, draws: 0, b: 0 });
  const [freshIdx, setFreshIdx] = useState<number | null>(null);
  const countedRef = useRef(false);
  const countedStateRef = useRef<TttState | null>(null);
  const prevOnlineBoardRef = useRef<Cell[] | null>(null);

  // An invite link (?room=CODE) opens straight into Online 2P.
  useEffect(() => {
    if (inviteCodeFromUrl()) setMode("online");
  }, []);

  const online = mode === "online";
  const shownBoard = online ? (room.state?.board ?? emptyBoard()) : board;
  const result = outcomeOf(shownBoard);
  const winLine = result && result !== "draw" ? winLineOf(shownBoard) : null;

  const myMark: "X" | "O" = room.role === "guest" ? "O" : "X";
  const myTurn = online && room.phase === "playing" && room.state?.turn === myMark;
  const hostName = room.lobby?.host.name ?? "Host";
  const guestName = room.lobby?.guest?.name ?? "Guest";

  /* CPU answers in solo mode only. The guard lives in a ref on
     purpose: with `thinking` state in the dep list, the effect's own
     setThinking re-render runs the cleanup and cancels the pending
     CPU timer before it fires (the pre-existing soft-lock this
     mirrors Connect 4's pattern to avoid). */
  useEffect(() => {
    if (mode !== "solo" || result !== null || thinkingRef.current) return;
    const xCount = board.filter((c) => c === "X").length;
    const oCount = board.filter((c) => c === "O").length;
    if (xCount <= oCount) return;
    thinkingRef.current = true;
    setThinking(true);
    const timer = setTimeout(() => {
      setBoard((prev) => {
        const next = [...prev];
        const move = pickCpuMove(next);
        if (move >= 0) { next[move] = "O"; setFreshIdx(move); }
        return next;
      });
      thinkingRef.current = false;
      setThinking(false);
    }, 450);
    return () => {
      clearTimeout(timer);
      thinkingRef.current = false;
    };
  }, [mode, board, result]);

  /* Score counting for solo + local (result derived from local board). */
  useEffect(() => {
    if (online || result === null || countedRef.current) return;
    countedRef.current = true;
    setTally((t) => ({
      a: t.a + (result === "X" ? 1 : 0),
      draws: t.draws + (result === "draw" ? 1 : 0),
      b: t.b + (result === "O" ? 1 : 0),
    }));
  }, [online, result]);

  /* Score counting for online (once per finished authoritative state). */
  useEffect(() => {
    if (!online || room.phase !== "finished" || !room.state) return;
    if (countedStateRef.current === room.state) return;
    countedStateRef.current = room.state;
    const r = outcomeOf(room.state.board);
    if (!r) return;
    setTally((t) => ({
      a: t.a + (r === "X" ? 1 : 0),
      draws: t.draws + (r === "draw" ? 1 : 0),
      b: t.b + (r === "O" ? 1 : 0),
    }));
  }, [online, room.phase, room.state]);

  /* Draw-in animation for the cell that just changed online. */
  useEffect(() => {
    if (!online) return;
    const b = room.state?.board ?? null;
    if (b && prevOnlineBoardRef.current) {
      const idx = b.findIndex((c, i) => c !== prevOnlineBoardRef.current![i]);
      if (idx >= 0) setFreshIdx(idx);
    }
    prevOnlineBoardRef.current = b ? [...b] : null;
  }, [online, room.state]);

  function play(index: number) {
    if (online) {
      if (!myTurn || shownBoard[index] !== null) return;
      room.sendMove(index);
      return;
    }
    if (result !== null || shownBoard[index] !== null) return;
    if (mode === "solo") {
      if (thinking) return;
      setFreshIdx(index);
      setBoard((prev) => {
        const next = [...prev];
        next[index] = "X";
        return next;
      });
    } else {
      setFreshIdx(index);
      setBoard((prev) => {
        const next = [...prev];
        next[index] = localTurn;
        return next;
      });
      setLocalTurn((t) => (t === "X" ? "O" : "X"));
    }
  }

  function reset() {
    countedRef.current = false;
    thinkingRef.current = false;
    setThinking(false);
    setBoard(emptyBoard());
    setLocalTurn("X");
    setFreshIdx(null);
  }

  function changeMode(next: GameMode) {
    if (next === mode) return;
    if (online) room.leave();
    countedStateRef.current = null;
    prevOnlineBoardRef.current = null;
    setTally({ a: 0, draws: 0, b: 0 });
    reset();
    setMode(next);
  }

  const winnerName = result === "X" ? hostName : guestName;
  const turnName = room.state?.turn === "X" ? hostName : guestName;

  const status =
    mode === "solo"
      ? result === "X" ? "You win — the impossible happened."
        : result === "O" ? "CPU wins. It plays perfectly, so a draw is your best shot."
        : result === "draw" ? "Draw. Against perfect play, that's a victory."
        : thinking ? "CPU is thinking…"
        : "Your move — you're X."
      : mode === "local"
        ? result === "X" ? "Player 1 wins!"
          : result === "O" ? "Player 2 wins!"
          : result === "draw" ? "Draw — dead even."
          : localTurn === "X" ? "Player 1's turn — X."
          : "Player 2's turn — O."
        : result === "X" || result === "O" ? `${winnerName} wins!`
          : result === "draw" ? "Draw — nobody blinked."
          : room.phase !== "playing" ? "Match over."
          : myTurn ? `Your move — you're ${myMark}.`
          : `${turnName}'s turn…`;

  const tallyLabels =
    mode === "solo"
      ? { a: "You", b: "CPU" }
      : mode === "local"
        ? { a: "Player 1", b: "Player 2" }
        : { a: hostName, b: guestName };

  const cellDisabled = (cell: Cell) =>
    online
      ? cell !== null || result !== null || !myTurn
      : cell !== null || result !== null || (mode === "solo" && thinking);

  // Win line geometry in cell units (0..3).
  const lineGeom = winLine ? (() => {
    const [a, b] = [winLine[0], winLine[2]];
    const ax = (a % 3) + 0.5, ay = Math.floor(a / 3) + 0.5;
    const bx = (b % 3) + 0.5, by = Math.floor(b / 3) + 0.5;
    return { x1: ax, y1: ay, x2: bx, y2: by };
  })() : null;

  const boardBlock = (
    <>
      <div className="pop-in relative mx-auto w-full sm:w-72" style={{ "--pop-delay": "220ms" } as CSSProperties}>
        <div className="grid touch-manipulation grid-cols-3 gap-2" role="grid" aria-label="Tic-Tac-Toe board">
          {shownBoard.map((cell, i) => (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              disabled={cellDisabled(cell)}
              aria-label={`Cell ${i + 1}${cell ? `, ${cell}` : ""}`}
              className={`ttt-cell ${winLine?.includes(i) ? "ttt-cell-win" : ""}`}
            >
              <Mark cell={cell} fresh={freshIdx === i} />
            </button>
          ))}
        </div>
        {lineGeom && (
          <svg viewBox="0 0 3 3" preserveAspectRatio="none" className="ttt-winline" aria-hidden="true">
            <line
              x1={lineGeom.x1} y1={lineGeom.y1} x2={lineGeom.x2} y2={lineGeom.y2}
              stroke={result === "X" ? "#22d3ee" : "#fb7185"}
              strokeWidth="0.09" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${result === "X" ? "#22d3ee" : "#fb7185"})` }}
            />
          </svg>
        )}
      </div>

      <p className="mt-6 min-h-6 text-sm font-semibold text-slate-200">
        {result ? (
          <span key={result} className={`pop-in inline-block ${result === "X" ? "text-arcade" : result === "O" ? "text-rose-400" : "text-slate-300"}`}>
            {status}
          </span>
        ) : status}
      </p>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-400">
        <span><span className="inline-block max-w-28 truncate align-bottom">{tallyLabels.a}</span> <strong key={tally.a} className="score-pop text-white">{tally.a}</strong></span>
        <span>Draws <strong key={tally.draws} className="score-pop text-white">{tally.draws}</strong></span>
        <span><span className="inline-block max-w-28 truncate align-bottom">{tallyLabels.b}</span> <strong key={tally.b} className="score-pop text-white">{tally.b}</strong></span>
      </div>

      {online ? (
        room.phase === "finished" && (
          <button
            type="button"
            onClick={() => room.backToLobby()}
            className="btn-alive mt-6 rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
          >
            Rematch — back to lobby
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={reset}
          className="btn-alive mt-6 rounded-lg border border-edge bg-panel px-6 py-2.5 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
        >
          New game
        </button>
      )}
    </>
  );

  return (
    <div className="w-full px-4 text-center sm:max-w-md sm:px-0">
      <p className="pop-in mb-2 text-xs font-bold tracking-widest text-arcade uppercase" style={{ "--pop-delay": "40ms" } as CSSProperties}>
        Playable demo
      </p>
      <div className="pop-in flex items-center justify-center gap-3" style={{ "--pop-delay": "100ms" } as CSSProperties}>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Tic-Tac-Toe
        </h1>
        <FullscreenButton />
        <VolumeControl />
      </div>
      <p className="pop-in mt-3 mb-5 text-sm text-slate-400" style={{ "--pop-delay": "160ms" } as CSSProperties}>
        {mode === "solo"
          ? "An unbeatable minimax opponent — it never plays a losing move."
          : mode === "local"
            ? "Same device — Player 1 is X, Player 2 is O. Pass and play."
            : "Online rooms with a short code — no account, no sign-in."}
      </p>

      <ModePicker mode={mode} onChange={changeMode} />

      {online ? <OnlinePanel room={room}>{boardBlock}</OnlinePanel> : boardBlock}

      <p className="mt-8 text-xs text-slate-500">
        Five games, one app —{" "}
        <Link href="/" className="text-arcade hover:underline">M4ster-5IN1</Link>, everywhere.
      </p>

      <style>{`
        .ttt-cell { position: relative; display: flex; align-items: center; justify-content: center; aspect-ratio: 1; border-radius: 0.75rem; border: 1px solid #232a38; background: #12161f; transition: transform 0.12s ease, border-color 0.15s ease, box-shadow 0.15s ease; }
        .ttt-cell:not(:disabled):hover { border-color: #0e7490; transform: translateY(-2px); }
        .ttt-cell:not(:disabled):active { transform: scale(0.93); }
        .ttt-cell:disabled { cursor: default; }
        .ttt-cell-win { border-color: rgba(34,211,238,0.7); box-shadow: 0 0 16px rgba(34,211,238,0.25); animation: ttt-winpulse 0.9s ease-in-out infinite; }
        @keyframes ttt-winpulse { 0%,100% { box-shadow: 0 0 10px rgba(34,211,238,0.2); } 50% { box-shadow: 0 0 22px rgba(34,211,238,0.45); } }
        .ttt-mark { width: 55%; height: 55%; overflow: visible; }
        .ttt-draw line, .ttt-draw circle { stroke-dasharray: 60; stroke-dashoffset: 60; animation: ttt-draw 0.32s cubic-bezier(0.5,0,0.3,1) forwards; }
        .ttt-draw line:nth-child(2) { animation-delay: 0.14s; }
        @keyframes ttt-draw { to { stroke-dashoffset: 0; } }
        .ttt-winline { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .ttt-winline line { stroke-dasharray: 5; stroke-dashoffset: 5; animation: ttt-winline 0.45s ease-out 0.25s forwards; }
        @keyframes ttt-winline { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .ttt-draw line, .ttt-draw circle, .ttt-winline line, .ttt-cell-win { animation-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
