import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  RegistrationWizardState,
  RegistrationStatus,
} from "@/types/auth.types";

const TTL_HOURS = 24;
const STORE_KEY = "togo-registration-wizard";

interface RegistrationStore extends RegistrationWizardState {
  setStep1Complete: (
    businessId: string,
    token: string,
    plan: number | null,
    status: RegistrationStatus
  ) => void;
  setPlanSelected: (plan: number) => void;
  goToStep: (step: 1 | 2 | 3) => void;
  resetWizard: () => void;
  isExpired: () => boolean;
}

const initialState: RegistrationWizardState = {
  currentStep: 1,
  businessId: null,
  registrationToken: null,
  selectedPlan: null,
  registrationStatus: null,
  createdAt: null,
};

function getStorage(): Storage | undefined {
  if (typeof window !== "undefined") return sessionStorage;
  return undefined;
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep1Complete: (businessId, token, plan, status) => {
        const step: 1 | 2 | 3 = plan ? 3 : 2;
        set({
          businessId,
          registrationToken: token,
          selectedPlan: plan,
          registrationStatus: status,
          currentStep: step,
          createdAt: Date.now(),
        });
      },

      setPlanSelected: (plan) => {
        set({
          selectedPlan: plan,
          registrationStatus: "PENDING_PAYMENT",
          currentStep: 3,
        });
      },

      goToStep: (step) => set({ currentStep: step }),

      resetWizard: () => set(initialState),

      isExpired: () => {
        const { createdAt } = get();
        if (!createdAt) return true;  // No createdAt = expired
        const hoursElapsed = (Date.now() - createdAt) / (1000 * 60 * 60);
        return hoursElapsed > TTL_HOURS;
      },
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => getStorage() as Storage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        businessId: state.businessId,
        registrationToken: state.registrationToken,
        selectedPlan: state.selectedPlan,
        registrationStatus: state.registrationStatus,
        createdAt: state.createdAt,
      }),
    }
  )
);
