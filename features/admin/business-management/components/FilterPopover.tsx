"use client";

/**
 * Filter Popover Component
 * Popover-based filter UI for business management
 * Similar to the orders page filter pattern
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAN_OPTIONS, PAYMENT_STATUS_CONFIG } from "../constants/payment-status";
import type { BusinessFilters } from "../types/business-subscription.types";

interface FilterPopoverProps {
  filters: BusinessFilters;
  onChange: (filters: BusinessFilters) => void;
  children?: React.ReactNode;
}

export function FilterPopover({ filters, onChange, children }: FilterPopoverProps) {
  const t = useTranslations("admin-businesses");
  const [isOpen, setIsOpen] = useState(false);

  // Local state for temporary filter values (applied only on "Apply")
  const [localFilters, setLocalFilters] = useState({
    plan: filters.plan?.toString() || "all",
    paymentStatus: filters.paymentStatus || "all",
    isActive: 
      filters.isActive === undefined
        ? "all"
        : filters.isActive
        ? "true"
        : "false",
  });

  // Calculate active filters count (excluding search)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.plan !== undefined) count++;
    if (filters.paymentStatus !== undefined) count++;
    if (filters.isActive !== undefined) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  // Update local filters when popover opens
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Sync local state with parent filters when opening
      setLocalFilters({
        plan: filters.plan?.toString() || "all",
        paymentStatus: filters.paymentStatus || "all",
        isActive:
          filters.isActive === undefined
            ? "all"
            : filters.isActive
            ? "true"
            : "false",
      });
    }
  }, [filters]);

  // Handle Apply button click
  const handleApply = useCallback(() => {
    onChange({
      ...filters,
      plan: localFilters.plan === "all" ? undefined : parseInt(localFilters.plan, 10),
      paymentStatus: localFilters.paymentStatus === "all" ? undefined : localFilters.paymentStatus,
      isActive: localFilters.isActive === "all" ? undefined : localFilters.isActive === "true",
      page: 1,
    });
    setIsOpen(false);
  }, [filters, localFilters, onChange]);

  // Handle Clear button click
  const handleClear = useCallback(() => {
    const clearedFilters = {
      page: 1,
      limit: filters.limit,
      search: filters.search,
    };
    
    setLocalFilters({
      plan: "all",
      paymentStatus: "all",
      isActive: "all",
    });
    
    onChange(clearedFilters);
    setIsOpen(false);
  }, [filters.limit, filters.search, onChange]);

  // Handle local filter changes
  const handlePlanChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, plan: value }));
  };

  const handlePaymentStatusChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, paymentStatus: value }));
  };

  const handleActiveChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, isActive: value }));
  };

  // Check if local filters differ from applied filters
  const hasLocalChanges = useMemo(() => {
    const currentPlan = filters.plan?.toString() || "all";
    const currentPaymentStatus = filters.paymentStatus || "all";
    const currentIsActive =
      filters.isActive === undefined
        ? "all"
        : filters.isActive
        ? "true"
        : "false";

    return (
      localFilters.plan !== currentPlan ||
      localFilters.paymentStatus !== currentPaymentStatus ||
      localFilters.isActive !== currentIsActive
    );
  }, [filters, localFilters]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "relative h-10 px-3 gap-2",
              hasActiveFilters && "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t("filters.title", { defaultValue: "Filters" })}</span>
            {hasActiveFilters && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-sm text-slate-900">
            {t("filters.title", { defaultValue: "Filters" })}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              {t("filters.clear", { defaultValue: "Clear all" })}
            </button>
          )}
        </div>

        {/* Filters Content */}
        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Plan Filter */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("filters.plan")}
            </Label>
            <Select value={localFilters.plan} onValueChange={handlePlanChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filters.plan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allPlans")}</SelectItem>
                {PLAN_OPTIONS.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value.toString()}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("filters.paymentStatus")}
            </Label>
            <Select
              value={localFilters.paymentStatus}
              onValueChange={handlePaymentStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filters.paymentStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Status Filter */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t("filters.status")}
            </Label>
            <Select value={localFilters.isActive} onValueChange={handleActiveChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStates")}</SelectItem>
                <SelectItem value="true">{t("filters.active")}</SelectItem>
                <SelectItem value="false">{t("filters.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-slate-600 hover:text-slate-900"
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!hasLocalChanges && !hasActiveFilters}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {t("filters.apply", { defaultValue: "Apply" })}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
