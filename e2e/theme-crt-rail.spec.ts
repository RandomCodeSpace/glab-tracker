import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gotoReady, openPalette } from "./fixtures/helpers";

const SERIOUS = ["serious", "critical"];

/** Run a palette command by typing a fragment of its label and clicking the row. */
async function runCommand(page: Page, fragment: string): Promise<void> {
  await openPalette(page);
  await page.locator(".tracker-command__input").fill(fragment);
  const row = page.locator('.tracker-command__row[role="option"]', { hasText: fragment }).first();
  await expect(row).toBeVisible();
  await row.click();
  // Palette closes after running a command.
  await expect(page.locator(".tracker-command")).toBeHidden();
}

test.describe("Theme / CRT / rail (view prefs)", () => {
  test("defaults: dark theme, CRT on, rail off", async ({ page }) => {
    await gotoReady(page);
    const root = page.locator(".tracker").first();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(root).toHaveAttribute("data-crt", "on");
    await expect(root).toHaveAttribute("data-rail", "off");
    // Rail is in the DOM but hidden until opted in.
    await expect(page.locator(".tracker-rail")).toBeHidden();
  });

  test("theme toggle flips to light and persists across reload", async ({ page }) => {
    await gotoReady(page);
    const root = page.locator(".tracker").first();

    await runCommand(page, "light theme");
    await expect(root).toHaveAttribute("data-theme", "light");

    // Persisted to localStorage and survives a reload (token + routes persist in-context).
    const stored = await page.evaluate(() => localStorage.getItem("lane.ui.prefs"));
    expect(stored).toContain('"theme":"light"');

    await page.reload();
    await expect(page.locator(".tracker-board")).toBeVisible();
    await expect(page.locator(".tracker").first()).toHaveAttribute("data-theme", "light");
  });

  test("CRT toggle turns the scanline overlay off", async ({ page }) => {
    await gotoReady(page);
    const root = page.locator(".tracker").first();
    await expect(root).toHaveAttribute("data-crt", "on");

    await runCommand(page, "CRT");
    await expect(root).toHaveAttribute("data-crt", "off");
  });

  test("rail toggle reveals the activity rail; nav buttons fire", async ({ page }) => {
    await gotoReady(page);
    const root = page.locator(".tracker").first();

    await runCommand(page, "activity rail");
    await expect(root).toHaveAttribute("data-rail", "on");
    const rail = page.locator(".tracker-rail");
    await expect(rail).toBeVisible();

    // "New issue" rail button opens the composer (maps to an existing action).
    await rail.getByRole("button", { name: "New issue" }).click();
    await expect(page.locator(".tracker-composer")).toBeVisible();
  });

  test("light theme has no serious/critical a11y violations", async ({ page }) => {
    await gotoReady(page);
    await runCommand(page, "light theme");
    await expect(page.locator(".tracker").first()).toHaveAttribute("data-theme", "light");
    const results = await new AxeBuilder({ page }).include(".tracker").analyze();
    const serious = results.violations.filter((v) => SERIOUS.includes(v.impact ?? ""));
    expect(serious).toEqual([]);
  });
});
