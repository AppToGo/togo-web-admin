"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Building2, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useUserBranches } from "@/features/orders/hooks";
import { useBranchesByBusiness } from "@/features/branches/hooks";
import { useBranchStore } from "@/stores/branch.store";
import { useBusinessStore } from "@/features/business/stores/business.store";
import { useIsSuperAdmin } from "@/features/auth/stores/auth.store";
import { MultiSelector } from "@/components/ui/multi-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export interface BranchMultiSelectorProps {
  className?: string;
  onSelectionChange?: (branchIds: string[]) => void;
}

/**
 * Branch Multi-Selector Component
 *
 * Uses the generic MultiSelector component with branch-specific logic.
 * Features:
 * - Conditional visibility based on branch count
 * - Auto-select default branch on mount
 * - Persist selection to localStorage via branch.store
 * - Shows main branch badge
 */
export function BranchMultiSelector({
  className,
  onSelectionChange,
}: BranchMultiSelectorProps) {
  const t = useTranslations("orders");
  const tb = useTranslations("branches");

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = useIsSuperAdmin();
  const { selectedBusinessId } = useBusinessStore();

  // For SUPER_ADMIN: load branches from selected business
  // For regular users: load branches from user session
  const {
    branches: userBranches,
    defaultBranchId: userDefaultBranchId,
    isLoading: userIsLoading,
    error: userError,
  } = useUserBranches();

  const {
    data: businessBranches,
    isLoading: businessIsLoading,
    error: businessError,
  } = useBranchesByBusiness(isSuperAdmin ? selectedBusinessId : null);

  // Use appropriate data based on user role
  const branches = isSuperAdmin ? (businessBranches ?? []) : userBranches;
  const defaultBranchId = isSuperAdmin
    ? businessBranches?.find((b) => b.isMainBranch)?.id ?? null
    : userDefaultBranchId;
  const isLoading = isSuperAdmin ? businessIsLoading : userIsLoading;
  const error = isSuperAdmin ? businessError : userError;

  const isVisible = branches.length > 1;

  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  const setSelectedBranches = useBranchStore(
    (state) => state.setSelectedBranches
  );

  // Convert branches to MultiSelector options with badges
  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: b.name,
        badge: b.isMainBranch ? (
          <Badge
            variant="outline"
            className="text-[10px] h-5 text-amber-600 border-amber-200 bg-amber-50"
          >
            {tb("main")}
          </Badge>
        ) : undefined,
      })),
    [branches, tb]
  );

  // Handle selection changes
  const handleChange = useCallback(
    (values: string[]) => {
      const names = values.reduce(
        (acc, id) => {
          const branch = branches.find((b) => b.id === id);
          if (branch) acc[id] = branch.name;
          return acc;
        },
        {} as Record<string, string>
      );
      setSelectedBranches(values, names);
      onSelectionChange?.(values);
    },
    [branches, setSelectedBranches, onSelectionChange]
  );

  // Initialize selection on mount
  useEffect(() => {
    if (isLoading || !branches.length) return;

    if (selectedBranchIds.length > 0) {
      const validIds = selectedBranchIds.filter((id) =>
        branches.some((b) => b.id === id)
      );
      if (validIds.length !== selectedBranchIds.length) {
        const validNames = validIds.reduce(
          (acc, id) => {
            const branch = branches.find((b) => b.id === id);
            if (branch) acc[id] = branch.name;
            return acc;
          },
          {} as Record<string, string>
        );
        setSelectedBranches(validIds, validNames);
      }
      return;
    }

    if (defaultBranchId) {
      const hasAccess = branches.some((b) => b.id === defaultBranchId);
      if (hasAccess) {
        const defaultBranch = branches.find((b) => b.id === defaultBranchId);
        setSelectedBranches(
          [defaultBranchId],
          defaultBranch ? { [defaultBranchId]: defaultBranch.name } : {}
        );
      } else if (branches.length > 0) {
        const firstBranch = branches[0];
        setSelectedBranches([firstBranch.id], {
          [firstBranch.id]: firstBranch.name,
        });
      }
    } else if (branches.length > 0) {
      const allNames = branches.reduce(
        (acc, branch) => {
          acc[branch.id] = branch.name;
          return acc;
        },
        {} as Record<string, string>
      );
      setSelectedBranches(
        branches.map((b) => b.id),
        allNames
      );
    }
  }, [
    isLoading,
    branches,
    defaultBranchId,
    selectedBranchIds,
    setSelectedBranches,
  ]);

  // Show message for SUPER_ADMIN when no business is selected
  if (isSuperAdmin && !selectedBusinessId) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-sm",
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{t("branchSelector.selectBusinessFirst")}</span>
      </div>
    );
  }

  if (!isVisible && !isLoading) return null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center h-10 px-3 gap-2 rounded-md border border-slate-200 bg-slate-50 min-w-45",
          className
        )}
      >
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-4 h-4 rounded ml-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm",
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{tb("errors.loadFailed")}</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-sm",
          className
        )}
      >
        <Store className="w-4 h-4" />
        <span>{tb("noBranches")}</span>
      </div>
    );
  }

  return (
    <MultiSelector
      options={branchOptions}
      value={selectedBranchIds}
      onChange={handleChange}
      placeholder={t("branchSelector.placeholder")}
      searchPlaceholder={t("branchSelector.searchPlaceholder")}
      emptyMessage={t("branchSelector.noResults")}
      allLabel={t("branchSelector.allBranches")}
      clearAllLabel={t("branchSelector.clearAll")}
      selectAllLabel={t("branchSelector.selectAll")}
      icon={<Building2 className="w-4 h-4" />}
      className={className}
      showSelectAll
      showFooter
    />
  );
}

/**
 * Branch Filter Badge
 */
export function BranchFilterBadge({ count }: { count: number }) {
  const t = useTranslations("orders");

  if (count === 0) return null;

  return (
    <Badge
      variant="secondary"
      className="h-6 px-2 gap-1 bg-indigo-50 text-indigo-700 border-indigo-100"
    >
      <Building2 className="w-3 h-3" />
      <span className="text-xs">
        {count === 1
          ? t("branchSelector.oneBranch")
          : t("branchSelector.multipleBranches", { count })}
      </span>
    </Badge>
  );
}
