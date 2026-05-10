import type { ApiClient } from "./client";
import type { GitLabLabel } from "../types/gitlab";

export interface LabelsApi {
  list(projectId: number): Promise<GitLabLabel[]>;
  create(projectId: number, input: { name: string; color: string }): Promise<GitLabLabel>;
  delete(projectId: number, name: string): Promise<void>;
}

export function createLabelsApi(api: ApiClient): LabelsApi {
  return {
    list(projectId) { return api.getPaginated<GitLabLabel>(`/projects/${projectId}/labels`); },
    create(projectId, input) {
      return api.post<GitLabLabel>(`/projects/${projectId}/labels`, input);
    },
    delete(projectId, name) {
      return api.delete(`/projects/${projectId}/labels/${encodeURIComponent(name)}`);
    },
  };
}
