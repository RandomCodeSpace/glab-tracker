import type { UserLabel } from "../../types/tracker";
import { Chip, AddChip } from "../Chip";

export interface DrawerLabelsProps {
  labels: UserLabel[];
  onAdd: () => void;
  onRemove: (name: string) => void;
}

export function DrawerLabels({ labels, onAdd, onRemove }: DrawerLabelsProps) {
  return (
    <div className="tracker-drawer__labels">
      {labels.map((l) => (
        <span key={l.name} className="tracker-drawer__label-wrap">
          <Chip name={l.name} hue={l.hue} />
          <button
            type="button"
            className="tracker-drawer__label-remove"
            aria-label={`Remove ${l.name}`}
            onClick={() => onRemove(l.name)}
          >×</button>
        </span>
      ))}
      <AddChip label="+ Add label" onClick={onAdd} />
    </div>
  );
}
