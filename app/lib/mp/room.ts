"use client";

/* Shared online-multiplayer room manager (Trystero, host-authoritative).
   One hook drives every game's online mode: the host creates a room
   with a short code, the guest joins by code or invite link, both use
   temporary session names (no accounts, no sign-in). The host owns the
   game state — it validates every move through the game's engine and
   broadcasts the resulting state; the guest only sends move intents.

   Transport: Trystero's MQTT strategy. The two browsers rendezvous
   through public MQTT brokers over secure WebSocket — arbitrary-topic
   publish/subscribe fan-out to live subscribers is a broker's entire
   function (no server of ours) — and then talk over a direct WebRTC
   data channel. History: a PeerJS build's public cloud broker
   repeatedly failed to make host registrations discoverable to
   guests ("Room not found" for rooms that were demonstrably open);
   the torrent strategy's WebTorrent trackers never rendezvoused the
   peers in the live test; and the nostr strategy that followed
   failed on two real devices (Mac host, phone guest, same error)
   because the big public Nostr relays don't reliably fan out
   Trystero's ephemeral event kinds.

   Wire protocol (JSON over the data channel):
     guest -> host : hello {name} | ready {ready} | name {name}
                     move {move} | tolobby (rematch request) | leave
     host  -> guest: lobby {host, guest, phase} | start {state}
                     state {state, phase} | tolobby | leave        */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "trystero";
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

/* Trystero room id for a game + room code. Derived from both so a
   Tic-Tac-Toe room and a Connect 4 room (or two different codes) can
   never collide in the same relay set. */
export function roomIdFor(game: string, code: string): string {
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

/* Trystero app id — every build of this app rendezvouses in this
   namespace; bump the suffix to hard-partition incompatible builds. */
const TRYSTERO_APP_ID = "m4ster-5in1-mp-v1";

/* Public MQTT brokers for rendezvous, passed to Trystero as
   relayUrls (when set, the whole list is used). This is the exact
   default set Trystero 0.22 ships for its MQTT strategy — pinned
   explicitly so the rendezvous set can't drift between builds.
   Three independent public brokers in parallel: any one of them
   fanning out is enough for the peers to find each other. */
const MQTT_BROKERS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://test.mosquitto.org:8081/mqtt",
  "wss://broker.hivemq.com:8884/mqtt",
];

/* ICE servers for the WebRTC data channel, passed to Trystero as
   rtcConfig. STUN alone cannot punch through strict NATs or networks
   that block UDP — peers would find each other, then the channel
   would never open. The TURN relays below (Open Relay Project, free
   public credentials) carry the channel over TCP/TLS when direct
   paths fail. One shared list for every room — no per-game copies. */
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.relay.metered.ca:80" },
  {
    urls: "turn:standard.relay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:standard.relay.metered.ca:80?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:standard.relay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turns:standard.relay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

/* How long a guest waits for the room's host to appear (broker
   connect + subscribe + rendezvous + channel open + first lobby
   sync) before concluding the room isn't there. Public-broker
   discovery is slower than a dedicated round-trip, so the budget
   is generous — but it always ends in the clear "Room not found"
   error, never a silent hang. */
const JOIN_BUDGET_MS = 30000;

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

/** Trystero action sender, narrowed to our wire messages. */
type WireSend = (msg: Wire, targetId?: string) => void;

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
  const roomRef = useRef<Room | null>(null);
  const wireSendRef = useRef<WireSend | null>(null);
  /* The counterpart's Trystero peer id: for the host, the peer that
     claimed the guest slot; for the guest, the host's peer. All wire
     traffic is targeted at this id — stray peers in the room (there
     should never be any) are ignored. */
  const remoteRef = useRef<string | null>(null);
  const roleRef = useRef<MpRole | null>(null);
  const phaseRef = useRef<MpPhase>("idle");
  const lobbyRef = useRef<LobbyState | null>(null);
  const stateRef = useRef<S | null>(null);
  const nameRef = useRef<string>("");
  const joinedRef = useRef(false);
  const budgetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Bumped on every teardown: async closures (dynamic import, budget
     timers) capture their generation and bail when it goes stale, so
     a dead session can never resurrect itself. */
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

  const send = useCallback((msg: Wire, targetId?: string) => {
    const wireSend = wireSendRef.current;
    if (!wireSend) return;
    wireSend(msg, targetId ?? remoteRef.current ?? undefined);
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
    if (iceTimerRef.current) {
      clearTimeout(iceTimerRef.current);
      iceTimerRef.current = null;
    }
    const room = roomRef.current;
    roomRef.current = null;
    wireSendRef.current = null;
    remoteRef.current = null;
    joinedRef.current = false;
    if (room) {
      try {
        void room.leave().catch(() => { /* already gone */ });
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

  /* ---------------- shared transport wiring ---------------- */

  /** ICE loss watcher for one peer connection: "disconnected" gets a
      grace window to recover, "failed"/"closed" declare the peer
      lost immediately. (Trystero also reports peer departures itself;
      both paths funnel into the same lost handler, which is
      idempotent — the first to fire wins.) */
  const watchIce = useCallback((peerId: string, onLost: () => void) => {
    const pc = roomRef.current?.getPeers()[peerId];
    if (!pc) return;
    pc.addEventListener("iceconnectionstatechange", () => {
      const state = pc.iceConnectionState;
      if (state === "connected" || state === "completed") {
        if (iceTimerRef.current) {
          clearTimeout(iceTimerRef.current);
          iceTimerRef.current = null;
        }
      } else if (state === "disconnected") {
        if (!iceTimerRef.current) {
          iceTimerRef.current = setTimeout(onLost, 6000);
        }
      } else if (state === "failed" || state === "closed") {
        if (iceTimerRef.current) {
          clearTimeout(iceTimerRef.current);
          iceTimerRef.current = null;
        }
        onLost();
      }
    });
  }, []);

  /* ---------------- host internals ---------------- */

  /** The guest is gone (left, dropped, or ICE died): reset to an
      open lobby waiting for a new guest. */
  const hostGuestGone = useCallback(() => {
    const l = lobbyRef.current;
    remoteRef.current = null;
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
    (msg: Wire, peerId: string) => {
      const l = lobbyRef.current;
      if (!l) return;
      if (msg.t === "hello") {
        // One guest only — a hello from anyone else is ignored while
        // the slot is taken. A hello from OUR guest just resyncs.
        if (remoteRef.current && remoteRef.current !== peerId) return;
        if (l.guest && remoteRef.current !== peerId) return;
        remoteRef.current = peerId;
        if (!l.guest) {
          setLobbyBoth({ host: l.host, guest: { name: cleanName(msg.name), ready: false } });
        }
        broadcastLobby();
        return;
      }
      if (peerId !== remoteRef.current) return; // not our guest
      switch (msg.t) {
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
          hostGuestGone();
          break;
      }
    },
    [broadcastLobby, hostApplyMove, hostBackToLobby, hostGuestGone, setLobbyBoth],
  );

  /* ---------------- guest internals ---------------- */

  /** The host is gone. Abrupt drops (peer departed / ICE died) and
      the host's clean "leave" differ only in whether an error line
      accompanies the opponent-left state. */
  const guestHostLost = useCallback(
    (showError: boolean) => {
      if (roleRef.current !== "guest" || phaseRef.current === "idle") return;
      remoteRef.current = null;
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
    (msg: Wire, peerId: string) => {
      if (remoteRef.current && peerId !== remoteRef.current) return;
      switch (msg.t) {
        case "lobby":
          if (!joinedRef.current) {
            /* First contact — the room is real and the host is in it.
               The join has officially succeeded. */
            joinedRef.current = true;
            remoteRef.current = peerId;
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

      void (async () => {
        const { joinRoom } = await import("trystero/mqtt");
        if (sessionRef.current !== gen) return;
        const room = joinRoom(
          {
            appId: TRYSTERO_APP_ID,
            relayUrls: MQTT_BROKERS,
            rtcConfig: { iceServers: ICE_SERVERS },
          },
          roomIdFor(game, roomCode),
        );
        roomRef.current = room;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [sendAction, onAction] = room.makeAction<any>("mp");
        wireSendRef.current = (msg, targetId) => {
          try {
            void (sendAction(msg, targetId) as Promise<unknown>).catch(() => {
              /* peer unreachable mid-send; leave handlers report it */
            });
          } catch { /* noop */ }
        };
        onAction((data: unknown, peerId: string) => hostOnMessage(data as Wire, peerId));
        room.onPeerJoin((peerId) => {
          watchIce(peerId, hostGuestGone);
        });
        room.onPeerLeave((peerId) => {
          if (peerId === remoteRef.current) hostGuestGone();
        });
        /* No broker registration to wait on: the room exists as soon
           as we announce on the brokers, so the code and lobby go up
           right away. Guests discover us through the brokers. */
        setStatus("connected");
        setCode(roomCode);
        setPhaseBoth("lobby");
        setLobbyBoth({ host: { name: nameRef.current, ready: false }, guest: null });
      })();
    },
    [game, resetAll, hostGuestGone, hostOnMessage, setLobbyBoth, setPhaseBoth, watchIce],
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

      void (async () => {
        const { joinRoom } = await import("trystero/mqtt");
        if (sessionRef.current !== gen) return;
        const room = joinRoom(
          {
            appId: TRYSTERO_APP_ID,
            relayUrls: MQTT_BROKERS,
            rtcConfig: { iceServers: ICE_SERVERS },
          },
          roomIdFor(game, roomCode),
        );
        roomRef.current = room;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [sendAction, onAction] = room.makeAction<any>("mp");
        wireSendRef.current = (msg, targetId) => {
          try {
            void (sendAction(msg, targetId) as Promise<unknown>).catch(() => {
              /* peer unreachable mid-send; leave handlers report it */
            });
          } catch { /* noop */ }
        };
        onAction((data: unknown, peerId: string) => guestOnMessage(data as Wire, peerId));
        room.onPeerJoin((peerId) => {
          watchIce(peerId, () => guestHostLost(true));
          if (remoteRef.current) return; // already talking to the host
          remoteRef.current = peerId;
          send({ t: "hello", name: nameRef.current }, peerId);
        });
        room.onPeerLeave((peerId) => {
          if (peerId === remoteRef.current) guestHostLost(false);
        });
        /* Join budget: if the host never appears (wrong code, room
           closed, brokers can't find them), the guest lands on the
           same clear error as before — never an endless "Joining…". */
        budgetTimerRef.current = setTimeout(() => {
          if (sessionRef.current !== gen || joinedRef.current) return;
          setError("Room not found — check the code and try again.");
          setStatus("error");
          setPhaseBoth("idle");
          teardown();
        }, JOIN_BUDGET_MS);
      })();
    },
    [game, resetAll, guestHostLost, guestOnMessage, send, setPhaseBoth, teardown, watchIce],
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
