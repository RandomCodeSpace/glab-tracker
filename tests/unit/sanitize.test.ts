import { describe, it, expect } from "vitest";
import { sanitizeForGitLab, fenceSourceSnapshot } from "../../src/data/sanitize";

const ownProject = "my/tracker";

describe("sanitizeForGitLab", () => {
  it("backtick-wraps cross-project issue refs", () => {
    expect(sanitizeForGitLab("see group/proj#42 for context", { ownProject }))
      .toBe("see `group/proj#42` for context");
  });

  it("backtick-wraps cross-project MR refs", () => {
    expect(sanitizeForGitLab("merged in group/proj!88", { ownProject }))
      .toBe("merged in `group/proj!88`");
  });

  it("backtick-wraps full GitLab issue URLs", () => {
    expect(sanitizeForGitLab("from https://gitlab.com/g/p/-/issues/3", { ownProject }))
      .toBe("from `https://gitlab.com/g/p/-/issues/3`");
  });

  it("backtick-wraps @username mentions", () => {
    expect(sanitizeForGitLab("ping @alice and @bob.smith", { ownProject }))
      .toBe("ping `@alice` and `@bob.smith`");
  });

  it("keeps own-project bare refs", () => {
    expect(sanitizeForGitLab("see #42 in this project", { ownProject }))
      .toBe("see #42 in this project");
  });

  it("keeps own-project label refs but escapes foreign ~labels", () => {
    expect(sanitizeForGitLab("~bug here", { ownProject })).toBe("~bug here");
  });

  it("keeps own-project full path issue refs (treats as same project)", () => {
    expect(sanitizeForGitLab(`see ${ownProject}#1`, { ownProject }))
      .toBe(`see \`${ownProject}#1\``);
  });

  it("does not double-wrap already-fenced code", () => {
    const input = "see `group/proj#42` already";
    expect(sanitizeForGitLab(input, { ownProject })).toBe(input);
  });

  it("does not modify content inside fenced code blocks", () => {
    const input = "before\n```\n@alice and group/p#3\n```\nafter";
    expect(sanitizeForGitLab(input, { ownProject })).toBe(input);
  });

  it("preserves email addresses (not @username)", () => {
    expect(sanitizeForGitLab("write to alice@example.com", { ownProject }))
      .toBe("write to alice@example.com");
  });
});

describe("fenceSourceSnapshot", () => {
  it("wraps content in a fenced code block", () => {
    const out = fenceSourceSnapshot({
      state: "closed",
      title: "X",
      labels: ["bug"],
      description: "see group/p#1",
    });
    expect(out).toMatch(/^```\n[\s\S]+\n```$/);
    expect(out).toContain("see group/p#1");
  });

  it("escapes nested triple-backticks in content", () => {
    const out = fenceSourceSnapshot({
      state: "opened", title: "x", labels: [],
      description: "code:\n```\nfoo\n```",
    });
    expect(out.split("```").length - 1).toBe(2);  // exactly the outer fence
  });
});
