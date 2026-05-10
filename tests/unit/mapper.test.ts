import { describe, it, expect } from "vitest";
import { mapIssue } from "../../src/data/mapper";
import type { GitLabIssue } from "../../src/types/gitlab";

const raw: GitLabIssue = {
  id: 1, iid: 7, project_id: 10,
  title: "T", description: "D",
  state: "opened",
  labels: ["state::doing", "flag::blocked", "src::bau", "src::bau::42-421", "area::auth"],
  assignees: [], due_date: null, weight: 3,
  user_notes_count: 2, updated_at: "2026-05-10T00:00:00Z",
  web_url: "https://gitlab.acme.io/me/tracker/-/issues/7",
  references: { full: "me/tracker#7" },
};

describe("mapIssue", () => {
  it("derives state, origin, flags, source, userLabels", () => {
    const m = mapIssue({ raw, openAssignedSet: new Set(["42-421"]), flagReasons: { blocked: "x" } });
    expect(m.state).toBe("doing");
    expect(m.origin).toBe("bau");
    expect(m.flags.has("blocked")).toBe(true);
    expect(m.source).toEqual({ projectId: 42, issueIid: 421 });
    expect(m.userLabels.map((l) => l.name)).toEqual(["area::auth"]);
    expect(m.flagReasons.blocked).toBe("x");
    expect(m.divergence).toBeNull();
  });
});
