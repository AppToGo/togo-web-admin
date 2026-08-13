/**
 * App Configuration
 *
 * Centralized configuration for the Togo Admin Dashboard
 */

export const APP_CONFIG = {
  name: "Togo",
  description: "Automatización de pedidos por WhatsApp",
  version: "1.0.0",
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1",
    timeout: 30000,
  },
  auth: {
    tokenKey: "togo_access_token",
    refreshTokenKey: "togo_refresh_token",
    tokenExpiryBuffer: 60, // seconds before expiry to refresh
  },
  features: {
    enableWebSockets: true, // Activado para órdenes en tiempo real
    enableNotifications: false,
  },
  meta: {
    // Meta Embedded Signup — onboarding asistido de WABA (Facebook Login for Business)
    appId: process.env.NEXT_PUBLIC_META_APP_ID || "",
    configId: process.env.NEXT_PUBLIC_META_CONFIG_ID || "",
    graphVersion: process.env.NEXT_PUBLIC_META_GRAPH_VERSION || "v25.0",
  },
  webCatalog: {
    // Mismo default que WEB_CATALOG_BASE_URL en api-togo (greeting-strategy.service.ts,
    // search-product.handler.ts, etc.) — usado para el QR imprimible de mesas
    // (docs/architecture/pedidos-en-mesa.md, Fase 2), que se arma client-side
    // sin pasar por el backend.
    baseUrl: process.env.NEXT_PUBLIC_WEB_CATALOG_BASE_URL || "https://catalogo.apptogo.co",
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
