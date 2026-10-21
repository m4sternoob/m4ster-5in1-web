# m4ster-5in1 room relay

A tiny Cloudflare Worker + Durable Object that relays online-multiplayer
room traffic for the 5IN1 web games (Tic-Tac-Toe, Connect 4). It replaces
the peer-to-peer rendezvous (PeerJS / Trystero) that repeatedly failed to
make host rooms discoverable to guests: both browsers now make a single
outbound WebSocket connection to this relay, and the relay forwards every
message to the other player. No WebRTC, no ICE/TURN, no sign-up data —
the relay stores nothing; open sockets are the only state.

## Protocol contract

- **Connect:** `GET /room/<game>/<code>` with a WebSocket upgrade.
  `<game>` is the game id (`tictactoe`, `connect4`); `<code>` is the room
  code (case-insensitive). Each `<game>:<code>` pair maps to one Durable
  Object instance (`ROOMS.idFromName`).
- **Capacity:** exactly 2 sockets per room. First socket in = host,
  second = guest. A third connection gets `{"type":"__full"}` and is
  closed.
- **Relay control messages** (JSON with a `type` field):
  - `{"type":"__paired"}` — sent to **both** sockets when the second
    socket joins. The client's cue to start the name/hello exchange.
  - `{"type":"__peer-left"}` — sent to the surviving socket when the
    other socket closes or errors.
  - `{"type":"__full"}` — see Capacity.
- **Everything else** is forwarded verbatim (text or binary) to the other
  socket. The game protocol on top of this pipe lives in
  `app/lib/mp/room.ts` and is not the relay's business.
- **Health check:** `GET /` returns the plain text `m4ster-5in1 relay ok`.

Sockets are held with the WebSocket hibernation API
(`state.acceptWebSocket`), with each socket's role (`host` / `guest`)
kept in its serialized attachment, so idle rooms hibernate for free and
roles survive the hibernation.

## Deploy

### Option A — wrangler CLI (mechanical)

```sh
cd relay
npx wrangler login     # once, opens the browser
npx wrangler deploy
```

`wrangler.toml` already declares everything: worker name
`m4ster-5in1-relay`, entry `worker.js`, the Durable Object binding
**`ROOMS`** → class **`Room`**, and migration tag **`v1`** creating
`Room` as a new SQLite-backed class. The deploy output prints the live
URL, e.g. `https://m4ster-5in1-relay.<your-subdomain>.workers.dev`.

### Option B — Cloudflare dashboard (paste)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Worker**.
   Name it `m4ster-5in1-relay`, deploy the placeholder.
2. **Edit code**, replace everything with the contents of `worker.js`,
   **Deploy**.
3. Worker **Settings → Durable Objects → Add binding**:
   variable name `ROOMS`, Durable Object class `Room` (defined in the
   same script). Saving the binding applies the class migration
   automatically.
4. The worker's `*.workers.dev` URL is shown on the worker's overview
   page.

### After deploying — wire the client

In `app/lib/mp/room.ts`, set the exported constant

```ts
export const RELAY_HOST = "<worker-host-from-the-deploy>";
```

to the deployed host (no scheme — the client uses `wss://<host>/room/…`),
then rebuild/redeploy the site. Verify with the health route:
`https://<host>/` should print `m4ster-5in1 relay ok`.
