import { openDB, type IDBPDatabase } from "idb";
import type { OAuthTokens } from "../types/gitlab";

const STORE = "auth";
const KEY = "tokens";

interface TokenSchema {
  auth: { key: string; value: OAuthTokens };
}

export interface TokenStore {
  get(): Promise<OAuthTokens | null>;
  set(t: OAuthTokens): Promise<void>;
  clear(): Promise<void>;
}

export async function createTokenStore(dbName = "tracker"): Promise<TokenStore> {
  const db = (await openDB<TokenSchema>(dbName, 1, {
    upgrade(d) { if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE); },
    // Close on versionchange/delete so other tabs (or test re-opens) aren't blocked indefinitely.
    blocking() { db.close(); },
  })) as unknown as IDBPDatabase;

  return {
    async get() { return ((await db.get(STORE, KEY)) as OAuthTokens) ?? null; },
    async set(t) { await db.put(STORE, t, KEY); },
    async clear() { await db.delete(STORE, KEY); },
  };
}
