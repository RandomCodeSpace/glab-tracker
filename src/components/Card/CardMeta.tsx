import type { Issue } from "../../types/tracker";

export interface CardMetaProps {
  issue: Issue;
  sourceUrl: string | null;
  onOpenNotes?: (() => void) | undefined;
}

export function CardMeta({ issue, sourceUrl, onOpenNotes }: CardMetaProps) {
  const overdue = issue.dueDate ? Date.parse(issue.dueDate) < Date.now() && issue.state !== "done" : false;
  return (
    <div className="tracker-card__meta">
      {sourceUrl ? (
        <a
          className="tracker-card__source"
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open source issue in GitLab"
          onClick={(e) => e.stopPropagation()}
        >
          ↗
        </a>
      ) : null}
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
        💬 {issue.noteCount > 0 ? issue.noteCount : "+ note"}
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
