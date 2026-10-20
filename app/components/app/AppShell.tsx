"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { detectAppMode } from "../../lib/appMode";
import AppModeProvider from "./AppModeProvider";
import AppBar from "./AppBar";
import AppLauncher from "./AppLauncher";
import ExitOverlay from "./ExitOverlay";

/* The gate between the website and the app.
 *
 * Server render and first client render are always the normal website
 * (SEO and browser visitors are untouched). A layout effect then checks
 * for a native shell / installed PWA before paint; in app mode the root
 * layout's children are swapped for the locked app shell: AppBar on
 * top, the launcher as home, games inside the frame, and no route out.
 */

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppBar />
      {pathname === "/" ? (
        <AppLauncher />
      ) : (
        <div className="flex flex-1 flex-col">{children}</div>
      )}
      <ExitOverlay />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [appMode, setAppMode] = useState(false);

  useIsoLayoutEffect(() => {
    if (detectAppMode()) {
      document.documentElement.classList.add("app-mode");
      setAppMode(true);
    }
  }, []);

  if (!appMode) return <>{children}</>;

  return (
    <AppModeProvider>
      <ShellFrame>{children}</ShellFrame>
    </AppModeProvider>
  );
}
