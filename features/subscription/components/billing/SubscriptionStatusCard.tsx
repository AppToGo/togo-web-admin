"use client";

import { useTranslations } from "next-intl";
import { Zap, AlertTriangle, Clock, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useFormatDate } from "@/hooks/useFormatDate";
import { useOpenUpgradePlanModal } from "../../hooks/useUpgradePlanModal";
import { BillingStatusBadge } from "./BillingStatusBadge";
import type { SubscriptionStatus } from "../../types/billing.types";

interface SubscriptionStatusCardProps {
  status: SubscriptionStatus | undefined;
  isLoading: boolean;
}

const URGENT_DUE_THRESHOLD_DAYS = 3;

/**
 * Días restantes de trial, calculados sobre `trialEndsAt` — NO sobre
 * `daysUntilDue`. El backend siempre devuelve `daysUntilDue: null` para un
 * negocio en trial Free (vence por `trialEndsAt`, no por `nextPaymentDue`,
 * ver `subscription-status.util.ts`), así que ramificar sobre esa
 * propiedad nunca activaría el aviso urgente. Mismo cálculo que
 * `TrialBanner.tsx` (misma feature) para no divergir en el criterio de
 * "cuántos días quedan".
 */
function daysUntilTrialEnds(trialEndsAt: string): number | null {
  const trialEndsAtMs = new Date(trialEndsAt).getTime();
  if (Number.isNaN(trialEndsAtMs)) return null;

  const msRemaining = trialEndsAtMs - Date.now();
  if (msRemaining <= 0) return 0;
  return Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
}

/**
 * Tarjeta principal del estado de cuenta — cubre 5 ramas de UI distintas
 * en vez de un mensaje genérico, porque cada una necesita datos y tono
 * diferentes:
 * 1. Free en trial → cuenta regresiva sobre trialEndsAt.
 * 2. Bloqueado (trial vencido o pago vencido) → estado urgente + CTA.
 * 3. Plan pago al día → próximo vencimiento.
 * 4. requestedPlan pendiente → "en verificación" + ventana de gracia.
 * 5. hasSubscriptionRecord: false → estado neutro, sin fechas inventadas.
 */
export function SubscriptionStatusCard({ status, isLoading }: SubscriptionStatusCardProps) {
  const t = useTranslations("subscription.billing");
  const openUpgradeModal = useOpenUpgradePlanModal();

  const trialEndsAt = useFormatDate(status?.trialEndsAt, { preset: "short" });
  const nextPaymentDue = useFormatDate(status?.nextPaymentDue, { preset: "short" });
  const lastPaymentAt = useFormatDate(status?.lastPaymentAt, { preset: "short" });
  const requestGraceEndsAt = useFormatDate(status?.requestGraceEndsAt, { preset: "short" });

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const isFreeTrial = status.plan === 1 && status.trialEndsAt !== null;
  const hasPendingRequest = status.requestedPlan !== null;
  const trialDaysRemaining = status.trialEndsAt ? daysUntilTrialEnds(status.trialEndsAt) : null;

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              {t("plan.title", { planName: status.planName })}
            </CardTitle>
            <CardDescription>
              {status.priceMonthly > 0
                ? t("plan.priceMonthly", {
                    price: formatCurrency(status.priceMonthly, status.currency),
                  })
                : t("plan.free")}
            </CardDescription>
          </div>
          <BillingStatusBadge status={status.paymentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rama 5: sin fila de suscripción — estado neutro, sin fechas inventadas */}
        {!status.hasSubscriptionRecord && (
          <p className="text-sm text-slate-500">{t("noRecord")}</p>
        )}

        {/* Rama 1/2: Free en trial (activo o vencido) */}
        {status.hasSubscriptionRecord && isFreeTrial && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-3 ${
              status.isBlocked
                ? "bg-red-50 border-red-200"
                : "bg-indigo-50 border-indigo-200"
            }`}
          >
            {status.isBlocked ? (
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Zap className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`text-sm font-medium ${
                  status.isBlocked ? "text-red-900" : "text-indigo-900"
                }`}
              >
                {status.isBlocked
                  ? t("trial.expired")
                  : trialDaysRemaining !== null && trialDaysRemaining <= URGENT_DUE_THRESHOLD_DAYS
                    ? t("trial.endingSoon", { date: trialEndsAt })
                    : t("trial.active", { date: trialEndsAt })}
              </p>
              <Button size="sm" className="mt-2" onClick={openUpgradeModal}>
                {t("cta.choosePlan")}
              </Button>
            </div>
          </div>
        )}

        {/* Rama 2: plan pago bloqueado (pago vencido) */}
        {status.hasSubscriptionRecord && !isFreeTrial && status.isBlocked && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">{t("overdue.blocked")}</p>
              {status.totalPaid !== "0" && (
                <p className="text-xs text-red-700 mt-1">
                  {t("overdue.contactSupport")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rama 3: plan pago al día, con nextPaymentDue */}
        {status.hasSubscriptionRecord && !isFreeTrial && !status.isBlocked && status.nextPaymentDue && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            {status.isInGracePeriod ? (
              <span className="text-amber-700 font-medium">{t("gracePeriod", { date: nextPaymentDue })}</span>
            ) : (
              <span>{t("nextPaymentDue", { date: nextPaymentDue })}</span>
            )}
          </div>
        )}

        {/* Rama 4: solicitud de cambio de plan pendiente de verificación */}
        {hasPendingRequest && (
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Clock className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                {t("pendingRequest.title", { planName: status.requestedPlanName ?? "" })}
              </p>
              {status.requestGraceEndsAt && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("pendingRequest.graceEndsAt", { date: requestGraceEndsAt })}
                </p>
              )}
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-slate-100">
          <div>
            <dt className="text-slate-500 text-xs">{t("fields.lastPaymentAt")}</dt>
            <dd className="font-medium">{status.lastPaymentAt ? lastPaymentAt : "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">{t("fields.totalPaid")}</dt>
            <dd className="font-medium">{formatCurrency(Number(status.totalPaid), status.currency)}</dd>
          </div>
        </dl>

        <Button variant="outline" size="sm" onClick={openUpgradeModal}>
          {t("cta.changePlan")}
        </Button>
      </CardContent>
    </Card>
  );
}
