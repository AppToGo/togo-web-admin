/**
 * Mutaciones de caja — patrón invalidate-on-success (igual que tables):
 * el dinero es sensible y el servidor recalcula todo, así que no hay
 * optimistic UI: cada mutación invalida y re-lee del servidor.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import * as cashService from "../services/cash.service";
import { CASH_KEYS } from "./query-keys";
import { ORDERS_KEYS } from "@/features/orders/types/order-cache.types";
import { getHumanizedErrorMessage } from "@/lib/error.utils";

function useInvalidateCash() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: CASH_KEYS.all });
    queryClient.invalidateQueries({ queryKey: ORDERS_KEYS.all });
  };
}

export function useCreateRegister(businessId: string, branchId: string) {
  const t = useTranslations("cash");
  const invalidateCash = useInvalidateCash();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      cashService.createRegister(businessId, branchId, data),
    onSuccess: (register) => {
      invalidateCash();
      toast.success(t("registers.created", { name: register.name }));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.operationFailed"));
    },
  });
}

export function useUpdateRegister(businessId: string, branchId: string) {
  const t = useTranslations("cash");
  const invalidateCash = useInvalidateCash();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; isActive?: boolean } }) =>
      cashService.updateRegister(businessId, branchId, id, data),
    onSuccess: () => {
      invalidateCash();
      toast.success(t("registers.updated"));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.operationFailed"));
    },
  });
}

export function useOpenSession(businessId: string, branchId: string) {
  const t = useTranslations("cash");
  const invalidateCash = useInvalidateCash();
  return useMutation({
    mutationFn: (data: { cashRegisterId: string; openingAmount: number; notes?: string }) =>
      cashService.openSession(businessId, branchId, data),
    onSuccess: () => {
      invalidateCash();
      toast.success(t("sessions.opened"));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.openFailed"));
    },
  });
}

export function useCreateManualMovement(
  businessId: string,
  branchId: string,
  sessionId: string
) {
  const t = useTranslations("cash");
  const invalidateCash = useInvalidateCash();
  return useMutation({
    mutationFn: (data: {
      type: "MANUAL_IN" | "MANUAL_OUT" | "WITHDRAWAL";
      amount: number;
      category?: string;
      notes?: string;
      reason?: string;
      authorizedByUserId?: string;
    }) => cashService.createManualMovement(businessId, branchId, sessionId, data),
    onSuccess: () => {
      invalidateCash();
      toast.success(t("movements.created"));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.operationFailed"));
    },
  });
}

export function useSettleCollections(
  businessId: string,
  branchId: string,
  sessionId: string
) {
  const t = useTranslations("cash");
  const invalidateCash = useInvalidateCash();
  return useMutation({
    mutationFn: (data: { collectionIds: string[]; receivedAmount: number; reason?: string }) =>
      cashService.settleCollections(businessId, branchId, sessionId, data),
    onSuccess: (result) => {
      invalidateCash();
      toast.success(t("settlements.settled", { count: result.settled }));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.settleFailed"));
    },
  });
}

export function useCloseSession(businessId: string, branchId: string, sessionId: string) {
  const t = useTranslations("cash");
  const invalidateCash = useInvalidateCash();
  return useMutation({
    mutationFn: (data: {
      denominations: Record<string, number>;
      countedAmount?: number;
      notes?: string;
    }) => cashService.closeSession(businessId, branchId, sessionId, data),
    onSuccess: () => {
      invalidateCash();
      toast.success(t("sessions.closed"));
    },
    onError: (err) => {
      toast.error(getHumanizedErrorMessage(err) || t("errors.closeFailed"));
    },
  });
}
