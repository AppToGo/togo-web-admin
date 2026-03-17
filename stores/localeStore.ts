/**
 * Locale Store
 *
 * Manages user locale preference using Zustand with persistence.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/i18n/config";

interface LocaleState {
  userPreference: Locale | null;
  setUserPreference: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      userPreference: null,
      setUserPreference: (locale) => set({ userPreference: locale }),
    }),
    {
      name: "togo-locale-preference",
    }
  )
);
