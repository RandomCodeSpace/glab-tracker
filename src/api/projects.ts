import type { ApiClient } from "./client";
import type { GitLabProject } from "../types/gitlab";

export interface ProjectsApi {
  get(projectId: number): Promise<GitLabProject>;
  currentUser(): Promise<{ id: number; username: string; name: string }>;
}

export function createProjectsApi(api: ApiClient): ProjectsApi {
  return {
    get(projectId) { return api.get<GitLabProject>(`/projects/${projectId}`); },
    currentUser() { return api.get<{ id: number; username: string; name: string }>(`/user`); },
  };
}
