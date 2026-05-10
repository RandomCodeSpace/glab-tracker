import type { AuthSession } from "../auth/refresh";

export class GitLabApiError extends Error {
  constructor(public status: number, public body: string, msg: string) {
    super(msg);
    this.name = "GitLabApiError";
  }
}

export interface ApiClient {
  get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T>;
  getPaginated<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T[]>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

export function createApiClient(args: { instanceUrl: string; auth: AuthSession }): ApiClient {
  const base = args.instanceUrl.replace(/\/+$/, "") + "/api/v4";

  async function request<T>(method: string, path: string, opts: { body?: unknown; query?: Record<string, string | number | undefined> } = {}): Promise<{ data: T; res: Response }> {
    const url = new URL(base + path);
    if (opts.query) for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const send = async (token: string): Promise<Response> => {
      const init: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };
      if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
      return fetch(url.toString(), init);
    };

    let token = await args.auth.accessToken();
    let res = await send(token);
    if (res.status === 401) {
      token = await args.auth.forceRefresh();
      res = await send(token);
    }
    if (!res.ok) {
      const body = await res.text();
      throw new GitLabApiError(res.status, body, `${method} ${path} → ${res.status}`);
    }
    if (res.status === 204) return { data: undefined as unknown as T, res };
    return { data: (await res.json()) as T, res };
  }

  return {
    async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
      return (await request<T>("GET", path, query !== undefined ? { query } : {})).data;
    },
    async getPaginated<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T[]> {
      const out: T[] = [];
      let page = 1;
      while (true) {
        const { data, res } = await request<T[]>("GET", path, {
          query: { ...query, page, per_page: 100 },
        });
        out.push(...data);
        const next = res.headers.get("x-next-page");
        if (!next) break;
        page = Number(next);
        if (!Number.isFinite(page) || page <= 0) break;
      }
      return out;
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      return (await request<T>("POST", path, { body })).data;
    },
    async put<T>(path: string, body: unknown): Promise<T> {
      return (await request<T>("PUT", path, { body })).data;
    },
    async delete(path: string): Promise<void> {
      await request<void>("DELETE", path);
    },
  };
}
