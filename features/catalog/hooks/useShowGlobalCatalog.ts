import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { useHasGlobalCatalogProducts } from "./useCatalog";
import { useBusinessFeature } from "@/features/business-features";

/**
 * Si se ofrece el Catálogo global: al super admin siempre; a un negocio,
 * solo si tiene activa la funcionalidad y hay productos disponibles para su
 * industria. Lo usan el Sidebar y la barra inferior de Catálogo del teléfono.
 */
export function useShowGlobalCatalog(): boolean {
  const isSuperAdmin = useIsSuperAdmin();
  const businessId = useEffectiveBusinessId();
  const { enabled: featureEnabled } = useBusinessFeature("GLOBAL_CATALOG");
  const { hasProducts } = useHasGlobalCatalogProducts(
    isSuperAdmin || !featureEnabled ? null : businessId
  );
  return isSuperAdmin || (featureEnabled && hasProducts);
}
