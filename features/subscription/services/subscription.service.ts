import apiClient from "@/services/api.service";

export interface UpgradePlanRequest {
  plan: number;
}

/**
 * Upgrade the subscription plan for a business.
 * Payment status will be set to PENDING — user must complete a manual transfer.
 * PATCH /businesses/:businessId/upgrade-plan
 */
export async function upgradePlan(
  businessId: string,
  data: UpgradePlanRequest
): Promise<{ subscriptionPlan: number }> {
  const response = await apiClient.patch<{ subscriptionPlan: number }>(
    `/businesses/${businessId}/upgrade-plan`,
    data
  );
  return response.data;
}
