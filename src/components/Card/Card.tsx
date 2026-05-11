import { useDraggable } from "@dnd-kit/core";
import type { Issue } from "../../types/tracker";
import { CardLabels } from "./CardLabels";
import { CardMeta } from "./CardMeta";
import { FlagHeader } from "./FlagHeader";

export interface CardProps {
  issue: Issue;
  webUrl: string;
  onSelect?: (() => void) | undefined;
  onClearFlag?: ((flag: "blocked" | "reviewing") => void) | undefined;
  onOpenNotes?: (() => void) | undefined;
  isActive?: boolean | undefined;
}

export function Card({ issue, webUrl, onSelect, onClearFlag, onOpenNotes, isActive }: CardProps) {
  const blocked = issue.flags.has("blocked");
  const reviewing = issue.flags.has("reviewing");
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `issue:${issue.iid}`,
    data: { iid: issue.iid, kind: "issue" },
  });
  return (
    <article
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`tracker-card${isActive ? " is-active" : ""}${isDragging ? " is-dragging" : ""}`}
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
      <CardMeta issue={issue} webUrl={webUrl} onOpenNotes={onOpenNotes} />
    </article>
  );
}
