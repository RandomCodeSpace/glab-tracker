import type { OAuthTokens } from "../types/gitlab";
import type { TokenStore } from "./tokenStore";
import type { AuthConfig } from "./oauth";
import { refreshTokens } from "./oauth";

export interface AuthSession {
  /** Returns a valid access token, refreshing if needed. */
  accessToken(): Promise<string>;
  /** Force-refresh on 401 from a request. Concurrent calls are coalesced. */
  forceRefresh(): Promise<string>;
  /** Clear the session (logout). */
  clear(): Promise<void>;
}

export function createAuthSession(cfg: AuthConfig, store: TokenStore): AuthSession {
  let inflight: Promise<OAuthTokens> | null = null;

  async function refresh(): Promise<OAuthTokens> {
    if (inflight) return inflight;
    inflight = (async () => {
      const current = await store.get();
      if (!current) throw new Error("no_tokens");
      const next = await refreshTokens(cfg, current.refresh_token);
      await store.set(next);
      return next;
    })().finally(() => { inflight = null; });
    return inflight;
  }

  return {
    async accessToken() {
      const t = await store.get();
      if (!t) throw new Error("no_tokens");
      const expiresAt = t.obtained_at + (t.expires_in - 60) * 1000;
      if (Date.now() >= expiresAt) {
        const fresh = await refresh();
        return fresh.access_token;
      }
      return t.access_token;
    },
    async forceRefresh() {
      const fresh = await refresh();
      return fresh.access_token;
    },
    async clear() { await store.clear(); },
  };
}
