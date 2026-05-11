import { describe, it, expect, vi } from "vitest";
import { createActions } from "../../src/actions";
import type { Issue } from "../../src/types/tracker";
import type { TrackerState } from "../../src/store/store";

function makeIssue(iid: number, noteCount: number): Issue {
  return {
    id: iid,
    iid,
    state: "doing",
    origin: "side",
    source: null,
    flags: new Set(),
    flagReasons: {},
    title: `Issue ${iid}`,
    description: "",
    dueDate: null,
    weight: null,
    userLabels: [],
    noteCount,
    divergence: null,
    updatedAt: "2026-05-10T00:00:00Z",
    webUrl: "https://x",
  };
}

function makeStoreState(initial: Issue[]): TrackerState {
  const issues = new Map<number, Issue>(initial.map((i) => [i.iid, i]));
  const state = {
    issues,
    projectLabels: [],
    selection: null,
    filter: { labelNames: new Set<string>(), flag: null, showCancelled: false },
    openAssignedSet: new Set<string>(),
    ordering: {},
    toasts: [],
    isDragging: false,
    hasSynced: false,
    setIssues: vi.fn(),
    upsertIssue: vi.fn((issue: Issue) => {
      state.issues.set(issue.iid, issue);
    }),
    removeIssue: vi.fn(),
    setProjectLabels: vi.fn(),
    select: vi.fn(),
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    setOpenAssignedSet: vi.fn(),
    setOrder: vi.fn(),
    pushToast: vi.fn(() => "id"),
    dismissToast: vi.fn(),
    setDragging: vi.fn(),
  } as unknown as TrackerState;
  return state;
}

describe("addNote increments noteCount locally", () => {
  it("bumps noteCount by 1 without a follow-up issues.update round-trip", async () => {
    const liveState = makeStoreState([makeIssue(42, 3)]);

    const notesApi = { create: vi.fn().mockResolvedValue(undefined) } as any;
    const issuesApi = {
      // Critical: GitLab may return the pre-note count if it served from
      // a read replica. A reliable fix must NOT depend on this round-trip.
      update: vi.fn(),
    } as any;
    const sidecar = { getAllFlagReasons: vi.fn() } as any;

    const actions = createActions({
      api: {} as any,
      issues: issuesApi,
      notes: notesApi,
      labels: {} as any,
      sidecar,
      store: { getState: () => liveState },
      personalProjectId: 10,
      ownProjectFullPath: "me/tracker",
      instanceUrl: "https://gitlab.example",
    });

    await actions.addNote(42, "hello @world");

    expect(notesApi.create).toHaveBeenCalledTimes(1);
    expect(issuesApi.update).not.toHaveBeenCalled();
    expect(liveState.issues.get(42)?.noteCount).toBe(4);
  });

  it("does nothing to noteCount if the issue is missing from the store", async () => {
    const liveState = makeStoreState([]);
    const notesApi = { create: vi.fn().mockResolvedValue(undefined) } as any;
    const issuesApi = { update: vi.fn() } as any;
    const sidecar = { getAllFlagReasons: vi.fn() } as any;

    const actions = createActions({
      api: {} as any,
      issues: issuesApi,
      notes: notesApi,
      labels: {} as any,
      sidecar,
      store: { getState: () => liveState },
      personalProjectId: 10,
      ownProjectFullPath: "me/tracker",
      instanceUrl: "https://gitlab.example",
    });

    await actions.addNote(99, "x");
    expect(liveState.issues.has(99)).toBe(false);
  });
});
