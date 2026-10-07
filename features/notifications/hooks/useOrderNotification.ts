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
import { playNotificationSound } from "../lib/play-notification-sound";

/**
 * Hook for managing order notifications (sound + toast)
 */
export function useOrderNotification() {
  const t = useTranslations("orders");
  const { enableSounds, enableNotifications } = useNotificationPreferences();

  /**
   * Plays the new order sound notification (if sounds are enabled)
   */
  const playNewOrderSound = useCallback(
    async (orderId?: string): Promise<void> => {
      if (!enableSounds) return;
      await playNotificationSound(orderId ? `order:${orderId}` : undefined);
    },
    [enableSounds]
  );

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
    (orderId: string, orderNumber?: string | number | null): void => {
      const formattedOrderNumber = formatOrderNumber(orderId, orderNumber);

      // Play sound first (non-blocking)
      playNewOrderSound(orderId);

      // Show toast
      showNewOrderToast(formattedOrderNumber);
    },
    [playNewOrderSound, showNewOrderToast]
  );

  return {
    playNewOrderSound,
    showNewOrderToast,
    notifyNewOrder,
  };
}
