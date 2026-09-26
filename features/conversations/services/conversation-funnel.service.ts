/**
 * Embudo conversacional del bot (plan bot natural, T20). Vive en
 * `src/metrics` del backend y pide el permiso `metrics.view`.
 */

import apiClient from "@/services/api.service";
import type { ConversationFunnel, GetConversationFunnelParams } from "../types";

export async function getConversationFunnel(
  businessId: string,
  params: GetConversationFunnelParams = {}
): Promise<ConversationFunnel> {
  const queryParams: Record<string, string> = {};
  if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
  if (params.dateTo) queryParams.dateTo = params.dateTo;

  const { data } = await apiClient.get<ConversationFunnel>(
    `/businesses/${businessId}/metrics/conversation-funnel`,
    { params: queryParams }
  );
  return data;
}
