import type { Flag } from "../../types/tracker";

export interface FlagHeaderProps {
  flag: Flag;
  reason?: string | undefined;
  onClear?: (() => void) | undefined;
}

export function FlagHeader({ flag, reason, onClear }: FlagHeaderProps) {
  const label = flag === "blocked" ? "Blocked" : "Reviewing";
  return (
    <span className={`tracker-card__flag-line tracker-card__flag-line--${flag}`}>
      <span className="tracker-card__flag-dot" />
      {label}
      {reason ? <span className="tracker-card__flag-ctx">· {reason}</span> : null}
      {onClear ? (
        <button
          type="button"
          className="tracker-card__flag-clear"
          aria-label={`Clear ${label}`}
          onClick={(e) => { e.stopPropagation(); onClear(); }}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
