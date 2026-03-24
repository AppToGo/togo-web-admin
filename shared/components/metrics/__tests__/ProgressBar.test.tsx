/**
 * Tests for ProgressBar Component
 */

import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../ProgressBar";

describe("ProgressBar", () => {
  it("renders with default props", () => {
    render(<ProgressBar value={50} max={100} color="blue" />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute("aria-valuenow", "50");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
  });

  it("calculates percentage correctly", () => {
    const { rerender } = render(
      <ProgressBar value={25} max={100} color="purple" />
    );

    let progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveStyle({ width: "25%" });

    rerender(<ProgressBar value={75} max={100} color="purple" />);
    progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveStyle({ width: "75%" });
  });

  it("handles zero max value gracefully", () => {
    render(<ProgressBar value={50} max={0} color="emerald" />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveStyle({ width: "0%" });
  });

  it("displays label when showLabel is true", () => {
    render(<ProgressBar value={50} max={100} color="amber" showLabel />);

    expect(screen.getByText("50 / 100")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("uses custom label formatter when provided", () => {
    const customFormatter = (value: number, max: number) =>
      `${value} of ${max} items`;

    render(
      <ProgressBar
        value={30}
        max={100}
        color="cyan"
        showLabel
        labelFormatter={customFormatter}
      />
    );

    expect(screen.getByText("30 of 100 items")).toBeInTheDocument();
  });

  it("applies correct color class", () => {
    const { rerender } = render(
      <ProgressBar value={50} max={100} color="blue" />
    );

    let progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveClass("bg-blue-500");

    rerender(<ProgressBar value={50} max={100} color="purple" />);
    progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveClass("bg-purple-500");

    rerender(<ProgressBar value={50} max={100} color="emerald" />);
    progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveClass("bg-emerald-500");
  });

  it("applies size variants correctly", () => {
    const { rerender } = render(
      <ProgressBar value={50} max={100} color="blue" size="sm" />
    );

    let container = screen.getByRole("progressbar").parentElement;
    expect(container).toHaveClass("h-1");

    rerender(<ProgressBar value={50} max={100} color="blue" size="md" />);
    container = screen.getByRole("progressbar").parentElement;
    expect(container).toHaveClass("h-1.5");
  });

  it("applies custom className", () => {
    render(
      <ProgressBar
        value={50}
        max={100}
        color="blue"
        className="custom-class"
      />
    );

    const wrapper = screen.getByRole("progressbar").parentElement?.parentElement;
    expect(wrapper).toHaveClass("custom-class");
  });

  it("applies custom fillClassName", () => {
    render(
      <ProgressBar
        value={50}
        max={100}
        color="blue"
        fillClassName="custom-fill"
      />
    );

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveClass("custom-fill");
  });

  it("memoizes correctly", () => {
    const { rerender } = render(
      <ProgressBar value={50} max={100} color="blue" />
    );

    const firstRender = screen.getByRole("progressbar");

    rerender(<ProgressBar value={50} max={100} color="blue" />);
    const secondRender = screen.getByRole("progressbar");

    expect(firstRender).toBe(secondRender);
  });
});
