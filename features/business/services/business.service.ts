/**
 * Business Service
 * API calls for business management
 */

import apiClient from "@/services/api.service";
import type { Business, UpdateBusinessRequest } from "../types/business.types";

/**
 * Get business by ID
 * GET /v1/businesses/:id
 */
export async function getBusinessById(id: string): Promise<Business> {
  const { data } = await apiClient.get<Business>(`/businesses/${id}`);
  return data;
}

/**
 * Get current user's business
 * GET /v1/businesses/me
 */
export async function getCurrentBusiness(): Promise<Business> {
  const { data } = await apiClient.get<Business>("/businesses/me");
  return data;
}

/**
 * Update business
 * PATCH /v1/businesses/:id
 */
export async function updateBusiness(
  id: string,
  request: UpdateBusinessRequest
): Promise<Business> {
  const { data } = await apiClient.patch<Business>(`/businesses/${id}`, request);
  return data;
}

/**
 * Upload business logo
 * POST /v1/businesses/:id/logo
 */
export async function uploadBusinessLogo(
  id: string,
  file: File
): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append("logo", file);

  const { data } = await apiClient.post<{ logoUrl: string }>(
    `/businesses/${id}/logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
}

/**
 * Check if slug is available
 * GET /v1/businesses/check-slug?slug=:slug
 */
export async function checkSlugAvailability(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  const { data } = await apiClient.get<{ available: boolean }>(
    "/businesses/check-slug",
    {
      params: { slug, excludeId },
    }
  );
  return data;
}
