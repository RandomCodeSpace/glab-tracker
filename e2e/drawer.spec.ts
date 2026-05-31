import { test, expect } from "@playwright/test";
import { gotoReady, openDrawer } from "./fixtures/helpers";
import type { GitlabState } from "./fixtures/gitlab";

test.describe("Drawer", () => {
  let state: GitlabState;
  test.beforeEach(async ({ page }) => {
    state = await gotoReady(page);
  });

  // Case 13: open a card, edit the title, blur, assert PUT fired.
  test("editing the title on blur fires a PUT", async ({ page }) => {
    await openDrawer(page, 101);
    // Click the title to enter edit mode (renders the title input).
    await page.locator(".tracker-drawer__title").click();
    const titleInput = page.locator(".tracker-drawer__title-input");
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Wire up the login form (revised)");
    await titleInput.blur();

    await expect
      .poll(() =>
        state.calls.find(
          (c) =>
            c.method === "PUT" &&
            c.path.endsWith("/issues/101") &&
            typeof (c.body as Record<string, unknown>)?.["title"] === "string",
        ),
      )
      .toBeTruthy();
  });

  // Case 14: the markdown Write/Preview toggle renders preview content.
  test("markdown Write/Preview toggle switches modes", async ({ page }) => {
    await openDrawer(page, 101);
    const field = page.locator(".tracker-drawer__prose-wrap .tracker-mdfield");
    // Write mode: type markdown into the textarea.
    await field.locator(".tracker-mdfield__textarea").fill("# Heading\n\nSome **bold** text");
    // Switch to Preview.
    await field.getByRole("tab", { name: "Preview" }).click();
    const preview = field.locator(".tracker-mdfield__preview");
    await expect(preview).toBeVisible();
    await expect(preview.locator("h1")).toHaveText("Heading");
    await expect(preview.locator("strong")).toHaveText("bold");
  });

  // Case 15: add a note in the Stream -> POST fires.
  // NOTE: the host's notes useEffect only re-fetches when selection.iid changes,
  // and addNote() only bumps noteCount (it does NOT push the new note into the
  // `notes` array passed to <Drawer>). So a just-added note does NOT appear in
  // the timeline without re-opening the card. We assert the POST fired and the
  // note-count indicator updates, then re-open to confirm the note renders.
  test("adding a note fires a POST and persists", async ({ page }) => {
    await openDrawer(page, 101);
    const compose = page.locator(".tracker-drawer__compose-input");
    await compose.fill("A brand new note");
    await page.locator(".tracker-drawer__compose-send").click();

    await expect
      .poll(() => state.calls.filter((c) => c.method === "POST" && c.path.endsWith("/issues/101/notes")).length)
      .toBeGreaterThan(0);

    // Re-open the card so the notes effect re-fetches and the note renders.
    await page.locator(".tracker-drawer__close").click();
    await expect(page.locator(".tracker-drawer")).toHaveCount(0);
    await openDrawer(page, 101);
    await expect(page.locator(".tracker-drawer__entry-body", { hasText: "A brand new note" })).toBeVisible();
  });

  // Case 16: add a label, then remove it, via the LabelPicker popover.
  test("add and remove a label via the picker", async ({ page }) => {
    await openDrawer(page, 101);
    // Open the picker.
    await page.locator(".tracker-drawer__labels").getByRole("button", { name: /Add label/i }).click();
    const picker = page.locator(".tracker-popover--labelpicker");
    await expect(picker).toBeVisible();

    // Add "backend" (a seeded user label not yet on issue 101).
    await picker.getByRole("option", { name: /backend/i }).click();
    await expect(page.locator(".tracker-drawer__labels")).toContainText("backend");

    // Toggling the same option again removes it.
    await picker.getByRole("option", { name: /backend/i }).click();
    await expect(page.locator(".tracker-drawer__labels")).not.toContainText("backend");
  });

  // The detail pane overlays the board instead of resizing it: the board keeps
  // its width when the drawer opens, and the drawer is pinned to the stage's
  // right edge.
  test("opening the drawer overlays the board without resizing it", async ({ page }) => {
    const board = page.locator(".tracker-board");
    const before = (await board.boundingBox())!.width;
    await openDrawer(page, 101);
    const after = (await board.boundingBox())!.width;
    expect(after).toBe(before); // overlay, not resize: board keeps its width
    // Drawer is pinned to the right side of the stage (right edges align within a
    // scrollbar's tolerance).
    const drawer = (await page.locator(".tracker-drawer").boundingBox())!;
    const stage = (await page.locator(".tracker-stage").boundingBox())!;
    expect(drawer.x).toBeGreaterThan(stage.x + stage.width / 2);
    expect(Math.abs((drawer.x + drawer.width) - (stage.x + stage.width))).toBeLessThanOrEqual(20);
  });

  // Esc closes the drawer — and does so even when focus is not inside the panel
  // (it overlays the board, so focus can drift). A document-level listener owns it.
  test("Escape closes the drawer regardless of focus", async ({ page }) => {
    await openDrawer(page, 101);
    // Panel takes focus on open (this also confirms the Esc listener has attached).
    await expect(page.locator(".tracker-drawer")).toBeFocused();
    // Drop focus off the panel to prove Esc isn't focus-dependent.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Escape");
    await expect(page.locator(".tracker-drawer")).toHaveCount(0);
  });

  // Case 17: toggle Blocked with a reason in the DrawerMeta flag toggle.
  // NOTE: the FlagToggle button has no reason input in the UI — onToggleFlag is
  // called WITHOUT a reason (reason is only set via the sidecar elsewhere). So
  // we assert the toggle flips on and the blocked flag label appears; the
  // "reason" half of this case is not reachable through the rendered DrawerMeta.
  test("toggle Blocked from the drawer meta", async ({ page }) => {
    await openDrawer(page, 101);
    const blockedToggle = page.locator('.tracker-flag-toggle[data-flag="blocked"]');
    await expect(blockedToggle).toHaveAttribute("aria-pressed", "false");
    await blockedToggle.click();
    await expect(blockedToggle).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        state.calls.find(
          (c) =>
            c.method === "PUT" &&
            c.path.endsWith("/issues/101") &&
            String((c.body as Record<string, unknown>)?.["add_labels"] ?? "").includes("flag::blocked"),
        ),
      )
      .toBeTruthy();
  });
});
