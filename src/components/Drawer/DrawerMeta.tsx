import type { Issue, ColumnState, Flag } from "../../types/tracker";

const COL_NAMES: Record<ColumnState, string> = { todo: "To do", doing: "Doing", done: "Done", cancelled: "Cancelled" };

export interface DrawerMetaProps {
  issue: Issue;
  onChangeState: (state: ColumnState) => void;
  onToggleFlag: (flag: Flag, on: boolean) => void;
}

export function DrawerMeta({ issue, onChangeState, onToggleFlag }: DrawerMetaProps) {
  return (
    <div className="tracker-drawer__meta">
      <select
        className="tracker-drawer__state"
        value={issue.state}
        onChange={(e) => onChangeState(e.target.value as ColumnState)}
        aria-label="Column state"
      >
        {(["todo", "doing", "done", "cancelled"] as ColumnState[]).map((s) => (
          <option key={s} value={s}>{COL_NAMES[s]}</option>
        ))}
      </select>
      {issue.dueDate ? (
        <span className="tracker-drawer__pair">Due <span className="tracker-drawer__value">{issue.dueDate}</span></span>
      ) : null}
      {issue.weight !== null ? (
        <span className="tracker-drawer__pair">Weight <span className="tracker-drawer__value">{issue.weight}</span></span>
      ) : null}
      {issue.divergence ? (
        <span className="tracker-drawer__pair">Source <span className="tracker-drawer__value">
          {issue.divergence === "source-open" ? "still open upstream" : "closed upstream"}
        </span></span>
      ) : null}
      <span className="tracker-drawer__grow" />
      <span className="tracker-drawer__flags">
        <FlagToggle
          flag="reviewing"
          on={issue.flags.has("reviewing")}
          onToggle={(on) => onToggleFlag("reviewing", on)}
        />
        <FlagToggle
          flag="blocked"
          on={issue.flags.has("blocked")}
          onToggle={(on) => onToggleFlag("blocked", on)}
        />
      </span>
    </div>
  );
}

function FlagToggle({ flag, on, onToggle }: { flag: Flag; on: boolean; onToggle: (on: boolean) => void }) {
  return (
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
  );
}
