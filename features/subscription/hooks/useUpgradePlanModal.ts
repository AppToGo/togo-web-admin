"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useTourStore } from "@/stores/tour.store";

const SESSION_FLAG_PREFIX = "togo-upgrade-modal-shown-";

// Global store — shared across the entire component tree so any component
// can open the modal without needing to prop-drill or duplicate state.
interface UpgradePlanModalStore {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const useUpgradePlanModalStore = create<UpgradePlanModalStore>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));

/**
 * Used ONCE in DashboardLayout to mount the modal and drive the auto-show
 * logic. Handles: auto-opening once per session for free-plan users,
 * rendering the modal, and providing closeModal.
 *
 * Do NOT call this hook in individual pages — use useOpenUpgradePlanModal
 * instead if you only need to imperatively open the modal (e.g. a CTA button).
 */
export function useUpgradePlanModal() {
  const user = useCurrentUser();
  const { open, openModal, closeModal } = useUpgradePlanModalStore();

  // Subscribe to completedTours so the effect re-runs when a tour is marked done.
  const completedTours = useTourStore((state) => state.completedTours);

  // Auto-open once per session for free-plan users, on any page.
  useEffect(() => {
    if (!user?.userId) return;
    if (user.subscriptionPlan === undefined) return;
    if (user.subscriptionPlan !== 1) return;

    // Don't show the modal until the onboarding tour has been completed or skipped.
    // On first login the tour runs on the orders page; showing the modal at the same
    // time creates a confusing overlap. Once markCompleted() fires (via goNext or skip),
    // completedTours updates, this effect re-runs, and the modal opens.
    const tourKey = `orders:${user.userId}:${user.businessId}`;
    if (!completedTours[tourKey]) return;

    const flagKey = `${SESSION_FLAG_PREFIX}${user.userId}-${user.businessId}`;
    const alreadyShown = sessionStorage.getItem(flagKey);
    if (alreadyShown) return;

    // Write flag before opening to prevent race conditions on re-mount
    try {
      sessionStorage.setItem(flagKey, "1");
    } catch {
      // sessionStorage unavailable (private mode, quota exceeded) — skip flag
    }
    openModal();
  }, [user?.userId, user?.subscriptionPlan, user?.businessId, completedTours, openModal]);

  return { open, closeModal };
}

/**
 * Lightweight hook for any component that needs to imperatively open the
 * upgrade modal (e.g. TrialBanner CTA, a locked-feature gate).
 * Does NOT register the auto-show effect.
 */
export function useOpenUpgradePlanModal(): () => void {
  return useUpgradePlanModalStore((state) => state.openModal);
}

/**
 * Imperative opener for use OUTSIDE React components (e.g. the Axios
 * response interceptor in services/api.service.ts, which runs before any
 * component tree exists). Prefer useOpenUpgradePlanModal inside components.
 */
export function openUpgradePlanModal(): void {
  useUpgradePlanModalStore.getState().openModal();
}
