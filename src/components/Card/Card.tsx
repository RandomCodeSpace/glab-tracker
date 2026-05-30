import { useCallback, useEffect, useRef } from "react";
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
  isFocused?: boolean | undefined;
}

export function Card({ issue, webUrl, onSelect, onClearFlag, onOpenNotes, isActive, isFocused }: CardProps) {
  const blocked = issue.flags.has("blocked");
  const reviewing = issue.flags.has("reviewing");
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `issue:${issue.iid}`,
    data: { iid: issue.iid, kind: "issue" },
  });
  const cardRef = useRef<HTMLElement | null>(null);
  const setRefs = useCallback(
    (el: HTMLElement | null) => {
      cardRef.current = el;
      setNodeRef(el);
    },
    [setNodeRef],
  );
  // Roving keyboard focus: when this card becomes the focused one, take DOM
  // focus and scroll it just into view (visible ring + screen-reader follow).
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.focus({ preventScroll: true });
      cardRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);
  return (
    <article
      ref={setRefs}
      {...listeners}
      {...attributes}
      className={`tracker-card${isActive ? " is-active" : ""}${isDragging ? " is-dragging" : ""}`}
      data-iid={issue.iid}
      data-focused={isFocused || undefined}
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
      <div className="tracker-card__head">
        <h3 className="tracker-card__title">{issue.title}</h3>
        <a
          className="tracker-card__iid"
          href={webUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Issue #${issue.iid} in GitLab`}
          onClick={(e) => e.stopPropagation()}
        >
          #{issue.iid}
        </a>
      </div>
      {issue.description ? (
        <p className="tracker-card__preview">{issue.description}</p>
      ) : null}
      <CardLabels labels={issue.userLabels} />
      <CardMeta issue={issue} webUrl={webUrl} onOpenNotes={onOpenNotes} />
    </article>
  );
}
