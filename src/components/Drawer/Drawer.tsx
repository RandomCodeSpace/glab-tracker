import { useRef } from "react";
import type { Issue, ColumnState, Flag } from "../../types/tracker";
import { DrawerMeta } from "./DrawerMeta";
import { Stream, type StreamNote } from "./Stream";
import { DrawerLabels } from "./DrawerLabels";
import { DrawerProse } from "./DrawerProse";
import { Icon } from "../Icon";
import { Kbd } from "../common/Kbd";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const STATE_LABELS: Record<ColumnState, string> = {
  todo: "To do",
  doing: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
};

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
  const ref = useRef<HTMLElement>(null);
  // Mounted only while open; trap focus and restore it to the opener on unmount.
  useFocusTrap(ref, true);

  return (
    <aside
      ref={ref}
      className="tracker-drawer"
      role="complementary"
      aria-label={`#${p.issue.iid} — ${p.issue.title}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          p.onClose();
        }
      }}
    >
      <div className="tracker-drawer__bar">
        <span className="tracker-drawer__bar-id">#{p.issue.iid}</span>
        <span
          className="tracker-drawer__state-pill"
          data-state={p.issue.state}
        >
          {STATE_LABELS[p.issue.state]}
        </span>
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
        <button type="button" className="tracker-drawer__close" aria-label="Close" onClick={p.onClose}>
          <Icon name="close" />
          <Kbd keys="esc" />
        </button>
      </div>

      <div className="tracker-drawer__body">
        <DrawerProse
          title={p.issue.title}
          description={p.issue.description}
          onEditTitle={p.onEditTitle}
          onEditDescription={p.onEditDescription}
        />
        <DrawerMeta issue={p.issue} onChangeState={p.onChangeState} onToggleFlag={p.onToggleFlag} />
        <DrawerLabels labels={p.issue.userLabels} onAdd={(r) => p.onAddLabel(r)} />
        <Stream notes={p.notes} onAddNote={p.onAddNote} />
      </div>
    </aside>
  );
}
