import { forwardRef } from "react";
import type { Hue } from "../types/tracker";

export interface ChipProps {
  name: string;
  hue: Hue;
  selected?: boolean;
  onClick?: () => void;
}

export function Chip({ name, hue, selected, onClick }: ChipProps) {
  const idx = name.lastIndexOf("::");
  const isScoped = idx > 0;
  const className = [
    "tracker-chip",
    isScoped ? "is-scoped" : "",
    selected ? "is-selected" : "",
  ].filter(Boolean).join(" ");

  if (!isScoped) {
    return (
      <span className={className} data-hue={hue} onClick={onClick} role={onClick ? "button" : undefined}>
        {name}
      </span>
    );
  }
  const scope = name.slice(0, idx);
  const value = name.slice(idx + 2);
  return (
    <span className={className} data-hue={hue} onClick={onClick} role={onClick ? "button" : undefined}>
      <span className="tracker-chip__scope">{scope}</span>
      <span className="tracker-chip__value">{value}</span>
    </span>
  );
}

export const AddChip = forwardRef<HTMLButtonElement, { label: string; onClick?: () => void }>(
  function AddChip({ label, onClick }, ref) {
    return (
      <button ref={ref} type="button" className="tracker-chip is-add" onClick={onClick}>
        {label}
      </button>
    );
  },
);
