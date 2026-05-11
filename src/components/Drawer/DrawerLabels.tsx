import { useRef } from "react";
import type { UserLabel } from "../../types/tracker";
import { Chip, AddChip } from "../Chip";

export interface DrawerLabelsProps {
  labels: UserLabel[];
  onAdd: (anchor: DOMRect) => void;
}

export function DrawerLabels({ labels, onAdd }: DrawerLabelsProps) {
  const addRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="tracker-drawer__labels">
      {labels.map((l) => (
        <Chip key={l.name} name={l.name} hue={l.hue} />
      ))}
      <AddChip
        ref={addRef}
        label="+ Add label"
        onClick={() => {
          const rect = addRef.current?.getBoundingClientRect();
          if (rect) onAdd(rect);
        }}
      />
    </div>
  );
}
