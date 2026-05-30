import { test, expect } from "@playwright/test";
import { gotoReady } from "./fixtures/helpers";

test.describe("Filter rail", () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page);
  });

  // Case 19: filtering by a label shows only matching cards.
  // The fixture: "backend" is on issues 102 (todo) and 104 (doing).
  test("filtering by a label shows only matching cards", async ({ page }) => {
    await expect(page.locator(".tracker-card[data-iid]")).toHaveCount(6);

    // Click the "backend" filter chip in the filter bar.
    await page.locator(".tracker-filterbar").getByText("backend", { exact: true }).click();

    // Only issues carrying the "backend" user label remain (102, 104).
    await expect(page.locator(".tracker-card[data-iid]")).toHaveCount(2);
    await expect(page.locator('.tracker-card[data-iid="102"]')).toBeVisible();
    await expect(page.locator('.tracker-card[data-iid="104"]')).toBeVisible();

    // Clearing the filter restores all cards.
    await page.getByRole("button", { name: /Clear filter/i }).click();
    await expect(page.locator(".tracker-card[data-iid]")).toHaveCount(6);
  });
});
