"use client";

/**
 * Business Management Page
 * Super Admin page for managing business subscriptions
 */

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertBadge } from "@/components/ui/alert-badge";
import {
  useBusinesses,
  usePaymentAlerts,
  useUpdateBranchesLimit,
  useRecordPayment,
  useSendNotification,
  useToggleBusinessStatus,
} from "@/features/admin/business-management/hooks/useAdminBusinesses";
import { BusinessFilters } from "@/features/admin/business-management/components/BusinessFilters";
import { BusinessTable } from "@/features/admin/business-management/components/BusinessTable";
import { RecordPaymentModal } from "@/features/admin/business-management/components/RecordPaymentModal";
import { EditBranchesLimitModal } from "@/features/admin/business-management/components/EditBranchesLimitModal";
import { SendNotificationModal } from "@/features/admin/business-management/components/SendNotificationModal";
import type {
  BusinessFilters as BusinessFiltersType,
  BusinessWithSubscription,
  RecordPaymentDto,
  UpdateBranchesLimitDto,
  SendNotificationDto,
} from "@/features/admin/business-management/types/business-subscription.types";

const DEFAULT_FILTERS: BusinessFiltersType = {
  page: 1,
  limit: 20,
};

export default function BusinessManagementPage() {
  const t = useTranslations("admin-businesses");
  const { isLoading: isAuthLoading } = useAuthGuard({ requiredRole: "SUPER_ADMIN" });
  const isSuperAdmin = useIsSuperAdmin();

  // State
  const [filters, setFilters] = useState<BusinessFiltersType>(DEFAULT_FILTERS);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithSubscription | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Queries
  const { data: businessesData, isLoading: isBusinessesLoading } = useBusinesses(filters);
  const { data: alerts } = usePaymentAlerts({
    enabled: isSuperAdmin,
  });

  // Mutations
  const updateBranchesLimit = useUpdateBranchesLimit();
  const recordPayment = useRecordPayment();
  const sendNotification = useSendNotification();
  const toggleStatus = useToggleBusinessStatus();

  // Handlers
  const handleFiltersChange = useCallback((newFilters: BusinessFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleRecordPayment = useCallback((business: BusinessWithSubscription) => {
    setSelectedBusiness(business);
    setIsPaymentModalOpen(true);
  }, []);

  const handleEditBranches = useCallback((business: BusinessWithSubscription) => {
    setSelectedBusiness(business);
    setIsBranchesModalOpen(true);
  }, []);

  const handleSendNotification = useCallback((business: BusinessWithSubscription) => {
    setSelectedBusiness(business);
    setIsNotificationModalOpen(true);
  }, []);

  const handleToggleStatus = useCallback((business: BusinessWithSubscription) => {
    toggleStatus.mutate({
      businessId: business.id,
      isActive: !business.isActive,
    });
  }, [toggleStatus]);

  const handleSubmitPayment = useCallback(
    (data: RecordPaymentDto) => {
      if (!selectedBusiness) return;
      recordPayment.mutate(
        { businessId: selectedBusiness.id, data },
        {
          onSuccess: () => {
            setIsPaymentModalOpen(false);
            setSelectedBusiness(null);
          },
        }
      );
    },
    [recordPayment, selectedBusiness]
  );

  const handleSubmitBranchesLimit = useCallback(
    (data: UpdateBranchesLimitDto) => {
      if (!selectedBusiness) return;
      updateBranchesLimit.mutate(
        { businessId: selectedBusiness.id, data },
        {
          onSuccess: () => {
            setIsBranchesModalOpen(false);
            setSelectedBusiness(null);
          },
        }
      );
    },
    [updateBranchesLimit, selectedBusiness]
  );

  const handleSubmitNotification = useCallback(
    (data: SendNotificationDto) => {
      if (!selectedBusiness) return;
      sendNotification.mutate(
        { businessId: selectedBusiness.id, data },
        {
          onSuccess: () => {
            setIsNotificationModalOpen(false);
            setSelectedBusiness(null);
          },
        }
      );
    },
    [sendNotification, selectedBusiness]
  );

  // Pagination handlers
  const handlePreviousPage = () => {
    if (filters.page && filters.page > 1) {
      setFilters((prev) => ({ ...prev, page: prev.page! - 1 }));
    }
  };

  const handleNextPage = () => {
    if (businessesData?.meta && filters.page! < businessesData.meta.totalPages) {
      setFilters((prev) => ({ ...prev, page: prev.page! + 1 }));
    }
  };

  if (isAuthLoading) {
    return null; // Let the loading.tsx handle this
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <ShieldIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {t("errors.unauthorized")}
            </h1>
            <p className="text-slate-500">{t("errors.superAdminRequired")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const alertCount = alerts?.length || 0;

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t("page.title")}
          </h1>
          <p className="text-slate-500 mt-1">{t("page.description")}</p>
        </div>
        {alertCount > 0 && (
          <AlertBadge
            count={alertCount}
            label={t("page.alerts", { count: alertCount })}
            variant="destructive"
          />
        )}
      </div>

      {/* Alerts Section */}
      {alertCount > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">
                {t("alerts.title", { count: alertCount })}
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {t("alerts.description")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <BusinessFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <Card>
        <BusinessTable
          businesses={businessesData?.data || []}
          onRecordPayment={handleRecordPayment}
          onEditBranches={handleEditBranches}
          onSendNotification={handleSendNotification}
          onToggleStatus={handleToggleStatus}
          isLoading={isBusinessesLoading}
        />

        {/* Pagination */}
        {businessesData?.meta && businessesData.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-slate-500">
              {t("pagination.showing", {
                from: (filters.page! - 1) * filters.limit! + 1,
                to: Math.min(
                  filters.page! * filters.limit!,
                  businessesData.meta.total
                ),
                total: businessesData.meta.total,
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={filters.page === 1}
              >
                {t("pagination.previous")}
              </Button>
              <span className="text-sm text-slate-600">
                {t("pagination.page", {
                  current: filters.page,
                  total: businessesData.meta.totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={filters.page === businessesData.meta.totalPages}
              >
                {t("pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <RecordPaymentModal
        business={selectedBusiness}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedBusiness(null);
        }}
        onSubmit={handleSubmitPayment}
        isSubmitting={recordPayment.isPending}
      />

      <EditBranchesLimitModal
        business={selectedBusiness}
        isOpen={isBranchesModalOpen}
        onClose={() => {
          setIsBranchesModalOpen(false);
          setSelectedBusiness(null);
        }}
        onSubmit={handleSubmitBranchesLimit}
        isSubmitting={updateBranchesLimit.isPending}
      />

      <SendNotificationModal
        business={selectedBusiness}
        isOpen={isNotificationModalOpen}
        onClose={() => {
          setIsNotificationModalOpen(false);
          setSelectedBusiness(null);
        }}
        onSubmit={handleSubmitNotification}
        isSubmitting={sendNotification.isPending}
      />
    </div>
    </DashboardLayout>
  );
}

// Icons
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
