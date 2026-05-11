import { describe, it, expect, vi } from "vitest";
import { createActions } from "../../src/actions";
import type { Issue } from "../../src/types/tracker";
import type { TrackerState } from "../../src/store/store";

function makeIssue(iid: number): Issue {
  return {
    id: iid,
    iid,
    state: "doing",
    origin: "bau",
    source: null,
    flags: new Set(),
    flagReasons: {},
    title: `Issue ${iid}`,
    description: "",
    dueDate: null,
    weight: null,
    userLabels: [],
    noteCount: 0,
    divergence: null,
    updatedAt: "2026-05-10T00:00:00Z",
    webUrl: "https://example/x",
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
    removeIssue: vi.fn((iid: number) => {
      state.issues.delete(iid);
    }),
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

describe("actions read live store state (no stale snapshot)", () => {
  it("moveColumn sees an issue added AFTER createActions was called", async () => {
    // Empty store at action-construction time
    const liveState = makeStoreState([]);

    const issuesApi = {
      update: vi.fn().mockImplementation(async (_pid: number, iid: number) => ({
        id: iid,
        iid,
        project_id: 10,
        title: `Issue ${iid}`,
        description: "",
        state: "opened",
        labels: ["state::done", "src::bau"],
        assignees: [],
        due_date: null,
        weight: null,
        user_notes_count: 0,
        updated_at: "2026-05-11T00:00:00Z",
        web_url: "https://x",
        references: { full: "x" },
      })),
    } as any;

    const sidecar = {
      getAllFlagReasons: vi.fn().mockResolvedValue({}),
    } as any;

    const actions = createActions({
      api: {} as any,
      issues: issuesApi,
      notes: {} as any,
      labels: {} as any,
      sidecar,
      store: { getState: () => liveState },
      personalProjectId: 10,
      ownProjectFullPath: "me/tracker",
      instanceUrl: "https://gitlab.example",
    });

    // Forked issue arrives AFTER createActions was constructed.
    liveState.issues.set(42, makeIssue(42));

    await actions.moveColumn(42, "done");

    expect(issuesApi.update).toHaveBeenCalledTimes(1);
    expect(issuesApi.update).toHaveBeenCalledWith(
      10,
      42,
      expect.objectContaining({ add_labels: expect.arrayContaining(["state::done"]) }),
    );
  });
});
