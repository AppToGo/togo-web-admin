/**
 * Funcionalidades activables por negocio. Debe coincidir con
 * api-togo/src/business-features/feature-registry.ts.
 */
export type FeatureKey =
  | "CASH_POS"
  | "COUNTER_SALE"
  | "AI_PAYMENT_VERIFICATION"
  | "AI_PRODUCT_IMPORT"
  | "BOT_VOICE"
  | "DINE_IN_QR"
  | "OPERATOR_CATALOG_ORDER"
  | "TIPS"
  | "GLOBAL_CATALOG"
  | "AI_BOT_PARAPHRASE"
  | "BOT_MESSAGES";

/**
 * Valor de arranque de cada funcionalidad (mismo `defaultEnabled` que el
 * registro de la API). Se usa mientras se cargan las del negocio, para que lo
 * que casi todos tienen activo no parpadee al entrar.
 */
export const FEATURE_DEFAULTS: Record<FeatureKey, boolean> = {
  CASH_POS: true,
  COUNTER_SALE: true,
  AI_PAYMENT_VERIFICATION: true,
  AI_PRODUCT_IMPORT: true,
  BOT_VOICE: true,
  DINE_IN_QR: false,
  OPERATOR_CATALOG_ORDER: false,
  TIPS: false,
  GLOBAL_CATALOG: false,
  AI_BOT_PARAPHRASE: false,
  BOT_MESSAGES: false,
};
