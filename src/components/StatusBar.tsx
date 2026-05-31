import { Icon } from "./Icon";
import { isMac } from "./common/Kbd";
import { VERSION } from "../version";

export interface StatusBarProps {
  projectPath: string;
  open: number;
  blocked: number;
  reviewing: number;
  syncing: boolean;
  onOpenCommand: () => void;
  onOpenShortcuts: () => void;
  theme?: "dark" | "light";
  crt?: boolean;
  onToggleTheme?: () => void;
  onToggleCrt?: () => void;
}

// Editor-style statusline pinned to the bottom: dark chrome, monospace, live
// counts + sync state on the left, keyboard affordances + version on the right.
export function StatusBar(p: StatusBarProps) {
  const mod = isMac ? "⌘K" : "Ctrl K";
  return (
    <footer className="tracker-statusbar" aria-label="Status bar">
      <span className="tracker-statusbar__seg tracker-statusbar__branch" title={p.projectPath}>
        <Icon name="git" />
        {p.projectPath}
      </span>
      <span className="tracker-statusbar__seg" aria-live="polite">
        <span className={`tracker-statusbar__dot ${p.syncing ? "is-syncing" : "is-synced"}`} />
        {p.syncing ? "syncing…" : "synced"}
      </span>

      <span className="tracker-statusbar__div" aria-hidden />

      <span className="tracker-statusbar__seg">{p.open} open</span>
      <span className="tracker-statusbar__seg tracker-statusbar__opt">
        <span className="tracker-statusbar__dot tracker-statusbar__dot--blocked" />
        {p.blocked} blocked
      </span>
      <span className="tracker-statusbar__seg tracker-statusbar__opt">
        <span className="tracker-statusbar__dot tracker-statusbar__dot--reviewing" />
        {p.reviewing} reviewing
      </span>

      <span className="tracker-statusbar__grow" />

      <button type="button" className="tracker-statusbar__btn" onClick={p.onOpenCommand}>
        <kbd className="tracker-statusbar__key">{mod}</kbd>
        <span className="tracker-statusbar__opt">palette</span>
      </button>
      <button type="button" className="tracker-statusbar__btn" onClick={p.onOpenShortcuts}>
        <kbd className="tracker-statusbar__key">?</kbd>
        <span className="tracker-statusbar__opt">shortcuts</span>
      </button>

      {p.onToggleTheme && (
        <button
          type="button"
          className="tracker-statusbar__btn"
          title={p.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          aria-label={p.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={p.onToggleTheme}
        >
          <Icon name="contrast" />
        </button>
      )}
      {p.onToggleCrt && (
        <button
          type="button"
          className="tracker-statusbar__btn"
          title={p.crt ? "Disable CRT texture" : "Enable CRT texture"}
          aria-label={p.crt ? "Disable CRT texture" : "Enable CRT texture"}
          aria-pressed={p.crt}
          onClick={p.onToggleCrt}
        >
          <Icon name="monitor" />
        </button>
      )}

      <span className="tracker-statusbar__div" aria-hidden />
      <span className="tracker-statusbar__seg tracker-statusbar__ver">lane v{VERSION}</span>
    </footer>
  );
}
