import { generateCodeVerifier, codeChallengeFromVerifier } from "./pkce";
import type { OAuthTokens } from "../types/gitlab";

const VERIFIER_KEY = "tracker.pkce.verifier";
const STATE_KEY = "tracker.pkce.state";

export interface AuthConfig {
  instanceUrl: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
}

export async function beginAuthorize(cfg: AuthConfig): Promise<void> {
  const verifier = await generateCodeVerifier();
  const challenge = await codeChallengeFromVerifier(verifier);
  const state = crypto.randomUUID();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  const url = new URL("/oauth/authorize", cfg.instanceUrl);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scope ?? "api");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  window.location.assign(url.toString());
}

export interface AuthCallbackResult {
  ok: boolean;
  tokens?: OAuthTokens;
  error?: string;
}

export async function completeAuthorize(cfg: AuthConfig): Promise<AuthCallbackResult> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code) return { ok: false, error: "missing_code" };

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!expectedState || state !== expectedState) return { ok: false, error: "state_mismatch" };
  if (!verifier) return { ok: false, error: "missing_verifier" };

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    code_verifier: verifier,
  });
  const res = await fetch(new URL("/oauth/token", cfg.instanceUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return { ok: false, error: `token_${res.status}` };
  const json = (await res.json()) as Omit<OAuthTokens, "obtained_at">;
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return { ok: true, tokens: { ...json, obtained_at: Date.now() } };
}

export async function refreshTokens(cfg: AuthConfig, refreshToken: string): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: cfg.clientId,
  });
  const res = await fetch(new URL("/oauth/token", cfg.instanceUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`refresh_${res.status}`);
  const json = (await res.json()) as Omit<OAuthTokens, "obtained_at">;
  return { ...json, obtained_at: Date.now() };
}
