import type { LabelsApi } from "./labels";
import { SYSTEM_LABEL_NAMES } from "../data/labels";

const COLORS: Record<string, string> = {
  "state::todo":      "#6b7280",
  "state::doing":     "#1d3da8",
  "state::done":      "#1c6635",
  "state::cancelled": "#7c7c7c",
  "flag::blocked":    "#a8341c",
  "flag::reviewing":  "#1d6e7a",
  "src::bau":         "#475569",
  "src::side":        "#5d2ab4",
};

export interface BootstrapResult {
  created: string[];
  alreadyPresent: string[];
}

export async function bootstrapSystemLabels(args: {
  labelsApi: LabelsApi;
  projectId: number;
}): Promise<BootstrapResult> {
  const existing = new Set((await args.labelsApi.list(args.projectId)).map((l) => l.name));
  const created: string[] = [];
  const alreadyPresent: string[] = [];
  for (const name of SYSTEM_LABEL_NAMES) {
    if (existing.has(name)) {
      alreadyPresent.push(name);
      continue;
    }
    await args.labelsApi.create(args.projectId, { name, color: COLORS[name] ?? "#888888" });
    created.push(name);
  }
  return { created, alreadyPresent };
}
