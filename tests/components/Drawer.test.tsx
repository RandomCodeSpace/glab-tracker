import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Issue } from "../../src/types/tracker";
import { Drawer, type DrawerProps } from "../../src/components/Drawer/Drawer";

function makeIssue(iid: number, title: string, description: string): Issue {
  return {
    id: iid,
    iid,
    state: "doing",
    origin: "side",
    source: null,
    flags: new Set(),
    flagReasons: {},
    title,
    description,
    dueDate: null,
    weight: null,
    userLabels: [],
    noteCount: 0,
    divergence: null,
    updatedAt: "2026-05-10T00:00:00Z",
    webUrl: "https://x",
  };
}

function drawerProps(issue: Issue): DrawerProps {
  return {
    issue,
    webUrl: "https://x",
    hasSource: false,
    notes: [],
    onClose: vi.fn(),
    onChangeState: vi.fn(),
    onToggleFlag: vi.fn(),
    onEditTitle: vi.fn(),
    onEditDescription: vi.fn(),
    onAddNote: vi.fn(),
    onPullSnapshot: vi.fn(),
    onCancelIssue: vi.fn(),
    onDeleteIssue: vi.fn(),
    onAddLabel: vi.fn(),
  };
}

describe("<Drawer> prose draft isolation", () => {
  it("without a key, DrawerProse leaks the previous issue's draft (regression demo)", () => {
    const A = makeIssue(1, "Title A", "Description A");
    const B = makeIssue(2, "Title B", "Description B");

    // No key — React reconciles same Drawer mount; DrawerProse useState retains.
    const { rerender } = render(<Drawer {...drawerProps(A)} />);
    fireEvent.click(screen.getByText("Title A"));
    const inputA = screen.getByDisplayValue("Title A") as HTMLInputElement;
    fireEvent.change(inputA, { target: { value: "DRAFT_LEAK" } });
    expect(inputA.value).toBe("DRAFT_LEAK");

    rerender(<Drawer {...drawerProps(B)} />);

    // BUG: the input still holds the leaked draft because DrawerProse
    // useState(title) ran once and never resyncs with the new title prop.
    // This assertion DOCUMENTS the regression we're guarding against.
    const stillThere = screen.queryByDisplayValue("DRAFT_LEAK");
    expect(stillThere).not.toBeNull();
  });

  it("with key={iid}, DrawerProse resets drafts when switching issues", () => {
    const A = makeIssue(1, "Title A", "Description A");
    const B = makeIssue(2, "Title B", "Description B");

    // With a key tied to the issue iid, React re-mounts on switch.
    const { rerender } = render(<Drawer key={A.iid} {...drawerProps(A)} />);
    fireEvent.click(screen.getByText("Title A"));
    const inputA = screen.getByDisplayValue("Title A") as HTMLInputElement;
    fireEvent.change(inputA, { target: { value: "DRAFT_LEAK" } });

    rerender(<Drawer key={B.iid} {...drawerProps(B)} />);

    // The leaked draft must NOT be in the DOM after a key change.
    expect(screen.queryByDisplayValue("DRAFT_LEAK")).toBeNull();
    // And the new title should render as the h1 heading (not in edit mode).
    expect(screen.getByText("Title B")).toBeInTheDocument();
  });
});
