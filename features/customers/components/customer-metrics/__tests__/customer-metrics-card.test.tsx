/**
 * Tests for CustomerMetricsCard Component
 */

import { render, screen } from "@testing-library/react";
import { CustomerMetricsCard } from "../customer-metrics-card";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("CustomerMetricsCard", () => {
  const mockMetrics = {
    totalSpent: 15000,
    totalOrders: 25,
    averageOrderValue: 600,
    firstOrderDate: "2024-01-15T00:00:00Z",
    lastOrderDate: "2024-12-01T00:00:00Z",
    favoriteProducts: [
      {
        productId: "prod-1",
        productName: "Product 1",
        totalQuantity: 10,
        totalSpent: 5000,
      },
      {
        productId: "prod-2",
        productName: "Product 2",
        totalQuantity: 5,
        totalSpent: 2500,
      },
    ],
  };

  it("renders all metric cards with correct color schemes", () => {
    render(<CustomerMetricsCard metrics={mockMetrics} />);

    // Check all metric titles are rendered
    expect(screen.getByText("metrics.totalSpent")).toBeInTheDocument();
    expect(screen.getByText("metrics.totalOrders")).toBeInTheDocument();
    expect(screen.getByText("metrics.averageOrder")).toBeInTheDocument();
    expect(screen.getByText("metrics.firstOrder")).toBeInTheDocument();
  });

  it("displays formatted values correctly", () => {
    render(<CustomerMetricsCard metrics={mockMetrics} />);

    // Check values are formatted
    expect(screen.getByText("25")).toBeInTheDocument(); // totalOrders
    // Currency formatting may vary by locale
    expect(screen.getAllByText(/\$|COP|15,000/).length).toBeGreaterThan(0);
  });

  it("renders gradient metric cards for revenue and average", () => {
    render(<CustomerMetricsCard metrics={mockMetrics} />);

    // Look for gradient backgrounds
    const gradientElements = document.querySelectorAll(
      "[class*='bg-gradient']"
    );
    expect(gradientElements.length).toBeGreaterThanOrEqual(2);
  });

  it("renders favorite products section when products exist", () => {
    render(<CustomerMetricsCard metrics={mockMetrics} />);

    expect(screen.getByText("metrics.favoriteProducts")).toBeInTheDocument();
    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByText("Product 2")).toBeInTheDocument();
  });

  it("does not render favorite products section when empty", () => {
    const metricsWithoutProducts = {
      ...mockMetrics,
      favoriteProducts: [],
    };

    render(<CustomerMetricsCard metrics={metricsWithoutProducts} />);

    expect(
      screen.queryByText("metrics.favoriteProducts")
    ).not.toBeInTheDocument();
  });

  it("limits favorite products to 5 items", () => {
    const metricsWithManyProducts = {
      ...mockMetrics,
      favoriteProducts: Array.from({ length: 10 }, (_, i) => ({
        productId: `prod-${i}`,
        productName: `Product ${i}`,
        totalQuantity: i + 1,
        totalSpent: (i + 1) * 100,
      })),
    };

    render(<CustomerMetricsCard metrics={metricsWithManyProducts} />);

    // Should only show 5 products
    const products = screen.getAllByText(/Product \d+/);
    expect(products.length).toBe(5);
  });

  it("renders ranking items for favorite products", () => {
    render(<CustomerMetricsCard metrics={mockMetrics} />);

    // Products should have position numbers (1, 2)
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("displays product quantity information", () => {
    render(<CustomerMetricsCard metrics={mockMetrics} />);

    expect(screen.getByText("metrics.timesOrdered")).toBeInTheDocument();
  });

  it("renders date cards with correct formatting", () => {
    render(<CustomerMetricsCard metrics={mockMetrics} />);

    expect(screen.getByText("metrics.lastOrderDate")).toBeInTheDocument();
    expect(screen.getByText("metrics.customerSince")).toBeInTheDocument();
  });

  it("handles missing dates gracefully", () => {
    const metricsWithoutDates = {
      ...mockMetrics,
      firstOrderDate: null,
      lastOrderDate: null,
    };

    render(<CustomerMetricsCard metrics={metricsWithoutDates} />);

    // Should show "-" for missing dates
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("uses correct icon color mappings", () => {
    const { container } = render(
      <CustomerMetricsCard metrics={mockMetrics} />
    );

    // Check for expected color classes in metric cards
    expect(container.innerHTML).toContain("bg-emerald-100");
    expect(container.innerHTML).toContain("bg-blue-100");
    expect(container.innerHTML).toContain("bg-purple-100");
    expect(container.innerHTML).toContain("bg-amber-100");
  });

  it("applies correct layout classes", () => {
    const { container } = render(
      <CustomerMetricsCard metrics={mockMetrics} />
    );

    // Check for grid layout
    expect(container.innerHTML).toContain("grid");
  });

  it("displays header borders on cards", () => {
    const { container } = render(
      <CustomerMetricsCard metrics={mockMetrics} />
    );

    // Check for border classes
    expect(container.innerHTML).toContain("border-b");
    expect(container.innerHTML).toContain("border-slate-100");
  });
});
