# Lane

> Distributed on npm as [`@ossrandom/lane`](https://www.npmjs.com/package/@ossrandom/lane).

A React component that mounts a personal kanban-style tracker on top of your own GitLab account, so you can plan, flag, and reorder issues from across an entire instance without ever writing back to the projects they live in. The component reads from any GitLab project you have access to and writes only to a single private "personal tracker" project that you own — every other project is strictly read-only.

## Status

MIT licensed. Requires React 18+ or 19+. `react` and `react-dom` are peer dependencies — host app provides them.

## Install

```bash
npm install @ossrandom/lane
```

The component ships pre-compiled CSS in a separate file. Import it once, anywhere in your app's bundle:

```ts
import "@ossrandom/lane/style.css";
```

The default JS entry also pulls the stylesheet as a side-effect import, so most bundlers will pick it up automatically if you `import { Tracker } from "@ossrandom/lane"`. Importing `style.css` explicitly is the safe option when your bundler is configured to drop side-effect imports.

## Quickstart

```tsx
import { Tracker } from "@ossrandom/lane";
import "@ossrandom/lane/style.css";

export default function App() {
  return (
    <Tracker
      instanceUrl="https://gitlab.example.com"
      oauthClientId="abc123def456..."
      oauthRedirectUri="https://you.gitlab.io/tracker/"
      personalProjectId={42}
    />
  );
}
```

The four required props:

- **`instanceUrl`** — the GitLab instance base URL, no trailing slash. Example: `https://gitlab.com` for GitLab SaaS, or your self-hosted equivalent.
- **`oauthClientId`** — the Application ID issued when you register an OAuth application on that instance (see next section).
- **`oauthRedirectUri`** — the exact URL where the page hosting `<Tracker>` is reachable. Must match the Redirect URI configured on the OAuth application byte-for-byte.
- **`personalProjectId`** — the numeric project ID of the private GitLab project that will hold your personal tracker. Find it on the project's main page (shown beneath the title) or via `/api/v4/projects/:path`.

## OAuth application setup

The component authenticates against GitLab using the OAuth 2.0 authorization code flow with PKCE. You need to register an OAuth application once per GitLab instance.

1. On the target GitLab instance, go to **Preferences -> Applications** (for a personal application) or the group/instance admin Applications page (for a shared one).
2. Click **New application**.
3. **Name** — anything memorable, e.g. `Personal Tracker`.
4. **Redirect URI** — the URL where the host page renders `<Tracker>`. This must match `oauthRedirectUri` exactly, including trailing slash.
5. **Scopes** — tick `api` only. `api` already grants the read-user permission needed to display your identity in the topbar, plus the read+write access needed to create issues, notes, and labels in your personal project.
6. **Confidential** — leave **unchecked**. The component runs in the browser and cannot hold a client secret; it is a public client and uses PKCE instead.
7. Save. Copy the **Application ID** that GitLab shows — that's your `oauthClientId`.

## Personal project setup

The component does not create the personal project for you. Set it up manually once:

1. On the GitLab instance, create a new project. Any name is fine.
2. **Visibility must be Private.** The component checks this on first connect and refuses to operate against a Public or Internal project. This is deliberate — your personal tracker contains your private flags, ordering, and notes, and must not leak.
3. Note the numeric project ID shown on the project's main page; pass it as `personalProjectId`.
4. On first run, the component prompts for the project ID, validates visibility, and then idempotently bootstraps eight system labels:
   - `state::todo`, `state::doing`, `state::done`, `state::cancelled`
   - `flag::blocked`, `flag::reviewing`
   - `src::bau`, `src::side`

   Bootstrap runs only once per project; subsequent loads detect the labels already exist and skip.

## Theming

A single in-between cream-on-ink theme ships by default. Override individual tokens by scoping a CSS rule to the `.tracker` selector or to an instance class you pass via the `className` prop:

```css
.tracker {
  --canvas: #yourbg;
  --surface: #yoursurface;
  --ink: #yourink;
  --accent: #youraccent;
  /* ...etc. — see src/styles/tokens.css in source for the full list */
}
```

To scope overrides to a single mount (e.g. when you have other styling that defines `.tracker`):

```tsx
<Tracker className="my-app-tracker" {/* ...rest */} />
```

```css
.my-app-tracker.tracker {
  --accent: #cc4400;
}
```

## Hard rules and warnings

- **Zero footprint on source projects.** The component is strictly read-only on every GitLab project except the one passed as `personalProjectId`. It never POSTs, PUTs, PATCHes, or DELETEs against source projects. When you fork a source issue into your tracker, the original issue is not touched in any way — no comment, no label, no subscription, no reference. This is verified by sanitization (below) and enforced in the API layer.

- **Sanitization.** All content the component writes to GitLab — issue titles, descriptions, notes — is run through a sanitizer that wraps anything GitLab would auto-cross-reference in backticks. This covers `@username` mentions, `group/proj#42` issue references, `group/proj!88` MR references, and full URLs to other projects. Backtick-wrapped, GitLab renders them as literal monospace text instead of creating a backlink in the referenced project. The end-to-end result: pasting an upstream description into your tracker produces zero notifications anywhere else.

- **IndexedDB sidecar.** Flag reasons (the free-text "why" you wrote next to a `blocked` or `reviewing` flag) and local-only column ordering live in IndexedDB on the device you're using. Clearing browser storage drops these. The flag itself survives because it lives in GitLab as a label; only the local prose disappears. The ordering will fall back to GitLab's default order until you drag cards again.

- **Tokens.** Access and refresh tokens are stored in IndexedDB on this device only. They are never sent anywhere except to the configured GitLab instance. No cookies, no analytics, no third-party endpoints.

## Browser support

Modern evergreen browsers — the latest two stable versions of Chrome, Edge, Firefox, and Safari. The component requires `crypto.subtle` (for PKCE), `IndexedDB` (for tokens and sidecar), and ES2022. No polyfills shipped; if you need to support older browsers, transpile and polyfill in your host app's bundler.

## Known limitations (v1)

- No background polling. The user manually clicks **Sync all** in the topbar to pull fresh state. This is by design — pollers in browser tabs are an easy way to burn through GitLab API rate limits unintentionally.
- Source project path is not displayed on cards in v1. A source-link icon will be wired in v2; for now, use the drawer to see the upstream reference.
- Single GitLab instance per mount. If you need to track issues across two instances, mount two `<Tracker>` instances against different `instanceUrl` values.
- Manual label or state changes made in the GitLab UI (outside this component) will desync the local model until the next sync. The simplest fix: drag the card to the column you want; the local state plus a write to GitLab will reconcile.

## License

MIT.
