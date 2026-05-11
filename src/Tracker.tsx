import { useEffect, useMemo, useRef, useState } from "react";
import "./styles/tracker.css";
import type { TrackerProps } from "./types/props";
import { ConnectScreen, type ConnectStep } from "./components/Connect/ConnectScreen";
import { Topbar } from "./components/Topbar/Topbar";
import { FilterRail } from "./components/FilterRail/FilterRail";
import { Board } from "./components/Board/Board";
import { Drawer } from "./components/Drawer/Drawer";
import { DndOrchestrator } from "./components/Tracker/DndOrchestrator";
import { useTracker } from "./store/store";
import { createTokenStore, type TokenStore } from "./auth/tokenStore";
import { createAuthSession } from "./auth/refresh";
import { beginAuthorize, completeAuthorize, type AuthConfig } from "./auth/oauth";
import { createApiClient, type ApiClient } from "./api/client";
import { createIssuesApi } from "./api/issues";
import { createLabelsApi } from "./api/labels";
import { createNotesApi } from "./api/notes";
import { createProjectsApi } from "./api/projects";
import { bootstrapSystemLabels } from "./api/bootstrap";
import { createSidecarStore, type SidecarStore } from "./data/sidecar";
import { createActions } from "./actions";
import { mapIssue } from "./data/mapper";
import { TrackerContextC, useTrackerCtx, type TrackerCtx } from "./components/Tracker/TrackerContext";
import { ToastTray } from "./components/Toast/Toast";
import { NewIssueComposer } from "./components/Composer/NewIssueComposer";
import { LabelPicker } from "./components/Popovers/LabelPicker";

type Stage =
  | { kind: "loading" }
  | { kind: "connect"; step: ConnectStep; bootstrap: { created: string[]; alreadyPresent: string[] } | null }
  | { kind: "ready"; ctx: TrackerCtx };

interface Services {
  tokenStore: TokenStore;
  sidecar: SidecarStore;
  api: ApiClient;
}

export function Tracker(props: TrackerProps) {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [username, setUsername] = useState<string | null>(null);
  const servicesRef = useRef<Services | null>(null);
  const store = useTracker();

  const authCfg: AuthConfig = useMemo(() => ({
    instanceUrl: props.instanceUrl,
    clientId: props.oauthClientId,
    redirectUri: props.oauthRedirectUri,
  }), [props.instanceUrl, props.oauthClientId, props.oauthRedirectUri]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokenStore = await createTokenStore();
      const sidecar = await createSidecarStore();

      const params = new URLSearchParams(window.location.search);
      if (params.get("code") && params.get("state")) {
        const r = await completeAuthorize(authCfg);
        if (r.ok && r.tokens) {
          await tokenStore.set(r.tokens);
          window.history.replaceState({}, "", window.location.pathname);
        }
      }

      const tokens = await tokenStore.get();
      if (!tokens) {
        if (!cancelled) setStage({ kind: "connect", step: "authorize", bootstrap: null });
        return;
      }

      const session = createAuthSession(authCfg, tokenStore);
      const api = createApiClient({ instanceUrl: authCfg.instanceUrl, auth: session });
      const projectsApi = createProjectsApi(api);
      const labelsApi = createLabelsApi(api);
      const issuesApi = createIssuesApi(api);
      const notesApi = createNotesApi(api);

      let me: { username: string };
      try { me = await projectsApi.currentUser(); }
      catch {
        if (!cancelled) setStage({ kind: "connect", step: "authorize", bootstrap: null });
        return;
      }
      if (!cancelled) setUsername(me.username);

      const proj = await projectsApi.get(props.personalProjectId).catch(() => null);
      if (!proj) {
        if (!cancelled) setStage({ kind: "connect", step: "project-id", bootstrap: null });
        return;
      }
      if (proj.visibility !== "private") {
        store.pushToast({
          kind: "error",
          message: "Tracker project must be visibility=private. Aborting.",
        });
        if (!cancelled) setStage({ kind: "connect", step: "project-id", bootstrap: null });
        return;
      }
      const ownProjectPath = proj.path_with_namespace;

      const bootstrapResult = await bootstrapSystemLabels({ labelsApi, projectId: props.personalProjectId });

      const labels = await labelsApi.list(props.personalProjectId);
      store.setProjectLabels(labels);

      const localRaw = await issuesApi.listInProject(props.personalProjectId);
      const initial = useTracker.getState();
      const mapped = await Promise.all(localRaw.map(async (r) => {
        const reasons = await sidecar.getAllFlagReasons(r.iid);
        return mapIssue({
          raw: r, openAssignedSet: initial.openAssignedSet, flagReasons: reasons,
          hasSynced: initial.hasSynced,
        });
      }));
      store.setIssues(mapped);

      servicesRef.current = { tokenStore, sidecar, api };

      const actions = createActions({
        api, issues: issuesApi, notes: notesApi, labels: labelsApi,
        sidecar, store: { getState: useTracker.getState },
        personalProjectId: props.personalProjectId,
        ownProjectFullPath: ownProjectPath,
        instanceUrl: authCfg.instanceUrl,
      });

      const ctx: TrackerCtx = {
        actions, api, tokenStore, sidecar,
        ownProjectPath,
        instanceUrl: authCfg.instanceUrl,
        personalProjectId: props.personalProjectId,
        username: me.username,
      };

      if (!cancelled) {
        setStage({ kind: "ready", ctx });
        if (bootstrapResult.created.length > 0) {
          store.pushToast({
            kind: "info",
            message: `Bootstrapped ${bootstrapResult.created.length} system label${bootstrapResult.created.length === 1 ? "" : "s"}.`,
          });
        }
      }
    })().catch((err) => {
      store.pushToast({ kind: "error", message: `Init failed: ${(err as Error).message}` });
      if (!cancelled) setStage({ kind: "connect", step: "authorize", bootstrap: null });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authCfg, props.personalProjectId]);

  if (stage.kind === "loading") {
    return (
      <div className={`tracker ${props.className ?? ""}`}>
        <div className="tracker-loading" role="status" aria-live="polite">
          <span className="tracker-spinner" aria-hidden />
          <span className="tracker-loading__text">Loading</span>
        </div>
        <ToastTray />
      </div>
    );
  }
  if (stage.kind === "connect") {
    return (
      <div className={`tracker ${props.className ?? ""}`}>
        <ConnectScreen
          step={stage.step}
          username={username}
          instanceHost={new URL(props.instanceUrl).host}
          onAuthorize={() => beginAuthorize(authCfg)}
          onSubmitProjectId={async () => ({ ok: true })}
          bootstrapResult={stage.bootstrap}
        />
        <ToastTray />
      </div>
    );
  }

  return (
    <TrackerContextC.Provider value={stage.ctx}>
      <ReadyTracker className={props.className} />
    </TrackerContextC.Provider>
  );
}

function ReadyTracker({ className }: { className?: string | undefined }) {
  const ctx = useTrackerCtx();
  const issues = useTracker((s) => s.issues);
  const projectLabels = useTracker((s) => s.projectLabels);
  const filter = useTracker((s) => s.filter);
  const selection = useTracker((s) => s.selection);
  const setFilter = useTracker((s) => s.setFilter);
  const clearFilter = useTracker((s) => s.clearFilter);
  const select = useTracker((s) => s.select);

  const issuesArr = useMemo(() => Array.from(issues.values()), [issues]);

  const [composerOpen, setComposerOpen] = useState(false);
  const [labelPicker, setLabelPicker] = useState<{ rect: DOMRect; iid: number } | null>(null);

  useEffect(() => {
    if (!composerOpen && !labelPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setComposerOpen(false);
        setLabelPicker(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [composerOpen, labelPicker]);

  const filtered = useMemo(() => issuesArr.filter((i) => {
    if (i.state === "cancelled" && !filter.showCancelled) return false;
    if (filter.flag && !i.flags.has(filter.flag)) return false;
    for (const ln of filter.labelNames) if (!i.userLabels.some((l) => l.name === ln)) return false;
    return true;
  }), [issuesArr, filter]);

  const counters = {
    blocked: issuesArr.filter((i) => i.flags.has("blocked") && i.state !== "cancelled").length,
    reviewing: issuesArr.filter((i) => i.flags.has("reviewing") && i.state !== "cancelled").length,
    cancelled: issuesArr.filter((i) => i.state === "cancelled").length,
    active: (filter.flag ?? (filter.showCancelled ? ("cancelled" as const) : null)),
    onToggle: (which: "blocked" | "reviewing" | "cancelled") => {
      if (which === "cancelled") setFilter({ showCancelled: !filter.showCancelled });
      else setFilter({ flag: filter.flag === which ? null : which });
    },
  };

  const webUrlFor = (issue: { webUrl: string }) => issue.webUrl;

  const selected = selection ? issues.get(selection.iid) ?? null : null;
  const [notes, setNotes] = useState<{ author: string; createdAt: string; body: string; system: boolean }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selection) { setNotes([]); return; }
      try {
        const raw = await ctx.api.get<Array<{ author: { username: string }; created_at: string; body: string; system: boolean }>>(
          `/projects/${ctx.personalProjectId}/issues/${selection.iid}/notes?per_page=100`,
        );
        if (!cancelled) {
          setNotes(raw.map((n) => ({
            author: `@${n.author.username}`,
            createdAt: n.created_at,
            body: n.body,
            system: n.system,
          })));
        }
      } catch {
        if (!cancelled) setNotes([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selection?.iid, ctx.api, ctx.personalProjectId]);

  return (
    <div className={`tracker ${className ?? ""}`}>
      <Topbar
        projectName="Lane"
        instanceHost={new URL(ctx.instanceUrl).host}
        counters={counters}
        onPasteUrl={(u) => { void ctx.actions.forkFromUrl(u); }}
        onSyncAll={() => { void ctx.actions.syncAll(); }}
        onNewIssue={() => setComposerOpen(true)}
      />
      <FilterRail
        allLabels={projectLabels}
        selected={filter.labelNames}
        onToggle={(name) => {
          const next = new Set(filter.labelNames);
          if (next.has(name)) next.delete(name); else next.add(name);
          setFilter({ labelNames: next });
        }}
        onClear={clearFilter}
        onCreate={(name) => ctx.actions.createUserLabel(name)}
      />
      <div className={`tracker-stage${selected ? " has-drawer" : ""}`}>
        <DndOrchestrator
          callbacks={{
            onColumnDrop: (iid, to) => { void ctx.actions.moveColumn(iid, to); },
            onCounterDrop: (iid, target) => {
              if (target === "cancelled") { void ctx.actions.cancelIssue(iid); }
              else { void ctx.actions.toggleFlag(iid, target, true); }
            },
          }}
        >
          <Board
            issues={filtered}
            selectedIid={selection?.iid ?? null}
            webUrlFor={webUrlFor}
            onSelectIssue={(iid) => select({ iid })}
            onClearFlag={(iid, flag) => { void ctx.actions.toggleFlag(iid, flag, false); }}
            onOpenNotes={(iid) => select({ iid })}
          />
        </DndOrchestrator>
        {selected && (
          <Drawer
            key={selected.iid}
            issue={selected}
            webUrl={webUrlFor(selected)}
            hasSource={selected.source !== null}
            notes={notes}
            onClose={() => select(null)}
            onChangeState={(s) => { void ctx.actions.moveColumn(selected.iid, s); }}
            onToggleFlag={(f, on) => { void ctx.actions.toggleFlag(selected.iid, f, on); }}
            onEditTitle={(t) => { void ctx.actions.editTitle(selected.iid, t); }}
            onEditDescription={(d) => { void ctx.actions.editDescription(selected.iid, d); }}
            onAddNote={(b) => { void ctx.actions.addNote(selected.iid, b); }}
            onPullSnapshot={() => { void ctx.actions.pullSnapshot(selected.iid); }}
            onCancelIssue={() => { void ctx.actions.cancelIssue(selected.iid); }}
            onDeleteIssue={() => { void ctx.actions.deleteIssue(selected.iid); }}
            onAddLabel={(rect) => setLabelPicker({ rect, iid: selected.iid })}
          />
        )}
      </div>
      {composerOpen && (
        <div
          className="tracker-modal"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setComposerOpen(false); }}
        >
          <NewIssueComposer
            allLabels={projectLabels}
            onCreate={async (input) => {
              await ctx.actions.createSideIssue(input);
              setComposerOpen(false);
            }}
            onCreateLabel={(name) => ctx.actions.createUserLabel(name)}
            onCancel={() => setComposerOpen(false)}
          />
        </div>
      )}
      {labelPicker && selected && (
        <LabelPicker
          allLabels={projectLabels}
          current={new Set(selected.userLabels.map((l) => l.name))}
          anchorRect={labelPicker.rect}
          onToggle={async (name) => {
            if (selected.userLabels.some((l) => l.name === name)) {
              await ctx.actions.removeUserLabel(labelPicker.iid, name);
            } else {
              await ctx.actions.addUserLabel(labelPicker.iid, name);
            }
          }}
          onCreate={async (name) => {
            await ctx.actions.addUserLabel(labelPicker.iid, name);
            setLabelPicker(null);
          }}
          onClose={() => setLabelPicker(null)}
        />
      )}
      <ToastTray />
    </div>
  );
}
