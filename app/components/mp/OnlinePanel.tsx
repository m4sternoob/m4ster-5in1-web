"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  inviteCodeFromUrl,
  inviteLinkFor,
  type MpRoom,
} from "../../lib/mp/room";
import { getMpName, saveMpName, cleanName } from "../../lib/mp/names";

/* Shared online-multiplayer panel for every game:
   step 1 — "Join as" temp session name (no account, ever)
   step 2 — Create Room or Join with a code (invite links prefill it)
   lobby  — big room code, copy buttons, both players + ready states,
            host-only Start once both are ready.
   In-match it collapses to a slim status bar (the game renders the
   board and the rematch control). */

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="btn-alive rounded-lg border border-edge bg-ink px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-arcade hover:text-arcade"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function NameField({
  name,
  onChange,
  compact = false,
}: {
  name: string;
  onChange: (name: string) => void;
  compact?: boolean;
}) {
  return (
    <label className={`block text-left ${compact ? "" : "mb-4"}`}>
      <span className="mb-1.5 block text-[11px] font-bold tracking-widest text-slate-400 uppercase">
        Join as
      </span>
      <input
        type="text"
        value={name}
        maxLength={20}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(cleanName(name))}
        placeholder="Your session name"
        aria-label="Your session name"
        className="w-full rounded-lg border border-edge bg-ink px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-arcade"
      />
      {!compact && (
        <span className="mt-1 block text-[11px] text-slate-500">
          Temporary name for this session only — no account, no sign-in.
        </span>
      )}
    </label>
  );
}

function ReadyChip({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
      Ready ✓
    </span>
  ) : (
    <span className="rounded-full border border-edge bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
      Not ready
    </span>
  );
}

export default function OnlinePanel<S, M>({
  room,
  children,
}: {
  room: MpRoom<S, M>;
  /** Rendered only while a match is playing/finished (the board). */
  children?: ReactNode;
}) {
  const [name, setName] = useState<string>(() =>
    typeof window === "undefined" ? "" : getMpName(),
  );
  const [joinCode, setJoinCode] = useState("");
  const [fromInvite, setFromInvite] = useState(false);

  // Invite link (?room=CODE) — land straight in the join flow, code filled.
  useEffect(() => {
    const code = inviteCodeFromUrl();
    if (code) {
      setJoinCode(code);
      setFromInvite(true);
    }
  }, []);

  function commitName(next: string) {
    setName(next);
    const trimmed = next.trim();
    if (trimmed) saveMpName(trimmed.slice(0, 20));
  }

  const { phase, lobby, role } = room;
  const inMatch = phase === "playing" || phase === "finished";
  const myReady = lobby ? (role === "host" ? lobby.host.ready : lobby.guest?.ready ?? false) : false;
  const bothReady = !!(lobby?.host.ready && lobby?.guest?.ready);
  const canStart = role === "host" && !!lobby?.guest && bothReady;

  /* ---------- in-match slim bar ---------- */
  if (inMatch) {
    const oppName = role === "host" ? lobby?.guest?.name : lobby?.host.name;
    return (
      <div className="mx-auto w-full sm:max-w-md">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-edge bg-panel px-4 py-2.5">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Online vs <span className="text-white">{oppName ?? "…"}</span>
          </span>
          <button
            type="button"
            onClick={room.leave}
            className="text-xs font-semibold text-slate-400 underline-offset-2 hover:text-rose-300 hover:underline"
          >
            Leave match
          </button>
        </div>
        {room.peerLeft ? (
          <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-5 text-center">
            <p className="text-sm font-bold text-rose-200">Opponent left the match.</p>
            <button
              type="button"
              onClick={room.leave}
              className="btn-alive mt-3 rounded-lg border border-edge bg-panel px-5 py-2 text-sm font-semibold text-slate-200 hover:border-arcade hover:text-arcade"
            >
              Back to Online 2P
            </button>
          </div>
        ) : (
          children
        )}
      </div>
    );
  }

  /* ---------- lobby ---------- */
  if (phase === "lobby" && lobby) {
    return (
      <div className="mx-auto w-full rounded-2xl border border-edge bg-panel p-5 text-left sm:max-w-md">
        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          Room code — share it with your opponent
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span
            className="text-4xl font-extrabold tracking-[0.2em] text-white"
            aria-label={`Room code ${room.code ?? ""}`}
          >
            {room.code}
          </span>
          {room.code && <CopyButton text={room.code} label="Copy code" />}
          {room.code && <CopyButton text={inviteLinkFor(room.code)} label="Copy invite link" />}
        </div>

        {room.peerLeft && (
          <p className="mt-3 text-xs font-semibold text-rose-300">
            Your opponent left — waiting for a new guest, or leave and make a new room.
          </p>
        )}

        <div className="rgb-sep my-4" aria-hidden="true" />

        <ul className="space-y-2.5">
          <li className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-semibold text-white">
              {lobby.host.name}
              <span className="ml-2 text-[11px] font-bold tracking-wider text-arcade uppercase">Host</span>
              {role === "host" && <span className="ml-1 text-[11px] text-slate-500">(you)</span>}
            </span>
            <ReadyChip ready={lobby.host.ready} />
          </li>
          <li className="flex items-center justify-between gap-3">
            {lobby.guest ? (
              <>
                <span className="min-w-0 truncate text-sm font-semibold text-white">
                  {lobby.guest.name}
                  <span className="ml-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">Guest</span>
                  {role === "guest" && <span className="ml-1 text-[11px] text-slate-500">(you)</span>}
                </span>
                <ReadyChip ready={lobby.guest.ready} />
              </>
            ) : (
              <span className="text-sm text-slate-400">Waiting for opponent to join…</span>
            )}
          </li>
        </ul>

        <div className="mt-4">
          <NameField
            compact
            name={name}
            onChange={(n) => {
              commitName(n);
              if (n.trim()) room.updateName(n.trim());
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => room.setReady(!myReady)}
            aria-pressed={myReady}
            className={`btn-alive rounded-lg border px-5 py-2.5 text-sm font-bold ${
              myReady
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                : "border-arcade bg-arcade text-ink"
            }`}
          >
            {myReady ? "Ready ✓ — tap to undo" : "I'm Ready"}
          </button>
          {role === "host" && (
            <button
              type="button"
              onClick={room.start}
              disabled={!canStart}
              className="btn-alive rounded-lg border border-edge bg-ink px-5 py-2.5 text-sm font-bold text-white enabled:hover:border-arcade enabled:hover:text-arcade disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start match
            </button>
          )}
          <button
            type="button"
            onClick={room.leave}
            className="ml-auto text-xs font-semibold text-slate-400 underline-offset-2 hover:text-rose-300 hover:underline"
          >
            Leave room
          </button>
        </div>
        {role === "host" && (
          <p className="mt-2.5 text-[11px] text-slate-500">
            {!lobby.guest
              ? "Start unlocks when your opponent joins and both of you are ready."
              : !bothReady
                ? "Start unlocks when both players are ready."
                : "Both ready — hit Start!"}
          </p>
        )}
        {role === "guest" && (
          <p className="mt-2.5 text-[11px] text-slate-500">
            {bothReady ? "Both ready — waiting for the host to start." : "Tap I'm Ready, then the host starts the match."}
          </p>
        )}
      </div>
    );
  }

  /* ---------- create / join ---------- */
  return (
    <div className="mx-auto w-full rounded-2xl border border-edge bg-panel p-5 text-left sm:max-w-md">
      <NameField name={name} onChange={commitName} />

      {room.error && (
        <p className="mb-3 rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200" role="alert">
          {room.error}
        </p>
      )}
      {fromInvite && (
        <p className="mb-3 rounded-lg border border-arcade/40 bg-arcade/10 px-3 py-2 text-xs font-semibold text-arcade">
          Invite link opened — your room code is filled in. Set your name and hit Join Room.
        </p>
      )}

      <button
        type="button"
        disabled={room.status === "connecting"}
        onClick={() => room.createRoom(cleanName(name))}
        className="btn-alive w-full rounded-lg border border-arcade bg-arcade px-5 py-2.5 text-sm font-bold text-ink disabled:cursor-wait disabled:opacity-50"
      >
        {room.status === "connecting" && room.role === "host" ? "Creating room…" : "Create Room"}
      </button>

      <div className="my-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-edge" />
        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">or join</span>
        <span className="h-px flex-1 bg-edge" />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
          placeholder="CODE"
          aria-label="Room code"
          className="min-w-0 flex-1 rounded-lg border border-edge bg-ink px-3 py-2.5 text-center text-base font-extrabold tracking-[0.25em] text-white uppercase outline-none placeholder:text-slate-600 focus:border-arcade"
        />
        <button
          type="button"
          disabled={joinCode.trim().length < 4 || room.status === "connecting"}
          onClick={() => room.joinRoom(joinCode, cleanName(name))}
          className="btn-alive shrink-0 rounded-lg border border-edge bg-ink px-5 py-2.5 text-sm font-bold text-white enabled:hover:border-arcade enabled:hover:text-arcade disabled:cursor-not-allowed disabled:opacity-40"
        >
          {room.status === "connecting" && room.role === "guest" ? "Joining…" : "Join Room"}
        </button>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">
        Rooms are anonymous and peer-to-peer — the code is the only key. Nothing is uploaded or stored on a server.
      </p>
    </div>
  );
}
