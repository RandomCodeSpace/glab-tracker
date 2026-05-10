import { useDroppable } from "@dnd-kit/core";
import type { Flag } from "../../types/tracker";

export interface CountersProps {
  blocked: number;
  reviewing: number;
  cancelled: number;
  active: Flag | "cancelled" | null;
  onToggle: (which: Flag | "cancelled") => void;
}

function CounterBtn({ id, count, label, active, onClick }: {
  id: Flag | "cancelled"; count: number; label: string; active: boolean; onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `counter:${id}`,
    data: { kind: "counter", flag: id },
  });
  return (
    <button
      ref={setNodeRef}
      className={`tracker-counter${active ? " is-active" : ""}${isOver ? " is-hover" : ""}`}
      data-flag={id}
      onClick={onClick}
      type="button"
    >
      <span className="tracker-counter__dot" />
      <span className="tracker-counter__num">{count}</span>
      <span>{label}</span>
    </button>
  );
}

export function StatusCounters({ blocked, reviewing, cancelled, active, onToggle }: CountersProps) {
  return (
    <div className="tracker-counters">
      <CounterBtn id="blocked" count={blocked} label="blocked" active={active === "blocked"} onClick={() => onToggle("blocked")} />
      <CounterBtn id="reviewing" count={reviewing} label="reviewing" active={active === "reviewing"} onClick={() => onToggle("reviewing")} />
      <CounterBtn id="cancelled" count={cancelled} label="cancelled" active={active === "cancelled"} onClick={() => onToggle("cancelled")} />
    </div>
  );
}
