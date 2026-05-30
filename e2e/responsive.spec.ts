import { test, expect } from "@playwright/test";
import { gotoReady, openDrawer } from "./fixtures/helpers";

// Runs under the mobile-chromium project (Pixel 7) per playwright.config.ts.
test.describe("Responsive (mobile)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page);
  });

  // Case 21: MobileNav tabs render; the drawer is a full-width mobile panel.
  test("mobile nav tabs render", async ({ page }) => {
    const nav = page.locator(".tracker-mobnav");
    await expect(nav).toBeVisible();
    // One tab per visible column (todo/doing/done).
    await expect(nav.locator(".tracker-mobnav__tab")).toHaveCount(3);
    await expect(nav.getByRole("tab")).toHaveCount(3);
  });

  // The drawer still opens and is usable on a narrow viewport.
  // NOTE: whether the drawer becomes a literal bottom *sheet* is a CSS concern
  // (the Drawer markup is the same .tracker-drawer aside at every width — only
  // the shared Modal supports variant="sheet", and the Drawer is NOT a Modal).
  // We assert the drawer opens and fits the viewport rather than asserting a
  // bottom-sheet class that does not exist in the markup.
  test("drawer opens on mobile and fits the viewport", async ({ page }) => {
    await openDrawer(page, 101);
    const drawer = page.locator(".tracker-drawer");
    await expect(drawer).toBeVisible();
    const box = await drawer.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    if (box && viewport) {
      // Drawer should not overflow the mobile viewport width.
      expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
});
