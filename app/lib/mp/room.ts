"use client";

/* Shared online-multiplayer room manager (WebSocket relay, host-authoritative).
   One hook drives every game's online mode: the host creates a room
   with a short code, the guest joins by code or invite link, both use
   temporary session names (no accounts, no sign-in). The host owns the
   game state — it validates every move through the game's engine and
   broadcasts the resulting state; the guest only sends move intents.

   Transport: a plain WebSocket to our own room relay (see relay/ —
   a Cloudflare Worker + Durable Object). Both browsers connect to
   wss://<RELAY_HOST>/room/<game>/<code>; the relay holds exactly the
   two sockets and forwards every message verbatim to the other side.
   There is no WebRTC, no ICE/TURN, and no third-party rendezvous —
   this replaced a PeerJS build and then a Trystero build whose public
   rendezvous infrastructure (cloud broker, torrent trackers, Nostr
   relays) repeatedly failed to make host rooms discoverable to
   guests: "Room not found" for rooms that were demonstrably open,
   on real devices as well as in tests.

   Relay control messages (JSON, `type` field — game messages use `t`):
     {type:"__paired"}    both sockets: the pair is complete
     {type:"__peer-left"} the other socket closed
     {type:"__full"}      a third join attempt was rejected

   Wire protocol (JSON over the socket):
     guest -> host : hello {name} | ready {ready} | name {name}
                     move {move} | tolobby (rematch request) | leave
     host  -> guest: lobby {host, guest, phase} | start {state}
                     state {state, phase} | tolobby | leave        */

import { useCallback, useEffect, useRef, useState } from "react";
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

/* Host of the room relay (relay/worker.js). No scheme — clients
   connect over wss://, except local dev hosts which use ws://. */
export const RELAY_HOST = "m4ster-5in1-relay.m4ster-relay.workers.dev";

function relayUrlFor(game: string, code: string): string {
  const local = RELAY_HOST.startsWith("127.") || RELAY_HOST.includes("localhost");
  const scheme = local ? "ws" : "wss";
  return `${scheme}://${RELAY_HOST}/room/${game}/${code.toLowerCase()}`;
}

/* How long a guest waits for the room's host to pair and send the
   first lobby sync before concluding the room isn't there. Generous
   enough for a cold relay + a host on a slow network — but it always
   ends in the clear "Room not found" error, never a silent hang. */
const JOIN_BUDGET_MS = 20000;

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
  const socketRef = useRef<WebSocket | null>(null);
  /* Whether the current socket ever reached OPEN — tells a relay
     that never answered (bad host, no network) apart from one that
     dropped mid-session when the close event lands. */
  const openedRef = useRef(false);
  const roleRef = useRef<MpRole | null>(null);
  const phaseRef = useRef<MpPhase>("idle");
  const lobbyRef = useRef<LobbyState | null>(null);
  const stateRef = useRef<S | null>(null);
  const nameRef = useRef<string>("");
  const joinedRef = useRef(false);
  const budgetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Bumped on every teardown: socket handlers and timers capture
     their generation and bail when it goes stale, so a dead session
     can never resurrect itself. */
  const sessionRef = useRef(0);

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
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* a dead socket reports itself through the close handler */
    }
  }, []);

  const broadcastLobby = useCallback(() => {
    const l = lobbyRef.current;
    if (!l) return;
    send({ t: "lobby", host: l.host, guest: l.guest, phase: phaseRef.current });
  }, [send]);

  const teardown = useCallback(() => {
    sessionRef.current += 1;
    if (budgetTimerRef.current) {
      clearTimeout(budgetTimerRef.current);
      budgetTimerRef.current = null;
    }
    const ws = socketRef.current;
    socketRef.current = null;
    openedRef.current = false;
    joinedRef.current = false;
    if (ws) {
      try {
        ws.close();
      } catch { /* noop */ }
    }
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

  /** The guest is gone (left, dropped, or the relay said so): reset
      to an open lobby waiting for a new guest. */
  const hostGuestGone = useCallback(() => {
    const l = lobbyRef.current;
    if (!l?.guest) return;
    setPeerLeft(true);
    setLobbyBoth({ host: { ...l.host, ready: false }, guest: null });
    setPhaseBoth("lobby");
    setStateBoth(null);
  }, [setLobbyBoth, setPhaseBoth, setStateBoth]);

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

  const hostOnMessage = useCallback(
    (msg: Wire) => {
      const l = lobbyRef.current;
      if (!l) return;
      if (msg.t === "hello") {
        // The relay guarantees a single counterpart. A repeat hello
        // from our guest just resyncs the lobby.
        if (!l.guest) {
          setLobbyBoth({ host: l.host, guest: { name: cleanName(msg.name), ready: false } });
        }
        broadcastLobby();
        return;
      }
      if (!l.guest) return; // no guest yet — nothing else can be real
      switch (msg.t) {
        case "name":
          setLobbyBoth({ host: l.host, guest: { ...l.guest, name: cleanName(msg.name) } });
          broadcastLobby();
          break;
        case "ready":
          setLobbyBoth({ host: l.host, guest: { ...l.guest, ready: !!msg.ready } });
          broadcastLobby();
          break;
        case "move":
          hostApplyMove(msg.move as M, "guest");
          break;
        case "tolobby":
          hostBackToLobby();
          break;
        case "leave":
          hostGuestGone();
          break;
      }
    },
    [broadcastLobby, hostApplyMove, hostBackToLobby, hostGuestGone, setLobbyBoth],
  );

  /* ---------------- guest internals ---------------- */

  /** The host is gone. A clean departure (their "leave" message or
      the relay's __peer-left) and an abrupt drop (our socket died)
      differ only in whether an error line accompanies the
      opponent-left state. */
  const guestHostLost = useCallback(
    (showError: boolean) => {
      if (roleRef.current !== "guest" || phaseRef.current === "idle") return;
      setPeerLeft(true);
      if (showError) {
        setError("Connection to the host was lost.");
        setStatus("error");
      }
      setPhaseBoth("lobby");
      setStateBoth(null);
    },
    [setPhaseBoth, setStateBoth],
  );

  const guestOnMessage = useCallback(
    (msg: Wire) => {
      switch (msg.t) {
        case "lobby":
          if (!joinedRef.current) {
            /* First contact — the room is real and the host is in it.
               The join has officially succeeded. */
            joinedRef.current = true;
            if (budgetTimerRef.current) {
              clearTimeout(budgetTimerRef.current);
              budgetTimerRef.current = null;
            }
            setStatus("connected");
          }
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
          guestHostLost(false);
          break;
      }
    },
    [guestHostLost, setLobbyBoth, setPhaseBoth, setStateBoth],
  );

  /* ---------------- transport wiring ---------------- */

  /** The host's socket closed (relay unreachable, network dropped):
      surface it and fall back to the create/join panel. */
  const hostRelayLost = useCallback(() => {
    if (roleRef.current !== "host" || phaseRef.current === "idle") return;
    const wasOpened = openedRef.current;
    resetAll();
    setError(
      wasOpened
        ? "Connection to the room relay was lost."
        : "Could not reach the room relay — check your connection and try again.",
    );
    setStatus("error");
  }, [resetAll]);

  /** Relay control messages: __paired starts the guest's hello
      exchange; __peer-left feeds the same opponent-left paths the
      game messages use; __full means the room already has two
      players, which from a joiner's seat is a room that can't be
      joined — the standard not-found error, immediately. */
  const handleControl = useCallback(
    (type: string) => {
      if (type === "__paired") {
        if (roleRef.current === "guest") {
          send({ t: "hello", name: nameRef.current });
        }
      } else if (type === "__peer-left") {
        if (roleRef.current === "host") hostGuestGone();
        else if (roleRef.current === "guest") guestHostLost(false);
      } else if (type === "__full") {
        if (roleRef.current === "guest" && !joinedRef.current) {
          setError("Room not found — check the code and try again.");
          setStatus("error");
          setPhaseBoth("idle");
          teardown();
        }
      }
    },
    [send, hostGuestGone, guestHostLost, setPhaseBoth, teardown],
  );

  /** Attach the session's handlers to a fresh socket. Handlers check
      the session generation before touching anything, so events from
      a torn-down socket are always ignored. */
  const wireSocket = useCallback(
    (ws: WebSocket, gen: number) => {
      ws.onmessage = (ev) => {
        if (sessionRef.current !== gen || typeof ev.data !== "string") return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(ev.data);
        } catch {
          return;
        }
        const rec = parsed as { type?: unknown; t?: unknown };
        if (typeof rec.type === "string" && rec.type.startsWith("__")) {
          handleControl(rec.type);
          return;
        }
        if (typeof rec.t !== "string") return;
        const msg = parsed as Wire;
        if (roleRef.current === "host") hostOnMessage(msg);
        else if (roleRef.current === "guest") guestOnMessage(msg);
      };
      ws.onclose = () => {
        if (sessionRef.current !== gen) return;
        if (roleRef.current === "host") {
          hostRelayLost();
        } else if (roleRef.current === "guest" && joinedRef.current) {
          guestHostLost(true);
        }
        /* A guest whose socket dies before pairing does nothing here —
           the still-running join budget delivers the verdict. */
      };
      ws.onerror = () => {
        /* onclose always follows an error and does the surfacing */
      };
    },
    [handleControl, hostOnMessage, guestOnMessage, hostRelayLost, guestHostLost],
  );

  /* ---------------- public actions ---------------- */

  const createRoom = useCallback(
    (name: string) => {
      resetAll();
      setError(null);
      nameRef.current = cleanName(name);
      setRole("host");
      roleRef.current = "host";
      setStatus("connecting");
      setPhaseBoth("connecting");
      const gen = sessionRef.current;
      const roomCode = generateRoomCode();

      let ws: WebSocket;
      try {
        ws = new WebSocket(relayUrlFor(game, roomCode));
      } catch {
        setError("Could not reach the room relay — check your connection and try again.");
        setStatus("error");
        setPhaseBoth("idle");
        return;
      }
      socketRef.current = ws;
      wireSocket(ws, gen);
      ws.onopen = () => {
        if (sessionRef.current !== gen) return;
        openedRef.current = true;
        /* The relay is holding our socket — the room is live and the
           code can be shared. A guest pairs with us when they connect
           to the same room URL. */
        setStatus("connected");
        setCode(roomCode);
        setPhaseBoth("lobby");
        setLobbyBoth({ host: { name: nameRef.current, ready: false }, guest: null });
      };
    },
    [game, resetAll, setLobbyBoth, setPhaseBoth, wireSocket],
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
      const gen = sessionRef.current;

      /* Join budget: if pairing + the first lobby sync never complete
         (wrong code, room closed, host gone), the guest lands on the
         same clear error as always — never an endless "Joining…". */
      budgetTimerRef.current = setTimeout(() => {
        if (sessionRef.current !== gen || joinedRef.current) return;
        setError("Room not found — check the code and try again.");
        setStatus("error");
        setPhaseBoth("idle");
        teardown();
      }, JOIN_BUDGET_MS);

      let ws: WebSocket;
      try {
        ws = new WebSocket(relayUrlFor(game, roomCode));
      } catch {
        return; // the budget timer delivers the verdict
      }
      socketRef.current = ws;
      wireSocket(ws, gen);
      ws.onopen = () => {
        if (sessionRef.current !== gen) return;
        openedRef.current = true;
        /* Nothing to show yet: __paired starts the hello exchange,
           and the host's first lobby broadcast completes the join. */
      };
    },
    [game, resetAll, setPhaseBoth, teardown, wireSocket],
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
