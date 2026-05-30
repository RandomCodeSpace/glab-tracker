import { test, expect } from "@playwright/test";
import { gotoReady } from "./fixtures/helpers";
import type { GitlabState } from "./fixtures/gitlab";

test.describe("New-issue composer", () => {
  let state: GitlabState;
  test.beforeEach(async ({ page }) => {
    state = await gotoReady(page);
  });

  // Case 18: n -> fill -> Create -> new card appears (mock POST).
  test("creating an issue adds a new card", async ({ page }) => {
    await page.keyboard.press("n");
    const composer = page.locator(".tracker-composer");
    await expect(composer).toBeVisible();

    await composer.locator(".tracker-composer__title").fill("A freshly composed task");
    // Ctrl+Enter submits (handled by the composer keydown). Description optional.
    await composer.locator(".tracker-composer__title").press("Control+Enter");

    // New issues are created with state::todo, so the card lands in the todo column.
    await expect(
      page.locator(`.tracker-col[data-state="todo"] .tracker-card`, { hasText: "A freshly composed task" }),
    ).toBeVisible();
    await expect
      .poll(() => state.calls.filter((c) => c.method === "POST" && c.path === "/projects/42/issues").length)
      .toBeGreaterThan(0);
  });
});
