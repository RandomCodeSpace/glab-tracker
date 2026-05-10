import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Chip } from "../Chip";
import { hueFromName, classifyLabel } from "../../data/labels";
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
  const ref = useRef<HTMLDivElement>(null);
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

  const positionStyle: CSSProperties | undefined = anchorRect
    ? ({ "--tracker-popover-x": `${anchorRect.left}px`, "--tracker-popover-y": `${anchorRect.bottom + 8}px` } as CSSProperties)
    : undefined;

  return (
    <div ref={ref} className="tracker-popover tracker-popover--labelpicker" style={positionStyle}>
      <div className="tracker-popover__search">
        <input
          autoFocus
          placeholder="Search or create…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.map((l) => (
        <button
          type="button"
          key={l.name}
          className="tracker-popover__row"
          onClick={() => onToggle(l.name)}
        >
          <span className="tracker-popover__check">{current.has(l.name) ? "✓" : ""}</span>
          <Chip name={l.name} hue={hueFromName(l.name)} />
        </button>
      ))}
      {query && !exactExists ? (
        <>
          <div className="tracker-popover__sep" />
          <button
            type="button"
            className="tracker-popover__row tracker-popover__row--create"
            onClick={() => { void onCreate(query); }}
          >
            <span className="tracker-popover__check">+</span>
            Create "{query}"
          </button>
        </>
      ) : null}
    </div>
  );
}
