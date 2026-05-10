import type { ColumnState, Flag, Hue, Origin, UserLabel, SourceIdentity } from "../types/tracker";

export const HUES: Hue[] = ["blue", "violet", "pink", "amber", "green", "teal", "slate"];

export type LabelClass =
  | { kind: "state"; value: ColumnState }
  | { kind: "flag"; value: Flag }
  | { kind: "origin"; value: Origin }
  | { kind: "source-id"; projectId: number; issueIid: number }
  | { kind: "user" };

const STATE_RE = /^state::(todo|doing|done|cancelled)$/;
const FLAG_RE = /^flag::(blocked|reviewing)$/;
const ORIGIN_RE = /^src::(bau|side)$/;
const SRC_ID_RE = /^src::bau::(\d+)-(\d+)$/;

export function classifyLabel(name: string): LabelClass {
  let m: RegExpMatchArray | null;
  if ((m = name.match(STATE_RE))) return { kind: "state", value: m[1] as ColumnState };
  if ((m = name.match(FLAG_RE))) return { kind: "flag", value: m[1] as Flag };
  if ((m = name.match(SRC_ID_RE)))
    return { kind: "source-id", projectId: Number(m[1]), issueIid: Number(m[2]) };
  if ((m = name.match(ORIGIN_RE))) return { kind: "origin", value: m[1] as Origin };
  return { kind: "user" };
}

export function parseUserLabel(name: string): UserLabel {
  const idx = name.lastIndexOf("::");
  const isScoped = idx > 0;
  const scope = isScoped ? name.slice(0, idx) : null;
  const value = isScoped ? name.slice(idx + 2) : name;
  return { name, scope, value, isScoped, hue: hueFromName(name) };
}

export function hueFromName(name: string): Hue {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) | 0;
  return HUES[Math.abs(h) % HUES.length]!;
}

export function pickColumnLabel(labels: string[]): ColumnState {
  for (const n of labels) {
    const c = classifyLabel(n);
    if (c.kind === "state") return c.value;
  }
  return "todo";
}

export function pickFlags(labels: string[]): Set<Flag> {
  const out = new Set<Flag>();
  for (const n of labels) {
    const c = classifyLabel(n);
    if (c.kind === "flag") out.add(c.value);
  }
  return out;
}

export function pickOrigin(labels: string[]): Origin {
  for (const n of labels) {
    const c = classifyLabel(n);
    if (c.kind === "origin") return c.value;
  }
  return "side";
}

export function pickSourceIdentity(labels: string[]): SourceIdentity | null {
  for (const n of labels) {
    const c = classifyLabel(n);
    if (c.kind === "source-id") return { projectId: c.projectId, issueIid: c.issueIid };
  }
  return null;
}

export function pickUserLabels(labels: string[]): UserLabel[] {
  return labels
    .filter((n) => classifyLabel(n).kind === "user")
    .map(parseUserLabel);
}

export const SYSTEM_LABEL_NAMES = [
  "state::todo", "state::doing", "state::done", "state::cancelled",
  "flag::blocked", "flag::reviewing",
  "src::bau", "src::side",
] as const;

export function makeSourceIdentityLabel(s: SourceIdentity): string {
  return `src::bau::${s.projectId}-${s.issueIid}`;
}
