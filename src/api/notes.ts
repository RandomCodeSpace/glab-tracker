import type { ApiClient } from "./client";
import type { GitLabNote } from "../types/gitlab";

export interface NotesApi {
  list(projectId: number, iid: number): Promise<GitLabNote[]>;
  create(projectId: number, iid: number, body: string): Promise<GitLabNote>;
}

export function createNotesApi(api: ApiClient): NotesApi {
  return {
    list(projectId, iid) {
      return api.getPaginated<GitLabNote>(`/projects/${projectId}/issues/${iid}/notes`);
    },
    create(projectId, iid, body) {
      return api.post<GitLabNote>(`/projects/${projectId}/issues/${iid}/notes`, { body });
    },
  };
}
