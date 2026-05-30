import { test, expect } from "@playwright/test";
import { gotoReady } from "./fixtures/helpers";

test.describe("Toast", () => {
  // Case 20: toast undo.
  // NOTE: SKIPPED — no app action emits a `kind: "undo"` toast. A repo-wide
  // search shows the only "undo" reference is the DURATION_MS map in Toast.tsx;
  // every pushToast call site uses "info" or "error", and none attaches an
  // `undo` callback. There is no user-reachable flow that produces an
  // Undo-bearing toast, so this case cannot be exercised against real behavior.
  // Re-enable if an action that pushes an undo toast is added.
  test.skip("clicking Undo on a toast reverts the action", async ({ page }) => {
    await gotoReady(page);
    // (intentionally empty — see NOTE above)
  });

  // Smoke: an error toast (a reachable toast variant) renders with role=alert
  // when an update fails. moveColumn -> applyPatch issues a PUT; on rejection it
  // rolls back the optimistic update and pushes a `kind: "error"` toast (see
  // src/actions/index.ts applyPatch catch). We force any issue PUT to 500 after
  // the board is up, then move the focused card to trigger the failure.
  test("a failed update surfaces an error toast", async ({ page }) => {
    await gotoReady(page);
    // Override every issue PUT to fail, regardless of which card j focuses
    // (sortIssues() reorders cards, so we don't assume a specific iid).
    await page.route(/\/api\/v4\/projects\/42\/issues\/\d+$/, (route) => {
      if (route.request().method() === "PUT") {
        return route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' });
      }
      return route.fallback();
    });

    await page.keyboard.press("j"); // focus the first card of the first non-empty column
    await expect(page.locator('.tracker-card[data-focused="true"]')).toHaveCount(1);
    await page.keyboard.press("]"); // move one column right (PUT -> 500)

    const toast = page.locator(".tracker-toast--error");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("role", "alert");
  });
});
