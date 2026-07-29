import apiClient from "@/services/api.service";

/**
 * Sentinel numérico que el backend usa para "sin límite" (Enterprise).
 * Debe coincidir con UNLIMITED en api-togo/src/plan/plan-config.service.ts.
 */
export const UNLIMITED_PLAN_LIMIT = 999999;

export interface PlanRequestRequest {
  plan: number;
}

export interface PlanRequestResponse {
  /** Plan actualmente activo del negocio — NO cambia con esta solicitud. */
  currentPlan: number;
  /** Plan solicitado, pendiente de verificación por un SUPER_ADMIN. */
  requestedPlan: number;
  requestedPlanAt: string;
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
 * Solicita un cambio de plan para el negocio. NO migra el plan — el negocio
 * sigue en su plan actual hasta que un SUPER_ADMIN verifica el pago y activa
 * el plan solicitado desde el panel admin (RecordPaymentModal).
 * POST /businesses/:businessId/plan-request
 */
export async function requestPlanChange(
  businessId: string,
  data: PlanRequestRequest
): Promise<PlanRequestResponse> {
  const response = await apiClient.post<PlanRequestResponse>(
    `/businesses/${businessId}/plan-request`,
    data
  );
  return response.data;
}
