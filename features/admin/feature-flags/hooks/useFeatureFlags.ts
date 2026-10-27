import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { FeatureKey } from "@/features/business-features/types";
import { BUSINESS_FEATURES_KEYS } from "@/features/business-features/hooks/useBusinessFeatures";
import * as featureFlagsService from "../services/feature-flags.service";
import type { BulkUpdateFeaturesDto } from "../types";

export const FEATURE_FLAGS_KEYS = {
  all: ["admin", "feature-flags"] as const,
  summary: () => [...FEATURE_FLAGS_KEYS.all, "summary"] as const,
  business: (businessId: string) =>
    [...FEATURE_FLAGS_KEYS.all, "business", businessId] as const,
  featureBusinesses: (key: FeatureKey) =>
    [...FEATURE_FLAGS_KEYS.all, "feature", key] as const,
};

export function useFeatureSummary(enabled = true) {
  return useQuery({
    queryKey: FEATURE_FLAGS_KEYS.summary(),
    queryFn: featureFlagsService.getFeatureSummary,
    enabled,
  });
}

export function useBusinessFeatureStatus(businessId: string | null) {
  return useQuery({
    queryKey: FEATURE_FLAGS_KEYS.business(businessId ?? ""),
    queryFn: () => featureFlagsService.getBusinessFeatureStatus(businessId!),
    enabled: !!businessId,
  });
}

export function useBusinessesWithFeature(key: FeatureKey | null) {
  return useQuery({
    queryKey: FEATURE_FLAGS_KEYS.featureBusinesses(key ?? ("" as FeatureKey)),
    queryFn: () => featureFlagsService.getBusinessesWithFeature(key!),
    enabled: !!key,
  });
}

export function useBulkUpdateFeatures() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin-feature-flags");

  return useMutation({
    mutationFn: (data: BulkUpdateFeaturesDto) =>
      featureFlagsService.bulkUpdateFeatures(data),
    onSuccess: (changes) => {
      const total = changes.reduce(
        (sum, c) => sum + c.enabled.length + c.disabled.length,
        0
      );
      toast.success(
        total === 0 ? t("notifications.noChanges") : t("notifications.updated", { count: total })
      );
      queryClient.invalidateQueries({ queryKey: FEATURE_FLAGS_KEYS.all });
      // El menú y las secciones del negocio que mira el SUPER_ADMIN se recalculan
      queryClient.invalidateQueries({ queryKey: BUSINESS_FEATURES_KEYS.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errors.update"));
    },
  });
}
