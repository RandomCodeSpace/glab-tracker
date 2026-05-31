import { useState } from "react";
import { Logo } from "../Logo";
import { Icon } from "../Icon";
import { SYSTEM_LABEL_NAMES } from "../../data/labels";

export type ConnectStep = "authorize" | "project-id" | "bootstrap" | "done";

export interface ConnectScreenProps {
  step: ConnectStep;
  username: string | null;
  instanceHost: string;
  oauthEnabled: boolean;
  onAuthorize: () => void;
  onSubmitToken: (token: string) => Promise<{ ok: boolean; error?: string }>;
  onSubmitProjectId: (id: number) => Promise<{ ok: boolean; error?: string }>;
  bootstrapResult: { created: string[]; alreadyPresent: string[] } | null;
}

export function ConnectScreen(p: ConnectScreenProps) {
  const [pidStr, setPidStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showTokenForm, setShowTokenForm] = useState(false);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenBusy, setTokenBusy] = useState(false);

  async function submit() {
    const pid = Number.parseInt(pidStr, 10);
    if (!Number.isInteger(pid) || pid <= 0) { setError("Enter a numeric project ID"); return; }
    setBusy(true);
    setError(null);
    const r = await p.onSubmitProjectId(pid);
    setBusy(false);
    if (!r.ok) setError(r.error ?? "Could not connect");
  }

  async function submitToken() {
    if (!token.trim()) { setTokenError("Paste a token"); return; }
    setTokenBusy(true);
    setTokenError(null);
    const r = await p.onSubmitToken(token);
    setTokenBusy(false);
    if (!r.ok) setTokenError(r.error ?? "Could not connect");
  }

  async function pasteToken() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setToken(text.trim()); setTokenError(null); }
    } catch {
      // Clipboard read denied/unavailable — user can paste manually into the field.
    }
  }

  const patUrl = `https://${p.instanceHost}/-/user_settings/personal_access_tokens`;
  const authDone = !!p.username;
  const pidDone = p.step === "bootstrap" || p.step === "done";

  return (
    <section className="tracker-connect">
      <header className="tracker-connect__head">
        <span className="tracker-connect__mark" aria-hidden>
          <Logo size={22} />
        </span>
        <div>
          <h1 className="tracker-connect__title">
            <span className="tracker-connect__prompt" aria-hidden>lane&nbsp;▸</span> Connect Lane
          </h1>
          <p className="tracker-connect__lede">
            A private GitLab project becomes your tracker. Three steps, all local.
          </p>
        </div>
      </header>

      <ol className="tracker-connect__steps">
        {/* ---- 01 · authorize ------------------------------------------------ */}
        <li className={`tracker-connect__step${p.step === "authorize" ? " is-current" : ""}${authDone ? " is-done" : ""}`}>
          <span className="tracker-connect__num">{authDone ? "[✓]" : "[1/3]"}</span>
          <div className="tracker-connect__body">
            <div className="tracker-connect__step-title">
              {p.oauthEnabled ? `Authorize on ${p.instanceHost}` : `Connect to ${p.instanceHost}`}
            </div>
            <div className="tracker-connect__step-desc">
              {p.oauthEnabled
                ? "OAuth 2.0 with PKCE, or a personal/project access token. Tokens live in IndexedDB on this device only."
                : "Paste a personal or project access token with the api scope. Stored in IndexedDB on this device only."}
            </div>

            {authDone ? (
              <div className="tracker-connect__ok">
                <Icon name="check" size={13} />
                <span>Connected as @{p.username}</span>
              </div>
            ) : (showTokenForm || !p.oauthEnabled) ? (
              <div className="tracker-connect__token">
                <div className="tracker-connect__inputwrap">
                  <span className="tracker-connect__sigil" aria-hidden>$</span>
                  <input
                    className="tracker-connect__input"
                    type="password"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="glpat-… or project access token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitToken()}
                  />
                  {!token && <span className="tracker-caret" aria-hidden />}
                  <button
                    type="button"
                    className="tracker-connect__paste"
                    onClick={pasteToken}
                    title="Paste from clipboard"
                  >
                    Paste
                  </button>
                </div>
                <div className="tracker-connect__token-row">
                  <button type="button" className="tracker-btn tracker-btn--primary" disabled={tokenBusy} onClick={submitToken}>
                    {tokenBusy ? "Verifying…" : "Connect with token"}
                  </button>
                  {p.oauthEnabled && (
                    <button type="button" className="tracker-btn tracker-btn--ghost tracker-btn--small" onClick={() => { setShowTokenForm(false); setToken(""); setTokenError(null); }}>
                      Use OAuth instead
                    </button>
                  )}
                </div>
                <div className="tracker-connect__token-hint">
                  Needs the <code>api</code> scope.{" "}
                  <a className="tracker-connect__link" href={patUrl} target="_blank" rel="noreferrer">
                    Create one on {p.instanceHost}
                    <Icon name="link-external" size={12} />
                  </a>
                </div>
                {tokenError && (
                  <div className="tracker-connect__error" role="alert">
                    <Icon name="block" size={13} />
                    <span>{tokenError}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="tracker-connect__choice">
                <button type="button" className="tracker-btn tracker-btn--primary" onClick={p.onAuthorize}>Authorize with OAuth</button>
                <button type="button" className="tracker-btn tracker-btn--ghost" onClick={() => setShowTokenForm(true)}>Use a token instead</button>
              </div>
            )}
          </div>
        </li>

        {/* ---- 02 · project id ---------------------------------------------- */}
        <li className={`tracker-connect__step${p.step === "project-id" ? " is-current" : ""}${pidDone ? " is-done" : ""}`}>
          <span className="tracker-connect__num">{pidDone ? "[✓]" : "[2/3]"}</span>
          <div className="tracker-connect__body">
            <div className="tracker-connect__step-title">Tracker project</div>
            <div className="tracker-connect__step-desc">
              The numeric ID of your private GitLab project. Lane refuses to operate on non-private projects.
            </div>
            {p.step === "project-id" && (
              <>
                <div className="tracker-connect__field">
                  <input
                    className="tracker-connect__input tracker-connect__input--num"
                    inputMode="numeric"
                    autoFocus
                    spellCheck={false}
                    placeholder="18472"
                    value={pidStr}
                    onChange={(e) => setPidStr(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                  />
                  <button type="button" className="tracker-btn tracker-btn--primary" disabled={busy} onClick={submit}>
                    {busy ? "Connecting…" : "Connect"}
                  </button>
                </div>
                {error && (
                  <div className="tracker-connect__error" role="alert">
                    <Icon name="block" size={13} />
                    <span>{error}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </li>

        {/* ---- 03 · bootstrap ----------------------------------------------- */}
        <li className={`tracker-connect__step${p.step === "bootstrap" ? " is-current" : ""}${p.step === "done" ? " is-done" : ""}`}>
          <span className="tracker-connect__num">{p.step === "done" ? "[✓]" : "[3/3]"}</span>
          <div className="tracker-connect__body">
            <div className="tracker-connect__step-title">Bootstrap labels</div>
            <div className="tracker-connect__step-desc">
              Creates the system labels Lane uses for state, flags, and sources. Idempotent.
            </div>
            {(p.step === "bootstrap" || p.step === "done") && (
              <ul className="tracker-connect__checklist" aria-label="System labels">
                {SYSTEM_LABEL_NAMES.map((name) => {
                  const resolved = !!p.bootstrapResult;
                  return (
                    <li key={name} className={`tracker-connect__checkrow${resolved ? " is-resolved" : ""}`}>
                      <span className="tracker-connect__checkmark" aria-hidden>
                        {resolved ? <Icon name="check" size={13} /> : <span className="tracker-connect__rowspin" />}
                      </span>
                      <span className="tracker-connect__labelname">{name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {p.bootstrapResult && (
              <div className="tracker-connect__ok">
                <Icon name="check" size={13} />
                <span>{p.bootstrapResult.created.length} created, {p.bootstrapResult.alreadyPresent.length} already present</span>
              </div>
            )}
          </div>
        </li>
      </ol>
    </section>
  );
}
