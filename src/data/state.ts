import type { ColumnState, Flag } from "../types/tracker";

export interface IssuePatch {
  add_labels?: string[];
  remove_labels?: string[];
  state_event?: "close" | "reopen";
}

const CLOSED: ColumnState[] = ["done", "cancelled"];

export function planTransition(from: ColumnState, to: ColumnState): IssuePatch | null {
  if (from === to) return null;
  const fromClosed = CLOSED.includes(from);
  const toClosed = CLOSED.includes(to);
  const remove = [`state::${from}`];
  if (toClosed) remove.push("flag::blocked", "flag::reviewing");
  const patch: IssuePatch = {
    add_labels: [`state::${to}`],
    remove_labels: remove,
  };
  if (toClosed && !fromClosed) patch.state_event = "close";
  if (!toClosed && fromClosed) patch.state_event = "reopen";
  return patch;
}

export function planFlagToggle(flag: Flag, on: boolean): IssuePatch {
  const label = `flag::${flag}`;
  return on ? { add_labels: [label] } : { remove_labels: [label] };
}
