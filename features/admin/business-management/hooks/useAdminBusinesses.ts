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
import type { BusinessFilters, PaginatedBusinesses, UpdateBranchesLimitDto, UpdateUsersLimitDto, UpdateProofQuotaDto, RecordPaymentDto, SendNotificationDto, AddonQuoteParams, UpdateLimitResponse } from "../types/business-subscription.types";
import { formatCurrency } from "@/lib/utils";

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

/**
 * Historial de cobros que ToGo inició en Wompi para un negocio
 * (docs/cobro-suscripciones.md §7 en api-togo).
 */
export function useChargeAttempts(businessId: string | null) {
  return useQuery({
    queryKey: ADMIN_BUSINESS_KEYS.chargeAttempts(businessId ?? ""),
    queryFn: () => adminBusinessService.getChargeAttempts(businessId!),
    enabled: !!businessId,
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
      notifyLimitResult(data, t("notifications.branchesLimitUpdated"), t, queryClient);
      invalidateLimitQueries(queryClient, data.id);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.updateBranchesLimit"));
    },
  });
}

/**
 * Cotización del cambio de límite de usuarios o sedes (cobro de hoy o desde
 * el próximo pago). `enabled` lo decide el modal: solo con un límite válido
 * y, si hay adicionales, con su precio.
 */
export function useAddonQuote(
  businessId: string | undefined,
  params: AddonQuoteParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: ADMIN_BUSINESS_KEYS.addonQuote(businessId ?? "", params),
    queryFn: () => adminBusinessService.getAddonQuote(businessId!, params),
    enabled: enabled && !!businessId,
    staleTime: 30_000,
  });
}

/** Con un cobro en curso el límite todavía no cambió: se avisa distinto. */
function notifyLimitResult(
  data: UpdateLimitResponse,
  appliedMessage: string,
  t: ReturnType<typeof useTranslations>,
  queryClient: ReturnType<typeof useQueryClient>
) {
  if (data.charge.mode === "CHARGED" && data.charge.reference) {
    void trackAddonCharge(
      data.id,
      data.charge.reference,
      formatCurrency(data.charge.amountInCents / 100),
      t,
      queryClient
    );
  } else if (data.charge.mode === "APPLIED_NEXT_CYCLE") {
    toast.success(t("notifications.addonNextCycle"));
  } else {
    toast.success(appliedMessage);
  }
}

const CHARGE_POLL_INTERVAL_MS = 2_000;
const CHARGE_POLL_TIMEOUT_MS = 60_000;

/**
 * El resultado del cobro llega por el webhook de Wompi, segundos después de
 * guardar: se sigue el intento por su referencia y se avisa si se aprobó
 * (límite activo) o no (con el motivo del banco). Sin esto el super admin
 * solo veía "en proceso" y nunca se enteraba de un rechazo.
 */
async function trackAddonCharge(
  businessId: string,
  reference: string,
  amount: string,
  t: ReturnType<typeof useTranslations>,
  queryClient: ReturnType<typeof useQueryClient>
) {
  const toastId = toast.loading(t("notifications.addonCharging", { amount }));
  const deadline = Date.now() + CHARGE_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, CHARGE_POLL_INTERVAL_MS));
    const attempt = await adminBusinessService
      .getChargeAttempts(businessId)
      .then((attempts) => attempts.find((a) => a.reference === reference))
      .catch(() => undefined);
    if (!attempt || attempt.status === "PENDING") continue;

    if (attempt.status === "APPROVED") {
      toast.success(t("notifications.addonChargeApproved", { amount }), {
        id: toastId,
      });
    } else {
      toast.error(
        attempt.statusMessage
          ? t("notifications.addonChargeFailed", {
              amount,
              reason: attempt.statusMessage,
            })
          : t("notifications.addonChargeFailedNoReason", { amount }),
        { id: toastId, duration: 15_000 }
      );
    }
    invalidateLimitQueries(queryClient, businessId);
    return;
  }

  toast.info(t("notifications.addonChargeTimeout"), {
    id: toastId,
    duration: 15_000,
  });
}

function invalidateLimitQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: string
) {
  queryClient.invalidateQueries({ queryKey: ADMIN_BUSINESS_KEYS.businesses() });
  queryClient.invalidateQueries({
    queryKey: ADMIN_BUSINESS_KEYS.business(businessId),
  });
  queryClient.invalidateQueries({
    queryKey: ADMIN_BUSINESS_KEYS.chargeAttempts(businessId),
  });
}

/**
 * Hook to update users limit for a business
 */
export function useUpdateUsersLimit() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-businesses");

  return useMutation({
    mutationFn: async ({
      businessId,
      data,
    }: {
      businessId: string;
      data: UpdateUsersLimitDto;
    }) => {
      return adminBusinessService.updateUsersLimit(businessId, data);
    },
    onSuccess: (data) => {
      notifyLimitResult(data, t("notifications.usersLimitUpdated"), t, queryClient);
      invalidateLimitQueries(queryClient, data.id);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.updateUsersLimit"));
    },
  });
}

/**
 * Hook to update receipt-analysis quota for a business
 */
export function useUpdateProofQuota() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-businesses");

  return useMutation({
    mutationFn: async ({
      businessId,
      data,
    }: {
      businessId: string;
      data: UpdateProofQuotaDto;
    }) => {
      return adminBusinessService.updateProofQuota(businessId, data);
    },
    onSuccess: (data) => {
      toast.success(t("notifications.proofQuotaUpdated"));
      queryClient.invalidateQueries({
        queryKey: ADMIN_BUSINESS_KEYS.businesses(),
      });
      queryClient.invalidateQueries({
        queryKey: ADMIN_BUSINESS_KEYS.business(data.id),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.updateProofQuota"));
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
