/**
 * Notification Preferences Store
 *
 * Manages user preferences for notifications and sound alerts.
 * Persisted to localStorage using Zustand's persist middleware.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface NotificationPreferencesState {
  /** Whether sound alerts are enabled for new orders */
  enableSounds: boolean;
  /** Whether toast notifications are enabled */
  enableNotifications: boolean;
}

interface NotificationPreferencesActions {
  /** Set sound alerts enabled/disabled */
  setEnableSounds: (value: boolean) => void;
  /** Set toast notifications enabled/disabled */
  setEnableNotifications: (value: boolean) => void;
  /** Toggle sound alerts on/off */
  toggleSounds: () => void;
  /** Toggle toast notifications on/off */
  toggleNotifications: () => void;
}

type NotificationPreferencesStore = NotificationPreferencesState &
  NotificationPreferencesActions;

const initialState: NotificationPreferencesState = {
  enableSounds: true,
  enableNotifications: true,
};

/**
 * Notification Preferences Store
 *
 * Persisted to localStorage with key 'togo-notification-preferences'
 */
export const useNotificationPreferences = create<NotificationPreferencesStore>()(
  persist(
    (set) => ({
      ...initialState,

      setEnableSounds: (value: boolean) => {
        set({ enableSounds: value });
      },

      setEnableNotifications: (value: boolean) => {
        set({ enableNotifications: value });
      },

      toggleSounds: () => {
        set((state) => ({ enableSounds: !state.enableSounds }));
      },

      toggleNotifications: () => {
        set((state) => ({ enableNotifications: !state.enableNotifications }));
      },
    }),
    {
      name: "togo-notification-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
