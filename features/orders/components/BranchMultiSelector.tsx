"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Building2, Check, ChevronsUpDown, X, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useUserBranches } from "@/features/orders/hooks";
import { useBranchStore } from "@/stores/branch.store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface BranchMultiSelectorProps {
  className?: string;
  onSelectionChange?: (branchIds: string[]) => void;
}

/**
 * Branch Multi-Selector Component
 *
 * Multi-select dropdown for filtering orders by branches.
 * 
 * Features:
 * - Conditional visibility based on business plan and branch count
 * - Multi-select UI with checkboxes
 * - "All Branches" option for OWNER/SUPER_ADMIN users
 * - Auto-select all branches on mount for OWNER/SUPER_ADMIN
 * - Persist selection to localStorage via branch.store
 * - Loading skeleton state
 * - Error state handling
 */
export function BranchMultiSelector({
  className,
  onSelectionChange,
}: BranchMultiSelectorProps) {
  const t = useTranslations("orders");
  const tb = useTranslations("branches");

  // Get branches and business info from useUserBranches hook
  const {
    branches,
    defaultBranchId,
    isLoading,
    error,
  } = useUserBranches();
  
  // Derive additional properties from branches
  const canSelectAll = branches.length > 0; // All authenticated users can select from their accessible branches
  const isVisible = branches.length > 1; // Only show if user has access to multiple branches

  // Get selected branch IDs from store
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  const setSelectedBranches = useBranchStore((state) => state.setSelectedBranches);
  const deselectAllBranches = useBranchStore((state) => state.deselectAllBranches);
  const selectAllBranches = useBranchStore((state) => state.selectAllBranches);
  const selectedBranchNames = useBranchStore((state) => state.selectedBranchNames);

  // All branch IDs for "Select All" functionality
  const allBranchIds = useMemo(() => branches.map((b) => b.id), [branches]);

  // Check if all branches are selected
  const isAllSelected = useMemo(() => {
    if (!selectedBranchIds || selectedBranchIds.length === 0) return false;
    return selectedBranchIds.length === branches.length;
  }, [selectedBranchIds, branches.length]);

  // Initialize selection on mount
  useEffect(() => {
    if (isLoading || !branches.length) return;

    // If there's already a selection in store, use it
    if (selectedBranchIds && selectedBranchIds.length > 0) {
      // Validate that all selected IDs still exist
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
      // Select default branch from session
      const hasAccess = branches.some((b) => b.id === defaultBranchId);
      if (hasAccess) {
        const defaultBranch = branches.find((b) => b.id === defaultBranchId);
        setSelectedBranches([defaultBranchId], defaultBranch ? { [defaultBranchId]: defaultBranch.name } : {});
      } else if (branches.length > 0) {
        // Fallback to first available branch
        const firstBranch = branches[0];
        setSelectedBranches([firstBranch.id], { [firstBranch.id]: firstBranch.name });
      }
    } else if (branches.length > 0) {
      // No default branch, select all available branches
      const allNames = branches.reduce((acc, branch) => {
        acc[branch.id] = branch.name;
        return acc;
      }, {} as Record<string, string>);
      setSelectedBranches(allBranchIds, allNames);
    }
  }, [
    isLoading,
    branches,
    canSelectAll,
    defaultBranchId,
    allBranchIds,
    selectedBranchIds,
    setSelectedBranches,
    selectAllBranches,
  ]);

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChange && selectedBranchIds) {
      onSelectionChange(selectedBranchIds);
    }
  }, [selectedBranchIds, onSelectionChange]);

  // Handle individual branch toggle
  const handleToggleBranch = useCallback(
    (branchId: string) => {
      const branch = branches.find((b) => b.id === branchId);
      if (!branch) return;

      if (selectedBranchIds.includes(branchId)) {
        // Remove branch if already selected
        const newSelection = selectedBranchIds.filter((id) => id !== branchId);
        const newNames = { ...selectedBranchNames };
        delete newNames[branchId];
        setSelectedBranches(newSelection, newNames);
      } else {
        // Add branch to selection
        setSelectedBranches(
          [...selectedBranchIds, branchId],
          { ...selectedBranchNames, [branchId]: branch.name }
        );
      }
    },
    [selectedBranchIds, selectedBranchNames, setSelectedBranches, branches]
  );

  // Handle "All Branches" toggle
  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      deselectAllBranches();
    } else {
      const allNames = branches.reduce((acc, branch) => {
        acc[branch.id] = branch.name;
        return acc;
      }, {} as Record<string, string>);
      setSelectedBranches(allBranchIds, allNames);
    }
  }, [isAllSelected, allBranchIds, deselectAllBranches, setSelectedBranches, branches]);

  // Handle select all branches
  const handleSelectAll = useCallback(() => {
    const allNames = branches.reduce((acc, branch) => {
      acc[branch.id] = branch.name;
      return acc;
    }, {} as Record<string, string>);
    setSelectedBranches(allBranchIds, allNames);
  }, [allBranchIds, setSelectedBranches, branches]);

  // Handle clear all selections
  const handleClearAll = useCallback(() => {
    deselectAllBranches();
  }, [deselectAllBranches]);

  // Get selected branch names for display
  const selectedLabels = useMemo(() => {
    if (selectedBranchIds.length === 0) return [];
    return selectedBranchIds
      .map((id) => selectedBranchNames[id] || branches.find((b) => b.id === id)?.name)
      .filter(Boolean) as string[];
  }, [selectedBranchIds, selectedBranchNames, branches]);

  // Don't render if not visible (single branch or basic plan)
  if (!isVisible && !isLoading) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return <BranchMultiSelectorSkeleton className={className} />;
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

  // No branches state (user without branch access)
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "h-10 px-3 justify-between gap-2 min-w-[180px]",
            "bg-white hover:bg-slate-50 border-slate-200",
            "text-slate-700 font-normal",
            className
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            {selectedBranchIds.length > 0 ? (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="truncate text-sm">
                  {selectedLabels.length === 1
                    ? selectedLabels[0]
                    : t("branchSelector.selectedCount", {
                        count: selectedLabels.length,
                      })}
                </span>
                {selectedLabels.length > 1 && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] font-medium shrink-0"
                  >
                    {selectedBranchIds.length}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-sm">
                {t("branchSelector.placeholder")}
              </span>
            )}
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 z-50"
        align="start"
        sideOffset={4}
      >
        <Command className="rounded-lg border-0">
          <CommandInput
            placeholder={t("branchSelector.searchPlaceholder")}
            className="h-10 border-b border-slate-100"
          />
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandEmpty className="py-3 text-sm text-slate-500 text-center">
              {t("branchSelector.noResults")}
            </CommandEmpty>
            <CommandGroup className="p-1">
              {/* "All Branches" option */}
              {canSelectAll && (
                <CommandItem
                  onSelect={handleToggleAll}
                  className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100"
                >
                  <div className="flex items-center justify-center w-4 h-4 rounded border border-slate-300 bg-white shrink-0">
                    {isAllSelected && (
                      <Check className="w-3 h-3 text-indigo-600" />
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-700">
                    {t("branchSelector.allBranches")}
                  </span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {branches.length}
                  </Badge>
                </CommandItem>
              )}

              {/* Divider when "All Branches" option is shown */}
              {canSelectAll && (
                <div className="my-1 border-t border-slate-100" />
              )}

              {/* Individual branches */}
              {branches.map((branch) => {
                const isSelected = selectedBranchIds.includes(branch.id);
                return (
                  <CommandItem
                    key={branch.id}
                    onSelect={() => handleToggleBranch(branch.id)}
                    className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-slate-100 aria-selected:bg-slate-100"
                  >
                    <div className="flex items-center justify-center w-4 h-4 rounded border border-slate-300 bg-white shrink-0">
                      {isSelected && (
                        <Check className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {branch.name}
                    </span>
                    {branch.isMainBranch && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 text-amber-600 border-amber-200 bg-amber-50"
                      >
                        {tb("main")}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-2 py-2 border-t border-slate-100 bg-slate-50/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
              disabled={selectedBranchIds.length === 0}
            >
              <X className="w-3 h-3 mr-1" />
              {t("branchSelector.clearAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700"
            >
              <Check className="w-3 h-3 mr-1" />
              {t("branchSelector.selectAll")}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Skeleton loader for Branch Multi-Selector
 */
function BranchMultiSelectorSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center h-10 px-3 gap-2 rounded-md border border-slate-200 bg-slate-50",
        className
      )}
    >
      <Skeleton className="w-4 h-4 rounded" />
      <Skeleton className="w-24 h-4 rounded" />
      <Skeleton className="w-4 h-4 rounded ml-auto" />
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
