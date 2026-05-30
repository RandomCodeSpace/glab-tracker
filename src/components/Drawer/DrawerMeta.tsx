import type { Issue, ColumnState, Flag } from "../../types/tracker";

const STATE_ORDER: ColumnState[] = ["todo", "doing", "done", "cancelled"];
const COL_NAMES: Record<ColumnState, string> = {
  todo: "To do",
  doing: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
};

export interface DrawerMetaProps {
  issue: Issue;
  onChangeState: (state: ColumnState) => void;
  onToggleFlag: (flag: Flag, on: boolean) => void;
}

export function DrawerMeta({ issue, onChangeState, onToggleFlag }: DrawerMetaProps) {
  return (
    <dl className="tracker-drawer__meta">
      <div className="tracker-drawer__row">
        <dt className="tracker-drawer__key">State</dt>
        <dd className="tracker-drawer__val">
          <div className="tracker-drawer__segmented" role="radiogroup" aria-label="Column state">
            {STATE_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={issue.state === s}
                className="tracker-drawer__seg"
                data-state={s}
                data-active={issue.state === s}
                onClick={() => onChangeState(s)}
              >
                {COL_NAMES[s]}
              </button>
            ))}
          </div>
        </dd>
      </div>

      <div className="tracker-drawer__row">
        <dt className="tracker-drawer__key">Flags</dt>
        <dd className="tracker-drawer__val">
          <div className="tracker-drawer__flags">
            <FlagToggle
              flag="blocked"
              on={issue.flags.has("blocked")}
              reason={issue.flagReasons.blocked}
              onToggle={(on) => onToggleFlag("blocked", on)}
            />
            <FlagToggle
              flag="reviewing"
              on={issue.flags.has("reviewing")}
              reason={issue.flagReasons.reviewing}
              onToggle={(on) => onToggleFlag("reviewing", on)}
            />
          </div>
        </dd>
      </div>

      {issue.dueDate !== null ? (
        <div className="tracker-drawer__row">
          <dt className="tracker-drawer__key">Due</dt>
          <dd className="tracker-drawer__val">
            <input
              type="date"
              className="tracker-drawer__date"
              value={issue.dueDate}
              readOnly
              aria-label="Due date"
            />
          </dd>
        </div>
      ) : null}

      {issue.weight !== null ? (
        <div className="tracker-drawer__row">
          <dt className="tracker-drawer__key">Weight</dt>
          <dd className="tracker-drawer__val">
            <span className="tracker-drawer__weight">w{issue.weight}</span>
          </dd>
        </div>
      ) : null}

      {issue.divergence ? (
        <div className="tracker-drawer__row">
          <dt className="tracker-drawer__key">Source</dt>
          <dd className="tracker-drawer__val">
            <span className="tracker-drawer__tag is-warn">
              {issue.divergence === "source-open" ? "still open upstream" : "closed upstream"}
            </span>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function FlagToggle({
  flag,
  on,
  reason,
  onToggle,
}: {
  flag: Flag;
  on: boolean;
  reason?: string | undefined;
  onToggle: (on: boolean) => void;
}) {
  return (
    <div className="tracker-drawer__flag">
      <button
        type="button"
        className={`tracker-flag-toggle${on ? " is-on" : ""}`}
        data-flag={flag}
        onClick={() => onToggle(!on)}
        aria-pressed={on}
      >
        <span className="tracker-flag-toggle__dot" />
        {flag === "blocked" ? "Blocked" : "Reviewing"}
      </button>
      {on && reason ? (
        <span className="tracker-flag-toggle__reason" title={reason}>{reason}</span>
      ) : null}
    </div>
  );
}
