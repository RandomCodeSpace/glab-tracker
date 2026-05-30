import { useState, type KeyboardEvent } from "react";
import { Markdown } from "../../utils/markdown";
import { Icon } from "../Icon";
import { Kbd } from "../common/Kbd";

export interface StreamNote {
  author: string;
  createdAt: string;
  body: string;
  system: boolean;
}

const SNAPSHOT_RE = /^```\nstate: (?:opened|closed)\n/;

// Compact log-gutter timestamp: "2:04 PM" today, "May 30" within the year.
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Relative time for the note head, e.g. "now", "5m", "3h", "2d".
function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function Stream({ notes, onAddNote }: { notes: StreamNote[]; onAddNote?: (body: string) => void }) {
  return (
    <div className="tracker-drawer__stream">
      <div className="tracker-drawer__timeline">
        {notes.map((n, i) => {
          const isSnapshot = SNAPSHOT_RE.test(n.body);
          const isSystem = n.system || isSnapshot;
          return (
            <div
              className={`tracker-drawer__entry${isSystem ? " is-system" : ""}`}
              key={i}
            >
              <div className="tracker-drawer__entry-gutter" aria-hidden>
                {isSystem ? <Icon name="dot" size={14} /> : <span className="tracker-drawer__entry-tick" />}
              </div>
              <div className="tracker-drawer__entry-main">
                <div className="tracker-drawer__entry-head">
                  {isSnapshot ? (
                    <span className="tracker-drawer__entry-kind">Source snapshot</span>
                  ) : (
                    <span className="tracker-drawer__entry-who">{n.author}</span>
                  )}
                  <span className="tracker-drawer__entry-rel" title={new Date(n.createdAt).toLocaleString()}>
                    {formatRelative(n.createdAt)}
                  </span>
                  <span className="tracker-drawer__entry-ts">{formatTimestamp(n.createdAt)}</span>
                </div>
                <div className="tracker-drawer__entry-body tracker-md">
                  <Markdown>{n.body}</Markdown>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {onAddNote ? <DrawerCompose onSubmit={onAddNote} /> : null}
    </div>
  );
}

function DrawerCompose({ onSubmit }: { onSubmit: (body: string) => void }) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onSubmit(body);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="tracker-drawer__compose"
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <textarea
        className="tracker-drawer__compose-input"
        placeholder="Add a note…"
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Add a note"
      />
      <div className="tracker-drawer__compose-foot">
        <span className="tracker-drawer__compose-hint">
          <Kbd keys="mod+enter" /> to add
        </span>
        <button
          type="submit"
          className="tracker-btn tracker-btn--primary tracker-drawer__compose-send"
          disabled={!draft.trim()}
        >
          Add note
        </button>
      </div>
    </form>
  );
}
