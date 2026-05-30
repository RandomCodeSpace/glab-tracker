import { Kbd } from "../common/Kbd";

export function DragHint() {
  return (
    <div className="tracker-drag-hint">
      <span className="tracker-drag-hint__pill">
        <strong>Drop on a column</strong> to change state
      </span>
      <span className="tracker-drag-hint__pill">
        Move with <Kbd keys="[" /> <Kbd keys="]" />
      </span>
    </div>
  );
}
