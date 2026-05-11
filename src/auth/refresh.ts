import type { OAuthTokens } from "../types/gitlab";
import type { TokenStore } from "./tokenStore";
import type { AuthConfig } from "./oauth";
import { refreshTokens } from "./oauth";

export interface AuthSession {
  accessToken(): Promise<string>;
  forceRefresh(): Promise<string>;
  clear(): Promise<void>;
}

export function createAuthSession(cfg: AuthConfig, store: TokenStore): AuthSession {
  let inflight: Promise<OAuthTokens> | null = null;

  async function refresh(): Promise<OAuthTokens> {
    if (inflight) return inflight;
    inflight = (async () => {
      const current = await store.get();
      if (!current) throw new Error("no_tokens");
      if (current.kind !== "oauth") throw new Error("token_not_refreshable");
      const next = await refreshTokens(cfg, current.tokens.refresh_token);
      await store.set({ kind: "oauth", tokens: next });
      return next;
    })().finally(() => { inflight = null; });
    return inflight;
  }

  return {
    async accessToken() {
      const a = await store.get();
      if (!a) throw new Error("no_tokens");
      if (a.kind === "pat") return a.token;
      const t = a.tokens;
      const expiresAt = t.obtained_at + (t.expires_in - 60) * 1000;
      if (Date.now() >= expiresAt) {
        const fresh = await refresh();
        return fresh.access_token;
      }
      return t.access_token;
    },
    async forceRefresh() {
      const a = await store.get();
      if (a?.kind === "pat") throw new Error("token_not_refreshable");
      const fresh = await refresh();
      return fresh.access_token;
    },
    async clear() { await store.clear(); },
  };
}
