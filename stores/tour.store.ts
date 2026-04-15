/**
 * Tour Store
 *
 * Tracks which product tours have been completed per user/business combination.
 * Persists to localStorage so tours don't repeat across sessions.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TourStoreState {
  /** Record of completed tours. Key format: `${tourId}:${userId}:${businessId}` */
  completedTours: Record<string, boolean>;
}

interface TourStoreActions {
  /** Mark a tour as completed */
  markCompleted: (key: string) => void;
  /** Reset a tour so it shows again */
  resetTour: (key: string) => void;
  /** Check whether a given tour has been completed */
  isTourCompleted: (key: string) => boolean;
}

type TourStore = TourStoreState & TourStoreActions;

const initialState: TourStoreState = {
  completedTours: {},
};

function getStorage(): Storage {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    return localStorage;
  }
  // Noop storage para SSR — no persiste nada, solo evita el crash
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

export const useTourStore = create<TourStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      markCompleted: (key: string) => {
        set((state) => ({
          completedTours: { ...state.completedTours, [key]: true },
        }));
      },

      resetTour: (key: string) => {
        set((state) => {
          const next = { ...state.completedTours };
          delete next[key];
          return { completedTours: next };
        });
      },

      isTourCompleted: (key: string) => {
        return get().completedTours[key] === true;
      },
    }),
    {
      name: "togo-tour-completed-v1",
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
