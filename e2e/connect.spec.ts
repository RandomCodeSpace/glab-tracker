import { test, expect } from "@playwright/test";
import { installGitlabMock } from "./fixtures/gitlab";
import { signInWithToken } from "./fixtures/helpers";

test.describe("Connect / token sign-in", () => {
  // Case 1: token sign-in -> bootstrap -> board renders.
  test("valid token signs in and renders the board", async ({ page }) => {
    installGitlabMock(page);
    await page.goto("/");

    // Connect screen shows the token form in token mode (no OAuth props).
    await expect(page.locator(".tracker-connect")).toBeVisible();
    await signInWithToken(page);

    // After verify + re-init, the board renders with seeded cards.
    await expect(page.locator(".tracker-board")).toBeVisible();
    await expect(page.locator(".tracker-card[data-iid]")).toHaveCount(6);
    // Bootstrap pre-seeds all 8 system labels, so 0 created -> no bootstrap toast.
    await expect(page.locator(".tracker-topbar")).toBeVisible();
  });

  // Case 2: invalid token -> /user returns 401 -> inline error, no navigation.
  test("rejected token shows inline error and stays on connect", async ({ page }) => {
    installGitlabMock(page, { userUnauthorized: true });
    await page.goto("/");

    await signInWithToken(page, "glpat-bad");

    const err = page.locator(".tracker-connect__error");
    await expect(err).toBeVisible();
    await expect(err).toContainText(/rejected by GitLab/i);
    // Still on the connect screen; board never rendered.
    await expect(page.locator(".tracker-connect")).toBeVisible();
    await expect(page.locator(".tracker-board")).toHaveCount(0);
  });
});
