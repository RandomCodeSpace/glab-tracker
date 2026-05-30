import { test, expect } from "@playwright/test";
import { gotoReady, card, column } from "./fixtures/helpers";
import type { GitlabState } from "./fixtures/gitlab";

test.describe("Drag and drop", () => {
  let state: GitlabState;
  test.beforeEach(async ({ page }) => {
    state = await gotoReady(page);
  });

  // Case 12: drag a card todo -> doing via Playwright pointer drag.
  // NOTE (UNSURE): the board uses dnd-kit through a custom ./hooks/useDnd
  // wrapper whose sensor activation constraints are not visible here. dnd-kit's
  // PointerSensor typically needs a small movement (e.g. 5px) before a drag
  // starts, so a single dragTo() can be flaky. We drive a manual pointer
  // sequence with several intermediate moves to satisfy an activation
  // constraint, then assert the card landed in the doing column AND a PUT fired.
  // If the sensor uses a keyboard-only or distance/delay constraint that this
  // doesn't satisfy, the runner may need to tune the move steps/delays.
  test("dragging a card from todo to doing moves it", async ({ page }) => {
    const source = card(page, 101);
    const target = column(page, "doing");

    const src = await source.boundingBox();
    const dst = await target.boundingBox();
    test.skip(!src || !dst, "missing bounding boxes");
    if (!src || !dst) return;

    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await page.mouse.down();
    // Several incremental moves to trip the dnd-kit activation constraint.
    await page.mouse.move(src.x + src.width / 2 + 8, src.y + src.height / 2 + 8, { steps: 5 });
    await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 12 });
    await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2 + 4, { steps: 3 });
    await page.mouse.up();

    await expect(column(page, "doing").locator('.tracker-card[data-iid="101"]')).toBeVisible();
    await expect
      .poll(() => state.calls.filter((c) => c.method === "PUT" && c.path.endsWith("/issues/101")).length)
      .toBeGreaterThan(0);
  });
});
