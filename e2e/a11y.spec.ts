import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installGitlabMock } from "./fixtures/gitlab";
import { gotoReady, openDrawer } from "./fixtures/helpers";

const SERIOUS = ["serious", "critical"];

function seriousViolations(results: { violations: Array<{ impact?: string | null; id: string; help: string }> }) {
  return results.violations.filter((v) => SERIOUS.includes(v.impact ?? ""));
}

test.describe("Accessibility (axe)", () => {
  // Case 22a: connect screen.
  test("connect screen has no serious/critical violations", async ({ page }) => {
    installGitlabMock(page);
    await page.goto("/");
    await expect(page.locator(".tracker-connect")).toBeVisible();

    const results = await new AxeBuilder({ page }).include(".tracker").analyze();
    expect(seriousViolations(results)).toEqual([]);
  });

  // Case 22b: board.
  test("board has no serious/critical violations", async ({ page }) => {
    await gotoReady(page);
    const results = await new AxeBuilder({ page }).include(".tracker").analyze();
    expect(seriousViolations(results)).toEqual([]);
  });

  // Case 22c: open drawer.
  test("open drawer has no serious/critical violations", async ({ page }) => {
    await gotoReady(page);
    await openDrawer(page, 101);
    const results = await new AxeBuilder({ page }).include(".tracker").analyze();
    expect(seriousViolations(results)).toEqual([]);
  });
});
