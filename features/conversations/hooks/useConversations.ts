"use client";

import { useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { getConversations } from "../services/conversation.service";
import { CONVERSATIONS_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { GetConversationsParams, PaginatedConversationsResponse } from "../types";

/**
 * Lista paginada de conversaciones del negocio. Mismo patrón de
 * enabled/effectiveBusinessId que `useCustomers`.
 *
 * @param enabled - Compuerta adicional (ej. `shouldLoad` de
 * `useLazySection`); se combina con el enabled calculado por negocio/rol.
 */
export function useConversations(
  params?: GetConversationsParams & { businessId?: string },
  enabled: boolean = true
) {
  const { user } = useAuthStore.getState();
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasBusinessId = !!user?.businessId;
  const hasSelectedBusiness =
    params?.businessId !== undefined || !!selectedBusinessId;
  const isEnabled =
    (isSuperAdmin ? hasSelectedBusiness : hasBusinessId) && enabled;

  const effectiveBusinessId =
    params?.businessId || selectedBusinessId || undefined;

  const mergedParams = {
    page: 1,
    limit: 10,
    ...params,
    businessId: effectiveBusinessId,
  };

  const query = useQuery<PaginatedConversationsResponse, Error>({
    queryKey: CONVERSATIONS_KEYS.list(mergedParams),
    queryFn: () => getConversations(mergedParams),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: isEnabled,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        const message = error.message;
        if (message.includes("401") || message.includes("403")) {
          return false;
        }
      }
      return failureCount < 3;
    },
  });

  const pagination = {
    page: query.data?.meta.page ?? 1,
    limit: query.data?.meta.limit ?? 10,
    total: query.data?.meta.total ?? 0,
    totalPages: query.data?.meta.totalPages ?? 1,
    hasNextPage: query.data?.meta.hasNextPage ?? false,
    hasPreviousPage: query.data?.meta.hasPreviousPage ?? false,
  };

  return {
    ...query,
    data: query.data?.data ?? [],
    meta: query.data?.meta,
    pagination,
  };
}
