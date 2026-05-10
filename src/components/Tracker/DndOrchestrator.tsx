import { type ReactNode, useState } from "react";
import { DndContext, DragOverlay, useDndSensors, type DragStartEvent, type DragEndEvent } from "../../hooks/useDnd";
import type { ColumnState, Flag } from "../../types/tracker";
import { useTracker } from "../../store/store";

export interface DndCallbacks {
  onColumnDrop: (iid: number, to: ColumnState) => void;
  onCounterDrop: (iid: number, target: Flag | "cancelled") => void;
}

export function DndOrchestrator({ children, callbacks }: { children: ReactNode; callbacks: DndCallbacks }) {
  const sensors = useDndSensors();
  const setDragging = useTracker((s) => s.setDragging);
  const issues = useTracker((s) => s.issues);
  const [draggedIid, setDraggedIid] = useState<number | null>(null);

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as { iid?: number } | undefined;
    if (data?.iid !== undefined) {
      setDraggedIid(data.iid);
      setDragging(true);
    }
  };
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(false);
    const dragged = draggedIid;
    setDraggedIid(null);
    if (!dragged || !e.over) return;
    const target = e.over.data.current as { kind?: string; state?: ColumnState; flag?: Flag | "cancelled" } | undefined;
    if (target?.kind === "column" && target.state) callbacks.onColumnDrop(dragged, target.state);
    if (target?.kind === "counter" && target.flag) callbacks.onCounterDrop(dragged, target.flag);
  };
  const dragged = draggedIid !== null ? issues.get(draggedIid) : null;
  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(false)}>
      {children}
      <DragOverlay>
        {dragged ? (
          <div className="tracker-card tracker-card--drag-overlay">
            <h3 className="tracker-card__title">{dragged.title}</h3>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
