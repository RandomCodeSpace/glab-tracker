import { describe, it, expect, beforeEach } from "vitest";
import { createSidecarStore } from "../../src/data/sidecar";

describe("sidecar", () => {
  beforeEach(() => indexedDB.deleteDatabase("tracker-sidecar-test"));

  it("stores and reads a flag reason", async () => {
    const s = await createSidecarStore("tracker-sidecar-test");
    await s.setFlagReason(42, "blocked", "awaiting spec");
    expect(await s.getFlagReason(42, "blocked")).toBe("awaiting spec");
  });

  it("clears a flag reason", async () => {
    const s = await createSidecarStore("tracker-sidecar-test");
    await s.setFlagReason(42, "blocked", "x");
    await s.clearFlagReason(42, "blocked");
    expect(await s.getFlagReason(42, "blocked")).toBeNull();
  });

  it("stores per-column ordering", async () => {
    const s = await createSidecarStore("tracker-sidecar-test");
    await s.setOrder("doing", [3, 1, 2]);
    expect(await s.getOrder("doing")).toEqual([3, 1, 2]);
  });

  it("getAllFlagReasons returns only the reasons for the requested iid", async () => {
    const s = await createSidecarStore("tracker-sidecar-test");
    await s.setFlagReason(7, "blocked", "for 7 blocked");
    await s.setFlagReason(7, "reviewing", "for 7 reviewing");
    // Noise: reasons for other issues that must NOT leak into the result
    await s.setFlagReason(8, "blocked", "for 8");
    await s.setFlagReason(9, "reviewing", "for 9");

    const r = await s.getAllFlagReasons(7);
    expect(r).toEqual({ blocked: "for 7 blocked", reviewing: "for 7 reviewing" });
  });

  it("getAllFlagReasons returns an empty object when no reasons exist", async () => {
    const s = await createSidecarStore("tracker-sidecar-test");
    expect(await s.getAllFlagReasons(42)).toEqual({});
  });
});
