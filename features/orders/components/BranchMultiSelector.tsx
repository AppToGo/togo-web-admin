"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Building2, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useUserBranches } from "@/features/orders/hooks";
import { useBranchStore } from "@/stores/branch.store";
import { MultiSelect } from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export interface BranchMultiSelectorProps {
  className?: string;
  onSelectionChange?: (branchIds: string[]) => void;
}

/**
 * Branch Multi-Selector Component
 *
 * Wrapper around the generic MultiSelect component for branch filtering.
 * Handles business logic: visibility, auto-initialization, and store integration.
 */
export function BranchMultiSelector({
  className,
  onSelectionChange,
}: BranchMultiSelectorProps) {
  const t = useTranslations("orders");
  const tb = useTranslations("branches");

  // Get branches and business info from useUserBranches hook
  const { branches, defaultBranchId, isLoading, error } = useUserBranches();

  // Only show if user has access to multiple branches
  const isVisible = branches.length > 1;

  // Get selected branch IDs from store
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  const setSelectedBranches = useBranchStore((state) => state.setSelectedBranches);
  const deselectAllBranches = useBranchStore((state) => state.deselectAllBranches);

  // Convert branches to MultiSelect options
  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [branches]
  );

  // Handle selection changes
  const handleChange = useCallback(
    (values: string[]) => {
      const names = values.reduce((acc, id) => {
        const branch = branches.find((b) => b.id === id);
        if (branch) acc[id] = branch.name;
        return acc;
      }, {} as Record<string, string>);
      setSelectedBranches(values, names);
      onSelectionChange?.(values);
    },
    [branches, setSelectedBranches, onSelectionChange]
  );

  // Initialize selection on mount
  useEffect(() => {
    if (isLoading || !branches.length) return;

    // If there's already a selection in store, validate it
    if (selectedBranchIds.length > 0) {
      const validIds = selectedBranchIds.filter((id) =>
        branches.some((b) => b.id === id)
      );
      if (validIds.length !== selectedBranchIds.length) {
        const validNames = validIds.reduce((acc, id) => {
          const branch = branches.find((b) => b.id === id);
          if (branch) acc[id] = branch.name;
          return acc;
        }, {} as Record<string, string>);
        setSelectedBranches(validIds, validNames);
      }
      return;
    }

    // First load - initialize based on default branch or select all
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
        setSelectedBranches([firstBranch.id], { [firstBranch.id]: firstBranch.name });
      }
    } else if (branches.length > 0) {
      const allNames = branches.reduce((acc, branch) => {
        acc[branch.id] = branch.name;
        return acc;
      }, {} as Record<string, string>);
      setSelectedBranches(
        branches.map((b) => b.id),
        allNames
      );
    }
  }, [isLoading, branches, defaultBranchId, selectedBranchIds, setSelectedBranches]);

  // Don't render if not visible (single branch)
  if (!isVisible && !isLoading) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center h-10 px-3 gap-2 rounded-md border border-slate-200 bg-slate-50 min-w-[180px]",
          className
        )}
      >
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-4 h-4 rounded ml-auto" />
      </div>
    );
  }

  // Error state
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

  // No branches state
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

  // Custom trigger content showing Building icon
  const customTrigger = (
    <div className="flex items-center gap-2 overflow-hidden">
      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
      {selectedBranchIds.length > 0 ? (
        <span className="truncate text-sm text-slate-700">
          {selectedBranchIds.length === 1
            ? branches.find((b) => b.id === selectedBranchIds[0])?.name
            : t("branchSelector.selectedCount", { count: selectedBranchIds.length })}
        </span>
      ) : (
        <span className="text-slate-400 text-sm">{t("branchSelector.placeholder")}</span>
      )}
    </div>
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MultiSelect
        options={branchOptions}
        value={selectedBranchIds}
        onChange={handleChange}
        placeholder={t("branchSelector.placeholder")}
        searchPlaceholder={t("branchSelector.searchPlaceholder")}
        emptyMessage={t("branchSelector.noResults")}
        maxDisplay={1}
        className="min-w-[180px]"
      />
      {selectedBranchIds.length > 1 && (
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] font-medium shrink-0"
        >
          {selectedBranchIds.length}
        </Badge>
      )}
    </div>
  );
}

/**
 * Branch Filter Badge
 *
 * Displays a badge with the count of selected branches
 * Used when space is limited
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
