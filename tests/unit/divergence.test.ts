import { describe, it, expect } from "vitest";
import { computeDivergence } from "../../src/data/divergence";

const openAssigned = new Set(["10-100", "10-101", "11-200"]);

describe("computeDivergence", () => {
  it("returns 'source-open' when local Done but source still open", () => {
    expect(computeDivergence("done", { projectId: 10, issueIid: 100 }, openAssigned))
      .toBe("source-open");
  });
  it("returns 'source-closed' when local not-Done and source not in open set", () => {
    expect(computeDivergence("doing", { projectId: 10, issueIid: 999 }, openAssigned))
      .toBe("source-closed");
  });
  it("returns null when aligned", () => {
    expect(computeDivergence("doing", { projectId: 10, issueIid: 100 }, openAssigned)).toBeNull();
    expect(computeDivergence("done", { projectId: 10, issueIid: 999 }, openAssigned)).toBeNull();
  });
  it("suppresses divergence for cancelled", () => {
    expect(computeDivergence("cancelled", { projectId: 10, issueIid: 999 }, openAssigned))
      .toBeNull();
  });
  it("returns null when source identity is unknown (src::side)", () => {
    expect(computeDivergence("doing", null, openAssigned)).toBeNull();
  });
});
