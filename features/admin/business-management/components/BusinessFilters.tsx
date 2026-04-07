"use client";

/**
 * Business Filters Component
 * Filter bar for business management table
 */

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAN_OPTIONS, PAYMENT_STATUS_CONFIG } from "../constants/payment-status";
import type { BusinessFilters as BusinessFiltersType } from "../types/business-subscription.types";

interface BusinessFiltersProps {
  filters: BusinessFiltersType;
  onFiltersChange: (filters: BusinessFiltersType) => void;
  className?: string;
}

export function BusinessFilters({
  filters,
  onFiltersChange,
  className,
}: BusinessFiltersProps) {
  const t = useTranslations("admin-businesses");
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  // Debounced search handler
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Debounce the actual filter change
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value || undefined, page: 1 });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onFiltersChange]
  );

  const handlePlanChange = (value: string) => {
    onFiltersChange({
      ...filters,
      plan: value === "all" ? undefined : parseInt(value, 10),
      page: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      paymentStatus: value === "all" ? undefined : value,
      page: 1,
    });
  };

  const handleActiveChange = (value: string) => {
    onFiltersChange({
      ...filters,
      isActive: value === "all" ? undefined : value === "true",
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    filters.plan !== undefined ||
    filters.paymentStatus !== undefined ||
    filters.isActive !== undefined ||
    (filters.search && filters.search.length > 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t("filters.searchPlaceholder")}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Plan Select */}
        <Select
          value={filters.plan?.toString() || "all"}
          onValueChange={handlePlanChange}
        >
          <SelectTrigger className="w-full sm:w-40">
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

        {/* Payment Status Select */}
        <Select
          value={filters.paymentStatus || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-44">
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

        {/* Active Status Select */}
        <Select
          value={
            filters.isActive === undefined
              ? "all"
              : filters.isActive
              ? "true"
              : "false"
          }
          onValueChange={handleActiveChange}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allStates")}</SelectItem>
            <SelectItem value="true">{t("filters.active")}</SelectItem>
            <SelectItem value="false">{t("filters.inactive")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            title={t("filters.clearFilters")}
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
