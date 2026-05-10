import { describe, it, expect, vi } from "vitest";
import { bootstrapSystemLabels } from "../../src/api/bootstrap";

const fakeLabelsApi = (existing: string[]) => {
  const list = vi.fn().mockResolvedValue(existing.map((name) => ({
    id: 1, name, color: "#000", description: null, text_color: "#fff",
  })));
  const create = vi.fn().mockResolvedValue({ id: 99, name: "x", color: "#000", description: null, text_color: "#fff" });
  return { list, create, delete: vi.fn(), _list: list, _create: create };
};

describe("bootstrapSystemLabels", () => {
  it("creates only labels that are missing", async () => {
    const api = fakeLabelsApi(["state::todo", "src::bau"]);
    const r = await bootstrapSystemLabels({ labelsApi: api as any, projectId: 1 });
    expect(r.alreadyPresent).toEqual(expect.arrayContaining(["state::todo", "src::bau"]));
    expect(api._create).toHaveBeenCalled();
    expect(r.created).not.toContain("state::todo");
  });

  it("creates all if none exist", async () => {
    const api = fakeLabelsApi([]);
    const r = await bootstrapSystemLabels({ labelsApi: api as any, projectId: 1 });
    expect(r.alreadyPresent).toEqual([]);
    expect(r.created.length).toBe(8);
  });
});
