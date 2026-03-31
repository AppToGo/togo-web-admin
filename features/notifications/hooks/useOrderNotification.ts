/**
 * Order Notification Hook
 *
 * Encapsulates sound + toast notification logic for new orders.
 * Handles browser autoplay restrictions gracefully.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useNotificationPreferences } from "../stores/notification-preferences.store";
import { formatOrderNumber } from "@/features/orders/utils/order-number.utils";

// Path to the notification sound file
const SOUND_PATH = "/sounds/beep.mp3";

/**
 * Hook for managing order notifications (sound + toast)
 */
export function useOrderNotification() {
  const t = useTranslations("orders");
  const { enableSounds, enableNotifications } = useNotificationPreferences();

  /**
   * Plays the new order sound notification
   * Creates fresh audio instance each time to ensure it plays reliably
   * Handles browser autoplay policy by catching errors
   */
  const playNewOrderSound = useCallback(async (): Promise<void> => {
    if (!enableSounds) return;

    try {
      // Create fresh audio instance each time (ensures it's ready to play)
      const audio = new Audio(SOUND_PATH);
      audio.volume = 0.5;

      // Play sound - modern browsers return a Promise
      await audio.play();
    } catch (error) {
      // Browser autoplay policy blocked the sound
      // This is expected before user interaction
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.debug("[Notification] Sound play prevented:", error);
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
  };
}
