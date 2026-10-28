"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, CreditCard, Repeat, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormatDate } from "@/hooks/useFormatDate";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useOpenUpgradePlanModal } from "../../hooks/useUpgradePlanModal";
import { useSubscriptionActions } from "../../hooks/useSubscriptionActions";
import type { SubscriptionStatus } from "../../types/billing.types";

interface SubscriptionManagementCardProps {
  status: SubscriptionStatus | undefined;
}

/**
 * Autogestión de la suscripción (docs/cobro-suscripciones.md §6 en
 * api-togo): pagar el mes (billing.view), y con billing.manage la tarjeta
 * guardada, el cambio de plan, la bajada programada y la cancelación.
 */
export function SubscriptionManagementCard({ status }: SubscriptionManagementCardProps) {
  const t = useTranslations("subscription.management");
  const { hasPermission } = useMyPermissions();
  const canManage = hasPermission("billing.manage");
  const openPlans = useOpenUpgradePlanModal();
  const actions = useSubscriptionActions();
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const periodEnd = useFormatDate(status?.nextPaymentDue, { preset: "short" });

  if (!status) return null;

  const isPaidPlan = status.plan !== 1;
  const alert = status.billingAlert;
  const owes =
    alert?.kind === "PAYMENT_PENDING" ||
    alert?.kind === "SUSPENDED" ||
    alert?.kind === "CANCELLED";
  const canCancel =
    canManage &&
    isPaidPlan &&
    !status.cancelAtPeriodEnd &&
    status.paymentStatus !== "OVERDUE" &&
    !!status.nextPaymentDue;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {owes && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">{t("owes")}</p>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={actions.pay.isPending}
              onClick={() => actions.pay.mutate()}
            >
              {actions.pay.isPending ? t("processing") : t("payNow")}
            </Button>
          </div>
        )}

        {canManage && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CreditCard className="h-4 w-4 text-slate-400 shrink-0" />
              {status.card ? (
                <span>
                  {status.card.brand === "NEQUI"
                    ? t("nequiSaved", { lastFour: status.card.lastFour ?? "••••" })
                    : t("cardSaved", {
                        brand: status.card.brand ?? t("cardGeneric"),
                        lastFour: status.card.lastFour ?? "••••",
                      })}
                </span>
              ) : (
                <span className="text-slate-500">{t("noCard")}</span>
              )}
            </div>
            {/* La tarjeta se captura en el widget de Wompi, nunca en ToGo */}
            <Button
              size="sm"
              variant="outline"
              disabled={actions.isOpeningCardWidget || actions.saveCard.isPending}
              onClick={() => void actions.openCardWidget()}
            >
              {actions.isOpeningCardWidget || actions.saveCard.isPending
                ? t("processing")
                : status.card
                  ? t("changeCard")
                  : t("saveCard")}
            </Button>
          </div>
        )}

        {canManage && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Repeat className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{t("currentPlan", { planName: status.planName })}</span>
            </div>
            <Button size="sm" variant="outline" onClick={openPlans}>
              {t("changePlan")}
            </Button>
          </div>
        )}

        {status.scheduledPlanName && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <div className="flex items-center gap-2 text-sm text-indigo-900">
              <CalendarClock className="h-4 w-4 shrink-0" />
              {t("downgradeScheduled", {
                planName: status.scheduledPlanName,
                date: periodEnd,
              })}
            </div>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                disabled={actions.undoDowngrade.isPending}
                onClick={() => actions.undoDowngrade.mutate()}
              >
                {t("undo")}
              </Button>
            )}
          </div>
        )}

        {status.cancelAtPeriodEnd && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <XCircle className="h-4 w-4 shrink-0" />
              {t("cancelScheduled", { date: periodEnd })}
            </div>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                disabled={actions.undoCancel.isPending}
                onClick={() => actions.undoCancel.mutate()}
              >
                {t("undoCancel")}
              </Button>
            )}
          </div>
        )}

        {canCancel && (
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              {t("cancel")}
            </button>
          </div>
        )}
      </CardContent>


      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelConfirm.description", { date: periodEnd })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelConfirm.keep")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => actions.cancel.mutate()}
            >
              {t("cancelConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
