"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getAssignableUsers } from "../services/conversation-inbox.service";
import { CONVERSATIONS_KEYS, STALE_TIME } from "./query-keys";

/** Lista de usuarios asignables del negocio — ver doc del service para el porqué no reusa `useUsers`. */
export function useAssignableUsers(enabled: boolean = true) {
  const businessId = useEffectiveBusinessId() ?? undefined;

  return useQuery({
    queryKey: [...CONVERSATIONS_KEYS.all, "assignable-users", businessId],
    queryFn: () => getAssignableUsers(businessId),
    enabled: !!businessId && enabled,
    staleTime: STALE_TIME,
  });
}
