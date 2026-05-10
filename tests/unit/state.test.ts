import { describe, it, expect } from "vitest";
import { planTransition, planFlagToggle } from "../../src/data/state";

describe("planTransition", () => {
  it("todo → doing keeps state opened", () => {
    expect(planTransition("todo", "doing")).toEqual({
      add_labels: ["state::doing"],
      remove_labels: ["state::todo"],
    });
  });

  it("doing → done closes the issue", () => {
    expect(planTransition("doing", "done")).toEqual({
      add_labels: ["state::done"],
      remove_labels: ["state::doing", "flag::blocked", "flag::reviewing"],
      state_event: "close",
    });
  });

  it("done → todo reopens", () => {
    expect(planTransition("done", "todo")).toEqual({
      add_labels: ["state::todo"],
      remove_labels: ["state::done"],
      state_event: "reopen",
    });
  });

  it("any → cancelled closes and strips flags", () => {
    expect(planTransition("doing", "cancelled")).toEqual({
      add_labels: ["state::cancelled"],
      remove_labels: ["state::doing", "flag::blocked", "flag::reviewing"],
      state_event: "close",
    });
  });

  it("cancelled → todo reopens via restore", () => {
    expect(planTransition("cancelled", "todo")).toEqual({
      add_labels: ["state::todo"],
      remove_labels: ["state::cancelled"],
      state_event: "reopen",
    });
  });

  it("no-op transition returns null", () => {
    expect(planTransition("doing", "doing")).toBeNull();
  });
});

describe("planFlagToggle", () => {
  it("turns blocked on", () => {
    expect(planFlagToggle("blocked", true)).toEqual({ add_labels: ["flag::blocked"] });
  });
  it("turns reviewing off", () => {
    expect(planFlagToggle("reviewing", false)).toEqual({ remove_labels: ["flag::reviewing"] });
  });
});
