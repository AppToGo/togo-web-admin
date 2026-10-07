/**
 * Aviso de Inbox
 *
 * Sonido + toast cuando un cliente pide hablar con un asesor. Usa las mismas
 * preferencias que los pedidos nuevos (enableSounds / enableNotifications).
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useNotificationPreferences } from "../stores/notification-preferences.store";
import { playNotificationSound } from "../lib/play-notification-sound";

const INBOX_PATH = "/dashboard/inbox";

export function useInboxNotification() {
  const t = useTranslations("inbox.notifications");
  const router = useRouter();
  const pathname = usePathname();
  const { enableSounds, enableNotifications } = useNotificationPreferences();

  const notifyHumanRequested = useCallback(
    (sessionId: string): void => {
      if (enableSounds) void playNotificationSound(`human:${sessionId}`);
      if (!enableNotifications) return;

      // En el inbox la conversación ya aparece en la lista: sin botón "Ver"
      // (el deep-link `?session=` solo se lee al montar la página).
      const onInbox = pathname.startsWith(INBOX_PATH);
      toast.info(t("humanRequested"), {
        action: onInbox
          ? undefined
          : {
              label: t("view"),
              onClick: () => router.push(`${INBOX_PATH}?session=${encodeURIComponent(sessionId)}`),
            },
      });
    },
    [enableSounds, enableNotifications, pathname, router, t]
  );

  return { notifyHumanRequested };
}
