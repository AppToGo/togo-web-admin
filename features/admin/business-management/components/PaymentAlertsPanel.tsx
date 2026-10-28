"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CreditCard, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  PaymentAlert,
  PaymentAlertKind,
} from "../types/business-subscription.types";

interface PaymentAlertsPanelProps {
  alerts: PaymentAlert[];
  onViewCharges: (alert: PaymentAlert) => void;
}

const KIND_STYLES: Record<PaymentAlertKind, string> = {
  SUSPENDED: "bg-red-100 text-red-800",
  PAYMENT_PENDING: "bg-amber-100 text-amber-800",
  TRIAL_EXPIRED: "bg-orange-100 text-orange-800",
  DUE_SOON: "bg-indigo-100 text-indigo-800",
  TRIAL_ENDING: "bg-sky-100 text-sky-800",
  CANCEL_SCHEDULED: "bg-slate-200 text-slate-700",
  PLAN_REQUEST: "bg-violet-100 text-violet-800",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const COLLAPSED_COUNT = 6;

/**
 * Alertas de pago del super admin (docs/cobro-suscripciones.md §7 en
 * api-togo), en el orden de urgencia que devuelve la API: qué negocio, qué
 * pasa y lo que hace falta para actuar (días para la suspensión, si tiene
 * tarjeta, motivo del último rechazo).
 */
export function PaymentAlertsPanel({ alerts, onViewCharges }: PaymentAlertsPanelProps) {
  const t = useTranslations("admin-businesses.alerts");
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? alerts : alerts.slice(0, COLLAPSED_COUNT);

  const detail = (alert: PaymentAlert): string => {
    switch (alert.kind) {
      case "PAYMENT_PENDING":
        return t("detail.pending", { days: alert.daysUntilSuspension ?? 0 });
      case "DUE_SOON":
        return alert.daysUntilDue < 0
          ? t("detail.overdueToday")
          : t("detail.dueIn", { days: alert.daysUntilDue });
      default:
        return t(`detail.${alert.kind}`);
    }
  };

  return (
    <Card className="p-4 border-amber-200 bg-amber-50/50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-amber-900">
            {t("title", { count: alerts.length })}
          </h3>
          <p className="text-sm text-amber-700 mt-1">{t("description")}</p>

          <ul className="mt-3 divide-y divide-amber-100 rounded-lg border border-amber-100 bg-white">
            {visible.map((alert) => (
              <li
                key={`${alert.businessId}-${alert.kind}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
              >
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    KIND_STYLES[alert.kind]
                  )}
                >
                  {t(`kinds.${alert.kind}`)}
                </span>
                <span className="text-sm font-medium text-slate-900">{alert.businessName}</span>
                <span className="text-xs text-slate-500">{detail(alert)}</span>
                {alert.hasCard && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <CreditCard className="w-3 h-3" />
                    {t("hasCard")}
                  </span>
                )}
                {alert.lastDeclineReason && (
                  <span className="text-[11px] text-red-600">
                    {t("declineReason", { reason: alert.lastDeclineReason })}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => onViewCharges(alert)}
                >
                  <History className="w-3.5 h-3.5 mr-1" />
                  {t("viewCharges")}
                </Button>
              </li>
            ))}
          </ul>

          {alerts.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-2 text-xs font-medium text-amber-800 hover:underline cursor-pointer"
            >
              {expanded ? t("showLess") : t("showAll", { count: alerts.length })}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
