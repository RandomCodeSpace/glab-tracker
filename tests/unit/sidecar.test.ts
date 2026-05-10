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
});
