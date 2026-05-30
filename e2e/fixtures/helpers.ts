import { expect, type Page } from "@playwright/test";
import { installGitlabMock, type GitlabState, type InstallOptions } from "./gitlab";

/**
 * Install the GitLab mock, load the harness, complete token sign-in through the
 * ConnectScreen, and wait for the board to render with cards.
 *
 * Token mode flow (Tracker.tsx):
 *   1. App boots with no stored token -> connect step "authorize".
 *   2. The token form is shown (oauthEnabled === false).
 *   3. Submitting the token fetches GET /api/v4/user (mock returns 200), stores
 *      a "pat" token, then re-runs init (reloadId++), which calls currentUser,
 *      get(project), bootstrapSystemLabels, list labels, list issues -> ready.
 *   4. onSubmitProjectId is auto-ok (returns {ok:true}) and is never reached in
 *      the happy path because the seeded project id (42) already resolves.
 */
export async function gotoReady(page: Page, opts: InstallOptions = {}): Promise<GitlabState> {
  const state = installGitlabMock(page, opts);
  await page.goto("/");
  await signInWithToken(page);
  await expect(page.locator(".tracker-board")).toBeVisible();
  // At least one seeded card must be present before a spec proceeds.
  await expect(page.locator(".tracker-card[data-iid]").first()).toBeVisible();
  return state;
}

/** Fill + submit the connect-screen token field. */
export async function signInWithToken(page: Page, token = "glpat-test-token"): Promise<void> {
  const field = page.locator(".tracker-connect__input").first();
  await expect(field).toBeVisible();
  await field.fill(token);
  await page.getByRole("button", { name: /Connect with token/i }).click();
}

/** Open the command palette (Ctrl+K) and wait for the search input to be focused. */
export async function openPalette(page: Page): Promise<void> {
  await page.keyboard.press("Control+k");
  const input = page.locator(".tracker-command__input");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
}

/** Locator for a card by its issue iid. */
export function card(page: Page, iid: number) {
  return page.locator(`.tracker-card[data-iid="${iid}"]`);
}

/** Locator for a board column by state. */
export function column(page: Page, state: "todo" | "doing" | "done") {
  return page.locator(`.tracker-col[data-state="${state}"]`);
}

/** Open a card's drawer by clicking it. */
export async function openDrawer(page: Page, iid: number) {
  await card(page, iid).click();
  await expect(page.locator(".tracker-drawer")).toBeVisible();
}
