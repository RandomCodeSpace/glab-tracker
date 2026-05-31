// Dev-only browser fetch mock — lets you click around the real <Tracker> in a
// browser with no live GitLab. NOT part of the library or the Playwright suite.
// Reuses the exported fixtures from the e2e GitLab mock and reimplements the
// REST handler against window.fetch (Playwright's page.route isn't available in
// a normal browser).
import { USER, PROJECT, PROJECT_ID, SYSTEM_LABELS, USER_LABELS } from "../fixtures/gitlab";

type Obj = Record<string, unknown>;

let labelId = 100;
function mkLabel(name: string, color: string) {
  return { id: ++labelId, name, color, description: null, text_color: "#ffffff" };
}

let issueId = 5000;
function mkIssue(a: {
  iid: number; title: string; labels: string[];
  description?: string; due_date?: string | null; weight?: number | null; notes?: number;
}) {
  return {
    id: ++issueId, iid: a.iid, project_id: PROJECT_ID, title: a.title,
    description: a.description ?? "", state: "opened", labels: a.labels, assignees: [USER],
    due_date: a.due_date ?? null, weight: a.weight ?? null, user_notes_count: a.notes ?? 0,
    updated_at: "2026-05-20T10:00:00.000Z",
    web_url: `https://gitlab.test/me/lane/-/issues/${a.iid}`,
    references: { full: `me/lane#${a.iid}` },
  };
}

interface State {
  labels: ReturnType<typeof mkLabel>[];
  issues: ReturnType<typeof mkIssue>[];
  notes: Record<number, Array<{ id: number; body: string; author: typeof USER; created_at: string; system: boolean }>>;
}

function freshState(): State {
  return {
    labels: [...SYSTEM_LABELS, ...USER_LABELS].map((l) => mkLabel(l.name, l.color)),
    issues: [
      mkIssue({ iid: 101, title: "Wire up the login form", labels: ["state::todo", "src::side", "frontend"], due_date: "2026-06-15", weight: 3 }),
      mkIssue({ iid: 102, title: "Migrate the user table", labels: ["state::todo", "src::side", "backend"], weight: 5, notes: 2 }),
      mkIssue({ iid: 103, title: "Fix the flaky payment test", labels: ["state::doing", "src::side", "flag::blocked", "urgent"], description: "Fails ~1 in 5 runs on CI. Suspect a race in the webhook stub.", due_date: "2026-06-01", weight: 2, notes: 1 }),
      mkIssue({ iid: 104, title: "Refactor the API client", labels: ["state::doing", "src::side", "flag::reviewing", "backend"], description: "Split `request()` and add typed pagination.", weight: 8 }),
      mkIssue({ iid: 105, title: "Add dark-mode tokens", labels: ["state::done", "src::side", "frontend"], notes: 3, description: "Landed the **token** set.\n\n```css\n--accent: #4f46e5;\n```" }),
      mkIssue({ iid: 106, title: "Write the release notes", labels: ["state::done", "src::side"], due_date: "2026-05-10", weight: 1 }),
    ],
    notes: {
      102: [{ id: 1, body: "Started on the schema diff.", author: USER, created_at: "2026-05-19T09:00:00.000Z", system: false }],
      103: [{ id: 2, body: "Blocked on infra ticket #88.", author: USER, created_at: "2026-05-18T15:30:00.000Z", system: false }],
      105: [
        { id: 3, body: "Tokens landed.", author: USER, created_at: "2026-05-17T11:00:00.000Z", system: false },
        { id: 5, body: "Ship it.", author: USER, created_at: "2026-05-17T12:00:00.000Z", system: false },
      ],
    },
  };
}

function csv(v: unknown): string[] {
  return typeof v === "string" && v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

let issueSeq = 900;
let noteSeq = 9000;

function handle(state: State, method: string, path: string, body: Obj): { status: number; data: unknown } {
  if (path === "/user" && method === "GET") return { status: 200, data: USER };

  if (/^\/projects\/\d+$/.test(path) && method === "GET") return { status: 200, data: PROJECT };

  if (path === `/projects/${PROJECT_ID}/labels`) {
    if (method === "GET") return { status: 200, data: state.labels };
    if (method === "POST") {
      const name = String(body["name"] ?? "");
      let l = state.labels.find((x) => x.name === name);
      if (!l) { l = mkLabel(name, String(body["color"] ?? "#888888")); state.labels.push(l); }
      return { status: 201, data: l };
    }
  }

  const ldel = path.match(/^\/projects\/\d+\/labels\/(.+)$/);
  if (ldel && method === "DELETE") {
    const n = decodeURIComponent(ldel[1] ?? "");
    state.labels = state.labels.filter((x) => x.name !== n);
    return { status: 204, data: null };
  }

  if (path === "/issues" && method === "GET") return { status: 200, data: [] };

  if (path === `/projects/${PROJECT_ID}/issues`) {
    if (method === "GET") return { status: 200, data: state.issues };
    if (method === "POST") {
      const created = mkIssue({
        iid: ++issueSeq, title: String(body["title"] ?? "Untitled"),
        description: String(body["description"] ?? ""), labels: csv(body["labels"]),
        due_date: (body["due_date"] as string | null) ?? null,
        weight: (body["weight"] as number | null) ?? null,
      });
      state.issues.push(created);
      return { status: 201, data: created };
    }
  }

  const im = path.match(/^\/projects\/\d+\/issues\/(\d+)$/);
  if (im && (method === "PUT" || method === "GET" || method === "DELETE")) {
    const iid = Number(im[1]);
    const idx = state.issues.findIndex((i) => i.iid === iid);
    const issue = idx >= 0 ? state.issues[idx] : undefined;
    if (method === "GET") return issue ? { status: 200, data: issue } : { status: 404, data: { message: "not found" } };
    if (method === "DELETE") { if (idx >= 0) state.issues.splice(idx, 1); return { status: 204, data: null }; }
    if (issue) {
      const add = csv(body["add_labels"]);
      const rem = new Set(csv(body["remove_labels"]));
      let labels = issue.labels.filter((l) => !rem.has(l));
      for (const l of add) if (!labels.includes(l)) labels = [...labels, l];
      issue.labels = labels;
      if (typeof body["title"] === "string") issue.title = body["title"];
      if (typeof body["description"] === "string") issue.description = body["description"];
      if ("due_date" in body) issue.due_date = (body["due_date"] as string | null) ?? null;
      if ("weight" in body) issue.weight = (body["weight"] as number | null) ?? null;
      if (body["state_event"] === "close") issue.state = "closed";
      if (body["state_event"] === "reopen") issue.state = "opened";
    }
    return { status: 200, data: issue ?? {} };
  }

  const nm = path.match(/^\/projects\/\d+\/issues\/(\d+)\/notes$/);
  if (nm) {
    const iid = Number(nm[1]);
    if (method === "GET") return { status: 200, data: state.notes[iid] ?? [] };
    if (method === "POST") {
      const note = { id: ++noteSeq, body: String(body["body"] ?? ""), author: USER, created_at: new Date().toISOString(), system: false };
      state.notes[iid] = [...(state.notes[iid] ?? []), note];
      const is = state.issues.find((i) => i.iid === iid);
      if (is) is.user_notes_count += 1;
      return { status: 201, data: note };
    }
  }

  return { status: 200, data: {} };
}

export function installFetchMock(): void {
  const state = freshState();
  const orig = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("/api/v4/")) return orig(input as RequestInfo | URL, init);

    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const path = url.replace(/^.*\/api\/v4/, "").replace(/\?.*$/, "");
    let body: Obj = {};
    const raw = init?.body ?? (input instanceof Request ? await input.clone().text() : undefined);
    if (typeof raw === "string" && raw) { try { body = JSON.parse(raw) as Obj; } catch { /* ignore */ } }

    const { status, data } = handle(state, method, path, body);
    const headers: Record<string, string> = { "content-type": "application/json", "x-next-page": "" };
    // small latency so optimistic UI + transitions are observable
    await new Promise((r) => setTimeout(r, 60));
    if (status === 204) return new Response(null, { status, headers });
    return new Response(JSON.stringify(data), { status, headers });
  };
  // eslint-disable-next-line no-console
  console.info("[lane dev] GitLab fetch mock installed — no live network used.");
}
