import { describe, it, expect } from "vitest";
import { sourceUrlFrom, isOwnProject } from "../../src/utils/ids";

describe("sourceUrlFrom", () => {
  it("builds web URL when projectPath known", () => {
    expect(sourceUrlFrom({
      instanceUrl: "https://gitlab.acme.io",
      projectPath: "g/a",
      issueIid: 42,
    })).toBe("https://gitlab.acme.io/g/a/-/issues/42");
  });
});

describe("isOwnProject", () => {
  it("matches by id", () => {
    expect(isOwnProject({ projectId: 10 }, 10)).toBe(true);
    expect(isOwnProject({ projectId: 11 }, 10)).toBe(false);
  });
});
