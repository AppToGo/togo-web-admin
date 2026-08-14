"use client";

import { Lock, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthGuard } from "@/features/auth/hooks/useAuthGuard";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import {
  useSubscriptionStatus,
  usePaymentHistory,
  usePaymentNotifications,
  SubscriptionStatusCard,
  PaymentHistoryTable,
  PaymentNotificationsList,
} from "@/features/subscription";

export default function BillingPage() {
  const t = useTranslations("subscription.billing");

  useAuthGuard();
  const { hasPermission, isLoading: permissionsLoading } = useMyPermissions();
  const canViewBilling = !permissionsLoading && hasPermission("billing.view");

  const { data: status, isLoading: statusLoading } = useSubscriptionStatus();
  const { data: payments, isLoading: paymentsLoading } = usePaymentHistory();
  const { data: notifications, isLoading: notificationsLoading } = usePaymentNotifications();

  if (permissionsLoading) {
    return <DashboardLayout>{null}</DashboardLayout>;
  }

  if (!canViewBilling) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t("accessDeniedTitle")}
          </h2>
          <p className="text-slate-500 text-center max-w-md">
            {t("accessDeniedDescription")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-indigo-600" />
            {t("title")}
          </h1>
          <p className="text-slate-500 mt-1">{t("description")}</p>
        </div>

        <SubscriptionStatusCard status={status} isLoading={statusLoading} />
        <PaymentHistoryTable
          payments={payments}
          isLoading={paymentsLoading}
          currency={status?.currency ?? "COP"}
        />
        <PaymentNotificationsList notifications={notifications} isLoading={notificationsLoading} />
      </div>
    </DashboardLayout>
  );
}
