import {
  DndContext, DragOverlay, useSensors, useSensor, PointerSensor, KeyboardSensor,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";

export { DndContext, DragOverlay };
export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // Space-only activation so Enter stays free for "open focused card".
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );
}
export type { DragStartEvent, DragEndEvent };
