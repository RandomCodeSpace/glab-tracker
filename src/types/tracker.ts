export type ColumnState = "todo" | "doing" | "done" | "cancelled";
export type Flag = "blocked" | "reviewing";
export type Origin = "bau" | "side";

export interface SourceIdentity {
  projectId: number;
  issueIid: number;
}

export interface UserLabel {
  name: string;       // raw label name (may contain ::)
  scope: string | null;
  value: string;      // for non-scoped, equals name
  hue: Hue;
  isScoped: boolean;
}

export type Hue = "blue" | "violet" | "pink" | "amber" | "green" | "teal" | "slate";

export interface Issue {
  id: number;            // GitLab numeric id
  iid: number;           // project-scoped iid
  state: ColumnState;
  origin: Origin;
  source: SourceIdentity | null;  // null for src::side
  flags: Set<Flag>;
  flagReasons: Partial<Record<Flag, string>>;  // sidecar
  title: string;
  description: string;
  dueDate: string | null;        // ISO date "YYYY-MM-DD"
  weight: number | null;
  userLabels: UserLabel[];
  noteCount: number;
  divergence: "source-open" | "source-closed" | null;
  updatedAt: string;             // ISO datetime
  webUrl: string;                // local issue URL on personal project
}

export interface OrderingMap {
  [columnState: string]: number[];  // ordered iids, local-only
}
