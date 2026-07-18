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
} as const;

export type AppConfig = typeof APP_CONFIG;
