import { test, expect } from "@playwright/test";
import { gotoReady, card } from "./fixtures/helpers";
import type { GitlabState } from "./fixtures/gitlab";

/** Read the iid of the currently roving-focused card ([data-focused="true"]). */
async function focusedIid(page: import("@playwright/test").Page): Promise<string> {
  const el = page.locator('.tracker-card[data-focused="true"]');
  await expect(el).toHaveCount(1);
  const iid = await el.getAttribute("data-iid");
  expect(iid).toBeTruthy();
  return iid!;
}

test.describe("Keyboard navigation", () => {
  let state: GitlabState;
  test.beforeEach(async ({ page }) => {
    state = await gotoReady(page);
  });

  // Case 10a: j/k move roving focus within a column (assert [data-focused] moves).
  // sortIssues() reorders cards within a column by flag rank, so the DOM order is
  // NOT the fixture array order. We never assume which iid is first — we read the
  // focused card's data-iid at runtime and make relative assertions.
  test("j and k move focus between cards", async ({ page }) => {
    // First j with no focus seeds focus on the first non-empty column's first card.
    // (No body click — clicking the board would open a card's drawer and disable nav.)
    await page.keyboard.press("j");
    const first = await focusedIid(page);

    // Second j moves focus down within the same column to a different card.
    await page.keyboard.press("j");
    const second = await focusedIid(page);
    expect(second).not.toBe(first);
    await expect(card(page, Number(first))).not.toHaveAttribute("data-focused", "true");

    // k moves focus back up to the first card.
    await page.keyboard.press("k");
    await expect(card(page, Number(first))).toHaveAttribute("data-focused", "true");
  });

  // Case 10b: ] moves the focused card to the next column and fires a PUT.
  // We read whichever card j focuses and the column it currently lives in, press
  // ], then assert that same card moved to the NEXT column and a PUT fired for it.
  test("] moves a card to the next column", async ({ page }) => {
    await page.keyboard.press("j"); // focus the first card of the first non-empty column
    const iid = await focusedIid(page);

    // Determine the column the focused card currently lives in.
    // Only .tracker-col carries data-state (not .tracker-col__list), so match on it.
    const colState = await card(page, Number(iid))
      .locator("xpath=ancestor::*[@data-state]")
      .getAttribute("data-state");
    const order = ["todo", "doing", "done"] as const;
    const nextState = order[order.indexOf(colState as (typeof order)[number]) + 1];
    expect(nextState).toBeTruthy(); // the seeded first card is not already in the last column

    await page.keyboard.press("]"); // move one column to the right
    await expect(
      page.locator(`.tracker-col[data-state="${nextState}"] .tracker-card[data-iid="${iid}"]`),
    ).toBeVisible();
    await expect
      .poll(() => state.calls.filter((c) => c.method === "PUT" && c.path.endsWith(`/issues/${iid}`)).length)
      .toBeGreaterThan(0);
  });

  // Case 11a: n opens the composer; Esc closes it.
  test("n opens the composer and Esc closes it", async ({ page }) => {
    await page.keyboard.press("n");
    await expect(page.locator(".tracker-composer")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".tracker-composer")).toHaveCount(0);
  });

  // Case 11b: "/" focuses the filter input.
  // NOTE: the board FilterRail has NO persistent text input — the only input is
  // the "+ New label" create field, which is rendered on demand. onFocusFilter
  // does document.querySelector(".tracker-filterbar input"), which is null in
  // the default state, so "/" is a no-op until the create field is open. We
  // first open the create field, then assert "/" focuses it.
  test('"/" focuses the filter create input when present', async ({ page }) => {
    await page.locator(".tracker-filterbar").getByRole("button", { name: /New label/i }).click();
    const input = page.locator(".tracker-filterbar input");
    await expect(input).toBeVisible();
    // Keep it non-empty so the onBlur collapse (which only fires when empty)
    // doesn't remove the input when we move focus away.
    await input.fill("x");
    // Move focus out of the input (without opening a drawer) so "/" exercises
    // onFocusFilter rather than typing a literal "/" into the focused field.
    await input.blur();
    await page.keyboard.press("/");
    await expect(input).toBeFocused();
  });
});
