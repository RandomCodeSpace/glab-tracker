import type { IssuesApi } from "../api/issues";
import type { NotesApi } from "../api/notes";
import type { SourceIdentity } from "../types/tracker";
import { fenceSourceSnapshot } from "../data/sanitize";

export async function pullSourceSnapshot(args: {
  issuesApi: IssuesApi;
  notesApi: NotesApi;
  source: SourceIdentity;
  sourceProjectPath: string;
  personalProjectId: number;
  localIssueIid: number;
}): Promise<void> {
  const src = await args.issuesApi.getOne(args.sourceProjectPath, args.source.issueIid);
  const fenced = fenceSourceSnapshot({
    state: src.state,
    title: src.title,
    labels: src.labels,
    description: src.description ?? "",
  });
  await args.notesApi.create(args.personalProjectId, args.localIssueIid, fenced);
}
