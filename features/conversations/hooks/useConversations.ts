"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getConversations } from "../services/conversation.service";
import { CONVERSATIONS_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { GetConversationsParams, PaginatedConversationsResponse } from "../types";

type ExtraQueryOptions = Partial<
  Pick<UseQueryOptions<PaginatedConversationsResponse, Error>, "refetchInterval">
>;

/**
 * Lista paginada de conversaciones del negocio. Mismo patrón de
 * enabled/effectiveBusinessId que `useCustomers`, pero delegando en el hook
 * canónico `useEffectiveBusinessId` (que ya valida coherencia ante un
 * `selectedBusinessId` obsoleto) en vez de recalcular la lógica a mano.
 *
 * @param enabled - Compuerta adicional (ej. `shouldLoad` de
 * `useLazySection`); se combina con el enabled calculado por negocio/rol.
 * @param extraOptions - Opciones adicionales de TanStack Query (ej.
 * `refetchInterval` para el fallback del inbox cuando el socket está
 * caído — ver `useInboxConversations`).
 */
export function useConversations(
  params?: GetConversationsParams & { businessId?: string },
  enabled: boolean = true,
  extraOptions?: ExtraQueryOptions
) {
  const effectiveBusinessIdFromStore = useEffectiveBusinessId();
  // "" es el sentinel explícito de "Todos los negocios" (SUPER_ADMIN) — a
  // diferencia de null (nada seleccionado todavía), acá sí hay una elección
  // consciente, pero el endpoint de conversaciones exige un negocio
  // concreto. Sin esta distinción, `"" || undefined` colapsa a undefined y
  // la query queda deshabilitada en silencio, indistinguible de "aún no
  // hay negocio elegido".
  const isAllBusinessesSelected = effectiveBusinessIdFromStore === "";

  const effectiveBusinessId =
    params?.businessId ?? (effectiveBusinessIdFromStore || undefined);

  const isEnabled = !!effectiveBusinessId && enabled;

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
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
    ...extraOptions,
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
    isAllBusinessesSelected,
  };
}
