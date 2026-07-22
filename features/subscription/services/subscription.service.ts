import apiClient from "@/services/api.service";

/**
 * Sentinel numérico que el backend usa para "sin límite" (Enterprise).
 * Debe coincidir con UNLIMITED en api-togo/src/plan/plan-config.service.ts.
 */
export const UNLIMITED_PLAN_LIMIT = 999999;

export interface UpgradePlanRequest {
  plan: number;
}

export interface PlanCatalogEntry {
  plan: number;
  name: string;
  maxBranches: number;
  maxUsers: number;
  priceMonthly: number;
}

export interface PlanCatalogResponse {
  plans: PlanCatalogEntry[];
  currency: string;
  trialDays: number;
}

/**
 * Catálogo de planes (límites y precios), servido desde el backend
 * (configurable por env — ver PlanConfigService). Público, no requiere auth.
 * GET /businesses/plans
 */
export async function getPlanCatalog(): Promise<PlanCatalogResponse> {
  const response = await apiClient.get<PlanCatalogResponse>("/businesses/plans");
  return response.data;
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
