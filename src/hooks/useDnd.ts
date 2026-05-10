import {
  DndContext, DragOverlay, useSensors, useSensor, PointerSensor, KeyboardSensor,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";

export { DndContext, DragOverlay };
export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );
}
export type { DragStartEvent, DragEndEvent };
