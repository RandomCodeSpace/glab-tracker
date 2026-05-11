import { describe, it, expect, beforeEach } from "vitest";
import { createTokenStore } from "../../src/auth/tokenStore";

describe("tokenStore", () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase("tracker-test");
  });

  it("persists and retrieves oauth tokens", async () => {
    const store = await createTokenStore("tracker-test");
    const auth = {
      kind: "oauth" as const,
      tokens: {
        access_token: "a", refresh_token: "r", token_type: "Bearer" as const,
        expires_in: 7200, obtained_at: Date.now(), scope: "api",
      },
    };
    await store.set(auth);
    expect(await store.get()).toEqual(auth);
  });

  it("persists and retrieves a PAT", async () => {
    const store = await createTokenStore("tracker-test");
    await store.set({ kind: "pat", token: "glpat-xxxxxxx" });
    expect(await store.get()).toEqual({ kind: "pat", token: "glpat-xxxxxxx" });
  });

  it("clear removes the stored auth", async () => {
    const store = await createTokenStore("tracker-test");
    await store.set({ kind: "pat", token: "glpat-x" });
    await store.clear();
    expect(await store.get()).toBeNull();
  });
});
