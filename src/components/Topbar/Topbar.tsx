import { PasteInput } from "./PasteInput";
import { StatusCounters, type CountersProps } from "./StatusCounters";
import { Icon } from "../Icon";
import { Kbd } from "../common/Kbd";
import { Logo } from "../Logo";
import { VERSION } from "../../version";

export interface TopbarProps {
  projectName: string;
  instanceHost: string;
  username: string;
  counters: CountersProps;
  onPasteUrl: (url: string) => void;
  onSyncAll: () => void;
  onNewIssue: () => void;
  onSignOut: () => void;
  /** Opens the command palette. Wired in a later phase; no-op when absent. */
  onOpenCommand?: () => void;
}

export function Topbar(props: TopbarProps) {
  return (
    <header className="tracker-topbar">
      <div className="tracker-topbar__brand">
        <span className="tracker-topbar__mark" aria-hidden>
          <Logo size={20} />
        </span>
        <span className="tracker-topbar__wordmark">Lane</span>
        <span className="tracker-topbar__path" title={props.instanceHost}>{props.projectName}</span>
      </div>

      <button
        type="button"
        className="tracker-topbar__command"
        aria-label="Open command palette"
        onClick={() => props.onOpenCommand?.()}
      >
        <Icon name="search" size={14} />
        <span className="tracker-topbar__command-label">Search or run a command</span>
        <Kbd keys="mod+k" />
      </button>

      <PasteInput onSubmit={props.onPasteUrl} />
      <StatusCounters {...props.counters} />

      <div className="tracker-topbar__actions">
        <button type="button" className="tracker-topbar__sync" aria-label="Sync all" onClick={props.onSyncAll}>
          <Icon name="refresh" size={14} />
          <span>Sync</span>
        </button>
        <span className="tracker-topbar__version" title={`Lane ${VERSION}`}>v{VERSION}</span>
        <button
          type="button"
          className="tracker-iconbtn"
          aria-label={`Sign out (${props.username})`}
          title={`Sign out @${props.username}`}
          onClick={props.onSignOut}
        >
          <Icon name="logout" />
        </button>
        <button type="button" className="tracker-btn tracker-btn--primary" onClick={props.onNewIssue}>
          <Icon name="plus" />
          <span>New</span>
        </button>
      </div>
    </header>
  );
}
