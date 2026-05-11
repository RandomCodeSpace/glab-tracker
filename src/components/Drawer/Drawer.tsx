import type { Issue, ColumnState, Flag } from "../../types/tracker";
import { DrawerMeta } from "./DrawerMeta";
import { Stream, type StreamNote } from "./Stream";
import { DrawerLabels } from "./DrawerLabels";
import { DrawerProse } from "./DrawerProse";
import { Icon } from "../Icon";

export interface DrawerProps {
  issue: Issue;
  webUrl: string;
  hasSource: boolean;
  notes: StreamNote[];
  onClose: () => void;
  onChangeState: (state: ColumnState) => void;
  onToggleFlag: (flag: Flag, on: boolean) => void;
  onEditTitle: (title: string) => void;
  onEditDescription: (md: string) => void;
  onAddNote: (body: string) => void;
  onPullSnapshot: () => void;
  onCancelIssue: () => void;
  onDeleteIssue: () => void;
  onAddLabel: (anchor: DOMRect) => void;
}

export function Drawer(p: DrawerProps) {
  return (
    <aside className="tracker-drawer" role="complementary">
      <div className="tracker-drawer__bar">
        <button type="button" className="tracker-iconbtn" aria-label="Close" onClick={p.onClose}>
          <Icon name="close" />
        </button>
        <span className="tracker-drawer__bar-grow" />
        <a className="tracker-iconbtn" href={p.webUrl} target="_blank" rel="noopener noreferrer" aria-label="Open in GitLab">
          <Icon name="external" />
        </a>
        {p.hasSource && (
          <button type="button" className="tracker-iconbtn" aria-label="Pull source snapshot" onClick={p.onPullSnapshot}>
            <Icon name="refresh" />
          </button>
        )}
        <button type="button" className="tracker-iconbtn" aria-label="Cancel issue" onClick={p.onCancelIssue}>
          <Icon name="cancel" />
        </button>
        <button type="button" className="tracker-iconbtn tracker-iconbtn--danger" aria-label="Delete issue" onClick={p.onDeleteIssue}>
          <Icon name="trash" />
        </button>
      </div>

      <div className="tracker-drawer__body">
        <DrawerMeta issue={p.issue} onChangeState={p.onChangeState} onToggleFlag={p.onToggleFlag} />
        <DrawerProse
          title={p.issue.title}
          description={p.issue.description}
          onEditTitle={p.onEditTitle}
          onEditDescription={p.onEditDescription}
        />
        <DrawerLabels labels={p.issue.userLabels} onAdd={(r) => p.onAddLabel(r)} />
        <Stream notes={p.notes} />
      </div>

      <DrawerCompose onSubmit={p.onAddNote} />
    </aside>
  );
}

function DrawerCompose({ onSubmit }: { onSubmit: (body: string) => void }) {
  return (
    <form
      className="tracker-drawer__compose"
      onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.querySelector("input");
        if (input && input.value.trim()) { onSubmit(input.value.trim()); input.value = ""; }
      }}
    >
      <input type="text" placeholder="Add a note…" />
    </form>
  );
}
