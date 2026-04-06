/**
 * Query Keys para Business Settings
 */

export const BUSINESS_SETTINGS_KEYS = {
  all: ['business-settings'] as const,
  detail: (id: string) => [...BUSINESS_SETTINGS_KEYS.all, id] as const,
};

export const STALE_TIME = 5 * 60 * 1000; // 5 minutos
export const GC_TIME = 10 * 60 * 1000; // 10 minutos
