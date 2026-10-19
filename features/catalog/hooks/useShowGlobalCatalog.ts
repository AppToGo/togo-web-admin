import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useHasGlobalCatalogProducts } from "./useCatalog";

/**
 * Si se ofrece el Catálogo global: al super admin siempre; a un negocio,
 * solo si hay productos disponibles para su industria. Lo usan el Sidebar y
 * la barra inferior de Catálogo del teléfono.
 */
export function useShowGlobalCatalog(): boolean {
  const isSuperAdmin = useIsSuperAdmin();
  const businessId = useEffectiveBusinessId();
  const { hasProducts } = useHasGlobalCatalogProducts(isSuperAdmin ? null : businessId);
  return isSuperAdmin || hasProducts;
}
