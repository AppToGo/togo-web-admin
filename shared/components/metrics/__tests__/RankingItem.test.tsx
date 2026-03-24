/**
 * Tests for RankingItem Component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { RankingItem } from "../RankingItem";

describe("RankingItem", () => {
  it("renders with required props", () => {
    render(<RankingItem position={1} name="John Doe" />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders position number for positions > 3", () => {
    render(<RankingItem position={4} name="Jane Smith" />);

    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders medal icon for top 3 positions", () => {
    const { rerender } = render(<RankingItem position={1} name="First" />);
    expect(document.querySelector("svg")).toBeInTheDocument();

    rerender(<RankingItem position={2} name="Second" />);
    expect(document.querySelector("svg")).toBeInTheDocument();

    rerender(<RankingItem position={3} name="Third" />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("applies correct color classes for gold (position 1)", () => {
    render(<RankingItem position={1} name="Winner" />);

    const badge = screen.getByText("Winner").previousElementSibling;
    expect(badge).toHaveClass("bg-amber-100");
    expect(badge).toHaveClass("text-amber-700");
  });

  it("applies correct color classes for silver (position 2)", () => {
    render(<RankingItem position={2} name="Runner-up" />);

    const badge = screen.getByText("Runner-up").previousElementSibling;
    expect(badge).toHaveClass("bg-slate-100");
    expect(badge).toHaveClass("text-slate-700");
  });

  it("applies correct color classes for bronze (position 3)", () => {
    render(<RankingItem position={3} name="Third" />);

    const badge = screen.getByText("Third").previousElementSibling;
    expect(badge).toHaveClass("bg-orange-100");
    expect(badge).toHaveClass("text-orange-700");
  });

  it("applies default color classes for positions > 3", () => {
    render(<RankingItem position={5} name="Fifth" />);

    const badge = screen.getByText("Fifth").previousElementSibling;
    expect(badge).toHaveClass("bg-slate-50");
    expect(badge).toHaveClass("text-slate-600");
  });

  it("renders subtitle when provided", () => {
    render(
      <RankingItem
        position={1}
        name="John Doe"
        subtitle="john@example.com"
      />
    );

    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("renders value when provided", () => {
    render(
      <RankingItem position={1} name="John Doe" value="$1,000" />
    );

    expect(screen.getByText("$1,000")).toBeInTheDocument();
    expect(screen.getByText("$1,000")).toHaveClass("text-emerald-600");
  });

  it("renders as Link when href is provided", () => {
    render(
      <RankingItem
        position={1}
        name="John Doe"
        href="/customers/123"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/customers/123");
    expect(link).toHaveClass("group");
    expect(link).toHaveClass("cursor-pointer");
  });

  it("renders as button when onClick is provided", () => {
    const handleClick = jest.fn();
    render(
      <RankingItem
        position={1}
        name="John Doe"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as div when no interaction props provided", () => {
    render(<RankingItem position={1} name="John Doe" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows external link icon when href is provided", () => {
    render(
      <RankingItem
        position={1}
        name="John Doe"
        href="/customers/123"
      />
    );

    // ExternalLink icon should be present
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders extraContent when provided", () => {
    render(
      <RankingItem
        position={1}
        name="John Doe"
        extraContent={<span data-testid="extra">Extra Info</span>}
      />
    );

    expect(screen.getByTestId("extra")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <RankingItem
        position={1}
        name="John Doe"
        className="custom-class"
      />
    );

    const element = screen.getByText("John Doe").closest(".custom-class");
    expect(element).toBeInTheDocument();
  });

  it("truncates long names", () => {
    render(
      <RankingItem
        position={1}
        name="Very Long Name That Should Be Truncated"
      />
    );

    const nameElement = screen.getByText(
      "Very Long Name That Should Be Truncated"
    );
    expect(nameElement).toHaveClass("truncate");
  });

  it("applies hover styles for clickable items", () => {
    render(
      <RankingItem
        position={1}
        name="John Doe"
        href="/customers/123"
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveClass("hover:bg-slate-50");
  });

  it("memoizes correctly", () => {
    const { rerender } = render(
      <RankingItem position={1} name="John Doe" />
    );

    const firstRender = screen.getByText("John Doe");

    rerender(<RankingItem position={1} name="John Doe" />);
    const secondRender = screen.getByText("John Doe");

    expect(firstRender).toBe(secondRender);
  });
});
