/**
 * Tests for TopCustomersCharts Component
 */

import { render, screen } from "@testing-library/react";
import { TopCustomersCharts } from "../top-customers-charts";

// Mock the hooks
jest.mock("../../hooks", () => ({
  useGlobalCustomerMetrics: jest.fn(),
}));

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

import { useGlobalCustomerMetrics } from "../../hooks";

const mockUseGlobalCustomerMetrics = useGlobalCustomerMetrics as jest.Mock;

describe("TopCustomersCharts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state correctly", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<TopCustomersCharts />);

    // Should show skeleton elements
    const skeletons = document.querySelectorAll("[class*='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders null when no metrics data", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { container } = render(<TopCustomersCharts />);
    expect(container.firstChild).toBeNull();
  });

  it("renders empty state when no customer data", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: {
        topByFrequency: [],
        topBySpending: [],
      },
      isLoading: false,
    });

    render(<TopCustomersCharts />);

    expect(screen.getByText("topCustomers.noData")).toBeInTheDocument();
  });

  it("renders top customers by frequency", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: {
        topByFrequency: [
          { customerId: "1", name: "Customer 1", phoneNumber: "123" },
          { customerId: "2", name: "Customer 2", phoneNumber: "456" },
        ],
        topBySpending: [],
      },
      isLoading: false,
    });

    render(<TopCustomersCharts />);

    expect(screen.getByText("Customer 1")).toBeInTheDocument();
    expect(screen.getByText("Customer 2")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("renders top customers by spending with progress bars", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: {
        topByFrequency: [],
        topBySpending: [
          { customerId: "1", name: "Spender 1", phoneNumber: "123", value: 1000 },
          { customerId: "2", name: "Spender 2", phoneNumber: "456", value: 500 },
        ],
      },
      isLoading: false,
    });

    render(<TopCustomersCharts />);

    expect(screen.getByText("Spender 1")).toBeInTheDocument();
    expect(screen.getByText("Spender 2")).toBeInTheDocument();
    // Progress bars should be rendered
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("renders links to customer detail pages", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: {
        topByFrequency: [
          { customerId: "cust-123", name: "Linked Customer", phoneNumber: "123" },
        ],
        topBySpending: [],
      },
      isLoading: false,
    });

    render(<TopCustomersCharts />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/customers/cust-123");
  });

  it("displays anonymous for customers without name", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: {
        topByFrequency: [
          { customerId: "1", name: null, phoneNumber: "123" },
        ],
        topBySpending: [],
      },
      isLoading: false,
    });

    render(<TopCustomersCharts />);

    expect(screen.getByText("table.anonymous")).toBeInTheDocument();
  });

  it("limits display to 10 customers", () => {
    const manyCustomers = Array.from({ length: 15 }, (_, i) => ({
      customerId: String(i),
      name: `Customer ${i}`,
      phoneNumber: String(i),
    }));

    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: {
        topByFrequency: manyCustomers,
        topBySpending: manyCustomers,
      },
      isLoading: false,
    });

    render(<TopCustomersCharts />);

    // Should only show 10 per list
    const customerElements = screen.getAllByText(/Customer \d+/);
    expect(customerElements.length).toBe(20); // 10 frequency + 10 spending
  });

  it("uses correct header styling with border", () => {
    mockUseGlobalCustomerMetrics.mockReturnValue({
      data: {
        topByFrequency: [{ customerId: "1", name: "Test", phoneNumber: "123" }],
        topBySpending: [],
      },
      isLoading: false,
    });

    render(<TopCustomersCharts />);

    const headers = document.querySelectorAll("[class*='border-b']");
    expect(headers.length).toBeGreaterThan(0);
  });
});
