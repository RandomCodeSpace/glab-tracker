export interface TrackerProps {
  /** GitLab instance base URL, e.g. "https://gitlab.acme.io". No trailing slash. */
  instanceUrl: string;
  /** OAuth application ID registered on the configured GitLab instance. */
  oauthClientId: string;
  /** Redirect URI registered with the OAuth application. Must match exactly. */
  oauthRedirectUri: string;
  /** Numeric project id of the user's private personal tracker project. */
  personalProjectId: number;
  /** Optional: className applied to the wrapper element for theme overrides. */
  className?: string;
}
