/* m4ster-5in1 room relay — a single-file Cloudflare Worker + Durable Object.
 *
 * Why this exists: the game's online rooms used to rendezvous through
 * public peer-to-peer infrastructure (PeerJS cloud, then Trystero over
 * torrent trackers, then Trystero over public Nostr relays). All three
 * failed the same way in production — the host's room was open and
 * waiting, but guests could never discover it ("Room not found").
 * This relay is the deterministic replacement: both browsers make one
 * outbound WebSocket connection to the room URL, the Durable Object
 * holds the room, and every message is forwarded verbatim to the other
 * player. No WebRTC, no ICE, no TURN, no third-party rendezvous.
 *
 * Protocol contract:
 *   Connect:  GET /room/<game>/<code>   (WebSocket upgrade required)
 *             <game> is the game's id ("tictactoe", "connect4"),
 *             <code> is the room code (case-insensitive; the DO
 *             instance is keyed "<game>:<lowercased code>").
 *   Capacity: a room holds exactly 2 sockets. The first is the host,
 *             the second is the guest. A third connection receives
 *             {"type":"__full"} and is closed immediately.
 *   Relay-generated control messages (JSON, `type` field):
 *             {"type":"__paired"}    — sent to BOTH sockets the moment
 *                                      the second socket joins.
 *             {"type":"__peer-left"} — sent to the surviving socket
 *                                      when the other one closes.
 *             {"type":"__full"}      — see Capacity above.
 *   Everything else is forwarded byte-for-byte to the other socket.
 *   The relay understands nothing about the game protocol and stores
 *   nothing — sockets are the only state, held via the WebSocket
 *   hibernation API so idle rooms cost nothing.
 *   Health:   GET /  ->  "m4ster-5in1 relay ok" (plain text)
 *
 * Deploy: see README.md in this folder.
 */

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected a WebSocket upgrade", { status: 426 });
    }

    const sockets = this.state.getWebSockets();

    if (sockets.length >= 2) {
      // Room is full: accept just long enough to say so, then close.
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      server.accept();
      server.send(JSON.stringify({ type: "__full" }));
      server.close(1008, "room full");
      return new Response(null, { status: 101, webSocket: client });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const role = sockets.length === 0 ? "host" : "guest";

    this.state.acceptWebSocket(server);
    server.serializeAttachment({ role });

    if (role === "guest") {
      // The pair is complete — tell both sides they can start talking.
      for (const ws of this.state.getWebSockets()) {
        try {
          ws.send(JSON.stringify({ type: "__paired" }));
        } catch {
          /* socket already going away; its close handler will fire */
        }
      }
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, message) {
    // Verbatim fan-out to the other socket. Text and binary alike —
    // the relay never inspects payloads.
    for (const other of this.state.getWebSockets()) {
      if (other === ws) continue;
      try {
        other.send(message);
      } catch {
        /* ignore — the close handler handles cleanup */
      }
    }
  }

  webSocketClose(ws, code, reason, wasClean) {
    this.notifyPeerLeft(ws);
    try {
      ws.close(code, reason);
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws, error) {
    this.notifyPeerLeft(ws);
    try {
      ws.close(1011, "socket error");
    } catch {
      /* already closed */
    }
  }

  notifyPeerLeft(leaving) {
    for (const other of this.state.getWebSockets()) {
      if (other === leaving) continue;
      try {
        other.send(JSON.stringify({ type: "__peer-left" }));
      } catch {
        /* ignore */
      }
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("m4ster-5in1 relay ok", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const match = url.pathname.match(/^\/room\/([^/]+)\/([^/]+)$/);
    if (match) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected a WebSocket upgrade", { status: 426 });
      }
      const game = match[1];
      const code = decodeURIComponent(match[2]).toLowerCase();
      const id = env.ROOMS.idFromName(`${game}:${code}`);
      const room = env.ROOMS.get(id);
      return room.fetch(request);
    }

    return new Response("not found", { status: 404 });
  },
};
