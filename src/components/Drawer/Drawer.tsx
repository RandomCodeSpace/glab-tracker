import type { Issue, ColumnState, Flag } from "../../types/tracker";
import { DrawerMeta } from "./DrawerMeta";
import { Stream, type StreamNote } from "./Stream";
import { DrawerLabels } from "./DrawerLabels";
import { DrawerProse } from "./DrawerProse";

export interface DrawerProps {
  issue: Issue;
  sourceUrl: string | null;
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
  onAddLabel: () => void;
  onRemoveLabel: (name: string) => void;
}

export function Drawer(p: DrawerProps) {
  return (
    <aside className="tracker-drawer" role="complementary">
      <div className="tracker-drawer__bar">
        <button className="tracker-iconbtn" aria-label="Close" onClick={p.onClose}>×</button>
        <span className="tracker-drawer__bar-grow" />
        {p.sourceUrl && (
          <a className="tracker-iconbtn" href={p.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label="Open source in GitLab">↗</a>
        )}
        {p.sourceUrl && (
          <button className="tracker-iconbtn" aria-label="Pull source snapshot" onClick={p.onPullSnapshot}>↻</button>
        )}
        <button className="tracker-iconbtn" aria-label="Cancel issue" onClick={p.onCancelIssue}>⊘</button>
        <button className="tracker-iconbtn" aria-label="Delete issue" onClick={p.onDeleteIssue}>🗑</button>
      </div>

      <div className="tracker-drawer__body">
        <DrawerMeta issue={p.issue} onChangeState={p.onChangeState} onToggleFlag={p.onToggleFlag} />
        <DrawerProse
          title={p.issue.title}
          description={p.issue.description}
          onEditTitle={p.onEditTitle}
          onEditDescription={p.onEditDescription}
        />
        <DrawerLabels labels={p.issue.userLabels} onAdd={p.onAddLabel} onRemove={p.onRemoveLabel} />
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
