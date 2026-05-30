import { test, expect } from "@playwright/test";
import { gotoReady } from "./fixtures/helpers";

// Case 23: prefers-reduced-motion emulation — board still renders (smoke).
test.use({ colorScheme: "light" });

test("board renders with prefers-reduced-motion: reduce", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReady(page);
  await expect(page.locator(".tracker-board")).toBeVisible();
  await expect(page.locator(".tracker-card[data-iid]")).toHaveCount(6);
});
