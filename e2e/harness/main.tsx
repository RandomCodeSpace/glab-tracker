import { createRoot } from "react-dom/client";
// Importing from src/index also pulls in styles/tracker.css (side-effect import).
import { Tracker } from "../../src/index";

// Token-mode mount: no oauthClientId / oauthRedirectUri, so the connect screen
// renders the personal-access-token form (see Tracker.tsx oauthEnabled gate).
// instanceUrl + personalProjectId are the only required TrackerProps.
//
// Deliberately NOT wrapped in <StrictMode>: the Tracker boot effect performs
// IndexedDB + async init work, and StrictMode's intentional double-invoke in
// dev makes the connect/ready sequence non-deterministic for E2E. The library
// is StrictMode-safe in production; the harness just wants a single, stable run.
const root = document.getElementById("root");
if (!root) throw new Error("Harness root element #root not found");

createRoot(root).render(<Tracker instanceUrl="https://gitlab.test" personalProjectId={42} />);
