"use client";

/**
 * Business Management Page
 * Super Admin page for managing business subscriptions
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertBadge } from "@/components/ui/alert-badge";
import { Input } from "@/components/ui/input";
import { Filter, Search, Shield, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBusinesses,
  usePaymentAlerts,
  useUpdateBranchesLimit,
  useRecordPayment,
  useSendNotification,
  useToggleBusinessStatus,
} from "@/features/admin/business-management/hooks/useAdminBusinesses";
import {
  BusinessTable,
  FilterPopover,
  RecordPaymentModal,
  EditBranchesLimitModal,
  SendNotificationModal,
} from "@/features/admin/business-management/components";
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

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function BusinessManagementPage() {
  const t = useTranslations("admin-businesses");
  const tc = useTranslations("common");
  const { isLoading: isAuthLoading } = useAuthGuard();
  const isSuperAdmin = useIsSuperAdmin();

  // State
  const [filters, setFilters] = useState<BusinessFiltersType>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithSubscription | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1,
    }));
  }, [debouncedSearch]);

  // Queries
  const { data: businessesData, isLoading: isBusinessesLoading } = useBusinesses(filters);
  const { data: alerts } = usePaymentAlerts(isSuperAdmin);

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

  // Check if there are active filters (excluding search)
  const hasActiveFilters =
    filters.plan !== undefined ||
    (filters.paymentStatuses && filters.paymentStatuses.length > 0) ||
    (filters.statusFilter !== undefined && filters.statusFilter !== "all");

  if (isAuthLoading) {
    return null; // Let the loading.tsx handle this
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
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
        {/* Header with Title, Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("page.title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{t("page.description")}</p>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={t("filters.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 w-full sm:w-64 h-10",
                  searchQuery && "pr-8"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Popover */}
            <FilterPopover filters={filters} onChange={handleFiltersChange}>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10 relative",
                  hasActiveFilters && "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                )}
                title={t("filters.title", { defaultValue: "Filters" })}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </FilterPopover>

            {/* Alerts Badge */}
            {alertCount > 0 && (
              <AlertBadge
                count={alertCount}
                label={t("page.alerts", { count: alertCount })}
                variant="destructive"
              />
            )}
          </div>
        </div>

        {/* Alerts Section */}
        {alertCount > 0 && (
          <Card className="p-4 border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
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

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">{t("filters.active")}:</span>
            <div className="flex items-center gap-2">
              {filters.plan !== undefined && (
                <FilterTag
                  label={`${t("filters.plan")}: ${filters.plan}`}
                  onRemove={() =>
                    handleFiltersChange({ ...filters, plan: undefined, page: 1 })
                  }
                />
              )}
              {filters.paymentStatuses && filters.paymentStatuses.length > 0 && (
                <FilterTag
                  label={`${t("filters.paymentStatus")}: ${filters.paymentStatuses.join(", ")}`}
                  onRemove={() =>
                    handleFiltersChange({ ...filters, paymentStatuses: undefined, page: 1 })
                  }
                />
              )}
              {filters.statusFilter && filters.statusFilter !== "all" && (
                <FilterTag
                  label={`${t("filters.status")}: ${filters.statusFilter === "active" ? t("filters.active") : t("filters.inactive")}`}
                  onRemove={() =>
                    handleFiltersChange({ ...filters, statusFilter: undefined, page: 1 })
                  }
                />
              )}
            </div>
            <button
              onClick={() =>
                handleFiltersChange({
                  page: 1,
                  limit: filters.limit,
                  search: filters.search,
                })
              }
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-2"
            >
              {tc("buttons.clearAll", { defaultValue: "Clear all" })}
            </button>
          </div>
        )}

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
                  from: ((filters.page ?? 1) - 1) * (filters.limit ?? 20) + 1,
                  to: Math.min(
                    (filters.page ?? 1) * (filters.limit ?? 20),
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
                    current: filters.page ?? 1,
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

// Filter Tag Component
function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:text-indigo-900 focus:outline-none"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
