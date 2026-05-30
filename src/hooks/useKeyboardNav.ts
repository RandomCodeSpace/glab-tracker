import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { ColumnState, Flag } from "../types/tracker";

// Visible board columns, left-to-right. Cancelled is not a board column.
const COLUMNS: ColumnState[] = ["todo", "doing", "done"];
const G_WINDOW_MS = 800;

export interface KeyboardNavOptions {
  /** When false (an overlay/drawer is open), the listener is inert. */
  enabled: boolean;
  boardRef: RefObject<HTMLElement | null>;
  focusedIid: number | null;
  setFocusedIid: (iid: number | null) => void;
  isDragging: boolean;
  getState: (iid: number) => ColumnState | undefined;
  onOpen: (iid: number) => void;
  onMove: (iid: number, to: ColumnState) => void;
  onToggleFlag: (iid: number, flag: Flag) => void;
  onNewIssue: () => void;
  onFocusFilter: () => void;
  onToggleCancelled: () => void;
  onSync: () => void;
  onShowShortcuts: () => void;
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

/** Read the card iids in each visible column straight from the DOM (visual order). */
function readColumns(board: HTMLElement): Record<string, number[]> {
  const map: Record<string, number[]> = {};
  for (const state of COLUMNS) {
    const ids: number[] = [];
    const col = board.querySelector(`.tracker-col[data-state="${state}"]`);
    if (col) {
      col.querySelectorAll<HTMLElement>(".tracker-card[data-iid]").forEach((el) => {
        const v = Number(el.getAttribute("data-iid"));
        if (!Number.isNaN(v)) ids.push(v);
      });
    }
    map[state] = ids;
  }
  return map;
}

/**
 * Board-wide keyboard navigation (roving focus + card actions), DOM-driven so it
 * always matches the rendered order. Single-key shortcuts only — modifier combos
 * are left to the browser/host, and the dnd KeyboardSensor owns Space/arrows while
 * a drag is active (we bail when `isDragging`).
 */
export function useKeyboardNav(opts: KeyboardNavOptions): void {
  const ref = useRef(opts);
  ref.current = opts;
  const gPending = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearG = () => {
      gPending.current = false;
      if (gTimer.current) {
        clearTimeout(gTimer.current);
        gTimer.current = null;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const o = ref.current;
      if (!o.enabled || o.isDragging) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const board = o.boardRef.current;
      if (!board) return;

      const key = e.key;

      // g → s : sync all
      if (gPending.current && (key === "s" || key === "S")) {
        e.preventDefault();
        clearG();
        o.onSync();
        return;
      }
      clearG();

      const cols = readColumns(board);
      const focused = o.focusedIid;
      const focusedState = focused != null ? o.getState(focused) : undefined;
      const focusIid = (iid: number | undefined) => {
        if (iid != null) o.setFocusedIid(iid);
      };
      const firstNonEmpty = (): number | undefined => {
        for (const s of COLUMNS) {
          const list = cols[s];
          if (list && list.length) return list[0];
        }
        return undefined;
      };

      switch (key) {
        case "g":
        case "G": {
          gPending.current = true;
          gTimer.current = setTimeout(() => {
            gPending.current = false;
          }, G_WINDOW_MS);
          return;
        }
        case "j":
        case "ArrowDown": {
          e.preventDefault();
          if (focused == null || !focusedState) return focusIid(firstNonEmpty());
          const list = cols[focusedState] ?? [];
          const idx = list.indexOf(focused);
          if (idx === -1) return focusIid(list[0]);
          focusIid(list[Math.min(idx + 1, list.length - 1)]);
          return;
        }
        case "k":
        case "ArrowUp": {
          e.preventDefault();
          if (focused == null || !focusedState) return focusIid(firstNonEmpty());
          const list = cols[focusedState] ?? [];
          const idx = list.indexOf(focused);
          if (idx === -1) return focusIid(list[0]);
          focusIid(list[Math.max(idx - 1, 0)]);
          return;
        }
        case "h":
        case "ArrowLeft":
        case "l":
        case "ArrowRight": {
          e.preventDefault();
          if (focused == null || !focusedState) return focusIid(firstNonEmpty());
          const dir = key === "h" || key === "ArrowLeft" ? -1 : 1;
          const colIdx = COLUMNS.indexOf(focusedState);
          const curList = cols[focusedState] ?? [];
          const row = Math.max(0, curList.indexOf(focused));
          let ci = colIdx + dir;
          while (ci >= 0 && ci < COLUMNS.length) {
            const s = COLUMNS[ci]!;
            const list = cols[s] ?? [];
            if (list.length) return focusIid(list[Math.min(row, list.length - 1)]);
            ci += dir;
          }
          return;
        }
        case "Enter": {
          if (focused != null) {
            e.preventDefault();
            o.onOpen(focused);
          }
          return;
        }
        case "[": {
          if (focused != null && focusedState) {
            const ci = COLUMNS.indexOf(focusedState);
            if (ci > 0) {
              e.preventDefault();
              o.onMove(focused, COLUMNS[ci - 1]!);
            }
          }
          return;
        }
        case "]": {
          if (focused != null && focusedState) {
            const ci = COLUMNS.indexOf(focusedState);
            if (ci >= 0 && ci < COLUMNS.length - 1) {
              e.preventDefault();
              o.onMove(focused, COLUMNS[ci + 1]!);
            }
          }
          return;
        }
        case "b":
        case "B": {
          if (focused != null) {
            e.preventDefault();
            o.onToggleFlag(focused, "blocked");
          }
          return;
        }
        case "r":
        case "R": {
          if (focused != null) {
            e.preventDefault();
            o.onToggleFlag(focused, "reviewing");
          }
          return;
        }
        case "n":
        case "N": {
          e.preventDefault();
          o.onNewIssue();
          return;
        }
        case "/": {
          e.preventDefault();
          o.onFocusFilter();
          return;
        }
        case "c":
        case "C": {
          e.preventDefault();
          o.onToggleCancelled();
          return;
        }
        case "?": {
          e.preventDefault();
          o.onShowShortcuts();
          return;
        }
        default:
          return;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearG();
    };
  }, []);
}
