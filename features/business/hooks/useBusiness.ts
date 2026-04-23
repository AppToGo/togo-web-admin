"use client";

/**
 * Business Hooks
 * TanStack Query hooks for business management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BUSINESS_KEYS } from "./query-keys";
import {
  getBusinessById,
  getCurrentBusiness,
  updateBusiness,
  uploadBusinessLogo,
  checkSlugAvailability,
} from "../services/business.service";
import type {
  Business,
  UpdateBusinessRequest,
} from "../types/business.types";

/**
 * Hook to get business by ID
 */
export function useBusiness(id: string, options?: { enabled?: boolean }) {
  return useQuery<Business>({
    queryKey: BUSINESS_KEYS.detail(id),
    queryFn: () => getBusinessById(id),
    enabled: options?.enabled !== false && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get current user's business
 */
export function useCurrentBusiness(options?: { enabled?: boolean }) {
  return useQuery<Business>({
    queryKey: BUSINESS_KEYS.current(),
    queryFn: () => getCurrentBusiness(),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to update business
 */
export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      data,
    }: {
      businessId: string;
      data: UpdateBusinessRequest;
    }) => {
      return updateBusiness(businessId, data);
    },
    onSuccess: (data) => {
      // Invalidate and update cache
      queryClient.invalidateQueries({
        queryKey: BUSINESS_KEYS.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: BUSINESS_KEYS.current(),
      });
    },
  });
}

/**
 * Hook to upload business logo
 */
export function useUploadBusinessLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, file }: { businessId: string; file: File }) => {
      return uploadBusinessLogo(businessId, file);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<Business>(BUSINESS_KEYS.current(), (old) =>
        old ? { ...old, settings: { ...(old.settings ?? {}), logo: data.logoUrl } } : old,
      );
      queryClient.invalidateQueries({ queryKey: BUSINESS_KEYS.detail(variables.businessId) });
      queryClient.invalidateQueries({ queryKey: BUSINESS_KEYS.current() });
    },
  });
}

/**
 * Hook to check slug availability
 */
export function useCheckSlugAvailability(slug: string, excludeId?: string) {
  return useQuery<{ available: boolean }>({
    queryKey: BUSINESS_KEYS.slugCheck(slug),
    queryFn: () => checkSlugAvailability(slug, excludeId),
    enabled: slug.length >= 3,
    staleTime: 30 * 1000, // 30 seconds
  });
}
