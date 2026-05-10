import type { ApiClient } from "./client";
import type { GitLabIssue } from "../types/gitlab";
import type { IssuePatch } from "../data/state";

export interface IssuesApi {
  listInProject(projectId: number, opts?: { state?: "opened" | "closed" | "all" }): Promise<GitLabIssue[]>;
  listOpenAssignedToMe(): Promise<GitLabIssue[]>;
  getOne(projectPath: string, iid: number): Promise<GitLabIssue>;
  create(projectId: number, input: {
    title: string; description: string;
    labels: string[];
    due_date?: string | null;
    weight?: number | null;
  }): Promise<GitLabIssue>;
  update(projectId: number, iid: number, patch: IssuePatch & {
    title?: string; description?: string; due_date?: string | null; weight?: number | null;
  }): Promise<GitLabIssue>;
  delete(projectId: number, iid: number): Promise<void>;
}

export function createIssuesApi(api: ApiClient): IssuesApi {
  return {
    listInProject(projectId, opts) {
      return api.getPaginated<GitLabIssue>(`/projects/${projectId}/issues`, {
        state: opts?.state ?? "all",
      });
    },
    listOpenAssignedToMe() {
      return api.getPaginated<GitLabIssue>(`/issues`, {
        scope: "assigned_to_me",
        state: "opened",
      });
    },
    getOne(projectPath, iid) {
      const enc = encodeURIComponent(projectPath);
      return api.get<GitLabIssue>(`/projects/${enc}/issues/${iid}`);
    },
    create(projectId, input) {
      const body: Record<string, unknown> = {
        title: input.title,
        description: input.description,
        labels: input.labels.join(","),
      };
      if (input.due_date != null) body.due_date = input.due_date;
      if (input.weight != null) body.weight = input.weight;
      return api.post<GitLabIssue>(`/projects/${projectId}/issues`, body);
    },
    update(projectId, iid, patch) {
      const body: Record<string, unknown> = {};
      if (patch.add_labels?.length) body.add_labels = patch.add_labels.join(",");
      if (patch.remove_labels?.length) body.remove_labels = patch.remove_labels.join(",");
      if (patch.state_event) body.state_event = patch.state_event;
      if (patch.title !== undefined) body.title = patch.title;
      if (patch.description !== undefined) body.description = patch.description;
      if (patch.due_date !== undefined) body.due_date = patch.due_date;
      if (patch.weight !== undefined) body.weight = patch.weight;
      return api.put<GitLabIssue>(`/projects/${projectId}/issues/${iid}`, body);
    },
    delete(projectId, iid) {
      return api.delete(`/projects/${projectId}/issues/${iid}`);
    },
  };
}
