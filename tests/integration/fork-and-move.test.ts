import { describe, it, expect, vi } from "vitest";
import { forkIssue } from "../../src/sync/fork";
import { planTransition } from "../../src/data/state";

describe("fork → state move pipeline", () => {
  it("forks with sanitized title, then plans a doing→done transition", async () => {
    const issuesApi = {
      getOne: vi.fn().mockResolvedValue({
        id: 1, iid: 421, project_id: 42,
        title: "see group/proj#3 for context",
        description: "ping @alice",
        state: "opened", labels: [], assignees: [],
        due_date: null, weight: null, user_notes_count: 0,
        updated_at: "2026-05-10T00:00:00Z",
        web_url: "x", references: { full: "x" },
      }),
      create: vi.fn().mockResolvedValue({
        id: 99, iid: 7, project_id: 10,
        title: "see `group/proj#3` for context",
        description: "ping `@alice`",
        state: "opened",
        labels: ["state::todo", "src::bau", "src::bau::42-421"],
        assignees: [], due_date: null, weight: null, user_notes_count: 0,
        updated_at: "2026-05-10T00:00:00Z", web_url: "x", references: { full: "x" },
      }),
    } as any;

    const created = await forkIssue({
      issuesApi,
      input: {
        source: { projectPath: "group/proj", issueIid: 421 },
        personalProjectId: 10,
        ownProjectFullPath: "me/tracker",
      },
    });
    expect(issuesApi.create).toHaveBeenCalledWith(10, expect.objectContaining({
      title: "see `group/proj#3` for context",
      description: "ping `@alice`",
      labels: ["state::todo", "src::bau", "src::bau::42-421"],
    }));

    const patch = planTransition("doing", "done");
    expect(patch).toEqual({
      add_labels: ["state::done"],
      remove_labels: ["state::doing", "flag::blocked", "flag::reviewing"],
      state_event: "close",
    });
    expect(created.iid).toBe(7);
  });
});
