import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Chip, AddChip } from "../../src/components/Chip";

describe("<Chip>", () => {
  it("renders flat chip", () => {
    render(<Chip name="spike" hue="pink" />);
    expect(screen.getByText("spike")).toBeInTheDocument();
  });
  it("renders scoped split chip", () => {
    render(<Chip name="area::auth" hue="violet" />);
    expect(screen.getByText("area")).toBeInTheDocument();
    expect(screen.getByText("auth")).toBeInTheDocument();
  });
  it("renders add chip", () => {
    render(<AddChip label="New label" />);
    expect(screen.getByText("New label")).toBeInTheDocument();
  });
});
