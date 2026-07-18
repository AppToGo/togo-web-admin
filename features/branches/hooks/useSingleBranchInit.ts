/**
 * useSingleBranchInit Hook
 *
 * Initializes the branch store for users that have exactly one accessible branch.
 * The BranchMultiSelector is not rendered for single-branch users (showBranchSelector
 * is false), so without this hook the store would remain empty or stale after logout,
 * causing endpoints to receive no branchId filter.
 *
 * Placed in DashboardLayout so it runs on every dashboard page, not just orders.
 */

import { useEffect } from "react";
import { useEffectiveBranches } from "./useEffectiveBranches";
import { useBranchStore } from "@/stores/branch.store";

/**
 * Side-effect hook — returns nothing.
 *
 * When the authenticated user has exactly one branch and the store is either empty
 * or holds a stale ID from a previous session, the store is updated to contain
 * that single branch.
 */
export function useSingleBranchInit(): void {
  const { branches, isLoading } = useEffectiveBranches();
  const selectedBranchIds = useBranchStore((state) => state.selectedBranchIds);
  const setSelectedBranches = useBranchStore((state) => state.setSelectedBranches);

  useEffect(() => {
    if (isLoading || branches.length !== 1) return;

    const singleBranch = branches[0];
    const isAlreadySet =
      selectedBranchIds.length === 1 && selectedBranchIds[0] === singleBranch.id;

    if (!isAlreadySet) {
      setSelectedBranches(
        [singleBranch.id],
        { [singleBranch.id]: singleBranch.name }
      );
    }
  }, [isLoading, branches, selectedBranchIds, setSelectedBranches]);
}
