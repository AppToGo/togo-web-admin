/**
 * Admin Business Hooks
 * TanStack Query hooks for Super Admin business management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ADMIN_BUSINESS_KEYS } from "./query-keys";
import * as adminBusinessService from "../services/admin-business.service";
import type {
  BusinessWithSubscription,
  BusinessFilters,
  PaginatedBusinesses,
  UpdateBranchesLimitDto,
  RecordPaymentDto,
  SendNotificationDto,
} from "../types/business-subscription.types";

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch businesses with filters and pagination
 */
export function useBusinesses(
  filters?: BusinessFilters,
  options?: UseQueryOptions<PaginatedBusinesses, Error>
) {
  return useQuery({
    queryKey: ADMIN_BUSINESS_KEYS.filters(filters || {}),
    queryFn: () => adminBusinessService.getBusinesses(filters),
    ...options,
  });
}

/**
 * Hook to fetch payment alerts
 */
export function usePaymentAlerts(
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ADMIN_BUSINESS_KEYS.alerts(),
    queryFn: () => adminBusinessService.getPaymentAlerts(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to update branches limit for a business
 */
export function useUpdateBranchesLimit() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-businesses");

  return useMutation({
    mutationFn: async ({
      businessId,
      data,
    }: {
      businessId: string;
      data: UpdateBranchesLimitDto;
    }) => {
      return adminBusinessService.updateBranchesLimit(businessId, data);
    },
    onSuccess: (data) => {
      toast.success(t("notifications.branchesLimitUpdated"));
      queryClient.invalidateQueries({
        queryKey: ADMIN_BUSINESS_KEYS.businesses(),
      });
      queryClient.invalidateQueries({
        queryKey: ADMIN_BUSINESS_KEYS.business(data.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.updateBranchesLimit"));
    },
  });
}

/**
 * Hook to record a payment for a business
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-businesses");

  return useMutation({
    mutationFn: async ({
      businessId,
      data,
    }: {
      businessId: string;
      data: RecordPaymentDto;
    }) => {
      return adminBusinessService.recordPayment(businessId, data);
    },
    onSuccess: () => {
      toast.success(t("notifications.paymentRecorded"));
      queryClient.invalidateQueries({
        queryKey: ADMIN_BUSINESS_KEYS.businesses(),
      });
      queryClient.invalidateQueries({
        queryKey: ADMIN_BUSINESS_KEYS.alerts(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.recordPayment"));
    },
  });
}

/**
 * Hook to send notification to a business
 */
export function useSendNotification() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-businesses");

  return useMutation({
    mutationFn: async ({
      businessId,
      data,
    }: {
      businessId: string;
      data: SendNotificationDto;
    }) => {
      return adminBusinessService.sendNotification(businessId, data);
    },
    onSuccess: () => {
      toast.success(t("notifications.notificationSent"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.sendNotification"));
    },
  });
}

/**
 * Hook to toggle business status
 */
export function useToggleBusinessStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-businesses");

  return useMutation({
    mutationFn: async ({
      businessId,
      isActive,
    }: {
      businessId: string;
      isActive: boolean;
    }) => {
      return adminBusinessService.toggleBusinessStatus(businessId, isActive);
    },
    onSuccess: (_, variables) => {
      const successMessage = variables.isActive
        ? t("notifications.businessActivated")
        : t("notifications.businessDeactivated");
      toast.success(successMessage);
      queryClient.invalidateQueries({
        queryKey: ADMIN_BUSINESS_KEYS.businesses(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.toggleStatus"));
    },
  });
}
