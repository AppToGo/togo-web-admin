import { useQuery } from "@tanstack/react-query";
import type { AiUsageQuery } from "@/types/ai-usage.types";
import { getAiUsageSummary } from "@/features/admin/ai-usage/services/ai-usage.service";

export const AI_USAGE_KEYS = {
  all: ["admin", "ai-usage"] as const,
  summary: (query: AiUsageQuery) =>
    [...AI_USAGE_KEYS.all, "summary", query] as const,
};

/** Consumo de IA del rango (y del negocio, si viene). Solo SUPER_ADMIN. */
export function useAiUsageSummary(query: AiUsageQuery, enabled = true) {
  return useQuery({
    queryKey: AI_USAGE_KEYS.summary(query),
    queryFn: () => getAiUsageSummary(query),
    staleTime: 60 * 1000,
    enabled,
  });
}
