import { useEffect, useRef, useState } from "react";
import type { GitLabLabel } from "../../types/gitlab";
import { Chip, AddChip } from "../Chip";
import { hueFromName, classifyLabel } from "../../data/labels";

export interface FilterRailProps {
  allLabels: GitLabLabel[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function FilterRail({ allLabels, selected, onToggle, onClear, onCreate }: FilterRailProps) {
  const userLabels = allLabels.filter((l) => classifyLabel(l.name).kind === "user");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const reset = () => {
    setDraft("");
    setCreating(false);
  };

  const submit = async () => {
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true);
    try { await onCreate(name); }
    finally { setBusy(false); reset(); }
  };

  return (
    <div className="tracker-filterbar">
      <span className="tracker-filterbar__strip">
        <span className="tracker-filterbar__prefix">Labels</span>
        {userLabels.map((l) => (
          <Chip
            key={l.name}
            name={l.name}
            hue={hueFromName(l.name)}
            selected={selected.has(l.name)}
            onClick={() => onToggle(l.name)}
          />
        ))}
        {creating ? (
          <span className="tracker-filterbar__create">
            <input
              ref={inputRef}
              type="text"
              className="tracker-filterbar__create-input"
              placeholder="Label name"
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); void submit(); }
                else if (e.key === "Escape") { e.preventDefault(); reset(); }
              }}
              onBlur={() => { if (!draft.trim()) reset(); }}
            />
          </span>
        ) : (
          <AddChip label="+ New label" onClick={() => setCreating(true)} />
        )}
      </span>
      <span className="tracker-filterbar__grow" />
      {selected.size > 0 ? (
        <button type="button" className="tracker-btn tracker-btn--ghost tracker-btn--small" onClick={onClear}>Clear filter</button>
      ) : null}
    </div>
  );
}
