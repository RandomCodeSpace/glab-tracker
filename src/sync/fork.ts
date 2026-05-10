import type { IssuesApi } from "../api/issues";
import type { GitLabIssue } from "../types/gitlab";
import { sanitizeForGitLab } from "../data/sanitize";
import { makeSourceIdentityLabel } from "../data/labels";

export interface ForkInput {
  source: { projectPath: string; issueIid: number };
  personalProjectId: number;
  ownProjectFullPath: string;
}

export async function forkIssue(args: {
  issuesApi: IssuesApi;
  input: ForkInput;
}): Promise<GitLabIssue> {
  const src = await args.issuesApi.getOne(args.input.source.projectPath, args.input.source.issueIid);
  const sourceIdLabel = makeSourceIdentityLabel({ projectId: src.project_id, issueIid: src.iid });

  return args.issuesApi.create(args.input.personalProjectId, {
    title: sanitizeForGitLab(src.title, { ownProject: args.input.ownProjectFullPath }),
    description: sanitizeForGitLab(src.description ?? "", { ownProject: args.input.ownProjectFullPath }),
    labels: ["state::todo", "src::bau", sourceIdLabel],
    due_date: src.due_date ?? null,
    weight: src.weight ?? null,
  });
}

export function alreadyForked(localIssues: GitLabIssue[], src: { projectId: number; issueIid: number }): boolean {
  const target = `src::bau::${src.projectId}-${src.issueIid}`;
  return localIssues.some((i) => i.labels.includes(target));
}
