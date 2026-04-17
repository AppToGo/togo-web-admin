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
  // Subscribe for re-renders when isTourRunning changes (so the effect below
  // re-runs when the tour ends). The actual gate check inside the effect reads
  // via getState() to avoid a stale closure from concurrent sibling effects:
  // React runs children effects before parent effects, so useTour (child) calls
  // setTourRunning(true) before this effect runs — getState() sees that update.
  const isTourRunning = useTourStore((state) => state.isTourRunning);

  // Auto-open once per session for free-plan users, on any page.
  // Deferred while any tour is active so they don't overlap on first login.
  useEffect(() => {
    if (!user?.userId) return;
    if (user.subscriptionPlan === undefined) return;
    if (user.subscriptionPlan !== 1) return;

    // Read current store state directly — avoids stale closure when a sibling
    // effect (useTour, which runs first as a child component) updated the store
    // in the same effects flush before this effect ran.
    if (useTourStore.getState().isTourRunning) return;

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
  }, [user?.userId, user?.subscriptionPlan, user?.businessId, isTourRunning, openModal]);

  return { open, closeModal };
}

/**
 * Lightweight hook for any component that needs to imperatively open the
 * upgrade modal (e.g. FreePlanBanner CTA, a locked-feature gate).
 * Does NOT register the auto-show effect.
 */
export function useOpenUpgradePlanModal(): () => void {
  return useUpgradePlanModalStore((state) => state.openModal);
}
