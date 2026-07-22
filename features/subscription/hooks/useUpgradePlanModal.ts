"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useTourStore } from "@/stores/tour.store";
import {
  TRIAL_EXPIRED_EVENT,
  type TrialExpiredEventDetail,
  PAYMENT_OVERDUE_EVENT,
  type PaymentOverdueEventDetail,
} from "@/services/session.service";

const SESSION_FLAG_PREFIX = "togo-upgrade-modal-shown-";

// Evita apilar toasts si varios requests paralelos 402an en el mismo tick
// (ej: KPIs + métricas se disparan juntos al cargar el dashboard).
const TRIAL_EXPIRED_TOAST_ID = "trial-expired";
const PAYMENT_OVERDUE_TOAST_ID = "payment-overdue";

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

  // Reacciona al evento TRIAL_EXPIRED_EVENT (disparado por el interceptor de Axios
  // en services/api.service.ts al recibir un 402). El mismo patrón que
  // SESSION_LOGOUT_EVENT/AuthProvider: el cliente HTTP solo señaliza, esta capa
  // decide la UI. toast usa un id fijo para no apilar duplicados si varios
  // requests paralelos 402an en el mismo tick.
  useEffect(() => {
    function handleTrialExpired(event: Event) {
      const { message } = (event as CustomEvent<TrialExpiredEventDetail>).detail;
      toast.error(
        message || "Tu período de prueba terminó. Elige un plan para continuar.",
        { id: TRIAL_EXPIRED_TOAST_ID },
      );
      openModal();
    }

    window.addEventListener(TRIAL_EXPIRED_EVENT, handleTrialExpired);
    return () => window.removeEventListener(TRIAL_EXPIRED_EVENT, handleTrialExpired);
  }, [openModal]);

  // Reacciona a PAYMENT_OVERDUE_EVENT (plan pago con pago vencido más allá
  // del período de gracia). A diferencia de TRIAL_EXPIRED, NO abre el modal
  // de upgrade — el negocio no necesita cambiar de plan, necesita pagar
  // (flujo manual). Solo avisa.
  useEffect(() => {
    function handlePaymentOverdue(event: Event) {
      const { message } = (event as CustomEvent<PaymentOverdueEventDetail>).detail;
      toast.error(
        message || "Tu pago está vencido. Regulariza tu suscripción para seguir creando y editando.",
        { id: PAYMENT_OVERDUE_TOAST_ID },
      );
    }

    window.addEventListener(PAYMENT_OVERDUE_EVENT, handlePaymentOverdue);
    return () => window.removeEventListener(PAYMENT_OVERDUE_EVENT, handlePaymentOverdue);
  }, []);

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
