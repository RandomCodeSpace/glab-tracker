import type { GitLabLabel } from "../../types/gitlab";
import { Chip, AddChip } from "../Chip";
import { hueFromName, classifyLabel } from "../../data/labels";

export interface FilterRailProps {
  allLabels: GitLabLabel[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
  onCreate: () => void;
}

export function FilterRail({ allLabels, selected, onToggle, onClear, onCreate }: FilterRailProps) {
  const userLabels = allLabels.filter((l) => classifyLabel(l.name).kind === "user");
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
        <AddChip label="+ New label" onClick={onCreate} />
      </span>
      <span className="tracker-filterbar__grow" />
      {selected.size > 0 ? (
        <button type="button" className="tracker-filterbar__clear" onClick={onClear}>Clear filter</button>
      ) : null}
    </div>
  );
}
