import { useTranslations } from "next-intl";

/**
 * Hook helper para acceder a múltiples namespaces de traducción
 * usados en las páginas de administración de catálogo global.
 */
export function useAdminCatalogTranslations() {
  return {
    admin: useTranslations('admin-catalog'),
    common: useTranslations('common'),
    catalog: useTranslations('catalog'),
  };
}
