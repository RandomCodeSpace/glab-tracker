import { defineConfig, devices } from "@playwright/test";

const PORT = 5193;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Vitest unit tests live under /tests; never let Playwright pick those up.
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  expect: {
    // Minor anti-aliasing / sub-pixel differences must not fail visual specs.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Deterministic locale/timezone so date formatting in CardMeta/Stream is stable.
    locale: "en-US",
    timezoneId: "UTC",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Everything except the mobile-only responsive spec runs on desktop.
      testIgnore: /responsive\.spec\.ts$/,
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
      // Only the responsive spec needs the mobile viewport.
      testMatch: /responsive\.spec\.ts$/,
    },
  ],
  webServer: {
    command: `npx vite --config e2e/harness/vite.config.ts --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
