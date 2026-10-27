import type { FeatureKey } from "@/features/business-features/types";

export interface FeatureDefinition {
  key: FeatureKey;
  name: string;
  description: string;
  defaultEnabled: boolean;
  requires?: FeatureKey[];
  requiresAnyOf?: FeatureKey[];
}

export interface FeatureSummary extends FeatureDefinition {
  enabledCount: number;
  totalBusinesses: number;
}

export interface BusinessFeatureStatus extends FeatureDefinition {
  enabled: boolean;
  /** El SUPER_ADMIN no lo ha tocado: aplica el valor por defecto. */
  isDefault: boolean;
  updatedAt: string | null;
  updatedBy: { id: string; name: string } | null;
}

export interface BulkUpdateFeaturesDto {
  businessIds: string[];
  featureKeys: FeatureKey[];
  enabled: boolean;
}

export interface BulkFeatureChange {
  businessId: string;
  enabled: FeatureKey[];
  disabled: FeatureKey[];
}
