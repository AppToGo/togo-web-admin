"use client";

import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatDate } from "@/hooks/useFormatDate";
import type { OwnerPaymentNotification } from "../../types/billing.types";

interface PaymentNotificationsListProps {
  notifications: OwnerPaymentNotification[] | undefined;
  isLoading: boolean;
}

function NotificationRow({ notification }: { notification: OwnerPaymentNotification }) {
  const t = useTranslations("subscription.billing");
  const sentAt = useFormatDate(notification.sentAt, { preset: "short" });

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 border-b border-slate-100 last:border-0">
      <Bell className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">
            {t(`notificationType.${notification.type}`)}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{sentAt}</span>
        </div>
        <p className="text-sm text-slate-700 mt-0.5">{notification.message}</p>
      </div>
    </div>
  );
}

/**
 * Empty state cuidado a propósito: hoy la mayoría de tipos que ofrece el
 * modal admin de notificaciones (`SendNotificationModal`) no coinciden con
 * el enum real del backend y devuelven 400 — en la práctica esta lista
 * suele estar vacía en producción. "Sin notificaciones" no debe leerse
 * como una falla de esta pantalla.
 */
export function PaymentNotificationsList({
  notifications,
  isLoading,
}: PaymentNotificationsListProps) {
  const t = useTranslations("subscription.billing");

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base">{t("notifications.title")}</CardTitle>
        <CardDescription>{t("notifications.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">{t("notifications.empty")}</p>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
