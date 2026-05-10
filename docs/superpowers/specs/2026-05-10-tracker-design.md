# Personal Issue Tracker — Design Spec

**Date:** 2026-05-10
**Status:** Draft for user review
**Form factor:** Public npm package — React component

## 1. Problem & shape

Engineer is assigned issues across many GitLab projects, each with its own conventions for status/labels. They want **one personal kanban** that tracks their work end-to-end without altering the source projects. They also want to mix in self-created side-project tasks on the same board.

The component is published as an npm package and consumed by a static site (typically GitLab Pages). All sensitive config — instance URL, OAuth client ID, redirect URI, personal project ID — is supplied by the consumer at mount time. Single GitLab instance per mount.

## 2. Hard architectural rules

These shape every other decision and are non-negotiable.

1. **Zero footprint on source projects.** The component is *strictly read-only* on every GitLab project except the user's private personal tracker project. Never POST, PUT, PATCH, or DELETE against any source project. No comments, no reactions, no assignment changes — nothing.
2. **No cross-references in any content we write.** GitLab auto-creates backreference comments on the referenced issue/project when it parses references in any content we author. We sanitize all such patterns before sending content to GitLab.
3. **GitLab is the source of truth.** IndexedDB is purely a read cache to reduce API chatter. Every write hits the GitLab API first; the cache updates after success.
4. **Personal tracker project must be `visibility=private`.** The component refuses to operate on a non-private project (configurable check on first connect). Otherwise, copied titles/descriptions become publicly searchable.
5. **No inline styles in JSX.** All styling lives in the shipped CSS file via classes and CSS custom properties.

## 3. Distribution & build

| | |
|---|---|
| Package | Public npm registry, scoped name TBD |
| Language | TypeScript-first |
| Framework | React (peer dep on `react`, `react-dom`) |
| Build | Vite library mode, dual ESM + CJS, `vite-plugin-dts` for `.d.ts` |
| License | MIT |
| Dev workflow | `npm link` against a local consumer site for testing |
| Stylesheet | One shipped `tracker.css`, theme tokens as CSS custom properties |
| Theme | Single in-between cream theme; consumer can override CSS variables |

## 4. Configuration props

```ts
interface TrackerProps {
  instanceUrl: string;          // e.g. "https://gitlab.acme.io"
  oauthClientId: string;        // GitLab application ID
  oauthRedirectUri: string;     // consumer's deployed URL
  personalProjectId: number;    // numeric project id (paths can change; ids are stable)
}
```

No optional theme prop. Theme overrides happen via consumer-supplied CSS targeting `--tracker-*` variables on a wrapper class.

## 5. Authentication

OAuth 2.0 Authorization Code with PKCE. No client secret (SPA-friendly).

- Code verifier in `sessionStorage` only during the exchange round-trip.
- Access + refresh tokens stored at rest in IndexedDB.
- Silent refresh on first 401; concurrent calls during refresh are queued.
- Token scope: `api` + `read_user`.
- On refresh failure: surface a "reconnect" prompt; user re-authorizes.

First-run flow:
1. OAuth authorize round-trip — user consents on the configured GitLab instance.
2. Component prompts for personal project ID, validates: exists, user is Maintainer+, `visibility === 'private'`.
3. Idempotent label bootstrap: creates `state::todo`, `state::doing`, `state::done`, `state::cancelled`, `flag::blocked`, `flag::reviewing`, `src::bau`, `src::side` if they don't exist. (`src::bau::<pid>-<iid>` labels are created lazily as issues are forked.)

## 6. Data model

### 6.1 Source of truth

GitLab personal project. IndexedDB caches reads; writes always hit GitLab first and update cache after success.

### 6.2 Sidecar data (IndexedDB only, lossy on storage clear)

- Flag reasons (free-text, e.g. "awaiting spec sign-off") — labels can't carry arbitrary text and we don't want to pollute description/comments.
- Intra-column ordering — GitLab has no native first-class issue ordering; we don't introduce one.
- Recently-viewed cards, drawer scroll state, popover ephemeral state.

If storage is cleared: flags themselves stay (they're labels in GitLab); reasons go missing — card shows just `BLOCKED` without context. Acceptable v1 trade-off.

### 6.3 Label semantics on every local issue

| Label | Cardinality | Purpose |
|---|---|---|
| `state::todo` / `state::doing` / `state::done` / `state::cancelled` | Exactly one (`state` scope) | Column placement. `cancelled` is hidden from board, lives in cancelled bucket. |
| `src::bau` *or* `src::side` | Exactly one (`src` scope at first level) | Origin: forked from elsewhere vs created here |
| `src::bau::<projectId>-<issueIid>` | Exactly one if `src::bau` (sub-scope `src::bau`) | Source identity, drives idempotency and the source-link icon |
| `flag::blocked` | 0..1 | Orthogonal annotation |
| `flag::reviewing` | 0..1 | Orthogonal annotation |
| User labels (anything else) | 0..N | Free user categorization |

Reserved scopes that the component *never* renders as chips: `state::*`, `src::*`, `flag::*`. Each has dedicated UI (column, source-link icon, flag rail). User labels render as chips.

### 6.4 Native GitLab state mapping

The native `state` field (`opened`/`closed`) is kept in lockstep with the column placement:

- `state::todo` / `state::doing` ↔ GitLab `state=opened`
- `state::done` ↔ GitLab `state=closed`
- `state::cancelled` ↔ GitLab `state=closed`

Every column move is a *single PUT* combining `add_labels`, `remove_labels`, and (when crossing the open/closed boundary) `state_event=close`/`reopen`.

## 7. Sync model

### 7.1 Detached fork

Initial fork copies metadata once. Local copy is independent thereafter — title/description edits, label changes, state moves, notes — none of it propagates back upstream.

### 7.2 Three creation paths

1. **Paste a GitLab issue URL** in the toolbar input — primary daily flow. Fetches the source via API, sanitizes, forks into Triage.
2. **"Sync all open assigned" button** — `GET /issues?scope=assigned_to_me&state=opened`, paginated. For each result, if no local issue carries `src::bau::<pid>-<iid>`, fork it.
3. **"New issue" button** — creates a `src::side` issue from scratch.

### 7.3 Fields copied at fork

Kept: title, description, due date, weight.
Skipped: source labels, milestone, co-assignees, time-tracking, attachments. Source labels are kept project-private; if the user wants to know them, they hit "Pull source" which posts a sanitized snapshot comment on the local copy.

### 7.4 Sanitization rules

Before any content is written to any GitLab issue (forked title/description, snapshot comments, user notes, edited descriptions), the following patterns are backtick-wrapped to render as literal text and prevent backreference notifications:

- `@username` (other-user mentions across projects)
- `group/project#NNN` (cross-project issue refs)
- `group/project!NNN` (cross-project MR refs)
- Full GitLab URLs to other projects (`https://…/group/project/-/issues/N`)
- `~labelname` from outside the personal project
- `%milestonename` from outside the personal project

Within the personal project (e.g. user's note referencing `#42` of the same project, or `~yourown-label`): keep as-is — no leak risk.

"Pull source" snapshot comments wrap the verbatim source title/description/labels in a fenced code block (` ``` `). GitLab does not parse references inside code fences, so this is the simplest blanket safety net.

### 7.5 Idempotency

A source issue `(pid, iid)` is considered already forked if any local issue carries the label `src::bau::<pid>-<iid>`. Forking is skipped for already-forked sources.

### 7.6 Divergence indicator

Computed as a side-effect of "Sync all open assigned":

- Local card with `state::done` *and* its `(pid, iid)` is in the open-assigned response → amber dot, "source still open upstream".
- Local card not `state::done` and not `state::cancelled`, *and* its `(pid, iid)` is *not* in the open-assigned response → teal dot, "source closed/unassigned upstream".
- Cancelled cards: indicator suppressed (the user has explicitly stepped away; no nag).

The indicator is computed client-side; no extra API calls.

## 8. Lifecycle UI

### 8.1 Three columns + orthogonal flags

The board has three columns: **To do · Doing · Done**. The 90% common case (open / in-progress / closed) lives here.

The 5–10% case (blocked, reviewing, cancelled) is handled as **orthogonal annotations** rather than additional columns:

- **Blocked** — `flag::blocked` label. Card stays in its column, gets a 3px red rail at the left edge, opacity reduced to 92%, sorted to the bottom of the column. Optional free-text reason rendered as a muted context line (`BLOCKED · awaiting spec sign-off`).
- **Reviewing** — `flag::reviewing` label. Card stays in its column, 3px teal rail, sorted to the **top** of the column (highlights "almost done"). Optional reason context.
- **Both flags at once** — split rail (top half red, bottom half teal). Sort precedence: blocked wins, card sits at bottom.
- **Cancelled** — `state::cancelled` (mutually exclusive with column states). Hidden from board entirely. Lives in a Cancelled view reachable from the toolbar status counter. Restorable.

### 8.2 Status counters in the toolbar

```
●  3  blocked     ●  2  reviewing     ⊘  5  cancelled
```

Always visible. Two roles:

1. **Click to filter** — toggles a filter scoping the board to issues with that flag (or the cancelled-view in the case of cancelled).
2. **Drop targets while dragging** — when a drag starts, the counter cluster inflates: counters scale up ~4%, gain colored backgrounds and glows, and become `useDroppable` zones. Dropping a card on a counter sets/cancels accordingly.

### 8.3 Transitions (drag-to-counter)

| Drop target | Effect |
|---|---|
| Column (To do / Doing / Done) | Single PUT: update `state::*` label, add `state_event` if crossing open/closed boundary |
| `blocked` counter | Inline reason composer drops down for ~3s; on save, single PUT adds `flag::blocked` |
| `reviewing` counter | Same flow, adds `flag::reviewing` |
| `cancelled` counter | Confirmation toast (Undo for ~6s); on confirm, single PUT adds `state::cancelled`, removes prior `state::*`, `state_event=close` |

Optimistic UI throughout: card moves immediately; on API failure, snap back and surface a toast. No queue-and-retry in v1.

### 8.4 Alternate transition paths

For non-DnD users:

- **Drawer** — state pill (clickable column picker), flag toggles in meta row, More menu for Cancel/Delete.
- **Right-click on a card** — context menu with the same actions.
- **Keyboard on focused card** — `⌘⇧←/→` move column, `B` toggle blocked, `R` toggle reviewing, `⌘⌫` cancel.

### 8.5 Restore from Cancelled

The cancelled-counter, when not dragging, opens a Cancelled list view. Each row has a Restore action that sets `state::todo`, removes `state::cancelled`, and reopens the GitLab issue.

### 8.6 Flag reason capture

Three entry points:

1. **After drag-to-counter** — inline composer slides down: "Reason for blocking? [____] *Skip*".
2. **Drawer toggle** — when toggled on, expands inline to reveal a single-line reason input.
3. **Right-click → "Mark blocked…"** — small reason input attached to the card.

Reasons are stored in IndexedDB only. A v2 escape hatch (single hidden marker comment per issue carrying a JSON blob of UI sidecar) is deferred.

## 9. Cards

```
┌─────────────────────────────────────┐
│ Title (15px / 600)                  │
│ 1–2 line description preview        │
│                                     │
│ [chip] [chip] [chip]                │
│ ───────────────────────────────────  │
│ ↗  May 9 · w3 · 💬 3       ●       │
└─────────────────────────────────────┘
```

- **Title** at 15px, weight 600, line-height 1.34, tracking -0.012em.
- **Description preview** — first 1-2 lines of the description, muted, line-clamp 2.
- **Label rail** — split-pill scoped chips and flat single-tone chips. Detection: name contains `::` → split.
- **Footer (separated by hairline)**:
  - **Source-link icon** — small external-link glyph, real `<a target="_blank">` to the source GitLab issue. *Generated client-side from the `src::bau::<pid>-<iid>` label; never written into the issue body.* `src::side` cards have no icon.
  - **Due date** — mono numerals; warm-tinted (`--warn`) if overdue.
  - **Weight** — mono `wN`.
  - **Notes affordance** — chat icon + count when notes exist; "+ note" when zero. Clicking opens the quick-notes popover.
  - **Divergence dot** — colored 7px circle if divergence detected, with halo glow + tooltip.
- **Optional flag rail** — 3px solid color at left edge when blocked or reviewing; gradient split when both.
- **Optional flag mini-header** — above the title, uppercase 10px text with optional reason context, hover-revealed `×` to clear.

Hover lifts the card 1px and deepens shadow; active card carries an accent ring around it.

## 10. Detail drawer

Slides in from the right at 580px wide with a soft leading-edge shadow.

- **Header bar (icon strip)** — back, open-source, pull-snapshot, more (Cancel/Delete), close.
- **Meta row** — state pill (clickable column picker); source state value; flag toggles (Blocked / Reviewing) shown as on/off chips.
- **Title** at 32px, weight 600, `contenteditable`. Saves on blur.
- **Labels** — current labels + `+ Add label` chip opening the picker popover.
- **Description** as hero prose (14.5px / 1.66 line-height), `contenteditable`. Markdown rendering. Saves on blur.
- **Stream** — chronological mix of source snapshots (raw mono text in a code-fence-styled entry) and user notes (rendered prose entries). Hairlines separate entries. Newest first.
- **Persistent compose input** at the bottom — type a note and press Enter.

### Editing semantics

`contenteditable` for title and description. On blur or Enter (title), single PUT updates the field on GitLab — sanitization runs first.

## 11. Quick notes popover

Anchored to the card's notes affordance.

- 320px wide, soft shadow, hairline border.
- Heading: `NOTES · 3` (count).
- Latest 2-3 notes inline (author + relative timestamp + body).
- Single-line composer input below; ⏎ saves, ⇧⏎ multi-line, esc dismisses.
- Footer: "View all in drawer →" link + key hints.
- Saved notes POST to `/projects/:id/issues/:iid/notes`. Sanitization runs on save.
- Popover stays open after save for chaining; card's note count increments.

## 12. User labels & label picker

- Created via the picker popover (opened from `+ Add label` / `+ New label` chips).
- Hue palette: 7 hues — blue, violet, pink, amber, green, teal, slate.
- Render as **split-pill** if the label name contains `::`; otherwise flat single-tone chip.
- Filterable via the filter rail under the toolbar (click chip to filter; click again to clear).
- Reserved scopes (`state::*`, `flag::*`, `src::*`) cannot be created or edited via the picker — they're managed system labels.

## 13. Drag and drop

`dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) — MIT, no known CVEs as of writing.

- One `DndContext` wraps the board.
- Six `Droppable` zones at the column level (the three actual columns) plus three more (the toolbar status counters).
- Each card is `useSortable`.
- `DragOverlay` renders the floating preview during drag (matches `.card` styles plus `--shadow-drag`).
- On drag start, the toolbar `.counters` get the `.is-dragging` state — counters inflate, gain colored glows, become drop-receptive.
- A drop hint banner slides in just below the toolbar with the three semantics: "Drop on a column → state · Drop on blocked/reviewing → flag · Drop on cancelled → cancel".
- Cross-column drops emit a single PUT (label change ± `state_event`).
- Counter drops emit a single PUT (flag label add) or open the confirm flow (cancel).
- Intra-column reorder is local-only: the new order is persisted to IndexedDB but never written to GitLab.
- Keyboard sensor: focus a card with Tab, space to grab, arrow keys to move, space to drop.

## 14. Theme & styling

- Plain CSS, single shipped `tracker.css`.
- All theme values as CSS custom properties on the `:root` of the component's wrapper class.
- Single in-between cream theme. Consumer overrides via their own CSS targeting the wrapper class.
- No inline styles in JSX (`style={{}}` props forbidden).
- Typography: `Geist` for sans, `Geist Mono` for mono, with system fallbacks.

### Core tokens (visual identity)

```css
.tracker {
  --canvas: #d8d0bd;
  --surface: #e8e1ce;
  --surface-2: #c8c0aa;
  --line: rgba(26, 24, 16, 0.10);
  --line-strong: rgba(26, 24, 16, 0.20);
  --ink: #1a1810;
  --ink-2: #5b5544;
  --ink-3: #8a8470;
  --ink-4: #b3ad99;
  --accent: #1d3da8;
  --accent-fg: #e8e1ce;
  --blocked: #a8341c;
  --reviewing: #1d6e7a;
  --warn: #8b4a09;
  --done: #1c6635;
  /* … radii, shadows, fonts, hue palette … */
}
```

## 15. Errors, offline, edge cases

- API failure → optimistic UI reverts; toast surfaces the error.
- 401 → silent refresh; on refresh failure, "reconnect" prompt.
- Manually changing labels/state in GitLab UI desyncs the local model. We don't reconcile automatically — user drags to fix. Documented limitation.
- No background polling. User triggers Sync all manually.
- Cleared browser storage loses flag reasons (labels stay).

## 16. Out of scope for v1

- Background sync / auto-poll.
- In-component allow-list management for source projects (initial sync is instance-wide).
- Multi-instance support (one mount = one GitLab instance).
- Marker-comment persistence for flag reasons (deferred to v2).
- Cross-issue text search.
- Mobile-specific UX.
- i18n / RTL.
- Real-time collaboration (single-user by design).

## 17. Testing strategy

- **Unit:** sanitization rules (every leak pattern), label parsing (system vs user, scoped vs flat), state-transition mapping, sort precedence (blocked precedence over reviewing).
- **Integration:** OAuth/PKCE flow, fork from URL, sync-all-open-assigned, state move (each transition combo), flag toggle, cancel + restore, divergence detection.
- **Visual:** Storybook for card variants (plain / reviewing / blocked / both / active / side), drawer states, popover, connect screen.
- **E2E:** against a real GitLab test instance (CI can hit `gitlab.com` with a throwaway project).

## 18. Open questions / deferred decisions

- Default theme override mechanism's exact CSS-variable surface — finalize during implementation.
- Whether to ship a `Provider` companion for OAuth state alongside the `<Tracker>` component, or keep it monolithic — decide during implementation.
- Specific scoped name on npm — pick before publish.

---

End of spec. Ready for review.
