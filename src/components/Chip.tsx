import { forwardRef, type KeyboardEvent } from "react";
import type { Hue } from "../types/tracker";
import { Icon } from "./Icon";

export interface ChipProps {
  name: string;
  hue: Hue;
  selected?: boolean;
  onClick?: () => void;
  /** Render a leading check slot; shows the check when `selected`. */
  selectable?: boolean;
  /** Render a trailing × affordance that calls `onRemove`. */
  removable?: boolean;
  onRemove?: () => void;
}

export function Chip({ name, hue, selected, onClick, selectable, removable, onRemove }: ChipProps) {
  const idx = name.lastIndexOf("::");
  const isScoped = idx > 0;
  const interactive = !!onClick;
  const className = [
    "tracker-chip",
    isScoped ? "is-scoped" : "",
    selected ? "is-selected" : "",
    selectable ? "is-selectable" : "",
    removable ? "is-removable" : "",
  ].filter(Boolean).join(" ");

  const onKeyDown = interactive
    ? (e: KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  const check = selectable ? (
    <span className="tracker-chip__check" aria-hidden>
      <Icon name="check" size={12} />
    </span>
  ) : null;

  const remove = removable ? (
    <button
      type="button"
      className="tracker-chip__remove focus-ring"
      aria-label={`Remove ${name}`}
      onClick={(e) => {
        e.stopPropagation();
        onRemove?.();
      }}
    >
      <Icon name="close" size={11} />
    </button>
  ) : null;

  const scope = isScoped ? name.slice(0, idx) : "";
  const value = isScoped ? name.slice(idx + 2) : "";

  return (
    <span
      className={className}
      data-hue={hue}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive && selectable ? !!selected : undefined}
    >
      {check}
      {isScoped ? (
        <span className="tracker-chip__pill">
          <span className="tracker-chip__scope">{scope}</span>
          <span className="tracker-chip__value">{value}</span>
        </span>
      ) : (
        name
      )}
      {remove}
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

export interface CountChipProps {
  count: number;
  onClick?: () => void;
}

/** Overflow / count chip — mono `+N`. */
export const CountChip = forwardRef<HTMLButtonElement, CountChipProps>(
  function CountChip({ count, onClick }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className="tracker-chip is-count focus-ring"
        onClick={onClick}
        disabled={!onClick}
      >
        +{count}
      </button>
    );
  },
);
