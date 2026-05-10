export function sourceUrlFrom(args: {
  instanceUrl: string;
  projectPath: string;
  issueIid: number;
}): string {
  const base = args.instanceUrl.replace(/\/+$/, "");
  return `${base}/${args.projectPath}/-/issues/${args.issueIid}`;
}

export function isOwnProject(source: { projectId: number }, ownProjectId: number): boolean {
  return source.projectId === ownProjectId;
}
