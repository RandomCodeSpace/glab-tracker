import type { Issue } from "../../types/tracker";
import { CardLabels } from "./CardLabels";
import { CardMeta } from "./CardMeta";
import { FlagHeader } from "./FlagHeader";

export interface CardProps {
  issue: Issue;
  sourceUrl: string | null;
  onSelect?: () => void;
  onClearFlag?: (flag: "blocked" | "reviewing") => void;
  onOpenNotes?: () => void;
  isActive?: boolean;
}

export function Card({ issue, sourceUrl, onSelect, onClearFlag, onOpenNotes, isActive }: CardProps) {
  const blocked = issue.flags.has("blocked");
  const reviewing = issue.flags.has("reviewing");
  return (
    <article
      className={`tracker-card${isActive ? " is-active" : ""}`}
      data-blocked={blocked || undefined}
      data-reviewing={reviewing || undefined}
      onClick={onSelect}
    >
      {(blocked || reviewing) && (
        <div className="tracker-card__flag-stack">
          {blocked && (
            <FlagHeader
              flag="blocked"
              reason={issue.flagReasons.blocked}
              onClear={onClearFlag ? () => onClearFlag("blocked") : undefined}
            />
          )}
          {reviewing && (
            <FlagHeader
              flag="reviewing"
              reason={issue.flagReasons.reviewing}
              onClear={onClearFlag ? () => onClearFlag("reviewing") : undefined}
            />
          )}
        </div>
      )}
      <h3 className="tracker-card__title">{issue.title}</h3>
      {issue.description ? (
        <p className="tracker-card__preview">{issue.description}</p>
      ) : null}
      <CardLabels labels={issue.userLabels} />
      <CardMeta issue={issue} sourceUrl={sourceUrl} onOpenNotes={onOpenNotes} />
    </article>
  );
}
