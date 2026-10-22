// 5IN1 service worker — offline-first caching for the static export.
//
// Native app shells (Tauri / Capacitor) must never be fronted by a
// service worker: the bundle is already on disk, and a worker in a
// shell webview persists across app upgrades, where it can pin the
// previous build's HTML in front of a newer bundle whose hashed
// assets no longer exist (the v1.0.6 exe rendered with no CSS/JS).
// If this worker finds itself running in the Tauri shell — the
// webview's user-agent marker, or the shell's tauri.localhost origin —
// it retires: drop every cache, unregister, and reload open pages so
// they load the bundle directly. The browser's update check fetches
// this script without going through the old worker, so this also
// heals upgrades from builds that registered the worker
// unconditionally, even when the old worker can no longer load the
// app's JavaScript. Capacitor is cleaned up from the page instead
// (see PwaRegister) — its local server keeps page JS reachable.
const IN_APP_SHELL =
  navigator.userAgent.includes("M4sterAppShell") ||
  self.location.hostname === "tauri.localhost";

if (IN_APP_SHELL) {
  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        await Promise.all(
          clients.map((client) => client.navigate(client.url))
        );
      })()
    );
  });

  // While retirement is in flight, never answer a fetch — let every
  // request go straight to the bundle.
  self.addEventListener("fetch", () => {});
} else {
  // v3: the volume-control deploy (2026-10-21) left this name at v2,
  // so clients kept the old worker and its whole cache — pages and
  // chunks from before that deploy stayed in rotation on devices
  // that had visited earlier. Bump the name on any deploy that must
  // reach every installed client; activate below deletes the rest.
  const CACHE = "5in1-v3";
  const CORE = ["/", "/play/", "/manifest.json", "/offline.html"];

  // Install: pre-cache the app shell.
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches
        .open(CACHE)
        .then((cache) => cache.addAll(CORE))
        .then(() => self.skipWaiting())
        .catch(() => self.skipWaiting())
    );
  });

  // Activate: drop old caches.
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
        .then(() => self.clients.claim())
    );
  });

  // Fetch strategy:
  // - Navigations: network-first, fall back to cache, then offline page.
  // - Static assets (/_next/, /icons/, images): cache-first, populate in background.
  // - Everything else: network-first with cache fallback.
  self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          })
          .catch(() =>
            caches.match(request).then((hit) => hit || caches.match("/offline.html"))
          )
      );
      return;
    }

    if (
      url.pathname.startsWith("/_next/") ||
      url.pathname.startsWith("/icons/") ||
      /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css|js)$/i.test(url.pathname)
    ) {
      event.respondWith(
        caches.match(request).then((hit) => {
          const net = fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          });
          return hit || net;
        })
      );
      return;
    }

    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
  });
}
