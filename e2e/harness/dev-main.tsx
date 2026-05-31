import { createRoot } from "react-dom/client";
import { installFetchMock } from "./devmock";
import { Tracker } from "../../src/index";
import { createTokenStore } from "../../src/auth/tokenStore";

// Interactive dev launch: mock GitLab in the browser and seed a token so the
// app boots straight to a populated board. Sign-out still works (it returns to
// the connect screen; re-entering any token re-enters via the mocked /user).
async function boot(): Promise<void> {
  installFetchMock();
  try {
    const ts = await createTokenStore();
    await ts.set({ kind: "pat", token: "dev-token" });
  } catch {
    /* IndexedDB unavailable — the connect screen will handle sign-in */
  }
  const el = document.getElementById("root");
  if (!el) return;
  createRoot(el).render(
    <Tracker instanceUrl="https://gitlab.test" personalProjectId={42} />,
  );
}

void boot();
