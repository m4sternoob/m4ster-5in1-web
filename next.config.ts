import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so the app can run inside the Tauri desktop shell
  // (Tauri serves these files locally — no Node server needed).
  output: "export",
};

export default nextConfig;
