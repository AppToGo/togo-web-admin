'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Store, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthGuard } from '@/features/auth/hooks/useAuthGuard';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useBusinessStore } from '@/features/business/stores/business.store';
import { BusinessForm } from '@/features/business-settings/components/BusinessForm';
import { useBusiness, useUpdateBusiness } from '@/features/business-settings/hooks/useBusinessSettings';
import { formDataToUpdateRequest } from '@/features/business-settings/utils/settings-mappers';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessFormData } from '@/features/business-settings/types/business-settings.types';

export default function BusinessSettingsPage() {
  const t = useTranslations('businessSettings');
  const tCommon = useTranslations('common');

  useAuthGuard();

  const user = useAuthStore((state) => state.user);
  const { selectedBusinessId } = useBusinessStore();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const businessId = isSuperAdmin ? selectedBusinessId : user?.businessId;

  // Check if user can edit (OWNER or SUPER_ADMIN)
  const canEdit = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN';

  const { data: business, isLoading, error } = useBusiness(businessId || null);
  const updateMutation = useUpdateBusiness();

  const handleSubmit = (data: BusinessFormData, originalSlug: string) => {
    if (!businessId) return;

    const request = formDataToUpdateRequest(data);
    updateMutation.mutate({ businessId, data: request });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-indigo-600" />
              {t('title')}
            </h1>
            <p className="text-slate-500 mt-1">{t('subtitle')}</p>
          </div>
          <LoadingSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-indigo-600" />
              {t('title')}
            </h1>
            <p className="text-slate-500 mt-1">{t('subtitle')}</p>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tCommon('errors.loading')}</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-indigo-600" />
              {t('title')}
            </h1>
            <p className="text-slate-500 mt-1">{t('subtitle')}</p>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tCommon('errors.notFound')}</AlertTitle>
            <AlertDescription>{t('errors.businessNotFound')}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-indigo-600" />
            {t('title')}
          </h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        {/* Read-only warning */}
        {!canEdit && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tCommon('warnings.readOnly')}</AlertTitle>
            <AlertDescription>{t('readOnlyWarning')}</AlertDescription>
          </Alert>
        )}

        {/* Business Form */}
        <BusinessForm
          business={business}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          canEdit={canEdit}
        />
      </div>
    </DashboardLayout>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
