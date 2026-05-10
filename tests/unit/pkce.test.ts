import { describe, it, expect } from "vitest";
import { generateCodeVerifier, codeChallengeFromVerifier } from "../../src/auth/pkce";

describe("PKCE", () => {
  it("verifier is 43-128 chars and URL-safe", async () => {
    const v = await generateCodeVerifier();
    expect(v.length).toBeGreaterThanOrEqual(43);
    expect(v.length).toBeLessThanOrEqual(128);
    expect(v).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it("challenge derives from verifier deterministically", async () => {
    const v = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    const c1 = await codeChallengeFromVerifier(v);
    const c2 = await codeChallengeFromVerifier(v);
    expect(c1).toBe(c2);
    expect(c1).toMatch(/^[A-Za-z0-9_\-]+$/);
  });
});
