import { useEffect, useRef, useState } from "react";
import type { Issue, ColumnState, Flag } from "../../types/tracker";
import { DrawerMeta } from "./DrawerMeta";
import { Stream, type StreamNote } from "./Stream";
import { DrawerLabels } from "./DrawerLabels";
import { DrawerProse } from "./DrawerProse";
import { Icon } from "../Icon";
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
  projectPath?: string;
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { onClose } = p;

  // Focus the panel on open so it reads as the active surface (keyboard + SR).
  useEffect(() => {
    ref.current?.focus();
  }, []);

  // Esc closes the drawer regardless of where focus currently sits — the panel
  // overlays the board, so focus can drift to a card behind it. Defer to any
  // stacked modal/popover (label picker, composer, palette) so they close first;
  // when the inline delete-confirm is showing, Esc dismisses that first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector(".tracker-modal, .tracker-popover")) return;
      e.preventDefault();
      if (confirmDelete) setConfirmDelete(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmDelete, onClose]);

  return (
    <aside
      ref={ref}
      className="tracker-drawer"
      role="complementary"
      tabIndex={-1}
      aria-label={`#${p.issue.iid} — ${p.issue.title}`}
    >
      <div className="tracker-drawer__bar">
        {p.projectPath && (
          <>
            <span className="tracker-drawer__bar-path" title={p.projectPath}>/{p.projectPath}</span>
            <span className="tracker-drawer__bar-sep" aria-hidden>›</span>
          </>
        )}
        <span className="tracker-drawer__bar-id">#{p.issue.iid}</span>
        <span className="tracker-drawer__state-pill" data-state={p.issue.state}>
          {STATE_LABELS[p.issue.state]}
        </span>
        <span className="tracker-drawer__bar-grow" />
        <a
          className="tracker-iconbtn"
          href={p.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in GitLab"
          title="Open in GitLab"
        >
          <Icon name="link-external" />
        </a>
        <button
          type="button"
          className="tracker-drawer__close"
          aria-label="Close"
          title="Close (Esc)"
          onClick={p.onClose}
        >
          <Icon name="close" />
          <span className="tracker-drawer__close-key" aria-hidden>esc</span>
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

      {/* Footer: destructive actions live here, away from the close button, and
          delete reveals an inline confirm rather than firing immediately. */}
      <div className="tracker-drawer__foot" data-confirm={confirmDelete || undefined}>
        {confirmDelete ? (
          <>
            <span className="tracker-drawer__foot-confirm">
              <Icon name="block" />
              Delete #{p.issue.iid} permanently?
            </span>
            <span className="tracker-drawer__foot-grow" />
            <button
              type="button"
              className="tracker-btn tracker-btn--ghost tracker-btn--small"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="tracker-btn tracker-btn--danger tracker-btn--confirm tracker-btn--small"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onClick={() => {
                setConfirmDelete(false);
                p.onDeleteIssue();
              }}
            >
              Delete issue
            </button>
          </>
        ) : (
          <>
            {p.hasSource && (
              <button
                type="button"
                className="tracker-btn tracker-btn--ghost tracker-btn--small"
                onClick={p.onPullSnapshot}
              >
                <Icon name="refresh" />
                Pull snapshot
              </button>
            )}
            <span className="tracker-drawer__foot-grow" />
            <button
              type="button"
              className="tracker-btn tracker-btn--ghost tracker-btn--small"
              onClick={p.onCancelIssue}
            >
              <Icon name="cancel" />
              Cancel issue
            </button>
            <button
              type="button"
              className="tracker-btn tracker-btn--danger tracker-btn--small"
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="trash" />
              Delete
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
