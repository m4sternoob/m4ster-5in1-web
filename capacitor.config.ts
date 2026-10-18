import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.m4ster.sixinone",
  appName: "6IN1",
  // Next.js static export output — the exact same build Tauri and Vercel use.
  webDir: "out",
  // Keep the web app edge-to-edge; the UI already handles its own safe areas.
  android: {
    allowMixedContent: false,
  },
  ios: {
    // Served from the local bundle; no remote content.
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
