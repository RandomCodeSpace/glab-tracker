import type { Flag } from "../../types/tracker";

export interface CountersProps {
  blocked: number;
  reviewing: number;
  cancelled: number;
  active: Flag | "cancelled" | null;
  onToggle: (which: Flag | "cancelled") => void;
}

export function StatusCounters({ blocked, reviewing, cancelled, active, onToggle }: CountersProps) {
  const Btn = ({ id, count, label }: { id: Flag | "cancelled"; count: number; label: string }) => (
    <button
      className={`tracker-counter${active === id ? " is-active" : ""}`}
      data-flag={id}
      onClick={() => onToggle(id)}
      type="button"
    >
      <span className="tracker-counter__dot" />
      <span className="tracker-counter__num">{count}</span>
      <span>{label}</span>
    </button>
  );
  return (
    <div className="tracker-counters">
      <Btn id="blocked" count={blocked} label="blocked" />
      <Btn id="reviewing" count={reviewing} label="reviewing" />
      <Btn id="cancelled" count={cancelled} label="cancelled" />
    </div>
  );
}
