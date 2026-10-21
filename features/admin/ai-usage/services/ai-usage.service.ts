/**
 * Servicio del consumo de IA (solo SUPER_ADMIN).
 */

import apiClient from "@/services/api.service";
import type { AiUsageQuery, AiUsageSummary } from "@/types/ai-usage.types";

export async function getAiUsageSummary(
  query: AiUsageQuery
): Promise<AiUsageSummary> {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.businessId) params.set("businessId", query.businessId);
  const response = await apiClient.get<AiUsageSummary>(
    `/admin/ai-usage/summary?${params.toString()}`
  );
  return response.data;
}
