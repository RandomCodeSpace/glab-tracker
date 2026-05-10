export function DragHint() {
  return (
    <div className="tracker-drag-hint">
      <span><strong>Drop on a column</strong> → change state</span>
      <span><strong>Drop on blocked / reviewing</strong> → set flag</span>
      <span><strong>Drop on cancelled</strong> → cancel</span>
    </div>
  );
}
