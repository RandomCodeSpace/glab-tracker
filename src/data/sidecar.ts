import { openDB, type IDBPDatabase } from "idb";
import type { Flag, ColumnState } from "../types/tracker";

interface Schema {
  flagReasons: { key: string; value: { iid: number; flag: Flag; reason: string } };
  ordering: { key: ColumnState; value: number[] };
}

export interface SidecarStore {
  setFlagReason(iid: number, flag: Flag, reason: string): Promise<void>;
  getFlagReason(iid: number, flag: Flag): Promise<string | null>;
  clearFlagReason(iid: number, flag: Flag): Promise<void>;
  getAllFlagReasons(iid: number): Promise<Partial<Record<Flag, string>>>;
  setOrder(column: ColumnState, ids: number[]): Promise<void>;
  getOrder(column: ColumnState): Promise<number[] | null>;
}

const reasonKey = (iid: number, flag: Flag): string => `${iid}::${flag}`;

export async function createSidecarStore(dbName = "tracker-sidecar"): Promise<SidecarStore> {
  let db: IDBPDatabase | undefined;
  db = (await openDB<Schema>(dbName, 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("flagReasons")) d.createObjectStore("flagReasons");
      if (!d.objectStoreNames.contains("ordering")) d.createObjectStore("ordering");
    },
    blocking() { db?.close(); },
  })) as unknown as IDBPDatabase;

  const handle = db;

  return {
    async setFlagReason(iid, flag, reason) {
      await handle.put("flagReasons", { iid, flag, reason }, reasonKey(iid, flag));
    },
    async getFlagReason(iid, flag) {
      const row = (await handle.get("flagReasons", reasonKey(iid, flag))) as
        | { iid: number; flag: Flag; reason: string } | undefined;
      return row?.reason ?? null;
    },
    async clearFlagReason(iid, flag) { await handle.delete("flagReasons", reasonKey(iid, flag)); },
    async getAllFlagReasons(iid) {
      const all = (await handle.getAll("flagReasons")) as { iid: number; flag: Flag; reason: string }[];
      const out: Partial<Record<Flag, string>> = {};
      for (const r of all) if (r.iid === iid) out[r.flag] = r.reason;
      return out;
    },
    async setOrder(col, ids) { await handle.put("ordering", ids, col); },
    async getOrder(col) {
      const v = (await handle.get("ordering", col)) as number[] | undefined;
      return v ?? null;
    },
  };
}
