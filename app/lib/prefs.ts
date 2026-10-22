/* Shared access to the Customize prefs (localStorage key `m4ster-customize`,
   owned by CustomizeToolbar). The toolbar maintains body classes from the
   stored settings — `no-anim` is present whenever motion is off (master
   Animations toggle off, or the OS asks for reduced motion) — and fires
   PREFS_EVENT after every apply so loop-driven components (TileGrid,
   OrbCursor) can start/stop without polling. */

export const PREFS_KEY = "m4ster-customize";
export const PREFS_EVENT = "m4ster-customize-change";

/* True when all decorative motion must be off right now. The body class is
   the single source of truth: the pre-paint script in the root layout sets
   it before first paint, CustomizeToolbar keeps it in sync afterwards. */
export function motionOff(): boolean {
  if (typeof document === "undefined") return true;
  return document.body?.classList.contains("no-anim") ?? true;
}
