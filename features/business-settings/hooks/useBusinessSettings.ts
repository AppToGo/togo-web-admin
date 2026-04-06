'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getBusiness, updateBusiness } from '../services/business-settings.service';
import { BUSINESS_SETTINGS_KEYS } from './query-keys';
import type { BusinessWithSettings, UpdateBusinessRequest } from '../types/business-settings.types';
import { getHumanizedErrorMessage } from '@/lib/error.utils';

/**
 * Hook para obtener los datos de un negocio con su configuración
 */
export function useBusiness(businessId: string | null) {
  return useQuery<BusinessWithSettings, Error>({
    queryKey: BUSINESS_SETTINGS_KEYS.detail(businessId || ''),
    queryFn: () => getBusiness(businessId!),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para actualizar un negocio
 */
export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  const t = useTranslations('businessSettings');

  return useMutation({
    mutationFn: ({ businessId, data }: { businessId: string; data: UpdateBusinessRequest }) =>
      updateBusiness(businessId, data),

    onSuccess: (updatedBusiness, { businessId }) => {
      queryClient.setQueryData(
        BUSINESS_SETTINGS_KEYS.detail(businessId),
        updatedBusiness
      );
      toast.success(t('updateSuccess'));
    },

    onError: (error) => {
      const message = getHumanizedErrorMessage(error);
      toast.error(message || t('updateError'));
    },
  });
}
