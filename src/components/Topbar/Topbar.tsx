import { PasteInput } from "./PasteInput";
import { StatusCounters, type CountersProps } from "./StatusCounters";
import { Icon } from "../Icon";
import { Logo } from "../Logo";

export interface TopbarProps {
  projectName: string;
  instanceHost: string;
  counters: CountersProps;
  onPasteUrl: (url: string) => void;
  onSyncAll: () => void;
  onNewIssue: () => void;
}

export function Topbar(props: TopbarProps) {
  return (
    <header className="tracker-topbar">
      <div className="tracker-topbar__brand">
        <span className="tracker-topbar__mark" aria-hidden>
          <Logo size={14} />
        </span>
        <span className="tracker-topbar__name">{props.projectName}</span>
        <span className="tracker-topbar__instance">{props.instanceHost}</span>
      </div>
      <PasteInput onSubmit={props.onPasteUrl} />
      <StatusCounters {...props.counters} />
      <div className="tracker-topbar__actions">
        <button type="button" className="tracker-iconbtn" aria-label="Sync all" onClick={props.onSyncAll}>
          <Icon name="refresh" />
        </button>
        <button type="button" className="tracker-btn tracker-btn--primary" onClick={props.onNewIssue}>
          <Icon name="plus" />
          <span>New</span>
        </button>
      </div>
    </header>
  );
}
