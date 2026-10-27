import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEffectiveBusinessId } from "@/features/business/stores/business.store";
import { getBusinessFeatures } from "../services/business-features.service";
import type { FeatureKey } from "../types";

export const BUSINESS_FEATURES_KEYS = {
  all: ["business-features"] as const,
  detail: (businessId: string) =>
    [...BUSINESS_FEATURES_KEYS.all, businessId] as const,
};

/**
 * Funcionalidades activas del negocio efectivo (el propio o el que eligió el
 * SUPER_ADMIN). Sin negocio elegido (SUPER_ADMIN en "Todos los negocios") no
 * hay nada que ocultar: todo se considera activo.
 */
export function useBusinessFeatures() {
  const businessId = useEffectiveBusinessId();

  const query = useQuery({
    queryKey: BUSINESS_FEATURES_KEYS.detail(businessId ?? ""),
    queryFn: () => getBusinessFeatures(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });

  const isEnabled = useCallback(
    (key: FeatureKey) => {
      if (!businessId) return true;
      return query.data?.includes(key) ?? false;
    },
    [businessId, query.data]
  );

  return {
    features: query.data ?? [],
    isEnabled,
    isLoading: !!businessId && query.isLoading,
  };
}

export function useBusinessFeature(key: FeatureKey) {
  const { isEnabled, isLoading } = useBusinessFeatures();
  return { enabled: isEnabled(key), isLoading };
}
