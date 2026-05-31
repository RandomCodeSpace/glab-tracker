import { test, expect } from "@playwright/test";
import { gotoReady, card, column } from "./fixtures/helpers";

test.describe("Board rendering", () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page);
  });

  // Case 3: board renders the 3 visible columns (todo/doing/done; cancelled is
  // not a board column) with seeded cards in each.
  test("shows three columns with seeded cards", async ({ page }) => {
    await expect(page.locator(".tracker-col[data-state]")).toHaveCount(3);
    await expect(column(page, "todo")).toBeVisible();
    await expect(column(page, "doing")).toBeVisible();
    await expect(column(page, "done")).toBeVisible();

    // 2 todo, 2 doing, 2 done from the fixture.
    await expect(column(page, "todo").locator(".tracker-card[data-iid]")).toHaveCount(2);
    await expect(column(page, "doing").locator(".tracker-card[data-iid]")).toHaveCount(2);
    await expect(column(page, "done").locator(".tracker-card[data-iid]")).toHaveCount(2);
  });

  // Case 4: a card shows the mono #iid, meta (due/weight), and user labels.
  test("card shows mono iid, meta and labels", async ({ page }) => {
    const c = card(page, 101);
    await expect(c.locator(".tracker-card__title")).toHaveText("Wire up the login form");
    // The iid link carries an aria-label "Issue #101 in GitLab".
    await expect(c.locator(".tracker-card__iid")).toHaveAttribute("aria-label", /#101/);
    // Due date (2026-06-15) and weight (w3) render in the meta row.
    await expect(c.locator(".tracker-card__due")).toBeVisible();
    await expect(c.locator(".tracker-card__weight")).toContainText("w3");
    // User label chip "frontend" shows.
    await expect(c.locator(".tracker-card__labels")).toContainText("frontend");
  });

  // Case 5: blocked + reviewing cards show the flag tag line.
  test("blocked and reviewing cards show the flag tag", async ({ page }) => {
    const blocked = card(page, 103);
    await expect(blocked).toHaveAttribute("data-blocked", "true");
    await expect(blocked.locator(".tracker-card__flag-line--blocked .tracker-card__flag-label")).toHaveText("BLOCKED");

    const reviewing = card(page, 104);
    await expect(reviewing).toHaveAttribute("data-reviewing", "true");
    await expect(reviewing.locator(".tracker-card__flag-line--reviewing .tracker-card__flag-label")).toHaveText("REVIEWING");
  });

  // Regression: with many issues a column must SCROLL, not crush its cards.
  // Cards had no flex-shrink, so as flex items in the overflow-y:auto list they
  // shrank to fit and got compressed/distorted. Guard: cards don't shrink and the
  // list is the scroll container.
  test("cards keep their height; the column list scrolls on overflow", async ({ page }) => {
    const flexShrink = await card(page, 101).evaluate((el) => getComputedStyle(el).flexShrink);
    expect(flexShrink).toBe("0");
    const overflowY = await column(page, "todo")
      .locator(".tracker-col__list")
      .evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflowY).toBe("auto");
  });
});
