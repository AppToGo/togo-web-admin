/**
 * Tables Hook
 *
 * Pedidos en mesa (docs/architecture/pedidos-en-mesa.md, Fase 1).
 */

import { useQuery } from "@tanstack/react-query";
import { getTables } from "../services/table.service";
import { TABLES_KEYS, STALE_TIME, GC_TIME } from "./query-keys";
import type { RestaurantTable } from "../types";

export function useTables(businessId: string | null, branchId: string | null) {
  return useQuery<RestaurantTable[], Error>({
    queryKey: TABLES_KEYS.byBranch(businessId || "", branchId || ""),
    queryFn: () => getTables(businessId!, branchId!),
    enabled: !!businessId && !!branchId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}
