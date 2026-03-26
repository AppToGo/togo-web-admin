/**
 * Tests for CustomersTable component
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IntlProvider } from "next-intl";
import { CustomersTable } from "./customers-table";
import type { CustomerWithMetrics } from "../../types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock zustand store
vi.mock("../../stores/customer-selection.store", () => ({
  useCustomerSelectionStore: () => ({
    selectedIds: new Set(),
    isAllSelected: false,
    toggleSelection: vi.fn(),
    selectAll: vi.fn(),
    selectAllPages: vi.fn(),
    clearSelection: vi.fn(),
    setTotalItems: vi.fn(),
  }),
  useSelectedCustomerCount: () => 0,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="es" messages={{}}>
          {children}
        </IntlProvider>
      </QueryClientProvider>
    );
  };
};

const mockCustomers: CustomerWithMetrics[] = [
  {
    id: "customer-1",
    name: "John Doe",
    phoneNumber: "+1234567890",
    email: "john@example.com",
    notes: null,
    isActive: true,
    businessId: "business-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    totalOrders: 5,
    totalSpent: 250000,
    lastOrderDate: new Date("2024-01-15"),
  },
  {
    id: "customer-2",
    name: "Jane Smith",
    phoneNumber: "+0987654321",
    email: null,
    notes: null,
    isActive: true,
    businessId: "business-1",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
    totalOrders: 3,
    totalSpent: 150000,
    lastOrderDate: new Date("2024-01-10"),
  },
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 2,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe("CustomersTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render customer data correctly", () => {
    render(
      <CustomersTable
        data={mockCustomers}
        isLoading={false}
        pagination={mockPagination}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Check customer names are rendered
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    // Check phone numbers are rendered
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
    expect(screen.getByText("+0987654321")).toBeInTheDocument();
  });

  it("should show loading skeleton when isLoading is true", () => {
    render(
      <CustomersTable
        data={[]}
        isLoading={true}
        pagination={mockPagination}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Skeleton elements should be present
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should show empty state when no customers", () => {
    render(
      <CustomersTable
        data={[]}
        isLoading={false}
        pagination={{ ...mockPagination, total: 0 }}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Empty state should be shown
    expect(document.querySelector("[data-testid='empty-state']")).toBeTruthy();
  });

  it("should call onPageChange when pagination button is clicked", () => {
    const onPageChange = vi.fn();
    const paginationWithMorePages = {
      ...mockPagination,
      total: 20,
      totalPages: 2,
      hasNextPage: true,
    };

    render(
      <CustomersTable
        data={mockCustomers}
        isLoading={false}
        pagination={paginationWithMorePages}
        onPageChange={onPageChange}
      />,
      { wrapper: createWrapper() }
    );

    // Find and click next page button
    const nextButton = screen.getByText("Siguiente");
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should format currency correctly", () => {
    render(
      <CustomersTable
        data={mockCustomers}
        isLoading={false}
        pagination={mockPagination}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Check formatted currency (COP format)
    expect(screen.getByText("$250,000")).toBeInTheDocument();
    expect(screen.getByText("$150,000")).toBeInTheDocument();
  });

  it("should render order counts as badges", () => {
    render(
      <CustomersTable
        data={mockCustomers}
        isLoading={false}
        pagination={mockPagination}
        onPageChange={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Check order counts
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
