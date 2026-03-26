/**
 * Tests for useCustomers hook
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock dependencies
vi.mock("@/features/auth/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: "user-1",
        businessId: "business-1",
        role: "OWNER",
      },
    }),
  },
}));

vi.mock("@/features/business/stores/business.store", () => ({
  useBusinessStore: () => ({
    selectedBusinessId: null,
  }),
}));

vi.mock("@/features/filters/hooks/useDateFilterQuery", () => ({
  useDateFilterParams: () => ({
    dateFrom: "2024-01-01",
    dateTo: "2024-01-31",
  }),
}));

vi.mock("../services/customer.service", () => ({
  getCustomers: vi.fn(),
}));

import { getCustomers } from "../services/customer.service";
import { useCustomers } from "./useCustomers";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch customers with pagination", async () => {
    const mockResponse = {
      data: [
        {
          id: "customer-1",
          name: "John Doe",
          phoneNumber: "+1234567890",
          totalOrders: 5,
          totalSpent: 250000,
          lastOrderDate: new Date("2024-01-15"),
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    vi.mocked(getCustomers).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCustomers({ page: 1, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.pagination.total).toBe(1);
    expect(result.current.pagination.totalPages).toBe(1);
  });

  it("should include date filters in the query", async () => {
    const mockResponse = {
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };

    vi.mocked(getCustomers).mockResolvedValueOnce(mockResponse);

    renderHook(() => useCustomers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: "2024-01-01",
          dateTo: "2024-01-31",
        })
      );
    });
  });

  it("should not fetch when user has no business", async () => {
    // Override mock to simulate user without business
    vi.doMock("@/features/auth/stores/auth.store", () => ({
      useAuthStore: {
        getState: () => ({
          user: {
            id: "user-1",
            businessId: null,
            role: "OWNER",
          },
        }),
      },
    }));

    const { result } = renderHook(() => useCustomers(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isEnabled).toBe(false);
  });
});
