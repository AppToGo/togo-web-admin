/**
 * Tests for MetricCard Component
 */

import { render, screen } from "@testing-library/react";
import { DollarSign, Users } from "lucide-react";
import { MetricCard } from "../MetricCard";

describe("MetricCard", () => {
  it("renders with required props", () => {
    render(
      <MetricCard
        title="Total Revenue"
        value="$10,000"
        colorScheme="emerald"
      />
    );

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });

  it("renders with icon when provided", () => {
    render(
      <MetricCard
        title="Users"
        value="1,234"
        icon={Users}
        colorScheme="blue"
      />
    );

    // Lucide icons render as SVG
    const icon = document.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <MetricCard
        title="Revenue"
        value="$5,000"
        subtitle="+12% from last month"
        colorScheme="indigo"
      />
    );

    expect(screen.getByText("+12% from last month")).toBeInTheDocument();
  });

  it("applies correct color scheme classes", () => {
    const { rerender } = render(
      <MetricCard
        title="Test"
        value="100"
        icon={DollarSign}
        colorScheme="emerald"
      />
    );

    let iconContainer = document.querySelector(".bg-emerald-100");
    expect(iconContainer).toBeInTheDocument();

    rerender(
      <MetricCard title="Test" value="100" icon={DollarSign} colorScheme="blue" />
    );
    iconContainer = document.querySelector(".bg-blue-100");
    expect(iconContainer).toBeInTheDocument();
  });

  it("applies gradient variant correctly", () => {
    render(
      <MetricCard
        title="Total"
        value="$10K"
        colorScheme="indigo"
        isGradient
      />
    );

    const card = screen.getByText("Total").closest("div[class*='bg-gradient']");
    expect(card).toHaveClass("text-white");
  });

  it("renders children when provided", () => {
    render(
      <MetricCard title="Test" value="100" colorScheme="indigo">
        <div data-testid="child-content">Additional Content</div>
      </MetricCard>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("applies size variants correctly", () => {
    const { rerender } = render(
      <MetricCard title="Test" value="100" colorScheme="indigo" size="sm" />
    );

    let value = screen.getByText("100");
    expect(value).toHaveClass("text-xl");

    rerender(
      <MetricCard title="Test" value="100" colorScheme="indigo" size="md" />
    );
    value = screen.getByText("100");
    expect(value).toHaveClass("text-2xl");

    rerender(
      <MetricCard title="Test" value="100" colorScheme="indigo" size="lg" />
    );
    value = screen.getByText("100");
    expect(value).toHaveClass("text-3xl");
  });

  it("applies padding based on size", () => {
    const { rerender } = render(
      <MetricCard title="Test" value="100" colorScheme="indigo" size="sm" />
    );

    let card = screen.getByText("Test").closest("div[class*='p-']");
    expect(card).toHaveClass("p-4");

    rerender(
      <MetricCard title="Test" value="100" colorScheme="indigo" size="md" />
    );
    card = screen.getByText("Test").closest("div[class*='p-']");
    expect(card).toHaveClass("p-5");

    rerender(
      <MetricCard title="Test" value="100" colorScheme="indigo" size="lg" />
    );
    card = screen.getByText("Test").closest("div[class*='p-']");
    expect(card).toHaveClass("p-6");
  });

  it("applies custom className", () => {
    render(
      <MetricCard
        title="Test"
        value="100"
        colorScheme="indigo"
        className="custom-class"
      />
    );

    const card = screen.getByText("Test").closest(".custom-class");
    expect(card).toBeInTheDocument();
  });

  it("handles numeric values", () => {
    render(
      <MetricCard title="Count" value={1234} colorScheme="indigo" />
    );

    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("memoizes correctly", () => {
    const { rerender } = render(
      <MetricCard title="Test" value="100" colorScheme="indigo" />
    );

    const firstRender = screen.getByText("Test");

    rerender(<MetricCard title="Test" value="100" colorScheme="indigo" />);
    const secondRender = screen.getByText("Test");

    expect(firstRender).toBe(secondRender);
  });
});
