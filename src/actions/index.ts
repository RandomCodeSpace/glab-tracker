import type { ApiClient } from "../api/client";
import type { IssuesApi } from "../api/issues";
import type { NotesApi } from "../api/notes";
import type { LabelsApi } from "../api/labels";
import type { Issue, ColumnState, Flag } from "../types/tracker";
import { planTransition, planFlagToggle, type IssuePatch } from "../data/state";
import { mapIssue } from "../data/mapper";
import { sanitizeForGitLab } from "../data/sanitize";
import type { SidecarStore } from "../data/sidecar";
import type { TrackerState } from "../store/store";
import { syncAllOpenAssigned } from "../sync/syncAll";
import { forkIssue } from "../sync/fork";
import { pullSourceSnapshot } from "../sync/pullSnapshot";
import { parseGitLabIssueUrl } from "../sync/parseUrl";
import { hueFromName } from "../data/labels";

export interface ActionsCtx {
  api: ApiClient;
  issues: IssuesApi;
  notes: NotesApi;
  labels: LabelsApi;
  sidecar: SidecarStore;
  /**
   * Live accessor for the Zustand store. We must NOT capture the snapshot at
   * construction time — issues forked after mount would be invisible.
   * `useTracker.getState` is a stable function reference; calling it returns
   * the current state on every invocation.
   */
  store: { getState: () => TrackerState };
  personalProjectId: number;
  ownProjectFullPath: string;
  instanceUrl: string;
}

const HUE_TO_HEX: Record<string, string> = {
  blue: "#1d3490", violet: "#4d1f9e", pink: "#8c1351",
  amber: "#6f3007", green: "#145528", teal: "#1d6e7a", slate: "#2a2419",
};

function hueColor(name: string): string {
  return HUE_TO_HEX[hueFromName(name)] ?? "#888888";
}

function nextStateFromPatch(p: IssuePatch): ColumnState | null {
  if (!p.add_labels) return null;
  for (const l of p.add_labels) {
    const m = l.match(/^state::(todo|doing|done|cancelled)$/);
    if (m) return m[1]! as ColumnState;
  }
  return null;
}

export function createActions(ctx: ActionsCtx) {
  async function applyPatch(iid: number, patch: IssuePatch & { title?: string; description?: string }) {
    const s0 = ctx.store.getState();
    const before = s0.issues.get(iid);
    if (!before) return;

    // Build optimistic copy
    const optimistic: Issue = { ...before, flags: new Set(before.flags) };
    const next = nextStateFromPatch(patch);
    if (next) optimistic.state = next;
    if (patch.add_labels) for (const l of patch.add_labels) {
      if (l === "flag::blocked") optimistic.flags.add("blocked");
      if (l === "flag::reviewing") optimistic.flags.add("reviewing");
    }
    if (patch.remove_labels) for (const l of patch.remove_labels) {
      if (l === "flag::blocked") optimistic.flags.delete("blocked");
      if (l === "flag::reviewing") optimistic.flags.delete("reviewing");
    }
    s0.upsertIssue(optimistic);

    try {
      const updated = await ctx.issues.update(ctx.personalProjectId, iid, patch);
      const reasons = await ctx.sidecar.getAllFlagReasons(iid);
      const s1 = ctx.store.getState();
      const fresh = mapIssue({
        raw: updated, openAssignedSet: s1.openAssignedSet, flagReasons: reasons,
        hasSynced: s1.hasSynced,
      });
      s1.upsertIssue(fresh);
    } catch (e) {
      const s1 = ctx.store.getState();
      s1.upsertIssue(before);
      s1.pushToast({ kind: "error", message: `Update failed: ${(e as Error).message}` });
    }
  }

  async function getProjectPath(projectId: number): Promise<string> {
    const proj = await ctx.api.get<{ path_with_namespace: string }>(`/projects/${projectId}`);
    return proj.path_with_namespace;
  }

  return {
    async moveColumn(iid: number, to: ColumnState) {
      const issue = ctx.store.getState().issues.get(iid);
      if (!issue) return;
      const patch = planTransition(issue.state, to);
      if (!patch) return;
      await applyPatch(iid, patch);
    },

    async toggleFlag(iid: number, flag: Flag, on: boolean, reason?: string) {
      const patch = planFlagToggle(flag, on);
      if (on && reason !== undefined) await ctx.sidecar.setFlagReason(iid, flag, reason);
      if (!on) await ctx.sidecar.clearFlagReason(iid, flag);
      await applyPatch(iid, patch);
    },

    async editTitle(iid: number, title: string) {
      const sanitized = sanitizeForGitLab(title, { ownProject: ctx.ownProjectFullPath });
      try {
        const updated = await ctx.issues.update(ctx.personalProjectId, iid, { title: sanitized });
        const reasons = await ctx.sidecar.getAllFlagReasons(iid);
        const s = ctx.store.getState();
        s.upsertIssue(mapIssue({ raw: updated, openAssignedSet: s.openAssignedSet, flagReasons: reasons, hasSynced: s.hasSynced }));
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Title update failed: ${(e as Error).message}` });
      }
    },

    async editDescription(iid: number, body: string) {
      const sanitized = sanitizeForGitLab(body, { ownProject: ctx.ownProjectFullPath });
      try {
        const updated = await ctx.issues.update(ctx.personalProjectId, iid, { description: sanitized });
        const reasons = await ctx.sidecar.getAllFlagReasons(iid);
        const s = ctx.store.getState();
        s.upsertIssue(mapIssue({ raw: updated, openAssignedSet: s.openAssignedSet, flagReasons: reasons, hasSynced: s.hasSynced }));
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Description update failed: ${(e as Error).message}` });
      }
    },

    async addNote(iid: number, body: string) {
      const sanitized = sanitizeForGitLab(body, { ownProject: ctx.ownProjectFullPath });
      try {
        await ctx.notes.create(ctx.personalProjectId, iid, sanitized);
        // refresh count via a no-op update (returns the latest issue)
        const updated = await ctx.issues.update(ctx.personalProjectId, iid, {});
        const reasons = await ctx.sidecar.getAllFlagReasons(iid);
        const s = ctx.store.getState();
        s.upsertIssue(mapIssue({ raw: updated, openAssignedSet: s.openAssignedSet, flagReasons: reasons, hasSynced: s.hasSynced }));
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Could not add note: ${(e as Error).message}` });
      }
    },

    async syncAll() {
      try {
        const localRaw = await ctx.issues.listInProject(ctx.personalProjectId);
        const result = await syncAllOpenAssigned({
          issuesApi: ctx.issues,
          personalProjectId: ctx.personalProjectId,
          ownProjectFullPath: ctx.ownProjectFullPath,
          localIssues: localRaw,
        });
        const s = ctx.store.getState();
        s.setOpenAssignedSet(result.openAssignedSet);
        const refreshed = [...localRaw, ...result.forked];
        const mapped = await Promise.all(refreshed.map(async (raw) => {
          const reasons = await ctx.sidecar.getAllFlagReasons(raw.iid);
          // setOpenAssignedSet flips hasSynced=true, so subsequent mapIssue calls see it true.
          return mapIssue({ raw, openAssignedSet: result.openAssignedSet, flagReasons: reasons, hasSynced: true });
        }));
        ctx.store.getState().setIssues(mapped);
        ctx.store.getState().pushToast({
          kind: "info",
          message: `Synced: ${result.forked.length} forked, ${result.skipped.length} already tracked.`,
        });
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Sync failed: ${(e as Error).message}` });
      }
    },

    async forkFromUrl(rawUrl: string) {
      const parsed = parseGitLabIssueUrl(rawUrl, ctx.instanceUrl);
      if (!parsed) {
        ctx.store.getState().pushToast({ kind: "error", message: "Not a recognized GitLab issue URL on this instance." });
        return;
      }
      try {
        const created = await forkIssue({
          issuesApi: ctx.issues,
          input: {
            source: parsed,
            personalProjectId: ctx.personalProjectId,
            ownProjectFullPath: ctx.ownProjectFullPath,
          },
        });
        const reasons = await ctx.sidecar.getAllFlagReasons(created.iid);
        const s = ctx.store.getState();
        s.upsertIssue(mapIssue({
          raw: created, openAssignedSet: s.openAssignedSet, flagReasons: reasons,
          hasSynced: s.hasSynced,
        }));
        s.pushToast({ kind: "info", message: `Forked ${parsed.projectPath}#${parsed.issueIid}.` });
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Fork failed: ${(e as Error).message}` });
      }
    },

    async pullSnapshot(iid: number) {
      const issue = ctx.store.getState().issues.get(iid);
      if (!issue?.source) return;
      try {
        const sourceProjectPath = await getProjectPath(issue.source.projectId);
        await pullSourceSnapshot({
          issuesApi: ctx.issues, notesApi: ctx.notes,
          source: issue.source,
          sourceProjectPath,
          personalProjectId: ctx.personalProjectId,
          localIssueIid: iid,
        });
        ctx.store.getState().pushToast({ kind: "info", message: "Source snapshot added to notes." });
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Pull source failed: ${(e as Error).message}` });
      }
    },

    async createSideIssue(input: { title: string; description: string }) {
      const sanitized = {
        title: sanitizeForGitLab(input.title, { ownProject: ctx.ownProjectFullPath }),
        description: sanitizeForGitLab(input.description, { ownProject: ctx.ownProjectFullPath }),
      };
      try {
        const created = await ctx.issues.create(ctx.personalProjectId, {
          title: sanitized.title,
          description: sanitized.description,
          labels: ["state::todo", "src::side"],
        });
        const reasons = await ctx.sidecar.getAllFlagReasons(created.iid);
        const s = ctx.store.getState();
        s.upsertIssue(mapIssue({
          raw: created, openAssignedSet: s.openAssignedSet, flagReasons: reasons,
          hasSynced: s.hasSynced,
        }));
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Could not create issue: ${(e as Error).message}` });
      }
    },

    async cancelIssue(iid: number) {
      const before = ctx.store.getState().issues.get(iid);
      if (!before) return;
      const patch = planTransition(before.state, "cancelled");
      if (!patch) return;
      await applyPatch(iid, patch);
    },

    async restoreFromCancel(iid: number) {
      const before = ctx.store.getState().issues.get(iid);
      if (!before || before.state !== "cancelled") return;
      const patch = planTransition("cancelled", "todo");
      if (!patch) return;
      await applyPatch(iid, patch);
    },

    async deleteIssue(iid: number) {
      try {
        await ctx.issues.delete(ctx.personalProjectId, iid);
        ctx.store.getState().removeIssue(iid);
      } catch (e) {
        ctx.store.getState().pushToast({ kind: "error", message: `Delete failed: ${(e as Error).message}` });
      }
    },

    async addUserLabel(iid: number, name: string) {
      const s = ctx.store.getState();
      const issue = s.issues.get(iid);
      if (!issue) return;
      const existing = s.projectLabels.find((l) => l.name === name);
      if (!existing) {
        const created = await ctx.labels.create(ctx.personalProjectId, { name, color: hueColor(name) });
        const s1 = ctx.store.getState();
        s1.setProjectLabels([...s1.projectLabels, created]);
      }
      await applyPatch(iid, { add_labels: [name] });
    },

    async removeUserLabel(iid: number, name: string) {
      await applyPatch(iid, { remove_labels: [name] });
    },
  };
}
