import { describe, it, expect } from "vitest";
import {
  classifyLabel,
  parseUserLabel,
  hueFromName,
  pickColumnLabel,
  pickFlags,
  pickOrigin,
  pickSourceIdentity,
} from "../../src/data/labels";

describe("classifyLabel", () => {
  it("recognizes system state labels", () => {
    expect(classifyLabel("state::todo")).toEqual({ kind: "state", value: "todo" });
    expect(classifyLabel("state::cancelled")).toEqual({ kind: "state", value: "cancelled" });
  });
  it("recognizes flag labels", () => {
    expect(classifyLabel("flag::blocked")).toEqual({ kind: "flag", value: "blocked" });
  });
  it("recognizes src origin labels", () => {
    expect(classifyLabel("src::bau")).toEqual({ kind: "origin", value: "bau" });
    expect(classifyLabel("src::side")).toEqual({ kind: "origin", value: "side" });
  });
  it("recognizes src identity labels", () => {
    expect(classifyLabel("src::bau::42-421")).toEqual({
      kind: "source-id",
      projectId: 42,
      issueIid: 421,
    });
  });
  it("treats anything else as user label", () => {
    expect(classifyLabel("area::frontend").kind).toBe("user");
    expect(classifyLabel("spike").kind).toBe("user");
  });
});

describe("parseUserLabel", () => {
  it("splits scoped labels", () => {
    expect(parseUserLabel("area::frontend")).toMatchObject({
      name: "area::frontend", scope: "area", value: "frontend", isScoped: true,
    });
  });
  it("returns flat for non-scoped", () => {
    expect(parseUserLabel("spike")).toMatchObject({
      name: "spike", scope: null, value: "spike", isScoped: false,
    });
  });
});

describe("hueFromName", () => {
  it("is deterministic across runs", () => {
    expect(hueFromName("area::auth")).toBe(hueFromName("area::auth"));
  });
  it("returns one of the seven hues", () => {
    const valid = ["blue", "violet", "pink", "amber", "green", "teal", "slate"];
    for (const n of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(valid).toContain(hueFromName(n));
    }
  });
});

describe("pickers", () => {
  const labels = [
    "state::doing",
    "flag::blocked",
    "src::bau",
    "src::bau::42-421",
    "area::auth",
    "spike",
  ];
  it("picks the column state", () => {
    expect(pickColumnLabel(labels)).toBe("doing");
  });
  it("picks the flag set", () => {
    expect(pickFlags(labels)).toEqual(new Set(["blocked"]));
  });
  it("picks the origin", () => {
    expect(pickOrigin(labels)).toBe("bau");
  });
  it("picks the source identity", () => {
    expect(pickSourceIdentity(labels)).toEqual({ projectId: 42, issueIid: 421 });
  });
  it("returns null source identity when absent", () => {
    expect(pickSourceIdentity(["state::todo", "src::side"])).toBeNull();
  });
});
