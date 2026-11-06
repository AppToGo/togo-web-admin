'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useDashboardBusinessId } from '../stores/branch-filter.store';
import apiClient from '@/services/api.service';
import type { ProductReviewsSummary } from '../types/dashboard.types';

const reviewsKey = (businessId: string | null | undefined) => [
  'dashboard',
  'reviews',
  businessId,
];

/** Calificaciones de los productos del negocio (flag PRODUCT_REVIEWS). */
export function useProductReviewsSummary(options?: { enabled?: boolean }) {
  const businessId = useDashboardBusinessId();

  return useQuery({
    queryKey: reviewsKey(businessId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProductReviewsSummary>(
        `/businesses/${businessId}/reviews/summary`
      );
      return data;
    },
    enabled: options?.enabled !== false && !!businessId,
    staleTime: 60 * 1000,
  });
}

/** Oculta o vuelve a mostrar una reseña en el catálogo. */
export function useToggleReviewHidden() {
  const businessId = useDashboardBusinessId();
  const queryClient = useQueryClient();
  const t = useTranslations('dashboard.reviews');

  return useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      await apiClient.patch(
        `/businesses/${businessId}/reviews/${id}/${hidden ? 'hide' : 'unhide'}`
      );
    },
    onSuccess: (_data, { hidden }) => {
      toast.success(hidden ? t('hiddenToast') : t('shownToast'));
      queryClient.invalidateQueries({ queryKey: reviewsKey(businessId) });
    },
    onError: () => toast.error(t('toggleError')),
  });
}
