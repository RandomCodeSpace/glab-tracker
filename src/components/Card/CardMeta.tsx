import type { Issue } from "../../types/tracker";
import { Icon } from "../Icon";

export interface CardMetaProps {
  issue: Issue;
  webUrl: string;
  onOpenNotes?: (() => void) | undefined;
}

// Compact, mono-friendly due rendering: "2d" within a week, "May 30" otherwise.
function formatDue(iso: string): string {
  const due = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(due.getTime())) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days > 0 && days <= 7) return `${days}d`;
  if (days < 0 && days >= -7) return `${-days}d ago`;
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CardMeta({ issue, webUrl, onOpenNotes }: CardMetaProps) {
  const overdue = issue.dueDate ? Date.parse(issue.dueDate) < Date.now() && issue.state !== "done" : false;
  return (
    <div className="tracker-card__meta">
      <a
        className="tracker-card__source"
        href={webUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open issue in GitLab"
        onClick={(e) => e.stopPropagation()}
      >
        <Icon name="link-external" size={13} />
      </a>
      {issue.dueDate ? (
        <>
          <span className="tracker-card__sep" aria-hidden>·</span>
          <span
            className={`tracker-card__meta-item tracker-card__due${overdue ? " is-overdue" : ""}`}
            title={issue.dueDate}
          >
            <Icon name="clock" size={13} />
            {formatDue(issue.dueDate)}
          </span>
        </>
      ) : null}
      {issue.weight !== null ? (
        <>
          <span className="tracker-card__sep" aria-hidden>·</span>
          <span className="tracker-card__meta-item tracker-card__weight">
            <Icon name="gauge" size={13} />
            w{issue.weight}
          </span>
        </>
      ) : null}
      <span className="tracker-card__spacer" />
      {issue.divergence ? (
        <span
          className="tracker-card__divergence"
          title={issue.divergence === "source-open" ? "Source still open upstream" : "Source closed/unassigned upstream"}
        >
          {issue.divergence === "source-open" ? "↑open" : "↓closed"}
        </span>
      ) : null}
      <button
        type="button"
        className={`tracker-card__notes${issue.noteCount > 0 ? " has-notes" : ""}`}
        onClick={(e) => { e.stopPropagation(); onOpenNotes?.(); }}
        aria-label={issue.noteCount > 0 ? `View ${issue.noteCount} notes` : "Add a note"}
      >
        <Icon name="note" size={13} />
        <span>{issue.noteCount > 0 ? issue.noteCount : "+ note"}</span>
      </button>
    </div>
  );
}
