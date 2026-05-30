import { test, expect } from "@playwright/test";
import { gotoReady, openDrawer, openPalette } from "./fixtures/helpers";

// Light theme only. Baselines are generated on first run with --update-snapshots.
// maxDiffPixelRatio (playwright.config.ts) absorbs minor AA differences.
test.describe("Visual snapshots", () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page);
  });

  // Case 24a: the board.
  test("board", async ({ page }) => {
    // Mask the version pill — it changes with the package version.
    await expect(page).toHaveScreenshot("board.png", {
      mask: [page.locator(".tracker-topbar__version")],
      animations: "disabled",
    });
  });

  // Case 24b: open drawer.
  test("open drawer", async ({ page }) => {
    await openDrawer(page, 101);
    await expect(page).toHaveScreenshot("drawer.png", {
      mask: [page.locator(".tracker-topbar__version")],
      animations: "disabled",
    });
  });

  // Case 24c: command palette.
  test("command palette", async ({ page }) => {
    await openPalette(page);
    // Screenshot just the palette panel for stability.
    await expect(page.locator(".tracker-command")).toHaveScreenshot("command-palette.png", {
      animations: "disabled",
    });
  });
});
