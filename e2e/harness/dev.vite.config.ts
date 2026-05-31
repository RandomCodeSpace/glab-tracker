import { defineConfig, mergeConfig, type UserConfig } from "vite";
import base from "./vite.config";

// Dev-only: same harness as vite.config.ts, but allows the reverse-proxied
// public host and routes HMR over the HTTPS tunnel. Kept separate so the
// Playwright config stays clean.
export default mergeConfig(
  base as UserConfig,
  defineConfig({
    server: {
      allowedHosts: ["oteliq.randomcodespace.dev", ".randomcodespace.dev"],
      hmr: {
        protocol: "wss",
        host: "oteliq.randomcodespace.dev",
        clientPort: 443,
      },
    },
  }),
);
