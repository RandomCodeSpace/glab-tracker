export interface ParsedIssueUrl {
  projectPath: string;
  issueIid: number;
}

export function parseGitLabIssueUrl(
  raw: string,
  expectedOrigin?: string,
): ParsedIssueUrl | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (expectedOrigin && url.origin !== new URL(expectedOrigin).origin) return null;

  const path = url.pathname.replace(/\/+$/, "");
  const m = path.match(/^\/(.+?)\/-\/issues\/(\d+)$/);
  if (!m) return null;
  const iid = Number.parseInt(m[2]!, 10);
  if (!Number.isInteger(iid) || iid <= 0) return null;
  return { projectPath: m[1]!, issueIid: iid };
}
