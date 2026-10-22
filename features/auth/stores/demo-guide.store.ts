/**
 * Demo Guide Store
 *
 * Progreso de la guía flotante del modo demo (pedir por WhatsApp → verlo
 * llegar → cambiarle el estado). Se guarda por usuario demo en localStorage
 * para que la guía no se reinicie al recargar.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth.store";

export const DEMO_GUIDE_STEPS = ["whatsapp", "arrived", "status"] as const;
export type DemoGuideStep = (typeof DEMO_GUIDE_STEPS)[number];

interface DemoGuideState {
  /** Pasos completados por usuario demo. Key: userId */
  progress: Record<string, DemoGuideStep[]>;
  /** Guía minimizada a la píldora */
  minimized: boolean;
}

interface DemoGuideActions {
  complete: (userId: string, step: DemoGuideStep) => void;
  setMinimized: (value: boolean) => void;
}

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

export const useDemoGuideStore = create<DemoGuideState & DemoGuideActions>()(
  persist(
    (set) => ({
      progress: {},
      minimized: false,

      complete: (userId, step) => {
        set((state) => {
          const done = state.progress[userId] ?? [];
          if (done.includes(step)) return state;
          return { progress: { ...state.progress, [userId]: [...done, step] } };
        });
      },

      setMinimized: (value) => set({ minimized: value }),
    }),
    {
      name: "togo-demo-guide-v1",
      storage: createJSONStorage(() => getStorage()),
    }
  )
);

/**
 * Marca un paso de la guía si la sesión actual es demo. Se llama desde
 * fuera de React (sockets, mutaciones), por eso lee los stores directo.
 */
export function completeDemoGuideStep(step: DemoGuideStep) {
  const user = useAuthStore.getState().user;
  if (!user?.isDemo) return;
  useDemoGuideStore.getState().complete(user.userId, step);
}
