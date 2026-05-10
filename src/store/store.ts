import { create } from "zustand";
import type { Issue, ColumnState, Flag, OrderingMap } from "../types/tracker";
import type { GitLabLabel } from "../types/gitlab";

export type Selection = { iid: number } | null;

export interface Filter {
  labelNames: Set<string>;
  flag: Flag | null;
  showCancelled: boolean;
}

export interface Toast {
  id: string;
  message: string;
  kind: "info" | "error" | "undo";
  undo?: () => void;
}

export interface TrackerState {
  /** Map of iid → Issue (for personal project, all states). */
  issues: Map<number, Issue>;
  /** Project labels, populated from cache + API. */
  projectLabels: GitLabLabel[];
  /** Currently open card in detail drawer. */
  selection: Selection;
  /** Filter state for the board. */
  filter: Filter;
  /** Set of `${pid}-${iid}` for source open-assigned issues, refreshed on Sync All. */
  openAssignedSet: Set<string>;
  /** Local-only ordering per column. */
  ordering: OrderingMap;
  /** Toasts queue. */
  toasts: Toast[];
  /** Drag state. */
  isDragging: boolean;

  setIssues: (issues: Issue[]) => void;
  upsertIssue: (issue: Issue) => void;
  removeIssue: (iid: number) => void;
  setProjectLabels: (labels: GitLabLabel[]) => void;
  select: (sel: Selection) => void;
  setFilter: (f: Partial<Filter>) => void;
  clearFilter: () => void;
  setOpenAssignedSet: (s: Set<string>) => void;
  setOrder: (col: ColumnState, ids: number[]) => void;
  pushToast: (t: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
  setDragging: (on: boolean) => void;
}

export const useTracker = create<TrackerState>((set) => ({
  issues: new Map(),
  projectLabels: [],
  selection: null,
  filter: { labelNames: new Set(), flag: null, showCancelled: false },
  openAssignedSet: new Set(),
  ordering: {},
  toasts: [],
  isDragging: false,

  setIssues: (issues) =>
    set(() => ({ issues: new Map(issues.map((i) => [i.iid, i])) })),
  upsertIssue: (issue) =>
    set((s) => { const m = new Map(s.issues); m.set(issue.iid, issue); return { issues: m }; }),
  removeIssue: (iid) =>
    set((s) => { const m = new Map(s.issues); m.delete(iid); return { issues: m }; }),
  setProjectLabels: (labels) => set({ projectLabels: labels }),
  select: (sel) => set({ selection: sel }),
  setFilter: (f) => set((s) => ({ filter: { ...s.filter, ...f } })),
  clearFilter: () =>
    set({ filter: { labelNames: new Set(), flag: null, showCancelled: false } }),
  setOpenAssignedSet: (s) => set({ openAssignedSet: s }),
  setOrder: (col, ids) => set((s) => ({ ordering: { ...s.ordering, [col]: ids } })),
  pushToast: (t) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    return id;
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setDragging: (on) => set({ isDragging: on }),
}));
