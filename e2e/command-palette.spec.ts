import { test, expect } from "@playwright/test";
import { gotoReady, openPalette } from "./fixtures/helpers";
import type { GitlabState } from "./fixtures/gitlab";

test.describe("Command palette", () => {
  let state: GitlabState;
  test.beforeEach(async ({ page }) => {
    state = await gotoReady(page);
  });

  // Case 6: Ctrl+K opens the palette with focus in the search input.
  test("Ctrl+K opens the palette and focuses search", async ({ page }) => {
    await openPalette(page);
    await expect(page.locator(".tracker-command")).toBeVisible();
    await expect(page.locator(".tracker-command__input")).toBeFocused();
  });

  // Case 7: fuzzy search filters rows by title and by #iid.
  test("search filters jump-to rows by title and by iid", async ({ page }) => {
    await openPalette(page);
    const input = page.locator(".tracker-command__input");

    await input.fill("login");
    const byTitle = page.locator('.tracker-command__row[role="option"]', { hasText: "Wire up the login form" });
    await expect(byTitle).toBeVisible();

    await input.fill("#104");
    const byIid = page.locator('.tracker-command__row[role="option"]', { hasText: "#104" });
    await expect(byIid).toBeVisible();
    // Unrelated card filtered out.
    await expect(page.locator('.tracker-command__row[role="option"]', { hasText: "login form" })).toHaveCount(0);
  });

  // Case 8: Enter on a Jump-to row opens that card's drawer.
  test("Enter on a jump row opens the drawer", async ({ page }) => {
    await openPalette(page);
    const input = page.locator(".tracker-command__input");
    await input.fill("#105");
    // Single jump match becomes active; Enter runs it.
    await input.press("Enter");
    const drawer = page.locator(".tracker-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.locator(".tracker-drawer__bar-id")).toHaveText("#105");
  });

  // Case 9: a "Set state: Done" command moves the focused card and fires PUT.
  test("'Set state: Done' command moves a card and fires PUT", async ({ page }) => {
    // Roving-focus a todo card via `j` (sets focusedIid, which persists when the
    // palette opens). `target = selection?.iid ?? focusedIid`, so the Card
    // command group (with the state commands) is present.
    await page.keyboard.press("j"); // focus the first card of the first non-empty column
    // sortIssues() reorders cards, so we don't assume which iid is focused — read it.
    const focused = page.locator('.tracker-card[data-focused="true"]');
    await expect(focused).toHaveCount(1);
    const iid = await focused.getAttribute("data-iid");
    expect(iid).toBeTruthy();

    await openPalette(page);
    await page.locator(".tracker-command__input").fill("Set state: Done");
    const row = page.locator('.tracker-command__row[role="option"]', { hasText: "Set state: Done" });
    await expect(row).toBeVisible();
    await row.click();

    // The focused card should now be in the Done column, and a PUT must have fired.
    await expect(page.locator(`.tracker-col[data-state="done"] .tracker-card[data-iid="${iid}"]`)).toBeVisible();
    await expect
      .poll(() => state.calls.filter((c) => c.method === "PUT" && c.path.endsWith(`/issues/${iid}`)).length)
      .toBeGreaterThan(0);
  });
});
