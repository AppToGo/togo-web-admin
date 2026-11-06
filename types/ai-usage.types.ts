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

/**
 * Clasificador de intenciones por modelo: compara el principal con el
 * alternativo (flag LLM_INTENT_ALT_MODEL) en costo, caché, latencia y
 * confianza.
 */
export interface AiUsageIntentByModel {
  /** Sin el sufijo de fecha de la versión. */
  model: string;
  calls: number;
  costUsd: number;
  costPerCallUsd: number | null;
  /** Parte de los tokens de entrada servida desde la caché (0 a 1). */
  cachedInputShare: number | null;
  avgLatencyMs: number | null;
  p50LatencyMs: number | null;
  p90LatencyMs: number | null;
  /** Confianza promedio de la IA (0 a 1). */
  avgConfidence: number | null;
  /** Parte de las respuestas con confianza menor a 0,7 (no se usan). */
  lowConfidenceShare: number | null;
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
  /** Vacío hasta que la API registre llamadas del clasificador. */
  intentByModel?: AiUsageIntentByModel[];
  /** Vacío cuando se filtra por negocio. */
  byBusiness: AiUsageByBusiness[];
}
