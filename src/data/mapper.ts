import type { GitLabIssue } from "../types/gitlab";
import type { Issue, Flag } from "../types/tracker";
import {
  pickColumnLabel, pickFlags, pickOrigin, pickSourceIdentity, pickUserLabels,
} from "./labels";
import { computeDivergence } from "./divergence";

export function mapIssue(args: {
  raw: GitLabIssue;
  openAssignedSet: Set<string>;
  flagReasons: Partial<Record<Flag, string>>;
}): Issue {
  const labels = args.raw.labels;
  const state = pickColumnLabel(labels);
  const source = pickSourceIdentity(labels);
  return {
    id: args.raw.id,
    iid: args.raw.iid,
    state,
    origin: pickOrigin(labels),
    source,
    flags: pickFlags(labels),
    flagReasons: args.flagReasons,
    title: args.raw.title,
    description: args.raw.description ?? "",
    dueDate: args.raw.due_date,
    weight: args.raw.weight,
    userLabels: pickUserLabels(labels),
    noteCount: args.raw.user_notes_count,
    divergence: computeDivergence(state, source, args.openAssignedSet),
    updatedAt: args.raw.updated_at,
    webUrl: args.raw.web_url,
  };
}
