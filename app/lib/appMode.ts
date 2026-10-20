/* App-mode detection and native-bridge helpers.
 *
 * "App mode" means the site is running as an installed app rather than a
 * plain browser tab: the Tauri desktop shell, the Capacitor mobile shell,
 * or an installed PWA (standalone / fullscreen display mode, incl. iOS
 * home-screen apps). The locked AppShell renders only in app mode; the
 * normal website is completely unaffected.
 *
 * Everything here is synchronous and side-effect free except quitApp(),
 * so it can run in a layout effect before first paint. */

type TauriWindowApi = {
  getCurrentWindow?: () => { close: () => Promise<void> };
  getCurrent?: () => { close: () => Promise<void> };
};

type TauriGlobal = {
  window?: TauriWindowApi;
  webviewWindow?: TauriWindowApi;
  core?: { invoke?: (cmd: string, args?: unknown) => Promise<unknown> };
};

type TauriInternals = {
  invoke?: (cmd: string, args?: unknown) => Promise<unknown>;
};

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    App?: { exitApp?: () => Promise<void> | void };
  };
};

declare global {
  interface Window {
    __TAURI__?: TauriGlobal;
    __TAURI_INTERNALS__?: TauriInternals;
    Capacitor?: CapacitorGlobal;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.__TAURI_INTERNALS__ !== undefined ||
    window.__TAURI__ !== undefined
  );
}

export function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = window.Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === "function") {
    try {
      return cap.isNativePlatform();
    } catch {
      /* fall through to the platform check */
    }
  }
  if (typeof cap.getPlatform === "function") {
    try {
      return cap.getPlatform() !== "web";
    } catch {
      return false;
    }
  }
  return false;
}

export function isInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  ) {
    return true;
  }
  // iOS home-screen apps expose navigator.standalone instead.
  return (
    typeof navigator !== "undefined" && navigator.standalone === true
  );
}

/** True when the app should render the locked app shell. */
export function detectAppMode(): boolean {
  return isTauri() || isCapacitor() || isInstalledPwa();
}

/** Pathnames reachable inside the locked shell. Everything else — and
    every external origin — is blocked by the shell's click guard. */
export function isAllowedAppPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/play") return true;
  return pathname.startsWith("/play/");
}

/** Close the app through the strongest bridge available.
    Returns true when a native close was actually invoked; false when we
    could only try window.close() (a no-op for most installed PWAs), so
    the caller can show a "close it yourself" state instead. */
export async function quitApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Tauri v2 global bridge (present when withGlobalTauri is enabled).
  const tauri = window.__TAURI__;
  const winApi = tauri?.window ?? tauri?.webviewWindow;
  const current = winApi?.getCurrentWindow?.() ?? winApi?.getCurrent?.();
  if (current?.close) {
    try {
      await current.close();
      return true;
    } catch {
      /* try the next bridge */
    }
  }

  // Tauri v2 internals — always injected, no npm package needed.
  const internals = window.__TAURI_INTERNALS__;
  if (internals?.invoke) {
    try {
      await internals.invoke("plugin:window|close");
      return true;
    } catch {
      try {
        await internals.invoke("plugin:app|exit", { code: 0 });
        return true;
      } catch {
        /* fall through */
      }
    }
  }
  if (tauri?.core?.invoke) {
    try {
      await tauri.core.invoke("plugin:window|close");
      return true;
    } catch {
      /* fall through */
    }
  }

  // Capacitor: the App plugin closes Android apps. iOS forbids
  // programmatic exit, so this rejects there and we fall back.
  const exitApp = window.Capacitor?.Plugins?.App?.exitApp;
  if (exitApp) {
    try {
      await exitApp();
      return true;
    } catch {
      /* fall through */
    }
  }

  // Last resort. Works for Tauri-less popup windows; a no-op in most
  // installed PWAs, which the caller handles with a manual-close note.
  try {
    window.close();
  } catch {
    /* ignore */
  }
  return false;
}
