import apiClient from "@/services/api.service";
import type {
  SubscriptionStatus,
  OwnerPaymentRecord,
  OwnerPaymentNotification,
} from "../types/billing.types";

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

// ─── Estado de cuenta self-service (GET /businesses/:businessId/billing[...]) ─

function getBillingBaseUrl(businessId: string): string {
  return `/businesses/${businessId}/billing`;
}

/**
 * Estado de cuenta de la suscripción: plan, precio, estado de pago,
 * próximo vencimiento, totales pagados. Requiere el permiso `billing.view`.
 */
export async function getSubscriptionStatus(businessId: string): Promise<SubscriptionStatus> {
  const response = await apiClient.get<SubscriptionStatus>(getBillingBaseUrl(businessId));
  return response.data;
}

/** Historial de pagos registrados por TOGO para este negocio. */
export async function getPaymentHistory(businessId: string): Promise<OwnerPaymentRecord[]> {
  const response = await apiClient.get<OwnerPaymentRecord[]>(
    `${getBillingBaseUrl(businessId)}/payments`
  );
  return response.data;
}

/** Historial de notificaciones de cobranza que TOGO le ha enviado al negocio. */
export async function getPaymentNotifications(
  businessId: string
): Promise<OwnerPaymentNotification[]> {
  const response = await apiClient.get<OwnerPaymentNotification[]>(
    `${getBillingBaseUrl(businessId)}/notifications`
  );
  return response.data;
}

// ─── Checkout de Wompi (pago del plan solicitado o renovación del actual) ───

export interface WompiCheckout {
  publicKey: string;
  /** Único por intento de cobro — el backend lo usa para resolver el pago cuando llega el webhook. */
  reference: string;
  amountInCents: number;
  currency: string;
  /** SHA256(reference + amountInCents + currency + integritySecret) — la exige el Checkout de Wompi. */
  signature: string;
  redirectUrl: string;
}

/**
 * Inicia un checkout de Wompi. El monto lo decide el backend a partir del
 * `plan` enviado acá (upgrade elegido en el modal) — sin `plan`, cotiza una
 * renovación del plan actual. Elegir un plan no crea ninguna solicitud
 * pendiente: esta llamada es efímera hasta que el pago se confirme por
 * webhook. POST /businesses/:businessId/billing/checkout
 */
export async function createCheckout(
  businessId: string,
  plan?: number
): Promise<WompiCheckout> {
  const response = await apiClient.post<WompiCheckout>(
    `${getBillingBaseUrl(businessId)}/checkout`,
    plan != null ? { plan } : {}
  );
  return response.data;
}

/**
 * Respaldo para cuando el negocio vuelve del Checkout antes de que llegue el
 * webhook de Wompi — no consulta a Wompi, consulta si ya existe el
 * PaymentRecord correspondiente en nuestro backend.
 */
export async function getCheckoutStatus(
  businessId: string,
  reference: string
): Promise<{ status: "PAID" | "PENDING" }> {
  const response = await apiClient.get<{ status: "PAID" | "PENDING" }>(
    `${getBillingBaseUrl(businessId)}/checkout/${reference}`
  );
  return response.data;
}
