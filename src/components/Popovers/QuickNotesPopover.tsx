import { useEffect, useRef, type KeyboardEvent, type CSSProperties } from "react";
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

  return (
    <div ref={ref} className="tracker-popover" style={positionStyle}>
      <div className="tracker-popover__head">
        <span className="tracker-popover__title">Notes</span>
        <span className="tracker-popover__count">{notes.length}</span>
      </div>
      <div className="tracker-popover__list">
        {notes.slice(-3).reverse().map((n, i) => (
          <div key={i} className="tracker-popover__entry">
            <div className="tracker-popover__entry-meta">
              <span className="tracker-popover__entry-who">{n.author}</span>
              <span>{n.createdAt}</span>
            </div>
            <div className="tracker-popover__entry-body">{n.body}</div>
          </div>
        ))}
      </div>
      <div className="tracker-popover__compose">
        <input autoFocus placeholder="Add a quick note…" onKeyDown={onKey} />
        <span className="tracker-popover__hint">⏎</span>
      </div>
      <div className="tracker-popover__foot">
        <button type="button" className="tracker-popover__all" onClick={onViewAll}>View all in drawer →</button>
      </div>
    </div>
  );
}
