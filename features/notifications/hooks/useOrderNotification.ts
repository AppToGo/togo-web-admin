/**
 * Order Notification Hook
 *
 * Encapsulates sound + toast notification logic for new orders.
 * Handles browser autoplay restrictions gracefully.
 */

import { useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useNotificationPreferences } from "../stores/notification-preferences.store";
import { formatOrderNumber } from "@/features/orders/utils/order-number.utils";

// Simple beep sound as base64 fallback (short notification chime - WAV format)
const DEFAULT_SOUND_BASE64 =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSA0PVanu8LdnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREPUqzu8blnHgU1kNjyxn0vBSh+zPLaizsIHGu98+OZUREP';

/**
 * Hook for managing order notifications (sound + toast)
 */
export function useOrderNotification() {
  const t = useTranslations("orders");
  const { enableSounds, enableNotifications } = useNotificationPreferences();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Plays the new order sound notification
   * Handles browser autoplay policy by catching errors
   */
  const playNewOrderSound = useCallback(async (): Promise<void> => {
    if (!enableSounds) return;

    try {
      // Lazy-load audio element
      if (!audioRef.current) {
        audioRef.current = new Audio(DEFAULT_SOUND_BASE64);
        audioRef.current.volume = 0.5;
      }

      // Reset to start and play
      audioRef.current.currentTime = 0;

      // Handle browser autoplay restrictions
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      // Browser autoplay policy blocked the sound
      // This is expected behavior - we don't want to spam errors
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug("[Notification] Sound play prevented by browser policy:", error);
      }
    }
  }, [enableSounds]);

  /**
   * Shows a toast notification for a new order
   * Only shows if notifications are enabled
   */
  const showNewOrderToast = useCallback(
    (orderNumber: string): void => {
      if (!enableNotifications) return;

      toast.info(t("notifications.newOrder", { orderNumber }));
    },
    [enableNotifications, t]
  );

  /**
   * Full notification flow for a new order
   * Plays sound and shows toast based on user preferences
   */
  const notifyNewOrder = useCallback(
    (orderId: string): void => {
      const orderNumber = formatOrderNumber(orderId);

      // Play sound first (non-blocking)
      playNewOrderSound();

      // Show toast
      showNewOrderToast(orderNumber);
    },
    [playNewOrderSound, showNewOrderToast]
  );

  return {
    playNewOrderSound,
    showNewOrderToast,
    notifyNewOrder,
    /**
     * Direct notification with pre-formatted order number
     * Use this when you already have the formatted number
     */
    notifyWithNumber: useCallback(
      (orderNumber: string): void => {
        playNewOrderSound();
        if (enableNotifications) {
          toast.info(t("notifications.newOrder", { orderNumber }));
        }
      },
      [playNewOrderSound, enableNotifications, t]
    ),
  };
}
