import { describe, it, expect, beforeEach } from "vitest";
import { createTokenStore } from "../../src/auth/tokenStore";

describe("tokenStore", () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase("tracker-test");
  });

  it("persists and retrieves tokens", async () => {
    const store = await createTokenStore("tracker-test");
    const tokens = {
      access_token: "a", refresh_token: "r", token_type: "Bearer" as const,
      expires_in: 7200, obtained_at: Date.now(), scope: "api",
    };
    await store.set(tokens);
    expect(await store.get()).toEqual(tokens);
  });

  it("clear removes tokens", async () => {
    const store = await createTokenStore("tracker-test");
    await store.set({ access_token: "a", refresh_token: "r", token_type: "Bearer", expires_in: 1, obtained_at: 1, scope: "api" });
    await store.clear();
    expect(await store.get()).toBeNull();
  });
});
