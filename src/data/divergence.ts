import type { ColumnState, SourceIdentity } from "../types/tracker";

export type Divergence = "source-open" | "source-closed" | null;

export function computeDivergence(
  local: ColumnState,
  source: SourceIdentity | null,
  openAssignedSet: Set<string>,
): Divergence {
  if (!source || local === "cancelled") return null;
  const key = `${source.projectId}-${source.issueIid}`;
  const sourceIsOpen = openAssignedSet.has(key);
  if (local === "done" && sourceIsOpen) return "source-open";
  if (local !== "done" && !sourceIsOpen) return "source-closed";
  return null;
}

export function makeOpenAssignedKey(projectId: number, issueIid: number): string {
  return `${projectId}-${issueIid}`;
}
