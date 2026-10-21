/**
 * Consumo de IA (OpenAI) por negocio. Solo SUPER_ADMIN: los negocios no ven
 * estos datos. Montos en USD, lo que factura OpenAI.
 */

export type AiUsageFeature =
  | "INTENT"
  | "CUSTOMER_AGENT"
  | "OPERATOR_AGENT"
  | "PARAPHRASE"
  | "TRANSCRIPTION"
  | "PAYMENT_PROOF"
  | "CATALOG_VISION"
  | "CATALOG_CLASSIFIER"
  | "PRODUCT_KEYWORDS"
  | "BOT_MESSAGES";

export interface AiUsageQuery {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  businessId?: string;
}

export interface AiUsageTotals {
  costUsd: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  audioSeconds: number;
  conversations: number;
  costPerConversationUsd: number | null;
  orders: number;
  costPerOrderUsd: number | null;
}

export interface AiUsageDaily {
  date: string; // YYYY-MM-DD
  costUsd: number;
  calls: number;
}

export interface AiUsageByFeature {
  feature: AiUsageFeature;
  costUsd: number;
  calls: number;
}

export interface AiUsageByModel {
  model: string;
  costUsd: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AiUsageByBusiness {
  /** null = plataforma (catálogo global, categorías de industria). */
  businessId: string | null;
  businessName: string | null;
  costUsd: number;
  calls: number;
  orders: number;
  costPerOrderUsd: number | null;
}

export interface AiUsageSummary {
  from: string;
  to: string;
  totals: AiUsageTotals;
  daily: AiUsageDaily[];
  byFeature: AiUsageByFeature[];
  byModel: AiUsageByModel[];
  /** Vacío cuando se filtra por negocio. */
  byBusiness: AiUsageByBusiness[];
}
