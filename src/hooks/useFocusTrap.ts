// useFocusTrap — traps Tab / Shift+Tab inside a container while active, and
// restores focus to the previously-focused element on deactivate. Dependency-free.
// Used by the shared <Modal> shell (composer, confirm dialogs, command palette,
// shortcuts sheet) and any other focus-trapping overlay.

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(",");

function focusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Trap keyboard focus within `containerRef` while `active` is true.
 * On deactivate (or unmount while active), focus returns to whatever held it
 * when the trap engaged.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusable(container);
      if (items.length === 0) {
        // Nothing tabbable — keep focus on the container itself.
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const inside = activeEl ? container.contains(activeEl) : false;

      if (e.shiftKey) {
        if (!inside || activeEl === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (!inside || activeEl === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus();
    };
  }, [containerRef, active]);
}
