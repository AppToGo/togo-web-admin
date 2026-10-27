import apiClient from "@/services/api.service";
import type { FeatureKey } from "../types";

/** Funcionalidades que el SUPER_ADMIN activó para el negocio. */
export async function getBusinessFeatures(
  businessId: string
): Promise<FeatureKey[]> {
  const response = await apiClient.get<FeatureKey[]>(
    `/businesses/${businessId}/features`
  );
  return response.data;
}
