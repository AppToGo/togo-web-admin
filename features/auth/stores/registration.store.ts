import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RegistrationWizardState } from "@/types/auth.types";

const TTL_HOURS = 24;
const STORE_KEY = "togo-registration-wizard";

interface RegistrationStore extends RegistrationWizardState {
  setRegistrationComplete: (businessId: string) => void;
  goToStep: (step: 1 | 2 | 3) => void;
  resetWizard: () => void;
  isExpired: () => boolean;
}

const initialState: RegistrationWizardState = {
  currentStep: 1,
  businessId: null,
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

      setRegistrationComplete: (businessId) => {
        set({
          businessId,
          currentStep: 3,
          createdAt: Date.now(),
        });
      },

      goToStep: (step) => set({ currentStep: step }),

      resetWizard: () => set(initialState),

      isExpired: () => {
        const { createdAt } = get();
        if (!createdAt) return false;
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
        createdAt: state.createdAt,
      }),
    }
  )
);
