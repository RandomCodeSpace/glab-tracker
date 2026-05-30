import type { Page, Route, Request } from "@playwright/test";

// -----------------------------------------------------------------------------
// Fixture data
//
// Shapes mirror src/types/gitlab.ts exactly. The app classifies issues into
// board columns via labels (state::todo|doing|done|cancelled) — see
// src/data/labels.ts — NOT via the GitLab `state` field, so each seeded issue
// carries the right state:: label. Flags are flag::blocked / flag::reviewing.
// -----------------------------------------------------------------------------

export const PROJECT_ID = 42;
export const PROJECT_PATH = "me/lane";

export const USER = {
  id: 7,
  username: "tester",
  name: "Test User",
  avatar_url: null,
};

export const PROJECT = {
  id: PROJECT_ID,
  name: "lane",
  path_with_namespace: PROJECT_PATH,
  visibility: "private" as const,
  web_url: "https://gitlab.test/me/lane",
};

// System labels the bootstrap expects (src/data/labels.ts SYSTEM_LABEL_NAMES),
// with the exact colors from src/api/bootstrap.ts COLORS. Pre-seeding all of
// them means bootstrapSystemLabels reports 0 created / 8 already-present and
// never POSTs — a clean, deterministic ready state.
export const SYSTEM_LABELS = [
  { name: "state::todo", color: "#6b7280" },
  { name: "state::doing", color: "#1d3da8" },
  { name: "state::done", color: "#1c6635" },
  { name: "state::cancelled", color: "#7c7c7c" },
  { name: "flag::blocked", color: "#a8341c" },
  { name: "flag::reviewing", color: "#1d6e7a" },
  { name: "src::bau", color: "#475569" },
  { name: "src::side", color: "#5d2ab4" },
];

// A few user (unscoped) labels — classifyLabel() treats these as kind:"user"
// so they show on cards, in the FilterRail and the LabelPicker.
export const USER_LABELS = [
  { name: "frontend", color: "#1d3490" },
  { name: "backend", color: "#145528" },
  { name: "urgent", color: "#8c1351" },
];

let labelAutoId = 100;
function mkLabel(input: { name: string; color: string }) {
  return {
    id: ++labelAutoId,
    name: input.name,
    color: input.color,
    description: null,
    text_color: "#ffffff",
  };
}

export type SeededLabel = ReturnType<typeof mkLabel>;

function allSeedLabels(): SeededLabel[] {
  return [...SYSTEM_LABELS, ...USER_LABELS].map(mkLabel);
}

let issueAutoId = 5000;
function mkIssue(args: {
  iid: number;
  title: string;
  labels: string[];
  description?: string;
  due_date?: string | null;
  weight?: number | null;
  notes?: number;
  state?: "opened" | "closed";
}) {
  return {
    id: ++issueAutoId,
    iid: args.iid,
    project_id: PROJECT_ID,
    title: args.title,
    description: args.description ?? "",
    state: args.state ?? "opened",
    labels: args.labels,
    assignees: [USER],
    due_date: args.due_date ?? null,
    weight: args.weight ?? null,
    user_notes_count: args.notes ?? 0,
    updated_at: "2026-05-20T10:00:00.000Z",
    web_url: `https://gitlab.test/me/lane/-/issues/${args.iid}`,
    references: { full: `me/lane#${args.iid}` },
  };
}

export type SeededIssue = ReturnType<typeof mkIssue>;

// ~6 issues across todo/doing/done; one blocked, one reviewing; due dates &
// weights present; some with notes.
function seedIssues(): SeededIssue[] {
  return [
    mkIssue({ iid: 101, title: "Wire up the login form", labels: ["state::todo", "src::side", "frontend"], due_date: "2026-06-15", weight: 3, notes: 0 }),
    mkIssue({ iid: 102, title: "Migrate the user table", labels: ["state::todo", "src::side", "backend"], weight: 5, notes: 2 }),
    mkIssue({ iid: 103, title: "Fix the flaky payment test", labels: ["state::doing", "src::side", "flag::blocked", "urgent"], due_date: "2026-06-01", weight: 2, notes: 1 }),
    mkIssue({ iid: 104, title: "Refactor the API client", labels: ["state::doing", "src::side", "flag::reviewing", "backend"], weight: 8, notes: 0 }),
    mkIssue({ iid: 105, title: "Add dark-mode tokens", labels: ["state::done", "src::side", "frontend"], notes: 3 }),
    mkIssue({ iid: 106, title: "Write the release notes", labels: ["state::done", "src::side"], due_date: "2026-05-10", weight: 1, notes: 0 }),
  ];
}

export interface GitlabState {
  labels: SeededLabel[];
  issues: SeededIssue[];
  notes: Record<number, Array<{ id: number; body: string; author: typeof USER; created_at: string; system: boolean }>>;
  /** Recorded mutations, for asserting that the right API call fired. */
  calls: Array<{ method: string; path: string; body: unknown }>;
}

export interface InstallOptions {
  /** Force /api/v4/user to 401 (invalid-token path). */
  userUnauthorized?: boolean;
}

function freshState(): GitlabState {
  return {
    labels: allSeedLabels(),
    issues: seedIssues(),
    notes: {
      102: [{ id: 1, body: "Started on the schema diff.", author: USER, created_at: "2026-05-19T09:00:00.000Z", system: false }],
      103: [{ id: 2, body: "Blocked on infra ticket #88.", author: USER, created_at: "2026-05-18T15:30:00.000Z", system: false }],
      105: [
        { id: 3, body: "Tokens landed.", author: USER, created_at: "2026-05-17T11:00:00.000Z", system: false },
        { id: 4, body: "closed", author: USER, created_at: "2026-05-17T11:05:00.000Z", system: true },
        { id: 5, body: "Ship it.", author: USER, created_at: "2026-05-17T12:00:00.000Z", system: false },
      ],
    },
    calls: [],
  };
}

// -----------------------------------------------------------------------------
// Route helpers
// -----------------------------------------------------------------------------

function json(route: Route, status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return route.fulfill({
    status,
    contentType: "application/json",
    // Empty x-next-page disables the getPaginated loop after page 1.
    headers: { "x-next-page": "", ...extraHeaders },
    body: JSON.stringify(body),
  });
}

function parseBody(req: Request): Record<string, unknown> {
  const raw = req.postData();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function csvToList(v: unknown): string[] {
  if (typeof v !== "string" || v.length === 0) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

let issueIidSeq = 900;

/**
 * Install a stateful GitLab REST mock on the page. Returns the live state so
 * specs can assert recorded calls. The mock is keyed on method + URL pathname
 * (after /api/v4), so query strings (page, per_page, state, scope) are ignored.
 */
export function installGitlabMock(page: Page, opts: InstallOptions = {}): GitlabState {
  const state = freshState();

  void page.route("**/api/v4/**", async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());
    // Path after /api/v4 — e.g. "/user", "/projects/42/issues", ...
    const path = url.pathname.replace(/^.*\/api\/v4/, "");

    // --- GET /user (connect-stage token verify + projectsApi.currentUser) ---
    if (path === "/user" && method === "GET") {
      if (opts.userUnauthorized) {
        return json(route, 401, { message: "401 Unauthorized" });
      }
      return json(route, 200, USER);
    }

    // --- GET /projects/:id ---
    const projMatch = path.match(/^\/projects\/(\d+)$/);
    if (projMatch && method === "GET") {
      return json(route, 200, PROJECT);
    }

    // --- /projects/:id/labels ---
    if (path === `/projects/${PROJECT_ID}/labels`) {
      if (method === "GET") return json(route, 200, state.labels);
      if (method === "POST") {
        const body = parseBody(req);
        const name = String(body["name"] ?? "");
        const color = String(body["color"] ?? "#888888");
        let lbl = state.labels.find((l) => l.name === name);
        if (!lbl) {
          lbl = mkLabel({ name, color });
          state.labels.push(lbl);
        }
        state.calls.push({ method, path, body });
        return json(route, 201, lbl);
      }
    }

    // --- DELETE /projects/:id/labels/:name ---
    const labelDelMatch = path.match(/^\/projects\/(\d+)\/labels\/(.+)$/);
    if (labelDelMatch && method === "DELETE") {
      const name = decodeURIComponent(labelDelMatch[2]!);
      state.labels = state.labels.filter((l) => l.name !== name);
      state.calls.push({ method, path, body: null });
      return route.fulfill({ status: 204, body: "" });
    }

    // --- GET /issues (listOpenAssignedToMe via syncAll) ---
    if (path === "/issues" && method === "GET") {
      // No cross-project open-assigned issues in the fixture; sync is a no-op.
      return json(route, 200, []);
    }

    // --- /projects/:id/issues  (list / create) ---
    if (path === `/projects/${PROJECT_ID}/issues`) {
      if (method === "GET") return json(route, 200, state.issues);
      if (method === "POST") {
        const body = parseBody(req);
        const created = mkIssue({
          iid: ++issueIidSeq,
          title: String(body["title"] ?? "Untitled"),
          description: String(body["description"] ?? ""),
          labels: csvToList(body["labels"]),
          due_date: (body["due_date"] as string | null | undefined) ?? null,
          weight: (body["weight"] as number | null | undefined) ?? null,
        });
        state.issues.push(created);
        state.calls.push({ method, path, body });
        return json(route, 201, created);
      }
    }

    // --- PUT /projects/:id/issues/:iid  (state / labels / title / etc.) ---
    const issuePutMatch = path.match(/^\/projects\/(\d+)\/issues\/(\d+)$/);
    if (issuePutMatch && (method === "PUT" || method === "GET" || method === "DELETE")) {
      const iid = Number(issuePutMatch[2]);
      const idx = state.issues.findIndex((i) => i.iid === iid);
      if (method === "GET") {
        return idx >= 0 ? json(route, 200, state.issues[idx]) : json(route, 404, { message: "404 Not Found" });
      }
      if (method === "DELETE") {
        if (idx >= 0) state.issues.splice(idx, 1);
        state.calls.push({ method, path, body: null });
        return route.fulfill({ status: 204, body: "" });
      }
      // PUT — apply add_labels / remove_labels / title / description / etc.,
      // then echo the updated issue back (matches IssuesApi.update return).
      const body = parseBody(req);
      const issue = idx >= 0 ? state.issues[idx]! : undefined;
      if (issue) {
        const add = csvToList(body["add_labels"]);
        const remove = new Set(csvToList(body["remove_labels"]));
        let labels = issue.labels.filter((l) => !remove.has(l));
        for (const l of add) if (!labels.includes(l)) labels = [...labels, l];
        issue.labels = labels;
        if (typeof body["title"] === "string") issue.title = body["title"] as string;
        if (typeof body["description"] === "string") issue.description = body["description"] as string;
        if ("due_date" in body) issue.due_date = (body["due_date"] as string | null) ?? null;
        if ("weight" in body) issue.weight = (body["weight"] as number | null) ?? null;
        if (body["state_event"] === "close") issue.state = "closed";
        if (body["state_event"] === "reopen") issue.state = "opened";
        issue.updated_at = "2026-05-21T10:00:00.000Z";
      }
      state.calls.push({ method, path, body });
      return json(route, 200, issue ?? {});
    }

    // --- /projects/:id/issues/:iid/notes  (list / create) ---
    const notesMatch = path.match(/^\/projects\/(\d+)\/issues\/(\d+)\/notes$/);
    if (notesMatch) {
      const iid = Number(notesMatch[2]);
      if (method === "GET") {
        return json(route, 200, state.notes[iid] ?? []);
      }
      if (method === "POST") {
        const body = parseBody(req);
        const note = {
          id: Math.floor(Math.random() * 1e6),
          body: String(body["body"] ?? ""),
          author: USER,
          created_at: "2026-05-21T12:00:00.000Z",
          system: false,
        };
        state.notes[iid] = [...(state.notes[iid] ?? []), note];
        const issue = state.issues.find((i) => i.iid === iid);
        if (issue) issue.user_notes_count += 1;
        state.calls.push({ method, path, body });
        return json(route, 201, note);
      }
    }

    // Fallback: empty success so an unforeseen call never hangs the test.
    return json(route, 200, {});
  });

  return state;
}
