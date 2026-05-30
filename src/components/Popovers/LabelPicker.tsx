import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { hueFromName, classifyLabel } from "../../data/labels";
import { Icon } from "../Icon";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import type { GitLabLabel } from "../../types/gitlab";

export interface LabelPickerProps {
  allLabels: GitLabLabel[];
  current: Set<string>;
  anchorRect: DOMRect | null;
  onToggle: (name: string) => void;
  onCreate: (name: string) => Promise<void>;
  onClose: () => void;
}

export function LabelPicker({ allLabels, current, anchorRect, onToggle, onCreate, onClose }: LabelPickerProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const userLabels = allLabels.filter((l) => classifyLabel(l.name).kind === "user");
  const filtered = query
    ? userLabels.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
    : userLabels;
  const exactExists = userLabels.some((l) => l.name === query);
  const showCreate = !!query && !exactExists;
  // Navigable rows: every filtered label, plus the trailing "create" row when shown.
  const rowCount = filtered.length + (showCreate ? 1 : 0);

  // Clamp the active index whenever the result set changes.
  useEffect(() => {
    setActive((i) => (rowCount === 0 ? 0 : Math.min(i, rowCount - 1)));
  }, [rowCount]);

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const commit = (index: number) => {
    if (showCreate && index === filtered.length) {
      void onCreate(query);
      return;
    }
    const label = filtered[index];
    if (label) onToggle(label.name);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowCount) setActive((i) => (i + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowCount) setActive((i) => (i - 1 + rowCount) % rowCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rowCount) commit(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const positionStyle: CSSProperties | undefined = anchorRect
    ? ({ "--tracker-popover-x": `${anchorRect.left}px`, "--tracker-popover-y": `${anchorRect.bottom + 8}px` } as CSSProperties)
    : undefined;

  return (
    <div ref={ref} className="tracker-popover tracker-popover--labelpicker" style={positionStyle} role="dialog" aria-label="Labels">
      <div className="tracker-popover__search">
        <Icon name="search" size={14} className="tracker-popover__search-icon" />
        <input
          autoFocus
          placeholder="Search or create…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          aria-label="Search or create label"
        />
      </div>
      <div ref={listRef} className="tracker-popover__rows" role="listbox" aria-label="Labels">
        {filtered.map((l, i) => {
          const selected = current.has(l.name);
          return (
            <button
              type="button"
              key={l.name}
              data-row={i}
              role="option"
              aria-selected={selected}
              className={`tracker-popover__row${selected ? " is-selected" : ""}${i === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => onToggle(l.name)}
            >
              <span className="tracker-popover__row-dot" data-hue={hueFromName(l.name)} aria-hidden />
              <span className="tracker-popover__row-name">{l.name}</span>
              <span className="tracker-popover__check" aria-hidden>
                {selected ? <Icon name="check" size={14} /> : null}
              </span>
            </button>
          );
        })}
        {showCreate ? (
          <button
            type="button"
            data-row={filtered.length}
            className={`tracker-popover__row tracker-popover__row--create${active === filtered.length ? " is-active" : ""}`}
            onMouseEnter={() => setActive(filtered.length)}
            onClick={() => { void onCreate(query); }}
          >
            <span className="tracker-popover__check" aria-hidden>
              <Icon name="plus" size={14} />
            </span>
            <span className="tracker-popover__row-name">
              Create label <code>{query}</code>
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
