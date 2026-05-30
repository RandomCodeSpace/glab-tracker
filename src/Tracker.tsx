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
import { CommandPalette, type CommandItem } from "./components/Command/CommandPalette";
import { ShortcutsSheet } from "./components/Command/ShortcutsSheet";
import { useCommandPalette } from "./hooks/useCommandPalette";
import { useKeyboardNav } from "./hooks/useKeyboardNav";
import { Modal } from "./components/common/Modal";

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
  const [reloadId, setReloadId] = useState(0);
  const servicesRef = useRef<Services | null>(null);
  const store = useTracker();

  const oauthEnabled = Boolean(props.oauthClientId && props.oauthRedirectUri);

  const authCfg: AuthConfig = useMemo(() => ({
    instanceUrl: props.instanceUrl,
    clientId: props.oauthClientId ?? "",
    redirectUri: props.oauthRedirectUri ?? "",
  }), [props.instanceUrl, props.oauthClientId, props.oauthRedirectUri]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokenStore = await createTokenStore();
      const sidecar = await createSidecarStore();

      const params = new URLSearchParams(window.location.search);
      if (oauthEnabled && params.get("code") && params.get("state")) {
        const r = await completeAuthorize(authCfg);
        if (r.ok && r.tokens) {
          await tokenStore.set({ kind: "oauth", tokens: r.tokens });
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

      const signOut = async () => {
        await tokenStore.clear();
        setUsername(null);
        setStage({ kind: "loading" });
        setReloadId((n) => n + 1);
      };

      const ctx: TrackerCtx = {
        actions, api, tokenStore, sidecar,
        ownProjectPath,
        instanceUrl: authCfg.instanceUrl,
        personalProjectId: props.personalProjectId,
        username: me.username,
        signOut,
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
  }, [authCfg, props.personalProjectId, reloadId]);

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
          oauthEnabled={oauthEnabled}
          onAuthorize={() => beginAuthorize(authCfg)}
          onSubmitToken={async (token) => {
            const trimmed = token.trim();
            if (!trimmed) return { ok: false, error: "Token is empty" };
            try {
              const r = await fetch(`${authCfg.instanceUrl.replace(/\/+$/, "")}/api/v4/user`, {
                headers: { Authorization: `Bearer ${trimmed}` },
              });
              if (r.status === 401) return { ok: false, error: "Token rejected by GitLab" };
              if (!r.ok) return { ok: false, error: `GitLab returned ${r.status}` };
              const ts = await createTokenStore();
              await ts.set({ kind: "pat", token: trimmed });
              setStage({ kind: "loading" });
              setReloadId((n) => n + 1);
              return { ok: true };
            } catch (e) {
              return { ok: false, error: (e as Error).message };
            }
          }}
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
  const focusedIid = useTracker((s) => s.focusedIid);
  const setFocusedIid = useTracker((s) => s.setFocusedIid);
  const isDragging = useTracker((s) => s.isDragging);

  const issuesArr = useMemo(() => Array.from(issues.values()), [issues]);

  const [composerOpen, setComposerOpen] = useState(false);
  const [labelPicker, setLabelPicker] = useState<{ rect: DOMRect; iid: number } | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const palette = useCommandPalette();
  const boardRef = useRef<HTMLDivElement>(null);

  // Composer + confirm own their Esc via <Modal>; the popover handles its own.
  // This only covers the LabelPicker popover (rendered outside a Modal).
  useEffect(() => {
    if (!labelPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLabelPicker(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [labelPicker]);

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

  const target = selection?.iid ?? focusedIid;
  const commands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      { id: "new", group: "Board", label: "New issue", icon: "plus", keywords: "create add card", run: () => setComposerOpen(true) },
      { id: "sync", group: "Board", label: "Sync all", icon: "refresh", keywords: "refresh pull gitlab", run: () => { void ctx.actions.syncAll(); } },
      { id: "clear-filters", group: "Board", label: "Clear filters", icon: "filter", run: () => clearFilter() },
      { id: "toggle-cancelled", group: "Board", label: filter.showCancelled ? "Hide cancelled" : "Show cancelled", icon: "eye", keywords: "cancelled", run: () => setFilter({ showCancelled: !filter.showCancelled }) },
      { id: "shortcuts", group: "Board", label: "Keyboard shortcuts", icon: "keyboard", keywords: "help keys", run: () => setShortcutsOpen(true) },
      { id: "signout", group: "Session", label: "Sign out", icon: "logout", run: () => setConfirmSignOut(true) },
    ];
    if (target != null) {
      const t = target;
      const issue = issues.get(t);
      list.push(
        { id: "state-todo", group: "Card", label: "Set state: To do", icon: "dot", run: () => { void ctx.actions.moveColumn(t, "todo"); } },
        { id: "state-doing", group: "Card", label: "Set state: In Progress", icon: "dot", run: () => { void ctx.actions.moveColumn(t, "doing"); } },
        { id: "state-done", group: "Card", label: "Set state: Done", icon: "check", run: () => { void ctx.actions.moveColumn(t, "done"); } },
        { id: "state-cancelled", group: "Card", label: "Set state: Cancelled", icon: "cancel", run: () => { void ctx.actions.cancelIssue(t); } },
        { id: "flag-blocked", group: "Card", label: issue?.flags.has("blocked") ? "Clear Blocked" : "Mark Blocked", icon: "block", run: () => { void ctx.actions.toggleFlag(t, "blocked", !issue?.flags.has("blocked")); } },
        { id: "flag-reviewing", group: "Card", label: issue?.flags.has("reviewing") ? "Clear Reviewing" : "Mark Reviewing", icon: "eye", run: () => { void ctx.actions.toggleFlag(t, "reviewing", !issue?.flags.has("reviewing")); } },
      );
    }
    return list;
  }, [target, issues, filter.showCancelled, ctx, clearFilter, setFilter]);

  const anyOverlayOpen =
    composerOpen || !!labelPicker || confirmSignOut || palette.open || shortcutsOpen || !!selection;
  useKeyboardNav({
    enabled: !anyOverlayOpen,
    boardRef,
    focusedIid,
    setFocusedIid,
    isDragging,
    getState: (iid) => issues.get(iid)?.state,
    onOpen: (iid) => select({ iid }),
    onMove: (iid, to) => { void ctx.actions.moveColumn(iid, to); },
    onToggleFlag: (iid, f) => { void ctx.actions.toggleFlag(iid, f, !issues.get(iid)?.flags.has(f)); },
    onNewIssue: () => setComposerOpen(true),
    onFocusFilter: () => {
      const el = document.querySelector(".tracker-filterbar input");
      if (el instanceof HTMLElement) el.focus();
    },
    onToggleCancelled: () => setFilter({ showCancelled: !filter.showCancelled }),
    onSync: () => { void ctx.actions.syncAll(); },
    onShowShortcuts: () => setShortcutsOpen(true),
  });

  return (
    <div className={`tracker ${className ?? ""}`}>
      <Topbar
        projectName="Lane"
        instanceHost={new URL(ctx.instanceUrl).host}
        username={ctx.username}
        counters={counters}
        onPasteUrl={(u) => { void ctx.actions.forkFromUrl(u); }}
        onSyncAll={() => { void ctx.actions.syncAll(); }}
        onNewIssue={() => setComposerOpen(true)}
        onSignOut={() => setConfirmSignOut(true)}
        onOpenCommand={() => palette.setOpen(true)}
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
            focusedIid={focusedIid}
            boardRef={boardRef}
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
      <Modal open={composerOpen} onClose={() => setComposerOpen(false)} ariaLabel="New issue">
        <NewIssueComposer
          allLabels={projectLabels}
          onCreate={async (input) => {
            await ctx.actions.createSideIssue(input);
            setComposerOpen(false);
          }}
          onCreateLabel={(name) => ctx.actions.createUserLabel(name)}
          onCancel={() => setComposerOpen(false)}
        />
      </Modal>
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
      <Modal
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        labelledBy="tracker-confirm-title"
        size="sm"
      >
        <div className="tracker-confirm">
          <h2 id="tracker-confirm-title" className="tracker-confirm__title">Sign out?</h2>
          <p className="tracker-confirm__body">
            You'll be signed out as @{ctx.username} and your local token will be cleared. You can sign back in any time.
          </p>
          <div className="tracker-confirm__actions">
            <button
              type="button"
              className="tracker-btn tracker-btn--ghost"
              onClick={() => setConfirmSignOut(false)}
            >Cancel</button>
            <button
              type="button"
              className="tracker-btn tracker-btn--danger tracker-btn--confirm"
              onClick={() => { setConfirmSignOut(false); void ctx.signOut(); }}
            >Sign out</button>
          </div>
        </div>
      </Modal>
      <CommandPalette
        open={palette.open}
        onClose={() => palette.setOpen(false)}
        commands={commands}
        issues={issuesArr.map((i) => ({ iid: i.iid, title: i.title, state: i.state }))}
        onJumpToIssue={(iid) => { select({ iid }); palette.setOpen(false); }}
      />
      <ShortcutsSheet open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastTray />
    </div>
  );
}
