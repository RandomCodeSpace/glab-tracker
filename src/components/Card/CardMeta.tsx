import type { Issue } from "../../types/tracker";
import { Icon } from "../Icon";

export interface CardMetaProps {
  issue: Issue;
  webUrl: string;
  onOpenNotes?: (() => void) | undefined;
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
        <Icon name="external" size={13} />
      </a>
      {issue.dueDate ? (
        <span className={`tracker-card__due${overdue ? " is-overdue" : ""}`}>
          {issue.dueDate}
        </span>
      ) : null}
      {issue.weight !== null ? (
        <>
          {issue.dueDate ? <span className="tracker-card__sep">·</span> : null}
          <span className="tracker-card__weight">w{issue.weight}</span>
        </>
      ) : null}
      <span className="tracker-card__spacer" />
      <button
        type="button"
        className={`tracker-card__notes${issue.noteCount > 0 ? " has-notes" : ""}`}
        onClick={(e) => { e.stopPropagation(); onOpenNotes?.(); }}
        aria-label={issue.noteCount > 0 ? `View ${issue.noteCount} notes` : "Add a note"}
      >
        <Icon name="message" size={13} />
        <span>{issue.noteCount > 0 ? issue.noteCount : "+ note"}</span>
      </button>
      {issue.divergence ? (
        <span
          className={`tracker-card__divergence is-${issue.divergence === "source-open" ? "warn" : "info"}`}
          title={issue.divergence === "source-open" ? "Source still open upstream" : "Source closed/unassigned upstream"}
        />
      ) : null}
    </div>
  );
}
