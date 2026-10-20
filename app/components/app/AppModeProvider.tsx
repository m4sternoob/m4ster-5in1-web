"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { quitApp, isAllowedAppPath } from "../../lib/appMode";
import {
  ambientMusic,
  loadVolumeState,
  saveVolumeState,
  type VolumeState,
} from "../../lib/music";

/* State and behavior for the locked app shell: the in-app history
 * stack, back handling (button, edge swipe, hardware/browser back),
 * the exit-confirm flow, and the background-music controls.
 *
 * The shell is the navigation root now — the browser history is only a
 * transport. Our own stack decides what "one step back" means, and at
 * the root a back press opens the exit overlay instead of leaving. */

export type QuitState = "idle" | "closing" | "manual";

type AppModeContextValue = {
  appMode: boolean;
  atRoot: boolean;
  goBack: () => void;
  goHome: () => void;
  exitOpen: boolean;
  setExitOpen: (open: boolean) => void;
  quitState: QuitState;
  confirmQuit: () => void;
  volume: number;
  muted: boolean;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

const WEB_FALLBACK: AppModeContextValue = {
  appMode: false,
  atRoot: true,
  goBack: () => undefined,
  goHome: () => undefined,
  exitOpen: false,
  setExitOpen: () => undefined,
  quitState: "idle",
  confirmQuit: () => undefined,
  volume: 0,
  muted: true,
  setVolume: () => undefined,
  toggleMute: () => undefined,
};

const AppModeContext = createContext<AppModeContextValue>(WEB_FALLBACK);

/** Outside the provider (the plain website) this returns appMode:false
    and no-op controls, so shared components can call it safely. */
export function useAppMode(): AppModeContextValue {
  return useContext(AppModeContext);
}

const ROOT = "/";

export default function AppModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? ROOT;

  const [stack, setStack] = useState<string[]>([pathname]);
  const [exitOpen, setExitOpen] = useState(false);
  const [quitState, setQuitState] = useState<QuitState>("idle");
  const [vol, setVol] = useState<VolumeState>(() => loadVolumeState());

  /* Latest-value mirrors for the window-level handlers below, which
     subscribe once and must never read stale state. */
  const stackRef = useRef(stack);
  const pathRef = useRef(pathname);
  const volRef = useRef(vol);
  useEffect(() => {
    stackRef.current = stack;
    pathRef.current = pathname;
    volRef.current = vol;
  });

  /* Keep our stack in sync with real navigation, adjusted during render
     (the React-blessed pattern for state derived from a changing value).
     A pathname equal to the entry below the top means we just moved
     back — pop instead of push. */
  const [syncedPath, setSyncedPath] = useState(pathname);
  if (syncedPath !== pathname) {
    setSyncedPath(pathname);
    setStack((prev) => {
      const top = prev[prev.length - 1];
      if (pathname === top) return prev;
      if (prev.length > 1 && pathname === prev[prev.length - 2]) {
        return prev.slice(0, -1);
      }
      return [...prev, pathname];
    });
  }

  const atRoot = stack.length <= 1 && pathname === ROOT;

  /* History trap at the root: keep one sentinel entry behind the
     launcher so a hardware/browser back press lands on the same URL and
     opens the exit overlay instead of leaving the app. The current
     entry carrying our flag means a sentinel is already in place. */
  useEffect(() => {
    if (!atRoot) return;
    const state = window.history.state as { appShellRoot?: boolean } | null;
    if (state?.appShellRoot) return;
    try {
      window.history.pushState(
        { appShellRoot: true },
        "",
        window.location.href,
      );
    } catch {
      /* history unavailable — the overlay path just won't trigger */
    }
  }, [atRoot, stack]);

  useEffect(() => {
    const onPopState = () => {
      /* Only a back press AT the root opens the exit overlay. A back
         that lands on the root from a game arrives on our sentinel
         entry — its history.state carries the appShellRoot flag, which
         Next preserves when it stamps its own keys in. A genuine
         root back press lands on the plain entry below the sentinel,
         which has no flag. The flag is what separates the two cases;
         stack/pathname reads race with the router's own popstate
         handling and cannot. */
      const landed = window.history.state as {
        appShellRoot?: boolean;
      } | null;
      if (landed?.appShellRoot) return;
      if (stackRef.current.length <= 1 && pathRef.current === ROOT) {
        setExitOpen(true);
        try {
          window.history.pushState(
            { appShellRoot: true },
            "",
            window.location.href,
          );
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /* Navigation confinement: a capture-phase click listener on the
     document swallows any link that would leave the allowed route
     set — external sites, downloads, mailto, stray site pages.
     Attached at document level so even content rendered outside the
     shell frame (portals) cannot escape. In-app links pass through. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (
        url.origin !== window.location.origin ||
        !isAllowedAppPath(url.pathname)
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const goBack = useCallback(() => {
    if (exitOpen) {
      setExitOpen(false);
      return;
    }
    if (stackRef.current.length > 1) {
      router.back();
    } else if (pathRef.current !== ROOT) {
      // Landed directly on a game (deep link / restored tab): the
      // launcher is the implicit step below.
      setStack([ROOT]);
      router.replace(ROOT);
    } else {
      setExitOpen(true);
    }
  }, [exitOpen, router]);

  const goHome = useCallback(() => {
    setExitOpen(false);
    if (pathRef.current !== ROOT) {
      setStack([ROOT]);
      router.push(ROOT);
    }
  }, [router]);

  /* Edge swipe-back: a rightward swipe starting within 24px of the
     left edge is one step back — never an exit. */
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      tracking = t.clientX <= 24;
      startX = t.clientX;
      startY = t.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx >= 64 && dy < 60) goBack();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [goBack]);

  /* Background music: browsers require a user gesture before audio, so
     the engine starts on the first pointerdown anywhere in the shell.
     Later calls just make sure the context is resumed. */
  useEffect(() => {
    const kick = () => ambientMusic.start(volRef.current);
    kick();
    window.addEventListener("pointerdown", kick);
    return () => window.removeEventListener("pointerdown", kick);
  }, []);

  const applyVolume = useCallback((next: VolumeState) => {
    setVol(next);
    saveVolumeState(next);
    ambientMusic.start(next);
    ambientMusic.setVolume(next);
  }, []);

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.min(1, Math.max(0, v));
      applyVolume({ volume: clamped, muted: clamped === 0 ? volRef.current.muted : false });
    },
    [applyVolume],
  );

  const toggleMute = useCallback(() => {
    applyVolume({ ...volRef.current, muted: !volRef.current.muted });
  }, [applyVolume]);

  const confirmQuit = useCallback(() => {
    setQuitState("closing");
    void quitApp().then((invoked) => {
      if (!invoked) {
        // No native bridge took it (typical for an installed PWA):
        // tell the user to close the app themselves.
        setQuitState("manual");
        return;
      }
      // A native close should end us; if we are still alive shortly
      // after, it silently failed — same manual fallback.
      window.setTimeout(() => setQuitState("manual"), 900);
    });
  }, []);

  const value: AppModeContextValue = {
    appMode: true,
    atRoot,
    goBack,
    goHome,
    exitOpen,
    setExitOpen,
    quitState,
    confirmQuit,
    volume: vol.volume,
    muted: vol.muted,
    setVolume,
    toggleMute,
  };

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}
