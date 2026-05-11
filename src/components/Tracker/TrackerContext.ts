import { createContext, useContext } from "react";
import type { createActions } from "../../actions";
import type { TokenStore } from "../../auth/tokenStore";
import type { SidecarStore } from "../../data/sidecar";
import type { ApiClient } from "../../api/client";

export interface TrackerCtx {
  actions: ReturnType<typeof createActions>;
  api: ApiClient;
  tokenStore: TokenStore;
  sidecar: SidecarStore;
  ownProjectPath: string;
  instanceUrl: string;
  personalProjectId: number;
  username: string;
  signOut: () => Promise<void>;
}

export const TrackerContextC = createContext<TrackerCtx | null>(null);
export function useTrackerCtx(): TrackerCtx {
  const v = useContext(TrackerContextC);
  if (!v) throw new Error("TrackerContext missing");
  return v;
}
