"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { getHumanizedErrorMessage } from "@/lib/error.utils";
import { getOrderFlow, updateOrderFlow } from "../services/order.service";
import { ORDERS_KEYS } from "../types/order-cache.types";
import { FORWARD_FLOW, type VisibleStatuses } from "../utils/order-flow.utils";
import type { OrderStatus } from "../types";

export const ORDER_REVERT_STATUS_PERMISSION = "order.revert_status";

// El flujo lo cambia OWNER/ADMIN muy de vez en cuando.
const FLOW_STALE_TIME = 5 * 60 * 1000;

/**
 * Estados del flujo del tablero que el negocio no usa (En proceso / Lista).
 * Es configuración del negocio, igual para todos sus usuarios.
 */
export function useBusinessOrderFlow() {
  const businessId = useEffectiveBusinessId();
  return useQuery({
    queryKey: ORDERS_KEYS.flow(businessId),
    queryFn: () => getOrderFlow(businessId!),
    enabled: !!businessId,
    staleTime: FLOW_STALE_TIME,
  });
}

/** Cambia el flujo del negocio (solo OWNER/ADMIN; el backend lo exige). */
export function useUpdateBusinessOrderFlow() {
  const businessId = useEffectiveBusinessId();
  const queryClient = useQueryClient();
  const t = useTranslations("orders");
  return useMutation({
    mutationFn: (skippedStatuses: OrderStatus[]) =>
      updateOrderFlow(businessId!, skippedStatuses),
    onSuccess: (flow) => {
      queryClient.setQueryData(ORDERS_KEYS.flow(businessId), flow);
      toast.success(t("orderFlow.saved"));
    },
    onError: (error) => {
      toast.error(getHumanizedErrorMessage(error));
    },
  });
}

/**
 * Estados que usa el tablero (columnas y siguiente paso obligatorio) y si el
 * usuario puede devolver pedidos a un estado anterior. Mientras el flujo no
 * cargó se asume el completo: el backend valida igual.
 */
export function useOrderFlow(): {
  visible: VisibleStatuses;
  skipped: readonly OrderStatus[];
  canRevert: boolean;
} {
  const { data } = useBusinessOrderFlow();
  const { hasPermission } = useMyPermissions();
  const canRevert = hasPermission(ORDER_REVERT_STATUS_PERMISSION);
  const skippedKey = (data?.skippedStatuses ?? []).join(",");

  return useMemo(() => {
    const skipped = skippedKey ? (skippedKey.split(",") as OrderStatus[]) : [];
    const visible = new Set<OrderStatus>(
      [...FORWARD_FLOW, "CANCELLED" as OrderStatus].filter((s) => !skipped.includes(s))
    );
    return { visible, skipped, canRevert };
  }, [skippedKey, canRevert]);
}
