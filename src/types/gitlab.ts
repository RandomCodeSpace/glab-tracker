export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
}

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  visibility: "private" | "internal" | "public";
  web_url: string;
}

export interface GitLabLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
  text_color: string;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: "opened" | "closed";
  labels: string[];
  assignees: GitLabUser[];
  due_date: string | null;
  weight: number | null;
  user_notes_count: number;
  updated_at: string;
  web_url: string;
  references: { full: string };  // e.g. "group-a/alpha#421"
}

export interface GitLabNote {
  id: number;
  body: string;
  author: GitLabUser;
  created_at: string;
  system: boolean;
}

export interface GitLabPaginated<T> {
  items: T[];
  totalPages: number;
  nextPage: number | null;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;     // seconds
  obtained_at: number;    // ms epoch
  scope: string;
}
