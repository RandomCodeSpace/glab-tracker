import { openDB, type IDBPDatabase } from "idb";
import type { GitLabIssue, GitLabLabel } from "../types/gitlab";

interface Schema {
  issues: { key: number; value: GitLabIssue; indexes: { byUpdatedAt: string } };
  labels: { key: string; value: GitLabLabel };
  meta: { key: string; value: unknown };
}

export interface IssueCache {
  putIssues(issues: GitLabIssue[]): Promise<void>;
  putIssue(issue: GitLabIssue): Promise<void>;
  getAllIssues(): Promise<GitLabIssue[]>;
  deleteIssue(iid: number): Promise<void>;
  putLabels(labels: GitLabLabel[]): Promise<void>;
  getLabels(): Promise<GitLabLabel[]>;
  setMeta<T>(key: string, value: T): Promise<void>;
  getMeta<T>(key: string): Promise<T | null>;
}

export async function createIssueCache(dbName = "tracker"): Promise<IssueCache> {
  let db: IDBPDatabase | undefined;
  db = (await openDB<Schema>(dbName, 2, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        if (!d.objectStoreNames.contains("auth")) d.createObjectStore("auth");
      }
      if (oldVersion < 2) {
        const issues = d.createObjectStore("issues", { keyPath: "iid" });
        issues.createIndex("byUpdatedAt", "updated_at");
        d.createObjectStore("labels", { keyPath: "name" });
        d.createObjectStore("meta");
      }
    },
    blocking() { db?.close(); },
  })) as unknown as IDBPDatabase;

  const handle = db;

  return {
    async putIssues(issues) {
      const tx = handle.transaction("issues", "readwrite");
      await Promise.all(issues.map((i) => tx.store.put(i)));
      await tx.done;
    },
    async putIssue(i) { await handle.put("issues", i); },
    async getAllIssues() { return (await handle.getAll("issues")) as GitLabIssue[]; },
    async deleteIssue(iid) { await handle.delete("issues", iid); },
    async putLabels(labels) {
      const tx = handle.transaction("labels", "readwrite");
      await Promise.all(labels.map((l) => tx.store.put(l)));
      await tx.done;
    },
    async getLabels() { return (await handle.getAll("labels")) as GitLabLabel[]; },
    async setMeta(key, value) { await handle.put("meta", value as unknown, key); },
    async getMeta<T>(key: string) { return ((await handle.get("meta", key)) as T | undefined) ?? null; },
  };
}
