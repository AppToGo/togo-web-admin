"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getConversations } from "../services/conversation.service";
import { CONVERSATIONS_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type {
  ConversationListItem,
  GetConversationsParams,
  PaginatedConversationsResponse,
} from "../types";

/** Tamaño de página del inbox: las 20 más recientes y el resto con scroll. */
export const INBOX_PAGE_SIZE = 20;

/**
 * Lista del inbox con scroll infinito — mismos filtros que
 * `useConversations` (`control`, `assignedTo`, `q`, fechas), pero paginada
 * con `useInfiniteQuery`. La key cuelga de `CONVERSATIONS_KEYS.lists()`,
 * así que las invalidaciones del socket y de las mutaciones la siguen
 * alcanzando (TanStack refetchea todas las páginas ya cargadas).
 *
 * `isSocketConnected` activa un `refetchInterval` de respaldo: el
 * `QueryClient` global tiene `refetchOnWindowFocus:false`, así que sin
 * esto un socket caído dejaría la lista congelada sin que el operador se
 * entere (aparte del indicador de conexión en el header).
 */
export function useInboxConversations(
  filters: GetConversationsParams,
  isSocketConnected: boolean,
  enabled: boolean = true
) {
  const effectiveBusinessIdFromStore = useEffectiveBusinessId();
  // "" = "Todos los negocios" (SUPER_ADMIN): ver `useConversations`.
  const isAllBusinessesSelected = effectiveBusinessIdFromStore === "";
  const businessId = effectiveBusinessIdFromStore || undefined;

  const params = { ...filters, limit: INBOX_PAGE_SIZE, businessId };

  const query = useInfiniteQuery<PaginatedConversationsResponse, Error>({
    queryKey: [...CONVERSATIONS_KEYS.lists(), "inbox", JSON.stringify(params)],
    queryFn: ({ pageParam }) =>
      getConversations({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!businessId && enabled,
    refetchInterval: isSocketConnected ? false : 15000,
    retry: (failureCount, error) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });

  // Paginación por offset sobre una lista que se reordena en vivo (un
  // mensaje nuevo sube su conversación al tope): una misma conversación
  // puede caer en dos páginas entre fetch y fetch. Se deduplica por id.
  const conversations = useMemo<ConversationListItem[]>(() => {
    const seen = new Set<string>();
    const items: ConversationListItem[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const item of page.data) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        items.push(item);
      }
    }
    return items;
  }, [query.data]);

  return {
    conversations,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    isAllBusinessesSelected,
  };
}
