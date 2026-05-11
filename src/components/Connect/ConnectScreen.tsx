import { useState } from "react";
import { Logo } from "../Logo";

export type ConnectStep = "authorize" | "project-id" | "bootstrap" | "done";

export interface ConnectScreenProps {
  step: ConnectStep;
  username: string | null;
  instanceHost: string;
  onAuthorize: () => void;
  onSubmitProjectId: (id: number) => Promise<{ ok: boolean; error?: string }>;
  bootstrapResult: { created: string[]; alreadyPresent: string[] } | null;
}

export function ConnectScreen(p: ConnectScreenProps) {
  const [pidStr, setPidStr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const pid = Number.parseInt(pidStr, 10);
    if (!Number.isInteger(pid) || pid <= 0) { setError("Enter a numeric project ID"); return; }
    setBusy(true);
    setError(null);
    const r = await p.onSubmitProjectId(pid);
    setBusy(false);
    if (!r.ok) setError(r.error ?? "Could not connect");
  }

  return (
    <section className="tracker-connect">
      <div className="tracker-connect__mark" aria-hidden>
        <Logo size={26} />
      </div>
      <h1 className="tracker-connect__title">Connect to Lane.</h1>
      <p className="tracker-connect__lede">
        A private GitLab project becomes your second brain. Three steps and you're in.
      </p>
      <ol className="tracker-connect__steps">
        <li className={`tracker-connect__step${p.step === "authorize" ? " is-current" : ""}${p.username ? " is-done" : ""}`}>
          <span className="tracker-connect__num">01</span>
          <div>
            <div className="tracker-connect__step-title">Authorize on {p.instanceHost}</div>
            <div className="tracker-connect__step-desc">
              OAuth 2.0 Authorization Code with PKCE. Tokens live in IndexedDB on this device only.
            </div>
            {p.username ? (
              <div className="tracker-connect__ok">✓ Connected as @{p.username}</div>
            ) : (
              <button type="button" className="tracker-btn tracker-btn--primary" onClick={p.onAuthorize}>Authorize</button>
            )}
          </div>
        </li>
        <li className={`tracker-connect__step${p.step === "project-id" ? " is-current" : ""}${p.step === "bootstrap" || p.step === "done" ? " is-done" : ""}`}>
          <span className="tracker-connect__num">02</span>
          <div>
            <div className="tracker-connect__step-title">Tracker project</div>
            <div className="tracker-connect__step-desc">
              Paste the numeric project ID of your private GitLab project. The component refuses to operate on non-private projects.
            </div>
            {p.step === "project-id" && (
              <div className="tracker-connect__field">
                <input
                  placeholder="18472"
                  value={pidStr}
                  onChange={(e) => setPidStr(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button type="button" className="tracker-btn tracker-btn--primary" disabled={busy} onClick={submit}>
                  {busy ? "Connecting…" : "Connect"}
                </button>
              </div>
            )}
            {error && <div className="tracker-connect__error">{error}</div>}
          </div>
        </li>
        <li className={`tracker-connect__step${p.step === "bootstrap" ? " is-current" : ""}${p.step === "done" ? " is-done" : ""}`}>
          <span className="tracker-connect__num">03</span>
          <div>
            <div className="tracker-connect__step-title">Bootstrap labels</div>
            <div className="tracker-connect__step-desc">
              Creates state::todo · state::doing · state::done · state::cancelled, flag::blocked · flag::reviewing,
              src::bau · src::side. Idempotent.
            </div>
            {p.bootstrapResult && (
              <div className="tracker-connect__ok">
                ✓ {p.bootstrapResult.created.length} created, {p.bootstrapResult.alreadyPresent.length} already present
              </div>
            )}
          </div>
        </li>
      </ol>
    </section>
  );
}
