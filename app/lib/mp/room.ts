"use client";

/* Shared online-multiplayer room manager (PeerJS, host-authoritative).
   One hook drives every game's online mode: the host creates a room
   with a short code, the guest joins by code or invite link, both use
   temporary session names (no accounts, no sign-in). The host owns the
   game state — it validates every move through the game's engine and
   broadcasts the resulting state; the guest only sends move intents.

   Wire protocol (JSON over the PeerJS data connection):
     guest -> host : hello {name} | ready {ready} | name {name}
                     move {move} | tolobby (rematch request) | leave
     host  -> guest: lobby {host, guest, phase} | start {state}
                     state {state, phase} | tolobby | leave        */

import { useCallback, useEffect, useRef, useState } from "react";
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import { cleanName } from "./names";

export type MpRole = "host" | "guest";
export type MpPhase = "idle" | "connecting" | "lobby" | "playing" | "finished";

export interface MpPlayer {
  name: string;
  ready: boolean;
}

export interface LobbyState {
  host: MpPlayer;
  guest: MpPlayer | null;
}

/** Pure game rules the host uses to validate + apply moves. */
export interface MpEngine<S, M> {
  initial: () => S;
  applyMove: (state: S, move: M, by: MpRole) => S | null;
  isFinished: (state: S) => boolean;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L lookalikes
export const ROOM_CODE_LENGTH = 5;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function peerIdFor(game: string, code: string): string {
  return `m4ster5in1-${game}-${code.toLowerCase()}`;
}

export function inviteCodeFromUrl(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get("room");
    if (!raw) return null;
    const code = raw.trim().toUpperCase();
    return code.length >= 4 ? code : null;
  } catch {
    return null;
  }
}

export function inviteLinkFor(code: string): string {
  return `${window.location.origin}${window.location.pathname}?room=${code}`;
}

type Wire =
  | { t: "hello"; name: string }
  | { t: "ready"; ready: boolean }
  | { t: "name"; name: string }
  | { t: "move"; move: unknown }
  | { t: "tolobby" }
  | { t: "leave" }
  | { t: "lobby"; host: MpPlayer; guest: MpPlayer | null; phase: MpPhase }
  | { t: "start"; state: unknown }
  | { t: "state"; state: unknown; phase: MpPhase };

export interface MpRoom<S, M> {
  phase: MpPhase;
  role: MpRole | null;
  code: string | null;
  lobby: LobbyState | null;
  state: S | null;
  status: "offline" | "connecting" | "connected" | "error";
  error: string | null;
  peerLeft: boolean;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  setReady: (ready: boolean) => void;
  updateName: (name: string) => void;
  start: () => void;
  sendMove: (move: M) => void;
  backToLobby: () => void;
  leave: () => void;
}

export function useMpRoom<S, M>(game: string, engine: MpEngine<S, M>): MpRoom<S, M> {
  const [phase, setPhase] = useState<MpPhase>("idle");
  const [role, setRole] = useState<MpRole | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [gameState, setGameState] = useState<S | null>(null);
  const [status, setStatus] = useState<MpRoom<S, M>["status"]>("offline");
  const [error, setError] = useState<string | null>(null);
  const [peerLeft, setPeerLeft] = useState(false);

  const engineRef = useRef(engine);
  engineRef.current = engine;
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const roleRef = useRef<MpRole | null>(null);
  const phaseRef = useRef<MpPhase>("idle");
  const lobbyRef = useRef<LobbyState | null>(null);
  const stateRef = useRef<S | null>(null);
  const nameRef = useRef<string>("");
  const joinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);

  const setPhaseBoth = useCallback((p: MpPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const setLobbyBoth = useCallback((l: LobbyState | null) => {
    lobbyRef.current = l;
    setLobby(l);
  }, []);

  const setStateBoth = useCallback((s: S | null) => {
    stateRef.current = s;
    setGameState(s);
  }, []);

  const send = useCallback((msg: Wire) => {
    const conn = connRef.current;
    if (conn && conn.open) {
      try {
        conn.send(msg);
      } catch {
        /* connection died mid-send; close handler reports it */
      }
    }
  }, []);

  const broadcastLobby = useCallback(() => {
    const l = lobbyRef.current;
    if (!l) return;
    send({ t: "lobby", host: l.host, guest: l.guest, phase: phaseRef.current });
  }, [send]);

  const teardown = useCallback(() => {
    if (joinTimerRef.current) {
      clearTimeout(joinTimerRef.current);
      joinTimerRef.current = null;
    }
    try {
      connRef.current?.close();
    } catch { /* noop */ }
    try {
      peerRef.current?.destroy();
    } catch { /* noop */ }
    connRef.current = null;
    peerRef.current = null;
  }, []);

  const resetAll = useCallback(() => {
    teardown();
    roleRef.current = null;
    setRole(null);
    setCode(null);
    setLobbyBoth(null);
    setStateBoth(null);
    setPhaseBoth("idle");
    setStatus("offline");
    setPeerLeft(false);
  }, [teardown, setLobbyBoth, setStateBoth, setPhaseBoth]);

  /* ---------------- host internals ---------------- */

  const hostApplyMove = useCallback(
    (move: M, by: MpRole) => {
      const cur = stateRef.current;
      if (!cur || phaseRef.current !== "playing") return;
      const next = engineRef.current.applyMove(cur, move, by);
      if (!next) return; // illegal move — ignore, state stays authoritative
      setStateBoth(next);
      const finished = engineRef.current.isFinished(next);
      if (finished) setPhaseBoth("finished");
      send({ t: "state", state: next, phase: finished ? "finished" : "playing" });
    },
    [send, setStateBoth, setPhaseBoth],
  );

  const hostBackToLobby = useCallback(() => {
    const l = lobbyRef.current;
    if (!l) return;
    setPhaseBoth("lobby");
    setStateBoth(null);
    setLobbyBoth({
      host: { ...l.host, ready: false },
      guest: l.guest ? { ...l.guest, ready: false } : null,
    });
    setPeerLeft(false);
    send({ t: "tolobby" });
    broadcastLobby();
  }, [send, broadcastLobby, setLobbyBoth, setStateBoth, setPhaseBoth]);

  const wireHostConnection = useCallback(
    (conn: DataConnection) => {
      connRef.current = conn;
      conn.on("data", (raw) => {
        const msg = raw as Wire;
        const l = lobbyRef.current;
        if (!l) return;
        switch (msg.t) {
          case "hello":
            setLobbyBoth({ host: l.host, guest: { name: cleanName(msg.name), ready: false } });
            broadcastLobby();
            break;
          case "name":
            if (l.guest) {
              setLobbyBoth({ host: l.host, guest: { ...l.guest, name: cleanName(msg.name) } });
              broadcastLobby();
            }
            break;
          case "ready":
            if (l.guest) {
              setLobbyBoth({ host: l.host, guest: { ...l.guest, ready: !!msg.ready } });
              broadcastLobby();
            }
            break;
          case "move":
            hostApplyMove(msg.move as M, "guest");
            break;
          case "tolobby":
            hostBackToLobby();
            break;
          case "leave":
            setPeerLeft(true);
            setLobbyBoth({ host: { ...l.host, ready: false }, guest: null });
            setPhaseBoth("lobby");
            setStateBoth(null);
            break;
        }
      });
      conn.on("close", () => {
        const l = lobbyRef.current;
        if (roleRef.current === "host" && l?.guest) {
          setPeerLeft(true);
          setLobbyBoth({ host: { ...l.host, ready: false }, guest: null });
          setPhaseBoth("lobby");
          setStateBoth(null);
        }
        if (connRef.current === conn) connRef.current = null;
      });
    },
    [broadcastLobby, hostApplyMove, hostBackToLobby, setLobbyBoth, setPhaseBoth, setStateBoth],
  );

  /* ---------------- public actions ---------------- */

  const createRoom = useCallback(
    (name: string) => {
      resetAll();
      setError(null);
      retryRef.current = 0;
      nameRef.current = cleanName(name);
      setRole("host");
      roleRef.current = "host";
      setStatus("connecting");
      setPhaseBoth("connecting");

      const attempt = async () => {
        const { default: PeerCtor } = await import("peerjs");
        const roomCode = generateRoomCode();
        const peer = new PeerCtor(peerIdFor(game, roomCode));
        peerRef.current = peer;
        peer.on("open", () => {
          setCode(roomCode);
          setStatus("connected");
          setPhaseBoth("lobby");
          setLobbyBoth({ host: { name: nameRef.current, ready: false }, guest: null });
        });
        peer.on("connection", (conn) => {
          // One guest only — refuse extras.
          if (connRef.current) {
            conn.on("open", () => conn.close());
            return;
          }
          wireHostConnection(conn);
        });
        peer.on("error", (err: Error & { type?: string }) => {
          if (err.type === "unavailable-id" && retryRef.current < 3) {
            retryRef.current += 1;
            try { peer.destroy(); } catch { /* noop */ }
            void attempt();
            return;
          }
          setError("Could not create the room. Check your connection and try again.");
          setStatus("error");
          setPhaseBoth("idle");
        });
      };
      void attempt();
    },
    [game, resetAll, setLobbyBoth, setPhaseBoth, wireHostConnection],
  );

  const joinRoom = useCallback(
    (roomCodeRaw: string, name: string) => {
      resetAll();
      setError(null);
      nameRef.current = cleanName(name);
      const roomCode = roomCodeRaw.trim().toUpperCase();
      setRole("guest");
      roleRef.current = "guest";
      setCode(roomCode);
      setStatus("connecting");
      setPhaseBoth("connecting");

      void (async () => {
        const { default: PeerCtor } = await import("peerjs");
        const peer = new PeerCtor();
        peerRef.current = peer;
        peer.on("open", () => {
          const conn = peer.connect(peerIdFor(game, roomCode), { reliable: true });
          connRef.current = conn;
          joinTimerRef.current = setTimeout(() => {
            if (!conn.open) {
              setError("Room not found — check the code and try again.");
              setStatus("error");
              setPhaseBoth("idle");
              teardown();
            }
          }, 12000);
          conn.on("open", () => {
            if (joinTimerRef.current) clearTimeout(joinTimerRef.current);
            setStatus("connected");
            setPhaseBoth("lobby");
            send({ t: "hello", name: nameRef.current });
          });
          conn.on("data", (raw) => {
            const msg = raw as Wire;
            switch (msg.t) {
              case "lobby":
                setLobbyBoth({ host: msg.host, guest: msg.guest });
                setPhaseBoth(msg.phase);
                break;
              case "start":
                setStateBoth(msg.state as S);
                setPhaseBoth("playing");
                break;
              case "state":
                setStateBoth(msg.state as S);
                setPhaseBoth(msg.phase);
                break;
              case "tolobby":
                setStateBoth(null);
                setPhaseBoth("lobby");
                break;
              case "leave":
                setPeerLeft(true);
                setPhaseBoth("lobby");
                setStateBoth(null);
                break;
            }
          });
          conn.on("close", () => {
            if (roleRef.current === "guest" && phaseRef.current !== "idle") {
              setPeerLeft(true);
              setStatus("error");
              setPhaseBoth("lobby");
              setStateBoth(null);
            }
          });
        });
        peer.on("error", (err: Error & { type?: string }) => {
          if (err.type === "peer-unavailable") {
            if (joinTimerRef.current) clearTimeout(joinTimerRef.current);
            setError("Room not found — check the code and try again.");
          } else {
            setError("Connection problem — check your internet and try again.");
          }
          setStatus("error");
          setPhaseBoth("idle");
        });
      })();
    },
    [game, resetAll, send, setLobbyBoth, setPhaseBoth, setStateBoth, teardown],
  );

  const setReady = useCallback(
    (ready: boolean) => {
      const l = lobbyRef.current;
      if (!l) return;
      if (roleRef.current === "host") {
        setLobbyBoth({ ...l, host: { ...l.host, ready } });
        broadcastLobby();
      } else {
        if (l.guest) setLobbyBoth({ ...l, guest: { ...l.guest, ready } });
        send({ t: "ready", ready });
      }
    },
    [broadcastLobby, send, setLobbyBoth],
  );

  const updateName = useCallback(
    (name: string) => {
      const cleaned = cleanName(name);
      nameRef.current = cleaned;
      const l = lobbyRef.current;
      if (!l) return;
      if (roleRef.current === "host") {
        setLobbyBoth({ ...l, host: { ...l.host, name: cleaned } });
        broadcastLobby();
      } else {
        if (l.guest) setLobbyBoth({ ...l, guest: { ...l.guest, name: cleaned } });
        send({ t: "name", name: cleaned });
      }
    },
    [broadcastLobby, send, setLobbyBoth],
  );

  const start = useCallback(() => {
    const l = lobbyRef.current;
    if (roleRef.current !== "host" || !l?.guest) return;
    if (!l.host.ready || !l.guest.ready) return;
    const initial = engineRef.current.initial();
    setStateBoth(initial);
    setPhaseBoth("playing");
    setPeerLeft(false);
    send({ t: "start", state: initial });
  }, [send, setStateBoth, setPhaseBoth]);

  const sendMove = useCallback(
    (move: M) => {
      if (phaseRef.current !== "playing") return;
      if (roleRef.current === "host") {
        hostApplyMove(move, "host");
      } else {
        send({ t: "move", move });
      }
    },
    [hostApplyMove, send],
  );

  const backToLobby = useCallback(() => {
    if (roleRef.current === "host") hostBackToLobby();
    else send({ t: "tolobby" });
  }, [hostBackToLobby, send]);

  const leave = useCallback(() => {
    send({ t: "leave" });
    resetAll();
    setError(null);
  }, [resetAll, send]);

  useEffect(() => teardown, [teardown]);

  return {
    phase,
    role,
    code,
    lobby,
    state: gameState,
    status,
    error,
    peerLeft,
    createRoom,
    joinRoom,
    setReady,
    updateName,
    start,
    sendMove,
    backToLobby,
    leave,
  };
}
