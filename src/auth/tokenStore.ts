import { openDB, type IDBPDatabase } from "idb";
import type { OAuthTokens } from "../types/gitlab";

export type StoredAuth =
  | { kind: "oauth"; tokens: OAuthTokens }
  | { kind: "pat"; token: string };

const STORE = "auth";
const KEY = "tokens";

interface TokenSchema {
  auth: { key: string; value: StoredAuth };
}

export interface TokenStore {
  get(): Promise<StoredAuth | null>;
  set(a: StoredAuth): Promise<void>;
  clear(): Promise<void>;
}

export async function createTokenStore(dbName = "tracker"): Promise<TokenStore> {
  const db = (await openDB<TokenSchema>(dbName, 1, {
    upgrade(d) { if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE); },
    blocking() { db.close(); },
  })) as unknown as IDBPDatabase;

  return {
    async get() {
      const raw = await db.get(STORE, KEY) as StoredAuth | OAuthTokens | undefined;
      if (!raw) return null;
      if ("kind" in raw) return raw;
      // Legacy: bare OAuthTokens written by older versions.
      return { kind: "oauth", tokens: raw as OAuthTokens };
    },
    async set(a) { await db.put(STORE, a, KEY); },
    async clear() { await db.delete(STORE, KEY); },
  };
}
