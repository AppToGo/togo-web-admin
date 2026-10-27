/**
 * Activación de funcionalidades por negocio (solo SUPER_ADMIN).
 *
 * - GET /admin/features
 * - GET /admin/features/businesses/:businessId
 * - GET /admin/features/:key/businesses
 * - PUT /admin/features/bulk
 */

import apiClient from "@/services/api.service";
import type { FeatureKey } from "@/features/business-features/types";
import type {
  BulkFeatureChange,
  BulkUpdateFeaturesDto,
  BusinessFeatureStatus,
  FeatureSummary,
} from "../types";

export async function getFeatureSummary(): Promise<FeatureSummary[]> {
  const response = await apiClient.get<FeatureSummary[]>("/admin/features");
  return response.data;
}

export async function getBusinessFeatureStatus(
  businessId: string
): Promise<BusinessFeatureStatus[]> {
  const response = await apiClient.get<BusinessFeatureStatus[]>(
    `/admin/features/businesses/${businessId}`
  );
  return response.data;
}

export async function getBusinessesWithFeature(
  key: FeatureKey
): Promise<{ id: string; name: string; slug: string }[]> {
  const response = await apiClient.get<{ id: string; name: string; slug: string }[]>(
    `/admin/features/${key}/businesses`
  );
  return response.data;
}

export async function bulkUpdateFeatures(
  data: BulkUpdateFeaturesDto
): Promise<BulkFeatureChange[]> {
  const response = await apiClient.put<BulkFeatureChange[]>(
    "/admin/features/bulk",
    data
  );
  return response.data;
}
