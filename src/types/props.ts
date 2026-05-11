export interface TrackerProps {
  /** GitLab instance base URL, e.g. "https://gitlab.acme.io". No trailing slash. */
  instanceUrl: string;
  /** OAuth application ID. Omit (with oauthRedirectUri) to disable OAuth and use access-token sign-in only. */
  oauthClientId?: string;
  /** OAuth redirect URI (must match the app registration). Omit (with oauthClientId) to disable OAuth. */
  oauthRedirectUri?: string;
  /** Numeric project id of the user's private personal tracker project. */
  personalProjectId: number;
  /** Optional: className applied to the wrapper element for theme overrides. */
  className?: string;
}
