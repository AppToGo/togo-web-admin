"use client";

import { AlertTriangle, Ban, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/stores/auth.store";
import { useMyPermissions } from "@/features/auth/hooks/useMyPermissions";
import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";
import { useWompiCheckout } from "../hooks/useWompiCheckout";
import type { BillingAlert } from "../types/billing.types";

const STYLES: Record<
  BillingAlert["kind"],
  { container: string; text: string; button: string }
> = {
  PAYMENT_PENDING: {
    container: "bg-amber-50 border-b border-amber-200",
    text: "text-amber-900",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  SUSPENDED: {
    container: "bg-red-50 border-b border-red-200",
    text: "text-red-900",
    button: "bg-red-600 hover:bg-red-700",
  },
  CANCELLED: {
    container: "bg-slate-100 border-b border-slate-200",
    text: "text-slate-900",
    button: "bg-indigo-600 hover:bg-indigo-700",
  },
};

/**
 * Banner global de cobro (docs/cobro-suscripciones.md §5 en api-togo): pago
 * pendiente con los días que faltan para la suspensión, cuenta suspendida o
 * suscripción cancelada. El estado lo calcula la API en vivo
 * (`billingAlert`), no depende de que el correo haya salido. "Pagar ahora"
 * abre el checkout de Wompi del plan actual (renovación).
 *
 * Solo para quien puede pagar (`billing.view`, el mismo permiso del
 * checkout). La prueba gratis tiene su propio banner (TrialBanner).
 */
export function BillingBanner() {
  const t = useTranslations("dashboard.billingBanner");
  const user = useCurrentUser();
  const { hasPermission } = useMyPermissions();
  const canPay = hasPermission("billing.view") && !user?.isDemo;
  const { data: status } = useSubscriptionStatus(canPay);
  const checkout = useWompiCheckout();

  const alert = status?.billingAlert;
  if (!canPay || !alert) return null;

  const style = STYLES[alert.kind];
  const Icon =
    alert.kind === "SUSPENDED" ? Ban : alert.hasCard ? CreditCard : AlertTriangle;

  const message =
    alert.kind === "PAYMENT_PENDING"
      ? (alert.daysUntilSuspension ?? 0) <= 1
        ? t("pendingLastDay")
        : t("pending", { days: alert.daysUntilSuspension ?? 0 })
      : alert.kind === "SUSPENDED"
        ? t("suspended")
        : t("cancelled");

  const detail =
    alert.kind === "PAYMENT_PENDING" && alert.hasCard && alert.lastDeclineReason
      ? t("declined", { reason: alert.lastDeclineReason })
      : alert.kind === "SUSPENDED"
        ? t("suspendedDetail")
        : null;

  return (
    <div
      role="alert"
      className={cn(
        "w-full px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap sm:flex-nowrap",
        style.container
      )}
    >
      <div className="flex items-center gap-2 text-center sm:text-left">
        <Icon className={cn("w-4 h-4 shrink-0", style.text)} />
        <p className={cn("text-sm font-medium", style.text)}>
          {message}
          {detail && <span className="font-normal ml-1.5 opacity-80">{detail}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => checkout.mutate(undefined)}
        disabled={checkout.isPending}
        className={cn(
          "flex-shrink-0 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
          style.button
        )}
      >
        {checkout.isPending
          ? t("redirecting")
          : alert.kind === "PAYMENT_PENDING"
            ? t("payNow")
            : t("reactivate")}
      </button>
    </div>
  );
}
