import { PasteInput } from "./PasteInput";
import { StatusCounters, type CountersProps } from "./StatusCounters";

export interface TopbarProps {
  projectName: string;
  instanceHost: string;
  counters: CountersProps;
  onPasteUrl: (url: string) => void;
  onSyncAll: () => void;
  onNewIssue: () => void;
  onOpenSettings: () => void;
}

export function Topbar(props: TopbarProps) {
  return (
    <header className="tracker-topbar">
      <div className="tracker-topbar__brand">
        <span className="tracker-topbar__mark" aria-hidden />
        <span className="tracker-topbar__name">{props.projectName}</span>
        <span className="tracker-topbar__instance">{props.instanceHost}</span>
      </div>
      <PasteInput onSubmit={props.onPasteUrl} />
      <StatusCounters {...props.counters} />
      <div className="tracker-topbar__actions">
        <button type="button" className="tracker-iconbtn" aria-label="Sync all" onClick={props.onSyncAll}>↻</button>
        <button type="button" className="tracker-iconbtn" aria-label="Settings" onClick={props.onOpenSettings}>⚙</button>
        <button type="button" className="tracker-pill" onClick={props.onNewIssue}>+ New</button>
      </div>
    </header>
  );
}
