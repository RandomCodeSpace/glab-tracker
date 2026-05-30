import { useEffect, useRef, type KeyboardEvent, type CSSProperties } from "react";
import { Icon } from "../Icon";
import { Kbd } from "../common/Kbd";
import type { StreamNote } from "../Drawer/Stream";

export interface QuickNotesPopoverProps {
  notes: StreamNote[];
  onSubmit: (body: string) => void;
  onViewAll: () => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

export function QuickNotesPopover({ notes, onSubmit, onViewAll, onClose, anchorRect }: QuickNotesPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const v = e.currentTarget.value.trim();
      if (v) { onSubmit(v); e.currentTarget.value = ""; }
    }
    if (e.key === "Escape") onClose();
  };

  const positionStyle: CSSProperties | undefined = anchorRect
    ? ({ "--tracker-popover-x": `${anchorRect.left}px`, "--tracker-popover-y": `${anchorRect.bottom + 8}px` } as CSSProperties)
    : undefined;

  const recent = notes.slice(-3).reverse();

  return (
    <div ref={ref} className="tracker-popover" style={positionStyle} role="dialog" aria-label="Quick notes">
      <div className="tracker-popover__head">
        <span className="tracker-popover__title">Notes</span>
        <span className="tracker-popover__count">{notes.length}</span>
      </div>
      <div className="tracker-popover__list">
        {recent.length === 0 ? (
          <div className="tracker-popover__empty">No notes yet</div>
        ) : (
          recent.map((n, i) => (
            <div key={i} className="tracker-popover__entry">
              <div className="tracker-popover__entry-meta">
                <span className="tracker-popover__entry-who">{n.author}</span>
                <span className="tracker-popover__entry-when">{n.createdAt}</span>
              </div>
              <div className="tracker-popover__entry-body">{n.body}</div>
            </div>
          ))
        )}
      </div>
      <div className="tracker-popover__compose">
        <input autoFocus placeholder="Add a quick note…" onKeyDown={onKey} aria-label="Add a quick note" />
        <Kbd keys="mod+enter" className="tracker-popover__hint" />
      </div>
      <div className="tracker-popover__foot">
        <button type="button" className="tracker-popover__all" onClick={onViewAll}>
          View all in drawer
          <Icon name="arrow-right" size={13} />
        </button>
      </div>
    </div>
  );
}
