import { describe, it, expect } from "vitest";
import { parseGitLabIssueUrl } from "../../src/sync/parseUrl";

describe("parseGitLabIssueUrl", () => {
  it("parses a flat path", () => {
    expect(parseGitLabIssueUrl("https://gitlab.com/group/project/-/issues/421"))
      .toEqual({ projectPath: "group/project", issueIid: 421 });
  });

  it("parses a nested group path", () => {
    expect(parseGitLabIssueUrl("https://gitlab.acme.io/org/sub/proj/-/issues/88"))
      .toEqual({ projectPath: "org/sub/proj", issueIid: 88 });
  });

  it("strips trailing slash, query, and fragment", () => {
    expect(parseGitLabIssueUrl("https://gitlab.com/g/p/-/issues/12/?note=1#abc"))
      .toEqual({ projectPath: "g/p", issueIid: 12 });
  });

  it("rejects non-issue URLs", () => {
    expect(parseGitLabIssueUrl("https://gitlab.com/g/p/-/merge_requests/12")).toBeNull();
    expect(parseGitLabIssueUrl("https://gitlab.com/g/p")).toBeNull();
    expect(parseGitLabIssueUrl("not a url")).toBeNull();
  });

  it("rejects mismatched instance origin when expected provided", () => {
    expect(
      parseGitLabIssueUrl("https://gitlab.com/g/p/-/issues/1", "https://gitlab.acme.io"),
    ).toBeNull();
  });

  it("accepts matching instance origin", () => {
    expect(
      parseGitLabIssueUrl("https://gitlab.acme.io/g/p/-/issues/1", "https://gitlab.acme.io"),
    ).toEqual({ projectPath: "g/p", issueIid: 1 });
  });
});
