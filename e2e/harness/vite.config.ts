import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

// Separate from the library vite.config.ts: this one SERVES the harness app
// (index.html + main.tsx) so Playwright has something to drive. The library
// config is build-only (lib mode) and has no dev entry.
//
// version.ts reads the `__LANE_VERSION__` define; we mirror it here so the
// Topbar version pill resolves to the real package version instead of "dev".
const harnessDir = fileURLToPath(new URL(".", import.meta.url));
const pkg = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { version: string };

export default defineConfig({
  root: harnessDir,
  define: {
    __LANE_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react()],
  server: {
    fs: {
      // Allow importing from ../../src (outside the harness root).
      allow: [fileURLToPath(new URL("../../", import.meta.url))],
    },
  },
});
