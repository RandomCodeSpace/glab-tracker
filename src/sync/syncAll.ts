import type { IssuesApi } from "../api/issues";
import type { GitLabIssue } from "../types/gitlab";
import { sanitizeForGitLab } from "../data/sanitize";
import { makeSourceIdentityLabel } from "../data/labels";
import { makeOpenAssignedKey } from "../data/divergence";

export interface SyncResult {
  forked: GitLabIssue[];
  skipped: { projectId: number; issueIid: number }[];
  openAssignedSet: Set<string>;
}

export async function syncAllOpenAssigned(args: {
  issuesApi: IssuesApi;
  personalProjectId: number;
  ownProjectFullPath: string;
  localIssues: GitLabIssue[];
}): Promise<SyncResult> {
  const openAssigned = await args.issuesApi.listOpenAssignedToMe();

  const localKeys = new Set(
    args.localIssues.flatMap((i) =>
      i.labels.flatMap((l) => {
        const m = l.match(/^src::bau::(\d+)-(\d+)$/);
        return m ? [makeOpenAssignedKey(Number(m[1]!), Number(m[2]!))] : [];
      }),
    ),
  );

  const openAssignedSet = new Set(
    openAssigned
      .filter((i) => i.project_id !== args.personalProjectId)
      .map((i) => makeOpenAssignedKey(i.project_id, i.iid)),
  );

  const forked: GitLabIssue[] = [];
  const skipped: { projectId: number; issueIid: number }[] = [];

  for (const src of openAssigned) {
    if (src.project_id === args.personalProjectId) continue;
    const key = makeOpenAssignedKey(src.project_id, src.iid);
    if (localKeys.has(key)) {
      skipped.push({ projectId: src.project_id, issueIid: src.iid });
      continue;
    }
    const created = await args.issuesApi.create(args.personalProjectId, {
      title: sanitizeForGitLab(src.title, { ownProject: args.ownProjectFullPath }),
      description: sanitizeForGitLab(src.description ?? "", { ownProject: args.ownProjectFullPath }),
      labels: [
        "state::todo",
        "src::bau",
        makeSourceIdentityLabel({ projectId: src.project_id, issueIid: src.iid }),
      ],
      due_date: src.due_date ?? null,
      weight: src.weight ?? null,
    });
    forked.push(created);
  }

  return { forked, skipped, openAssignedSet };
}
